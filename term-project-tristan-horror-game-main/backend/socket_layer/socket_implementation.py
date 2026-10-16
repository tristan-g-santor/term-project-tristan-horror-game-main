
from game_api.api import handle_command
from socket_layer.network_utils import send_message #this is not used 

#I tried my best to match the c++ implementation of 
#TCP to Python to practice in different languages as well


import socket, threading
HOST = "192.168.11.101" #FOR (GRADER) #Change to correct port 
PORT = 22599 #my port that i use 

#all the users that are connected now to the server 
clients = []

def start_server():
    #simple first few socket lines to know 
    #help from here: https://www.geeksforgeeks.org/operating-systems/daemon-processes/
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

    server_socket.bind((HOST, PORT))
    server_socket.listen(5)
    #DEBUG
    print(f"[SERVER] Listening on {HOST}:{PORT}")

    #Accept clients 
    #daemon = background thread so now program can exit even if thread is running
    threading.Thread(target=accept_clients, args=(server_socket,), daemon = True).start()

def accept_clients(server_socket):
    while True:
        client_socket, addr = server_socket.accept()
        print(f"[SERVER] Client connected from {addr}")
        clients.append(client_socket)

        #create a new thread 
        threading.Thread(target=handle_client, args=(client_socket,), daemon=True).start()


def handle_client(client_socket):
    while(True):
        try:
            data = client_socket.recv(4096)
            if not data:
                break

            msg = data.decode().strip() #convert bytes into text string 
            print("[TCP SERVER] Received:", msg)
            response = handle_command(msg, client_socket) #sends message to the API Layer so our network is done here 

            #send API back to CLIENT
            if response:
                client_socket.sendall((response + "\n").encode())

        
        #build upon API layer
        except ConnectionResetError:
            break
    
    client_socket.close()
    print("[SERVER] Client disconnected")
