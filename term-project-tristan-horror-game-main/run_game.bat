@echo off
REM Get the directory where this batch file is located
set "PROJECT_DIR=%~dp0"

REM Remove trailing backslash
set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"

REM Start Python server in new terminal
start "Backend Server" cmd /k "cd /d "%PROJECT_DIR%\backend" && python server.py"

REM Start Node WebSocket in new terminal
start "WebSocket Server" cmd /k "cd /d "%PROJECT_DIR%\node_bridge" && node node_websocket.js"

REM Start Frontend dev server in new terminal
start "Frontend Dev" cmd /k "cd /d "%PROJECT_DIR%\frontend" && npm run dev -- --host"

echo All services started in separate terminals!
pause