# backend - testing client connection to server

import socket

HOST = "0.0.0.0" #accept any connections from interface
PORT = 22599

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.connect((HOST, PORT))

print("[CLIENT] Connected to server")

while True:
    msg = input("> ")   # user types a command like REGISTER Tristan (testCase)

    if msg.lower() == "quit":
        break

    sock.sendall((msg + "\n").encode())

    response = sock.recv(4096).decode().strip()
    print("[CLIENT] Server replied:", response)

sock.close()
print("[CLIENT] Disconnected")