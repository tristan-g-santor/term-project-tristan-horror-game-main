import Phaser from "phaser";
import BootScene from "./scenes/BootScene.js";
import RegisterScene from "./scenes/RegisterScene.js";
import MenuScene from "./scenes/MenuScene.js";
import GameScene from "./scenes/GameScene.js";
//this essentially is the driver for the frontend
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: "#000000",
    physics: {
        default: "arcade"
    },
    scene: [BootScene, RegisterScene, MenuScene, GameScene]
};

new Phaser.Game(config);
