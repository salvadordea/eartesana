@echo off
title Deploy Readiness Check - Estartesana Backend
cls
echo.
echo ========================================
echo   DEPLOY READINESS CHECK
echo   Estartesana Backend Services
echo ========================================
echo.

set "ERRORS=0"
set "WARNINGS=0"

REM Check 1: Node.js installed
echo [1/10] Checking Node.js...
node --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [OK] Node.js installed: %NODE_VERSION%
) else (
    echo [ERROR] Node.js not found
    set /a ERRORS+=1
)
echo.

REM Check 2: package.json exists
echo [2/10] Checking package.json...
if exist "package.json" (
    echo [OK] package.json found
) else (
    echo [ERROR] package.json not found
    set /a ERRORS+=1
)
echo.

REM Check 3: node_modules exists
echo [3/10] Checking dependencies...
if exist "node_modules\" (
    echo [OK] Dependencies installed
) else (
    echo [WARNING] node_modules not found - run 'npm install'
    set /a WARNINGS+=1
)
echo.

REM Check 4: .env file exists
echo [4/10] Checking .env configuration...
if exist ".env" (
    echo [OK] .env file found
) else (
    echo [WARNING] .env file not found
    echo [INFO] Create one from .env.example
    set /a WARNINGS+=1
)
echo.

REM Check 5: email-service.js exists
echo [5/10] Checking email-service.js...
if exist "email-service.js" (
    echo [OK] email-service.js found
) else (
    echo [ERROR] email-service.js not found
    set /a ERRORS+=1
)
echo.

REM Check 6: shipping-service.js exists
echo [6/10] Checking shipping-service.js...
if exist "shipping-service.js" (
    echo [OK] shipping-service.js found
) else (
    echo [ERROR] shipping-service.js not found
    set /a ERRORS+=1
)
echo.

REM Check 7: .gitignore excludes .env
echo [7/10] Checking .gitignore...
if exist "..\\.gitignore" (
    findstr /C:".env" "..\\.gitignore" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [OK] .env is in .gitignore
    ) else (
        echo [WARNING] .env not in .gitignore - SECURITY RISK!
        set /a WARNINGS+=1
    )
) else (
    echo [WARNING] .gitignore not found in parent directory
    set /a WARNINGS+=1
)
echo.

REM Check 8: Git repository initialized
echo [8/10] Checking Git repository...
cd ..
git status >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Git repository initialized
) else (
    echo [WARNING] Not a git repository - run 'git init'
    set /a WARNINGS+=1
)
cd backend
echo.

REM Check 9: backend-config.js exists
echo [9/10] Checking frontend backend-config.js...
if exist "..\assets\js\backend-config.js" (
    echo [OK] backend-config.js found

    REM Check if production URL is configured
    findstr /C:"tu-app.up.railway.app" "..\assets\js\backend-config.js" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [WARNING] Production URL not configured in backend-config.js
        echo [INFO] Update PRODUCTION_BACKEND_URL after Railway deploy
        set /a WARNINGS+=1
    ) else (
        echo [OK] Production URL appears configured
    )
) else (
    echo [ERROR] backend-config.js not found in assets/js/
    set /a ERRORS+=1
)
echo.

REM Check 10: README.md exists
echo [10/10] Checking documentation...
if exist "README.md" (
    echo [OK] README.md found
) else (
    echo [WARNING] README.md not found
    set /a WARNINGS+=1
)
echo.

REM Summary
echo ========================================
echo   CHECK SUMMARY
echo ========================================
echo.
if %ERRORS% EQU 0 (
    if %WARNINGS% EQU 0 (
        echo [SUCCESS] All checks passed! Ready for deploy!
        echo.
        echo Next steps:
        echo 1. Commit your changes: git add . ^&^& git commit -m "Ready for deploy"
        echo 2. Deploy to Railway: https://railway.app
        echo 3. Configure environment variables in Railway
        echo 4. Update backend-config.js with Railway URL
        echo 5. Deploy frontend to Vercel
    ) else (
        echo [WARNING] %WARNINGS% warning(s) found
        echo.
        echo You can proceed with deploy, but review warnings above.
    )
) else (
    echo [FAILED] %ERRORS% error(s) found
    echo.
    echo Fix the errors above before deploying.
)
echo.
echo ========================================
echo.

REM Detailed instructions
if %ERRORS% GTR 0 (
    echo ERROR DETAILS:
    echo.
    if not exist "package.json" (
        echo - package.json missing: This file is required for Railway deploy
    )
    if not exist "email-service.js" (
        echo - email-service.js missing: Main service file not found
    )
    if not exist "shipping-service.js" (
        echo - shipping-service.js missing: Shipping service file not found
    )
    if not exist "..\assets\js\backend-config.js" (
        echo - backend-config.js missing: Frontend won't know where to find the backend
    )
    echo.
)

if %WARNINGS% GTR 0 (
    echo WARNING DETAILS:
    echo.
    if not exist "node_modules\" (
        echo - Run 'npm install' to install dependencies
    )
    if not exist ".env" (
        echo - Copy .env.example to .env and configure it
        echo - Required before running locally or deploying
    )
    echo.
)

pause
