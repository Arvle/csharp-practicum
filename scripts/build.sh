#!/bin/bash
echo "Building CSharpPracticumGo..."

# Сборка фронтенда
cd frontend
npm install
npm run build
cd ..

# Сборка бэкенда
cd backend
go mod download
go build -o ../build/csharppracticum ./cmd/api
cd ..

echo "Build complete! Binary is in build/csharppracticum"
chmod +x build/csharppracticum
