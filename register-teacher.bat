@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
echo ==========================================
echo   C# Practicum - registration
echo ==========================================
echo.

:input_token
set /p "SETUP_TOKEN=Enter TEACHER_SETUP_TOKEN: "
if "!SETUP_TOKEN!"=="" (
    echo [ERROR] Token cannot be empty!
    goto input_token
)

:input_name
set /p "FULL_NAME=Enter FIO: "
if "!FULL_NAME!"=="" (
    echo [ERROR] FIO cannot be empty!
    goto input_name
)

:input_pass
set /p "PASSWORD=Enter Password: "
if "!PASSWORD!"=="" (
    echo [ERROR] Password cannot be empty!
    goto input_pass
)

echo.
echo Sending request...
curl.exe -k -L -s -X POST "https://localhost/api/auth/teacher/setup?token=!SETUP_TOKEN!" ^
    -H "Content-Type: application/json; charset=utf-8" ^
    -d "{\"fullName\":\"!FULL_NAME!\",\"password\":\"!PASSWORD!\"}" > temp_resp.json

echo.
echo Server response:
type temp_resp.json
echo.

findstr /C:"error" temp_resp.json >nul
if !errorlevel! equ 0 (
    echo [FAIL] Registration error!
    del temp_resp.json
    pause
    exit /b 1
) else (
    echo [OK] Teacher successfully registered!
    echo Login URL: https://localhost/login
)
del temp_resp.json
pause
