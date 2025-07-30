import { Scene } from "phaser";
import { initializeApp } from "firebase/app";

export class Game extends Scene {
    constructor() {
        super("Game");
    }

    preload() {
        // Your web app's Firebase configuration
        const firebaseConfig = {
            apiKey: "AIzaSyAcn3b_i7upynax4OifMzMZo-pEbYO7Uhs",
            authDomain: "spacedtaxi.firebaseapp.com",
            projectId: "spacedtaxi",
            storageBucket: "spacedtaxi.firebasestorage.app",
            messagingSenderId: "1062827483125",
            appId: "1:1062827483125:web:be150c67f20029eb8e4abc",
        };
        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        this.load.setPath("assets");

        this.load.image("background", "bg.png");
        this.load.image("logo", "logo.png");
    }

    create() {
        this.add.image(512, 384, "background");
        this.add.image(512, 350, "logo").setDepth(100);
        this.add
            .text(512, 490, "Make something fun!\nand share it with us:\nsupport@phaser.io", {
                fontFamily: "Arial Black",
                fontSize: 38,
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 8,
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100);
    }
}
