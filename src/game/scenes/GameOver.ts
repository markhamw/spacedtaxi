import { Scene } from "phaser";

export class GameOver extends Scene {
    private score: number = 0;
    private reason: string = 'Time ran out!';

    constructor() {
        super("GameOver");
    }

    init(data: { score?: number; reason?: string }) {
        this.score = data.score || 0;
        this.reason = data.reason || 'Time ran out!';
    }

    create() {
        const { width, height } = this.scale;

        // Color palette from CLAUDE.md
        const colors = {
            background: '#08141e',
            text: '#f6d6bd',
            textSecondary: '#c3a38a',
            accent: '#816271',
            danger: '#ff4444'
        };

        // Dark background
        this.add.rectangle(width / 2, height / 2, width, height, parseInt(colors.background.replace('#', '0x')));

        // Game Over title
        this.add.bitmapText(width / 2, height * 0.3, 'thick_8x8', 'GAME OVER', 32)
            .setOrigin(0.5)
            .setTint(parseInt(colors.danger.replace('#', '0x')));

        // Reason
        this.add.bitmapText(width / 2, height * 0.45, 'thick_8x8', this.reason, 16)
            .setOrigin(0.5)
            .setTint(parseInt(colors.text.replace('#', '0x')));

        // Final score
        this.add.bitmapText(width / 2, height * 0.55, 'thick_8x8', `Final Score: ${this.score}`, 14)
            .setOrigin(0.5)
            .setTint(parseInt(colors.textSecondary.replace('#', '0x')));

        // Instructions
        this.add.bitmapText(width / 2, height * 0.7, 'thick_8x8', 'Press SPACE to restart', 12)
            .setOrigin(0.5)
            .setTint(parseInt(colors.accent.replace('#', '0x')));

        this.add.bitmapText(width / 2, height * 0.75, 'thick_8x8', 'Press ESC to return to title', 12)
            .setOrigin(0.5)
            .setTint(parseInt(colors.accent.replace('#', '0x')));

        // Set up input handlers
        this.input.keyboard?.on('keydown-SPACE', () => {
            this.restartGame();
        });

        this.input.keyboard?.on('keydown-ESC', () => {
            this.returnToTitle();
        });

        console.log(`Game Over scene loaded. Score: ${this.score}, Reason: ${this.reason}`);
    }

    private restartGame(): void {
        console.log('Restarting game...');
        this.scene.start('Game');
    }

    private returnToTitle(): void {
        console.log('Returning to title...');
        this.scene.start('Title');
    }
}