@echo off
title Estartesana - Node Server
cls
echo.
echo ========================================
echo   STARTING NODE.JS SERVER
echo ========================================
echo.
echo Server URL: http://localhost:8080
echo.
echo Opening browser...
start http://localhost:8080/index.html
echo.
echo Installing/starting http-server...
echo.
npx -y http-server . -p 8080 --cors -c-1
pause
