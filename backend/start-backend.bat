@echo off
title Estartesana Backend Services
cls
echo.
echo ========================================
echo   ESTARTESANA - BACKEND SERVICES
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found
    echo.
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js detected
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [INFO] Installing dependencies...
    echo.
    call npm install
    echo.
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
)

echo [OK] Dependencies ready
echo.

REM Check if .env exists
if not exist ".env" (
    echo [WARNING] .env file not found
    echo.
    echo Creating .env from .env.example...
    echo Please edit backend/.env with your configuration
    echo.
    copy .env.example .env >nul
    echo [INFO] .env file created - Please configure before starting
    echo.
    pause
)

echo ========================================
echo   STARTING SERVICES
echo ========================================
echo.
echo   Email Service:    http://localhost:3000
echo   Shipping Service: http://localhost:3001
echo.
echo   Press Ctrl+C to stop all services
echo.
echo ========================================
echo.

REM Start both services using concurrently
echo Starting Email Service and Shipping Service...
echo.

npx -y concurrently -n "EMAIL,SHIPPING" -c "green,cyan" "node email-service.js" "node shipping-service.js"

:end
echo.
echo ========================================
echo   SERVICES STOPPED
echo ========================================
echo.
pause
