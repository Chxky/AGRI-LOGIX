@echo off
echo ========================================================
echo        AGRI-LOGIX DASHBOARD LAUNCHER
echo ========================================================
echo.
echo Starting all dashboards for the presentation...
echo.

echo [1/4] Starting Seed House Portal...
start "Seed House (Port 3000)" cmd /k "cd seedhouse-dashboard && npm start"

echo [2/4] Starting Government Portal...
start "Government (Port 3001)" cmd /k "cd government-dashboard && npm start"

echo [3/4] Starting Extension Officer Portal...
start "Extension Officer (Port 3002)" cmd /k "cd extension-officer-dashboard && npm start"

echo [4/4] Starting Farmer Portal...
start "Farmer (Port 3003/3004)" cmd /k "cd farmer-dashboard && npm start"

echo.
echo ========================================================
echo Success! All dashboards are now starting.
echo Four new terminal windows have been opened for the servers.
echo You can safely minimize them while you present.
echo ========================================================
pause
