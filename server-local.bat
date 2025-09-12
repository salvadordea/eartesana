@echo off
echo Iniciando servidor local para Estudio Artesana...
echo.
echo Servidor corriendo en: http://localhost:8000
echo Presiona Ctrl+C para detener
echo.

REM Intenta con Python 3 primero
python -m http.server 8000 2>nul
if %errorlevel% neq 0 (
    REM Si Python 3 falla, intenta con Python 2
    python -m SimpleHTTPServer 8000 2>nul
    if %errorlevel% neq 0 (
        echo Error: Python no está instalado o no está en PATH
        echo.
        echo Instalando Python o usando servidor alternativo...
        echo Por favor instala Python desde: https://python.org/downloads/
        pause
        exit /b 1
    )
)
