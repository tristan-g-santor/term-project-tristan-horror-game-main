@echo off
echo Installing project dependencies...

REM ---- Python Dependencies ----
echo.
echo Installing Python dependencies...
cd backend
python -m pip install --upgrade pip
python -m pip install websockets
cd ..

REM ---- Node Dependencies: Frontend ----
echo.
echo Installing Frontend dependencies...
cd frontend
call npm install
cd ..

REM ---- Node Dependencies: WebSocket Bridge ----
echo.
echo Installing Node bridge dependencies...
cd node_bridge
call npm install
cd ..

echo.
echo All dependencies installed successfully!
pause
