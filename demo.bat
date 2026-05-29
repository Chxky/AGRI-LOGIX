@echo off
echo ========================================
echo   AGRI-LOGIX DEMO LAUNCHER
echo   Republic of Zimbabwe - SeedTracker
echo ========================================
echo.

echo [1/2] Starting Government Dashboard (port 3001)...
start "Gov Dashboard" cmd /c "cd /d %~dp0government-dashboard && npm start"

echo [2/2] Starting Seed House Dashboard (port 3000)...
start "Seed Dashboard" cmd /c "cd /d %~dp0seedhouse-dashboard && npm start"

echo.
echo ========================================
echo   BOTH DASHBOARDS STARTING
echo ========================================
echo.
echo   Government Portal:  http://localhost:3001
echo   Seed House Portal:  http://localhost:3000
echo.
echo   Click "Enter Demo Mode" on the login page
echo   to access without Firebase credentials.
echo.
echo   Press any key to stop both servers...
echo ========================================
pause > nul

taskkill /FI "WINDOWTITLE eq Gov Dashboard*" /F > nul 2>&1
taskkill /FI "WINDOWTITLE eq Seed Dashboard*" /F > nul 2>&1
echo Servers stopped.
