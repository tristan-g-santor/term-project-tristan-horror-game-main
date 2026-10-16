export default class BootScene extends Phaser.Scene {
    constructor() {
        super("BootScene");
    }
    //nothing to render before 
    preload() {}
    //this is not really shown but this exists if the server cant be connected>
    //however if it already connected, you will not see this screen
    create() {
        this.add.text(20, 20, "Connecting to server...", {
            fontSize: "20px",
            color: "#ffff00"
        });

        this.connectToServer();
    }

    connectToServer() {
        //change this to UW IP for testing (hardcoded)
        this.socket = new WebSocket("ws://192.168.11.101:8080");
        
        this.socket.onopen = () => {
            console.log("Connected to backend.");
            this.scene.start("RegisterScene", { socket: this.socket });
        };

        this.socket.onerror = () => {
            this.add.text(20, 60, "Connection failed.", {
                fontSize: "20px",
                color: "#ff0000"
            });
        };
    }
}
