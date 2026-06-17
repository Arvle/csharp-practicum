package handlers

import (
	"CSharpPracticum/internal/middleware"
	"CSharpPracticum/internal/services"
	"context"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		allowed := strings.TrimSpace(os.Getenv("ALLOWED_WS_ORIGINS"))
		if allowed == "" || allowed == "*" {
			return true
		}
		origin := r.Header.Get("Origin")
		for _, item := range strings.Split(allowed, ",") {
			if origin == strings.TrimSpace(item) {
				return true
			}
		}
		return false
	},
}

type WSTerminalMessage struct {
	Type    string `json:"type"`
	Payload string `json:"payload"`
}

type InteractiveExecutor struct {
	compiler *services.CompilerService
	writeMu  sync.Mutex
}

func NewInteractiveExecutor(compiler *services.CompilerService) *InteractiveExecutor {
	return &InteractiveExecutor{compiler: compiler}
}

func (ie *InteractiveExecutor) writeMessage(conn *websocket.Conn, msg WSTerminalMessage) error {
	ie.writeMu.Lock()
	defer ie.writeMu.Unlock()
	return conn.WriteJSON(msg)
}

func (ie *InteractiveExecutor) ServeWS() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if _, err := middleware.ParseUserToken(strings.TrimSpace(r.URL.Query().Get("token"))); err != nil {
			writeJSONError(w, http.StatusUnauthorized, "invalid or missing token")
			return
		}

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("WebSocket upgrade error: %v", err)
			return
		}
		defer conn.Close()

		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Minute)
		defer cancel()
		ie.handleSession(ctx, conn)
	}
}

func (ie *InteractiveExecutor) handleSession(ctx context.Context, conn *websocket.Conn) {
	var cmd *exec.Cmd
	var stdin io.WriteCloser
	var runMu sync.Mutex

	stopProcess := func() {
		runMu.Lock()
		defer runMu.Unlock()
		if cmd != nil && cmd.Process != nil {
			_ = cmd.Process.Kill()
		}
		cmd = nil
		stdin = nil
	}
	defer stopProcess()

	for {
		var msg WSTerminalMessage
		if err := conn.ReadJSON(&msg); err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket read error: %v", err)
			}
			break
		}

		switch msg.Type {
		case "code":
			stopProcess()
			_ = ie.writeMessage(conn, WSTerminalMessage{Type: "output", Payload: "🔨 Компиляция...\n"})

			dllPath, _, _, err := ie.compiler.CompileOnly(msg.Payload, 30*time.Second)
			if err != nil {
				_ = ie.writeMessage(conn, WSTerminalMessage{Type: "error", Payload: err.Error()})
				_ = ie.writeMessage(conn, WSTerminalMessage{Type: "exit", Payload: "compile failed"})
				continue
			}

			newCmd, newStdin, stdout, stderr, err := ie.startProcess(ctx, dllPath)
			if err != nil {
				_ = ie.writeMessage(conn, WSTerminalMessage{Type: "error", Payload: err.Error()})
				_ = ie.writeMessage(conn, WSTerminalMessage{Type: "exit", Payload: "process start failed"})
				continue
			}

			runMu.Lock()
			cmd = newCmd
			stdin = newStdin
			runMu.Unlock()

			go ie.streamOutput(stdout, "output", conn)
			go ie.streamOutput(stderr, "error", conn)
			go ie.waitForExit(newCmd, conn)

			_ = ie.writeMessage(conn, WSTerminalMessage{Type: "ready", Payload: "ready"})
			_ = ie.writeMessage(conn, WSTerminalMessage{Type: "output", Payload: "✅ Программа запущена. Введите данные ниже, если программа ожидает Console.ReadLine().\n"})

		case "input":
			runMu.Lock()
			if stdin != nil {
				_, _ = stdin.Write([]byte(msg.Payload + "\n"))
			}
			runMu.Unlock()

		case "close":
			stopProcess()
			return
		}
	}
}

func (ie *InteractiveExecutor) startProcess(ctx context.Context, dllPath string) (*exec.Cmd, io.WriteCloser, io.ReadCloser, io.ReadCloser, error) {
	useSandbox := os.Getenv("COMPILER_SANDBOX") != "0"
	var cmd *exec.Cmd

	if useSandbox {
		projDir := filepath.Dir(filepath.Dir(filepath.Dir(filepath.Dir(dllPath))))
		args := []string{
			"run", "--rm", "--network=none", "--memory=128m", "--cpus=0.5", "--pids-limit=20",
			"--read-only", "--tmpfs=/tmp:rw,size=50m", "--security-opt=no-new-privileges:true", "--cap-drop=ALL",
			"-v", projDir + ":/app:ro", "-w", "/app",
			"mcr.microsoft.com/dotnet/runtime:8.0-alpine",
			"dotnet", "exec", "/app/bin/Release/net8.0/app.dll",
		}
		cmd = exec.CommandContext(ctx, "docker", args...)
	} else {
		cmd = exec.CommandContext(ctx, "dotnet", "exec", dllPath)
	}

	stdin, err := cmd.StdinPipe()
	if err != nil {
		return nil, nil, nil, nil, err
	}
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, nil, nil, nil, err
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return nil, nil, nil, nil, err
	}
	if err := cmd.Start(); err != nil {
		return nil, nil, nil, nil, err
	}
	return cmd, stdin, stdout, stderr, nil
}

func (ie *InteractiveExecutor) streamOutput(reader io.Reader, msgType string, conn *websocket.Conn) {
	buf := make([]byte, 4096)
	for {
		n, err := reader.Read(buf)
		if n > 0 {
			_ = ie.writeMessage(conn, WSTerminalMessage{Type: msgType, Payload: string(buf[:n])})
		}
		if err != nil {
			break
		}
	}
}

func (ie *InteractiveExecutor) waitForExit(cmd *exec.Cmd, conn *websocket.Conn) {
	_ = cmd.Wait()
	_ = ie.writeMessage(conn, WSTerminalMessage{Type: "exit", Payload: "Процесс завершен"})
}
