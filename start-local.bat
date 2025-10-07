@echo off
title Estartesana Local Server
cls
echo.
echo ========================================
echo   ESTARTESANA - LOCAL SERVER STARTER
echo ========================================
echo.
echo Checking available servers...
echo.

REM Check if Python is available
python --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Python detected
    echo.
    echo Starting Python HTTP server on http://localhost:8000
    echo.
    echo ========================================
    echo   SERVER RUNNING
    echo ========================================
    echo.
    echo   URL: http://localhost:8000
    echo   Index: http://localhost:8000/index.html
    echo.
    echo   Press Ctrl+C to stop the server
    echo.
    echo ========================================
    echo.
    start http://localhost:8000/index.html
    python -m http.server 8000
    goto :end
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Neither Python nor Node.js found
    echo.
    echo Please install one of the following:
    echo   - Python 3.x from https://python.org/
    echo   - Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Try npx http-server (comes with Node.js)
echo [OK] Node.js detected
echo.
echo Checking for http-server package...
echo.
echo Starting Node.js HTTP server on http://localhost:8080
echo.
echo ========================================
echo   SERVER RUNNING
echo ========================================
echo.
echo   URL: http://localhost:8080
echo   Index: http://localhost:8080/index.html
echo.
echo   Press Ctrl+C to stop the server
echo.
echo ========================================
echo.
start http://localhost:8080/index.html
npx -y http-server . -p 8080 --cors -c-1

:end
echo.
echo ========================================
echo   SERVER STOPPED
echo ========================================
echo.
pause