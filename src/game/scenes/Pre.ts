import { Scene } from "phaser";
import { initializeApp } from "firebase/app";

export class Pre extends Scene {
    constructor() {
        super("Pre");
    }

    private loadingText?: Phaser.GameObjects.Text;

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
        
        // Load bitmap font
        this.load.bitmapFont('thick_8x8', 'fonts/thick_8x8.png', 'fonts/thick_8x8.xml');
    }

    create() {
        const { width, height } = this.scale;
        
        // Show loading text using bitmap font
        this.loadingText = this.add.bitmapText(width / 2, height / 2, 'thick_8x8', 'Loading...', 16)
            .setOrigin(0.5)
            .setTint(0xf6d6bd);

        // Proceed to Title scene after a brief delay
        this.time.delayedCall(500, () => {
            this.scene.start('Title');
        });
    }
}
