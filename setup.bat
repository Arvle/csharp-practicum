@echo off
cd /d %~dp0
mkdir bin 2>nul
cd bin
curl -L -o wasmtime.zip https://github.com/bytecodealliance/wasmtime/releases/download/v18.0.0/wasmtime-v18.0.0-x86_64-windows.zip
tar -xf wasmtime.zip
move wasmtime-v18.0.0-x86_64-windows\wasmtime.exe .\wasmtime.exe
rmdir /s /q wasmtime-v18.0.0-x86_64-windows
del wasmtime.zip
echo ✅ wasmtime installed
cd ..