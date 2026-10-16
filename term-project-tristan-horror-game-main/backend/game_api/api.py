# ===============================
#  api.py  — Game API Layer
# ===============================
from socket_layer.network_utils import send_message
import os,json

players = {}        # username -> socket
player_state = {}   # username -> coordinates 
connections = {}    # socket -> username
games = {}          # gameID -> # of players and max players 

#find maze.json 
#decided to locate thinking this is the best approach 
#since i did not want to just copy over the same graph here, which i feel like isnt good practice 
#go back intro project root 3 times 
PROJECT_ROOT = os.path.dirname(os.path.dirname( os.path.dirname(os.path.abspath(__file__))))

#no go forward and locate maze.json (we are now in backrooms-escape)
MAZE_PATH = os.path.join(PROJECT_ROOT, "frontend", "assets", "maze.json")

print("MAZE_PATH:", MAZE_PATH)  # debug, you can remove later

with open(MAZE_PATH) as maze_file:
    maze = json.load(maze_file)["tiles"]



def broadcast(room_id, message):
    #Sends a message to all players in the same game room.
    for username in games[room_id]["players"]:
        sock = players[username]
        send_message(sock, (message + "\n").encode())


def handle_command(message, client_socket):
    #process new message and route it to correct API handler later down
    parts = message.strip().split()

    if len(parts) == 0:
        return "ERROR EMPTY_COMMAND"

    command = parts[0].upper()
    args = parts[1:]

    #ALL MY API COMMANDS: 
    #MORE DETAILS IN DOCUMENTATION

    if command == "REGISTER":
        return handle_register(args, client_socket)
    
    elif command == "UNREGISTER":
        return handle_unregister(args, client_socket)

    elif command == "LIST_GAMES":
        return handle_list_games(args, client_socket)

    elif command == "CREATE_GAME":
        return handle_create_game(args, client_socket)

    elif command == "JOIN_GAME":
        return handle_join_game(args, client_socket)

    elif command == "MOVE":
        return handle_move(args, client_socket)
    
    elif command == "SCOREBOARD":
        return handle_scoreboard(args, client_socket)
    
    elif command == "CHAT":
        return handle_chat(args, client_socket)


    elif command == "LEAVE_GAME":
        return handle_leave_game(args, client_socket)
    
    

    # Unknown command
    return "ERROR UNKNOWN_COMMAND"


#ALL GAME LOGIC HERE WHICH IS THE CRUCIAL PART OF THE NETWORKING
#AND GAMEPLAY

def handle_register(args, client_socket):
    """
    REGISTER <username>
    """
 
    if len(args) < 1:
        return "ERROR MISSING_USERNAME"
    
    username = args[0]

    if username in players:
        return "ERROR USERNAME_EXISTS"

    players[username] = client_socket; #store username insocket
    connections[client_socket] = username;  #this will help identify the user 
    #set players at 0,0
    player_state[username] = {"x" : 0, "y" : 0, "room" : None, "total_score" : 0}
    
    print(f"[API] Registered {username}")
    return f"REGISTERED {username}"

def handle_unregister(args, client_socket):
    if len(args) < 1:
        return "ERROR MISSING_USERNAME"

    username = args[0]

    # validate user exists
    if username not in players:
        return "ERROR USERNAME_NOT_FOUND"

    # remove player from any lobby
    for game_id, lobby in games.items():
        if username in lobby["players"]:
            lobby["players"].remove(username)
            room = player_state[username]["room"]
            if room is not None:
                broadcast(room, f"LEFT {username}")

    # process socket cleanup
    sock = players[username]

    # remove from master tables
    del players[username]
    del player_state[username]

    #delete all socket connections 
    if sock in connections:
        del connections[sock]

    print(f"[API] Unregistered {username}")
    return f"UNREGISTERED {username}"


def handle_list_games(args, client_socket):
    """
    LIST_GAMES
    """
    #check if there are no current game lobbies that exist
    if len(games) ==  0:
        return "GAMES EMPTY"
    
    #this will format the games into what lobbies are made
    result = ["GAMES"]
    #go through each lobbby with a game ID with a dicionary of players and max players
    for game_id, info in games.items():
        count = len(info["players"])
        result.append(f"{game_id} {count}/{info['max']}")

    #format
    return "\n".join(result)


def handle_create_game(args, client_socket):
    """
    CREATE_GAME <gameID>
    """
    if len(args) < 1:
        return "ERROR MISSING_GAME_ID"
    
    game_id = args[0]

    if game_id in games: 
        return "ERROR GAME_EXISTS"
    #fields are hardcoded to 5, 
    #and this players list are exclusive to each lobby
    games[game_id] = {"players": [], "max": 5}

    print(f"[API] Game created: {game_id}")
    return f"GAME_CREATED {game_id}"


