# How to Play
W = Up  
A = Left  
S = Down  
D = Right  
X = Leave Game  
C = Chat  

# Windows (Recommended)

## Install Dependencies
Run:
    .\install_dependencies.bat

## Network Configuration (Required for Multiplayer)
Find your IPv4 address:
    ipconfig  →  Wi-Fi Adapter → IPv4 Address

Update this IPv4 address in the following files:

1. node_bridge/node_websocket.js
       const TCP_HOST = "your_ipv4_here";

2. backend/socket_implementation.py
       HOST = "your_ipv4_here"

3. frontend/src/scenes/BootScene.js
       new WebSocket("ws://your_ipv4_here:8080");

All players connecting to your host must use the SAME IPv4 address.

## Run the Game
Start all services:
    .\run_game.bat (creates 3 terminals)

Open the game in your browser:
    http://your_ipv4_here:5173 or provided in terminal


# Linux / Mac (Optional / Experimental)
chmod +x run_game.sh  
./run_game.sh
