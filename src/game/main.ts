import { Pre } from "./scenes/Pre";
import { Title } from "./scenes/Title";
import { Game as GameScene } from "./scenes/Game";
import { GameOver } from "./scenes/GameOver";
import { AUTO, Game, Scale, Types } from "phaser";

// Find out more information about the Game Config at:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Types.Core.GameConfig = {
    type: AUTO,
    width: 1200,
    height: 600,
    parent: "game-container",
    backgroundColor: "#08141e",
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH,
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0, x: 0 }, // Zero gravity space environment
            debug: true, // Enable debug mode
            debugShowBody: true,
            debugShowStaticBody: true,
            debugShowVelocity: true
        }
    },
    scene: [Pre, Title, GameScene, GameOver],
};

const StartGame = (parent: string) => {
    return new Game({ ...config, parent });
};

export default StartGame;