def handle_join_game(args, client_socket):
    """
    JOIN_GAME <gameID>
    """
    if len(args) < 1:
        return "ERROR MISSING_GAME_ID"
    
    game_id = args[0]

    #check if game full and doesnt exist 
    if game_id not in games: 
        return "ERROR NO_SUCH_GAME"

    #check if game is full
    if(len(games[game_id]["players"]) >= games[game_id]["max"]):
        return "ERROR GAME_FULL"
    
    #check who is joining 
    username = connections.get(client_socket)

    games[game_id]["players"].append(username)
    player_state[username]["room"] = game_id

    #start user with origin at the top right of the imported grid 
    player_state[username]["x"] = 1
    player_state[username]["y"] = 1

    #debug
    print(f"[API] {username} joined {game_id}")
    return f"JOINED {game_id}"


def handle_move(args, client_socket):

    #router will call all the directions for the backend to interpet
    #but is only binded to WASD 
    if len(args) < 1:
        return "ERROR MISSING_DIRECTION"

    #get the direction and correlate that with the user 
    direction = args[0].upper()
    username = connections.get(client_socket)


    if username is None:
        return "ERROR NOT_REGISTERED"

    room = player_state[username]["room"]
    if room is None:
        return "ERROR NOT_IN_GAME"

    x = player_state[username]["x"]
    y = player_state[username]["y"]

    # update coordinates in order to sync with backend
    newx, newy = x,y
    if direction == "UP":
        newy -= 1
    elif direction == "DOWN":
        newy += 1
    elif direction == "LEFT":
        newx -= 1
    elif direction == "RIGHT":
        newx += 1
    else:
        return "ERROR BAD_DIRECTION"
    

    #added boundary protection of maze dimensions 
    #look back at this 
    if newy < 0 or newy >= len(maze) or newx < 0 or newx >= len(maze[0]):
        return 
    
    tile = maze[newy][newx]
    
    #if the tile # is 1 (wall) ignore movement 
    if tile == 1:
        return
    
    #this is if they win
    if tile == 2:
        # announce winner
        broadcast(room, f"WIN {username}")
        print(f"[API] {username} reached EXIT")

        # increase player's total score (for global)
        player_state[username]["total_score"] += 1

        # reset player to start position
        player_state[username]["x"] = 1
        player_state[username]["y"] = 1

        # broadcast teleport to everyone
        broadcast(room, f"MOVED {username} {1} {1}")

        # return the reset position to the winner
        return f"MOVED {username} {1} {1}"
        

    player_state[username]["x"] = newx
    player_state[username]["y"] = newy

    
    # broadcast to everyone in room
    broadcast(room, f"MOVED {username} {newx} {newy}")

    print(f"[API] {username} moved {direction}")
    return f"MOVED {username} {newx} {newy}"

def handle_chat(args, client_socket):
    #this is a check
    if len(args) < 1:
        return "ERROR EMPTY_CHAT"

    #show chat to all the players in the room 
    username = connections.get(client_socket)
    if username is None:
        return "ERROR NOT_REGISTERED"

    room = player_state[username]["room"]
    if room is None:
        return "ERROR NOT_IN_GAME"

    # Join all remaining args into a chat string
    message = " ".join(args)

    # Broadcast in format: CHAT <username> <message>
    broadcast(room, f"CHAT {username} {message}")

    return "CHAT_SENT"

def handle_scoreboard(args, client_socket):
    #just a simple scoreboard to show all current users in the registry 
    username = connections.get(client_socket)
    if username is None:
        return "ERROR NOT_REGISTERED"

    result = ["SCOREBOARD"]

    # iterate through ALL registered players
    for user, state in player_state.items():
        score = state["total_score"]
        result.append(f"{user} {score}")

    return "\n".join(result)




def handle_leave_game(args, client_socket):
    username = connections.get(client_socket)
    if not username:
        return "ERROR NOT_LOGGED_IN"

    # find the lobby the player is in
    for lobby in games.values():
        if username in lobby["players"]:
            room = player_state[username]["room"]
            #also notify other users you left 
            broadcast(room, f"LEFT {username}")
            lobby["players"].remove(username) 
            player_state[username]["room"] = None

            print(f"[API] {username} left game")
            return "LEFT_GAME"

    return "ERROR NOT_IN_GAME"