import Phaser from "phaser";
import mazeData from "../../assets/maze.json"

export default class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");
    }
    //all fields for this screne that is importnat 
    //FEATURES: chat, sockets
    init(data) {
        this.socket = data.socket;
        this.username = data.username;
        this.room = data.room;
        this.chatOpen = false;
        this.chatMessages = [];
    }

    preload() {
        //this is all teh images in the source(all backrooms themed)
        this.load.image("floor", "assets/tiles/floor.png");
        this.load.image("wall", "assets/tiles/wall.png");
        this.load.image("exit", "assets/tiles/exit.png");
    }
    //this is where all the UI rendering is happening
    create() {

        // UI
        this.add.text(20, 20, `Game Room: ${this.room}`, {
            fontSize: "22px",
            color: "#ffff00"
        });

        this.add.text(20, 50, `You are: ${this.username}`, {
            fontSize: "20px",
            color: "#ffffff"
        });

        // ---- MAZE SETUP ----
        const map = mazeData.tiles;
        //calculate maze dimensiosn for centering 
        const TILE = 16;
        const mazeWidth = map[0].length * TILE;
        const mazeHeight = map.length * TILE;

        const centerX = (this.scale.width - mazeWidth) / 2;
        const centerY = (this.scale.height - mazeHeight) / 2;

        //this is for the chatbox
        this.mazeBottom = centerY + mazeHeight;

        // draw maze
        for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[y].length; x++) {
                let tile = map[y][x];
                if (tile === 0)
                    this.add.image(centerX + x*TILE, centerY + y*TILE, "floor").setOrigin(0);
                if (tile === 1)
                    this.add.image(centerX + x*TILE, centerY + y*TILE, "wall").setOrigin(0);
                if (tile === 2)
                    this.add.image(centerX + x*TILE, centerY + y*TILE, "exit").setOrigin(0);
            }
        }
        // start player in the center of the map for now
        //dont hardcode this 
        const startX = 1;
        const startY = 1;
        this.playerTileX = startX;
        this.playerTileY = startY;

        //create ownplayer rectangle 
        this.player = this.add.rectangle( centerX + startX * TILE, centerY + startY * TILE, TILE, TILE, 0xffffff ).setOrigin(0);


        //create other player rectangles

        this.otherPlayers = {};
        // keybinds
        this.keys = this.input.keyboard.addKeys({
            up: "W",
            down: "S",
            left: "A",
            right: "D",
            leave: "X",
            chat: "C"
        });
        //initiliaze the key press 
        //this.keyReady = true;
        // listen for backend movement updates with players 
        //this is for other players 
        this.socket.onmessage = (event) => {
            const msg = event.data.trim();
            const parts = msg.split(" "); //parts are the server text 
            // ex parts[0] = MOVED , [1] = user 2 and 3 are x and y 

            if (parts[0] === "MOVED") 
            {
                const user = parts[1];
                const x = parseInt(parts[2]);
                const y = parseInt(parts[3]);

                const px = centerX + x * TILE;
                const py = centerY + y * TILE;

                if (user === this.username) 
                {
                    // update your player
                    this.player.x = px;
                    this.player.y = py;
                }
                else 
                {
                    // update or create other player sprites
                    if (!this.otherPlayers[user]) 
                    {
                        this.otherPlayers[user] = this.add.rectangle(px, py, TILE, TILE, 0xff0000).setOrigin(0);
                    } 
                    else 
                    {
                        this.otherPlayers[user].x = px;
                        this.otherPlayers[user].y = py;
                    }
                }
            }

            if (parts[0] === "CHAT") {
                const user = parts[1];
                const text = parts.slice(2).join(" ");
                this.showChatMessage(`${user}: ${text}`);
            }

            //other users left 
            if (parts[0] === "LEFT") 
            {
                const user = parts[1];

                if (this.otherPlayers[user]) 
                {
                    this.otherPlayers[user].destroy(); //delete the red icon
                    delete this.otherPlayers[user];
                }
            }
            //you left 
            if (parts[0] === "LEFT_GAME") 
            {
                this.scene.start("MenuScene", {socket: this.socket,username: this.username});
            }
        };
    }

    //if press enter, send chat to method logic
    handleChatKey = (event) => {
        if (!this.chatOpen) return;

        if (event.key === "Enter") {
            const msg = this.chatInput.substring(1);
            if (msg.length > 0) 
            {
                this.socket.send("CHAT " + msg);
            }
            this.closeChatBox();
        }
        else if (event.key === "Escape") {
            this.closeChatBox();
        }
        else if (event.key === "Backspace") 
            {
            if (this.chatInput.length > 1) 
            {
                this.chatInput = this.chatInput.slice(0, -1);
                this.chatText.setText(this.chatInput);
            }
        }
        else if (event.key.length === 1) 
            {
            this.chatInput += event.key;
            this.chatText.setText(this.chatInput);
        }
    };
    //open if c is pressed and 
    openChatBox() {
        if (this.chatOpen) return;
        this.chatOpen = true;

        this.chatInput = "";

        const barY = this.mazeBottom - 60;
        //create chat message box
        this.chatBG = this.add.rectangle(
            this.scale.width / 2,
            barY,
            this.scale.width - 80,
            40,
            0x000000,
            0.7
        );

        this.chatText = this.add.text(50, barY - 10, this.chatInput, {
            fontSize: "20px",
            color: "#ffffff"
        });

        this.input.keyboard.on("keydown", this.handleChatKey);
    }
    //destroy and delete the text once you press enter 
    closeChatBox() {
        this.chatOpen = false;

        if (this.chatBG) this.chatBG.destroy();
        if (this.chatText) this.chatText.destroy();

        this.input.keyboard.off("keydown", this.handleChatKey);
    }

    showChatMessage(text) {
    const baseY = this.mazeBottom + 30;

    // remove oldest if 4 already exist
    if (this.chatMessages.length >= 4) 
    {
        const removed = this.chatMessages.shift();
        removed.destroy();
    }

    // reposition all existing messages (mess around with position)
    for (let i = 0; i < this.chatMessages.length; i++) {
        const msgY = baseY + i * 22;
        this.chatMessages[i].y = msgY;
    }

    // add the new message at the bottom
    const newY = baseY + this.chatMessages.length * 22;

    const msg = this.add.text(50, newY, text, {
        fontSize: "18px",
        color: "#00ff00"
    });

    this.chatMessages.push(msg);
    }

    //update the user position with WASD
    update() {
        if (!this.keyReady) 
        {
            // wait for key release
            if (!this.keys.up.isDown && !this.keys.down.isDown && !this.keys.left.isDown && !this.keys.right.isDown) 
            {
                this.keyReady = true;
            }
            return;
        }
        //this is for chat
        if (this.keys.chat.isDown && !this.chatOpen) 
        {
            this.openChatBox();
            return;
        }
        //exit if the chat is already open
        if (this.chatOpen) return;

        let dir = null;
        //direction for sending to backend with WASD 
        if (this.keys.up.isDown) 
        {
            dir = "UP";
        }       
        else if (this.keys.down.isDown)
        {
            dir = "DOWN";
        } 
        else if (this.keys.left.isDown)
        {
            dir = "LEFT";
        } 
        else if (this.keys.right.isDown)
        {
            dir = "RIGHT";
        } 
        if (dir) 
        {
            this.socket.send(`MOVE ${dir}`);
            this.keyReady = false;   // block until released
        }
        if (this.keys.leave.isDown) 
        {
            this.socket.send("LEAVE_GAME");
        }
    }
}
