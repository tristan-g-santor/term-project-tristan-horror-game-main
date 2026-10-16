#this is just a wrapper which basicaly is core to the 
#design, since I had a big bug where the socket implementation
#and the api relied on it resulting in cyclic imports
#this avoids using send() which may be inconsistent as well
def send_message(client_socket, msg_bytes):
    client_socket.sendall(msg_bytes)
