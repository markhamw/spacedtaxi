import { Scene } from "phaser";

export class Game extends Scene {
    constructor() {
        super("Game");
    }

    create() {
        const { width, height } = this.scale;
    }
}
