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
    }

    create() {
        const { width, height } = this.scale;
        
        // Show loading text
        this.loadingText = this.add.text(width / 2, height / 2, 'Loading...', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#f6d6bd'
        }).setOrigin(0.5);

        // Load and wait for Sixtyfour font
        this.loadFont();
    }

    private async loadFont(): Promise<void> {
        try {
            // Load font CSS
            const link = document.createElement('link');
            link.href = 'https://fonts.googleapis.com/css2?family=Sixtyfour:wght@400&display=swap';
            link.rel = 'stylesheet';
            document.head.appendChild(link);

            // Wait for CSS to load
            await new Promise<void>((resolve) => {
                link.onload = () => resolve();
                link.onerror = () => resolve(); // Continue even if CSS fails
            });

            // Wait for all fonts to be ready (includes our Sixtyfour font)
            await document.fonts.ready;

            // Font loaded successfully, proceed to Title scene
            this.scene.start('Title');

        } catch (error) {
            console.warn('Font loading failed, proceeding with fallback:', error);
            // Proceed anyway with system font fallback
            this.scene.start('Title');
        }
    }
}
