@echo off
echo ============================================
echo  SkillXchange Dev Server Launcher
echo ============================================
echo.

echo [1/3] Killing stale Node processes on ports 5008 and 5173...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":5008 " ^| findstr "LISTENING"') do (
    echo     Killing PID %%a on port 5008...
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":5173 " ^| findstr "LISTENING"') do (
    echo     Killing PID %%a on port 5173...
    taskkill /F /PID %%a >nul 2>&1
)
echo     Done.
echo.

echo [2/3] Starting Backend on port 5008...
start "SkillXchange Backend" cmd /k "cd /d %~dp0backend && node server.js"
timeout /t 3 /nobreak >nul

echo [3/3] Starting Frontend on port 5173...
start "SkillXchange Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ============================================
echo  Both servers starting!
echo  Backend:  http://localhost:5008/api/health
echo  Frontend: http://localhost:5173
echo ============================================
echo.
pause
