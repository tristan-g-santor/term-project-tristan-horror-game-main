import Phaser from "phaser";

export default class RegisterScene extends Phaser.Scene {
    constructor() {
        super("RegisterScene");
    }
    //FEATURES: socket information, for registering
    init(data) {
        this.socket = data.socket;
    }

    create() {
        this.add.text(20, 20, "Enter Username", {
            fontSize: "28px",
            color: "#ffff00"
        });

        // HTML Input for username
        this.usernameInput = document.createElement("input");
        this.usernameInput.type = "text";
        this.usernameInput.placeholder = "username";
        this.usernameInput.style.position = "absolute";
        this.usernameInput.style.top = "80px";
        this.usernameInput.style.left = "20px";
        this.usernameInput.style.fontSize = "20px";
        document.body.appendChild(this.usernameInput);

        // clear error when typing anything
        this.usernameInput.oninput = () => {
            if (this.errorText) {
                this.errorText.destroy();
                this.errorText = null;
            }
        };

        // HTML Button for register
        this.registerButton = document.createElement("button");
        this.registerButton.innerText = "Register";
        this.registerButton.style.position = "absolute";
        this.registerButton.style.top = "120px";
        this.registerButton.style.left = "20px";
        this.registerButton.style.fontSize = "20px";
        document.body.appendChild(this.registerButton);

        // On click, send REGISTER command
        this.registerButton.onclick = () => {
            const username = this.usernameInput.value.trim();
            if (!username) return;

            const msg = `REGISTER ${username}`;
            console.log("[FRONTEND] Sent:", msg);
            this.socket.send(msg);
        };

        // Handle backend reply
        this.socket.onmessage = (event) => {
            const data = event.data.trim();
            console.log("[FRONTEND] Received:", data);

            // Successful registration: REGISTERED <username>
            if (data.startsWith("REGISTERED")) {
                if (this.errorText) this.errorText.destroy(); // clear error
                this.cleanup();
                this.scene.start("MenuScene", {
                    socket: this.socket,
                    username: this.usernameInput.value.trim()
                });
            }

            // Error case from Python: ERROR USERNAME_EXISTS
            if (data === "ERROR USERNAME_EXISTS") {
                this.showError("Username already exists.");
            }
        };
    }

    showError(msg) {
        // destroy previous error text if it exists
        if (this.errorText) {
            this.errorText.destroy();
        }

        // create new red error text
        this.errorText = this.add.text(20, 160, msg, {
            fontSize: "18px",
            color: "#ff0000"
        });
    }

    cleanup() {
        if (this.usernameInput) this.usernameInput.remove();
        if (this.registerButton) this.registerButton.remove();
        if (this.errorText) {
            this.errorText.destroy();
            this.errorText = null;
        }
    }

    shutdown() {
        this.cleanup();
    }
}
