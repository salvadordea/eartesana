@echo off
title Estartesana Local Server
echo Starting local server for Estartesana...
echo.

REM Check if Python is available (most systems have it)
python --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Starting Python HTTP server on http://localhost:8000
    echo Open your browser to: http://localhost:8000
    echo Press Ctrl+C to stop the server
    echo.
    python -m http.server 8000
    goto :end
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: Neither Python nor Node.js found
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Try npx http-server (comes with Node.js)
echo Starting Node.js HTTP server on http://localhost:8080
echo Open your browser to: http://localhost:8080
echo Press Ctrl+C to stop the server
echo.
npx http-server . -p 8080 --cors -c-1

:end
echo.
echo Server stopped.
pause