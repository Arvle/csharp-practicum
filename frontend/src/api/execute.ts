import { apiClient } from './client';
import { getToken } from '../utils/token';
import type { CompilationResult } from './types';

type WSMessageType = 'code' | 'input' | 'close' | 'output' | 'error' | 'exit' | 'ready';

interface WSMessage {
  type: WSMessageType;
  payload: string;
}

export class WSTerminal {
  private ws: WebSocket | null = null;
  private readonly baseUrl: string;
  private onOutputCb?: (output: string) => void;
  private onErrorCb?: (error: string) => void;
  private onExitCb?: () => void;
  private onReadyCb?: () => void;
  private reconnectAttempts = 0;
  private manuallyClosed = false;
  private readonly MAX_RECONNECTS = 3;

  constructor(baseUrl: string) {
    if (baseUrl.startsWith('http')) {
      this.baseUrl = baseUrl.replace(/^http/, 'ws');
      return;
    }

    const path = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`;
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    this.baseUrl = `${protocol}://${window.location.host}${path}`;
  }

  connect(code: string): Promise<void> {
    this.manuallyClosed = false;

    return new Promise((resolve, reject) => {
      const token = getToken();
      if (!token) {
        reject(new Error('Требуется авторизация'));
        return;
      }

      const separator = this.baseUrl.includes('?') ? '&' : '?';
      const wsUrl = `${this.baseUrl}/execute/ws${separator}token=${encodeURIComponent(token)}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.sendMessage({ type: 'code', payload: code });
        resolve();
      };

      this.ws.onmessage = (event: MessageEvent<string>) => {
        try {
          const msg = JSON.parse(event.data) as WSMessage;
          switch (msg.type) {
            case 'output':
              this.onOutputCb?.(msg.payload);
              break;
            case 'error':
              this.onErrorCb?.(msg.payload);
              break;
            case 'ready':
              this.onReadyCb?.();
              break;
            case 'exit':
              this.onExitCb?.();
              this.close();
              break;
            default:
              break;
          }
        } catch (err: unknown) {
          this.onErrorCb?.(`Parse error: ${err instanceof Error ? err.message : String(err)}`);
        }
      };

      this.ws.onerror = (err: Event) => {
        this.onErrorCb?.('WebSocket connection error');
        reject(err);
      };

      this.ws.onclose = () => {
        this.ws = null;
        if (!this.manuallyClosed && this.reconnectAttempts < this.MAX_RECONNECTS) {
          this.reconnectAttempts += 1;
          window.setTimeout(() => {
            this.connect(code).catch((err: unknown) => {
              this.onErrorCb?.(`Reconnect error: ${err instanceof Error ? err.message : String(err)}`);
            });
          }, 1000 * this.reconnectAttempts);
        }
      };
    });
  }

  private sendMessage(message: WSMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  sendInput(text: string): void {
    this.sendMessage({ type: 'input', payload: text });
  }

  close(): void {
    this.manuallyClosed = true;
    if (!this.ws) return;

    if (this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ type: 'close', payload: '' } satisfies WSMessage));
      } catch {
      }
    }

    if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
      this.ws.close();
    }
    this.ws = null;
  }

  onOutput(cb: (output: string) => void): this {
    this.onOutputCb = cb;
    return this;
  }

  onError(cb: (error: string) => void): this {
    this.onErrorCb = cb;
    return this;
  }

  onReady(cb: () => void): this {
    this.onReadyCb = cb;
    return this;
  }

  onExit(cb: () => void): this {
    this.onExitCb = cb;
    return this;
  }

  static async runFallback(code: string, input?: string): Promise<CompilationResult> {
    return apiClient.post<CompilationResult>('/execute', { code, input });
  }
}

export const executeApi = {
  run: (code: string, input?: string) =>
    apiClient.post<CompilationResult>('/execute', { code, input }),
  createTerminal: (baseUrl?: string) =>
    new WSTerminal(baseUrl || import.meta.env.VITE_API_URL || 'http://localhost:8080/api'),
};