@echo off
echo Building CSharpPracticumGo...

REM Сборка фронтенда
cd frontend
call npm install
call npm run build
cd ..

REM Сборка бэкенда
cd backend
go mod download
go build -o ../build/csharppracticum.exe ./cmd/api
cd ..

echo Build complete! Binary is in build/csharppracticum.exe
