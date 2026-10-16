from socket_layer.socket_implementation import start_server

def main():
    print("[SERVER] Starting server...")
    start_server()

    # Keep server running forever
    #just wanted a socket_implementation layer for more clarity and organization for my API - Socket
    while True:
        pass   

if __name__ == "__main__":
    main()
