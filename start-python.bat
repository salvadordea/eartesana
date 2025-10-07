@echo off
title Estartesana - Python Server
cls
echo.
echo ========================================
echo   STARTING PYTHON SERVER
echo ========================================
echo.
echo Server URL: http://localhost:8000
echo.
echo Opening browser...
start http://localhost:8000/index.html
echo.
echo Server running. Press Ctrl+C to stop.
echo.
python -m http.server 8000
pause
