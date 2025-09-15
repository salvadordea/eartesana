@echo off
echo ==============================================
echo ESTUDIO ARTESANA - Iniciando Servidores
echo ==============================================
echo.

echo [1/2] Iniciando servidor API en puerto 3001...
start "API Server" cmd /k "cd api && node server.js"
timeout /t 3 /nobreak > nul

echo [2/2] Iniciando servidor web en puerto 8080...
start "Web Server" cmd /k "npx http-server -p 8080 -c-1 -o"

echo.
echo ==============================================
echo ✅ SERVIDORES INICIADOS
echo ==============================================
echo 🌐 Tienda: http://localhost:8080/tienda/index-api.html
echo 🔧 API:    http://localhost:3001/api/test
echo ==============================================
echo.
echo Presiona cualquier tecla para continuar...
pause > nul
