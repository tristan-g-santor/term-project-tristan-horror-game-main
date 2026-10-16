import Phaser from "phaser";

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super("MenuScene");
    }

    init(data) {
        this.socket = data.socket;
        this.username = data.username;
        this.lobbyTexts = [];
        this.waitingForList = false;
        this.lobbyRefreshInterval = null;
        this.scoreboardTexts = [];
    }

    create() {
        this.add.text(20, 20, "Lobbies", {
            fontSize: "32px",
            color: "#ffff00"
        });

        // Create Lobby Button
        this.createBtn = this.add.text(20, 70, "[ Create Lobby ]", {
            fontSize: "24px",
            color: "#00ff00"
        }).setInteractive();

        this.createBtn.on("pointerdown", () => {
            const id = `${this.username}_lobby_${Math.floor(Math.random() * 9000 + 1000)}`;
            console.log("[FRONTEND] Sent:", `CREATE_GAME ${id}`);
            this.socket.send(`CREATE_GAME ${id}`);

            // Force refresh
            this.forceRefreshLobbies();
        });

        // View Lobbies Button
        this.viewBtn = this.add.text(20, 110, "[ View Lobbies ]", {
            fontSize: "24px",
            color: "#00ff00"
        }).setInteractive();

        this.viewBtn.on("pointerdown", () => {
            this.openLobbyList();
        });

         // Unregister Button
        this.unregisterBtn = this.add.text(20, 150, "[ Unregister ]", {
            fontSize: "24px",
            color: "#ff0000"
        }).setInteractive();

        this.unregisterBtn.on("pointerdown", () => {
            console.log("[FRONTEND] Sent:", `UNREGISTER ${this.username}`);
            this.socket.send(`UNREGISTER ${this.username}`);

            // Cleanup UI
            this.clearLobbyList();
            this.clearScoreboard();
            this.waitingForList = false;
            this.stopLobbyAutoRefresh();

            // Return to RegisterScene
            this.scene.start("RegisterScene");
        });


        // Handle backend messages
        this.socket.onmessage = (event) => {
            const data = event.data.trim();
            console.log("[FRONTEND] Received:", data);

            if (!this.waitingForList) return;
            if (data === "GAMES EMPTY") 
            {
                this.renderEmpty();
            }
            else if (data.startsWith("GAMES")) 
            {
                this.renderLobbyList(data);

                    // request scoreboard after lobby list update
                    //ask for the scoreboard from backend
                    this.socket.send("SCOREBOARD");
            }
            else if(data.startsWith("SCOREBOARD")) 
            {
                this.renderScoreboard(data);
            }
            else if (data.startsWith("GAME_CREATED")) 
            {
                this.forceRefreshLobbies();
            }
            else if (data.startsWith("JOINED")) {
                const room = data.split(" ")[1];

                this.stopLobbyAutoRefresh();
                this.waitingForList = false;

                this.scene.sleep("MenuScene");
                this.scene.start("GameScene", {
                    socket: this.socket,
                    username: this.username,
                    room: room
                });
            }
            else if (data === "ERROR GAME_FULL") 
            {
                this.showError("Lobby is full.");
                this.forceRefreshLobbies();
            }
            else if (data === "ERROR NO_SUCH_GAME") 
            {
                this.showError("Lobby no longer exists.");
                this.forceRefreshLobbies();
            }
        };
    }

 
    //these are all the lobby lists controls
    openLobbyList() {
        this.clearLobbyList();
        this.waitingForList = true;

        this.forceRefreshLobbies(); // immediate refresh

        // Start auto-refresh loop
        this.startLobbyAutoRefresh();
    }

    clearScoreboard() {
        this.scoreboardTexts.forEach(t => t.destroy());
        this.scoreboardTexts = [];
    }


    forceRefreshLobbies() {
        this.waitingForList = true;
        this.requestLobbyList();
        this.socket.send("SCOREBOARD");
    }

    startLobbyAutoRefresh() {
        this.stopLobbyAutoRefresh(); // prevent duplicates

        this.lobbyRefreshInterval = setInterval(() => {
            if (this.waitingForList) {
                this.requestLobbyList();
            }
        }, 1000); // update every second
    }

    stopLobbyAutoRefresh() {
        if (this.lobbyRefreshInterval) {
            clearInterval(this.lobbyRefreshInterval);
            this.lobbyRefreshInterval = null;
        }
    }

    // ------------------------------
    //this is for requesting hte lobbies calling the backend
    // ------------------------------

    requestLobbyList() {
        console.log("[FRONTEND] Sent: LIST_GAMES");
        this.socket.send("LIST_GAMES");
    }

    // ------------------------------
    // render the map and players 
    // ------------------------------

    clearLobbyList() {
        this.lobbyTexts.forEach(t => t.destroy());
        this.lobbyTexts = [];
    }

    renderEmpty() {
        this.clearLobbyList();

        const txt = this.add.text(20, 180, "No lobbies available.", {
            fontSize: "20px",
            color: "#ffffff"
        });

        this.lobbyTexts.push(txt);
    }

    renderLobbyList(raw) {
        this.clearLobbyList();

        const lines = raw.split("\n").slice(1);
        let y = 200;


        lines.forEach((line) => {
            const [id, status] = line.split(" ");

            let prettyName = id;
            if (id.includes("_lobby_")) {
                prettyName = `${id.split("_lobby_")[0]}'s lobby`;
            }

            const txt = this.add.text(20, y, `${prettyName}   ${status}`, {
                fontSize: "22px",
                color: "#ffffff"
            });

            const joinBtn = this.add.text(400, y, "[ Join ]", {
                fontSize: "22px",
                color: "#00ff00"
            }).setInteractive();

            joinBtn.on("pointerdown", () => {
                console.log("[FRONTEND] Sent:", `JOIN_GAME ${id}`);

                joinBtn.disableInteractive();

                this.socket.send(`JOIN_GAME ${id}`);

                this.forceRefreshLobbies();
            });

            this.lobbyTexts.push(txt, joinBtn);
            y += 45;
        });
    }

    //presents raw text string sent from the backend
    renderScoreboard(raw) {
        
        this.clearScoreboard();

        const lines = raw.split("\n").slice(1);

        if (lines.length === 0) return;

        let y = 160;

        const title = this.add.text(600, 120, "Scoreboard", {
            fontSize: "26px",
            color: "#ffff00"
        });

        this.scoreboardTexts.push(title);

        lines.forEach(line => {
            const [user, score] = line.split(" ");

            const row = this.add.text(600, y, `${user}: ${score}`, {
                fontSize: "22px",
                color: "#ffffff"
            });

            this.scoreboardTexts.push(row);
            y += 35;
        });
    }


    showError(msg) {
        if (this.errorText) {
            this.errorText.destroy();
        }

        this.errorText = this.add.text(20, 500, msg, {
            fontSize: "20px",
            color: "#ff0000"
        });
    }
}
