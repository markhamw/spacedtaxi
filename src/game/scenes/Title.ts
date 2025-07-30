import { Scene } from "phaser";

export class Title extends Scene {
    constructor() {
        super("Title");
    }

    create() {
        const { width, height } = this.scale;
        
        // Create background gradient using color palette
        const graphics = this.add.graphics();
        graphics.fillGradientStyle(0x08141e, 0x08141e, 0x0f2a3f, 0x20394f, 1);
        graphics.fillRect(0, 0, width, height);

        // Create decorative border using palette colors
        const borderGraphics = this.add.graphics();
        borderGraphics.lineStyle(4, 0x997577);
        borderGraphics.strokeRect(20, 20, width - 40, height - 40);
        
        borderGraphics.lineStyle(2, 0x816271);
        borderGraphics.strokeRect(25, 25, width - 50, height - 50);

        // Create title text using Sixtyfour font - scaled for 1200x600 resolution
        const titleText = this.add.text(width / 2, height / 2 - 80, 'SPACED TAXI', {
            fontFamily: 'Sixtyfour',
            fontSize: '100px',
            color: '#f6d6bd',
            stroke: '#4e495f',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Create subtitle/instruction text
        const subtitleText = this.add.text(width / 2, height / 2 + 80, 'Press SPACE to Start', {
            fontFamily: 'Sixtyfour',
            fontSize: '40px',
            color: '#c3a38a',
            stroke: '#816271',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Add decorative corner elements using palette colors
        const cornerSize = 30;
        const cornerGraphics = this.add.graphics();
        
        // Top-left corner
        cornerGraphics.fillStyle(0x997577);
        cornerGraphics.fillTriangle(40, 40, 40 + cornerSize, 40, 40, 40 + cornerSize);
        
        // Top-right corner
        cornerGraphics.fillTriangle(width - 40, 40, width - 40 - cornerSize, 40, width - 40, 40 + cornerSize);
        
        // Bottom-left corner
        cornerGraphics.fillTriangle(40, height - 40, 40 + cornerSize, height - 40, 40, height - 40 - cornerSize);
        
        // Bottom-right corner
        cornerGraphics.fillTriangle(width - 40, height - 40, width - 40 - cornerSize, height - 40, width - 40, height - 40 - cornerSize);

        // Add pulsing effect to subtitle with color cycling
        this.tweens.add({
            targets: subtitleText,
            alpha: 0.4,
            duration: 1500,
            yoyo: true,
            repeat: -1
        });

        // Color cycling tween for title text stroke
        this.tweens.add({
            targets: titleText,
            duration: 3000,
            repeat: -1,
            yoyo: true,
            onUpdate: (tween) => {
                const progress = tween.progress;
                const colors = [0x4e495f, 0x816271, 0x997577];
                const colorIndex = Math.floor(progress * colors.length) % colors.length;
                titleText.setStroke(`#${colors[colorIndex].toString(16).padStart(6, '0')}`, 3);
            }
        });

        // Listen for spacebar input only
        this.input.keyboard?.once('keydown-SPACE', () => {
            this.scene.start('Game');
        });
    }
}