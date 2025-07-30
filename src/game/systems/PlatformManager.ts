import { Scene } from 'phaser';
import { Platform } from './LevelGenerator';

export interface PlatformVisual extends Platform {
    sprite: Phaser.GameObjects.Rectangle;
    labelText: Phaser.GameObjects.Text;
    isOccupied: boolean;
    passengerWaiting: boolean;
}

export class PlatformManager {
    private scene: Scene;
    private platforms: PlatformVisual[] = [];
    private platformGroup: Phaser.GameObjects.Group;

    // Color palette from CLAUDE.md
    private readonly colors = {
        background: '#08141e',
        platform: '#20394f',
        platformBorder: '#997577',
        text: '#f6d6bd',
        textSecondary: '#c3a38a',
        accent: '#816271',
        highlight: '#4e495f'
    };

    constructor(scene: Scene) {
        this.scene = scene;
        this.platformGroup = scene.add.group();
    }

    createPlatforms(platformData: Platform[]): PlatformVisual[] {
        // Clear existing platforms
        this.clearPlatforms();

        platformData.forEach(platform => {
            const visual = this.createPlatformVisual(platform);
            this.platforms.push(visual);
            this.platformGroup.add([visual.sprite, visual.labelText]);
        });

        return this.platforms;
    }

    private createPlatformVisual(platform: Platform): PlatformVisual {
        // Platform dimensions
        const platformWidth = 80;
        const platformHeight = 20;

        // Create platform sprite as rectangle
        const sprite = this.scene.add.rectangle(
            platform.x,
            platform.y,
            platformWidth,
            platformHeight,
            parseInt(this.colors.platform.replace('#', '0x'))
        );

        // Add border
        sprite.setStrokeStyle(2, parseInt(this.colors.platformBorder.replace('#', '0x')));

        // Create platform label
        const labelText = this.scene.add.text(
            platform.x,
            platform.y - 35,
            platform.id,
            {
                fontFamily: 'Sixtyfour',
                fontSize: '16px',
                color: this.colors.text
            }
        ).setOrigin(0.5);

        return {
            ...platform,
            sprite,
            labelText,
            isOccupied: false,
            passengerWaiting: false
        };
    }

    getPlatformById(id: string): PlatformVisual | undefined {
        return this.platforms.find(platform => platform.id === id);
    }

    getAllPlatforms(): PlatformVisual[] {
        return [...this.platforms];
    }

    setPlatformOccupied(id: string, occupied: boolean): void {
        const platform = this.getPlatformById(id);
        if (platform) {
            platform.isOccupied = occupied;
            this.updatePlatformVisuals(platform);
        }
    }

    setPlatformPassengerWaiting(id: string, waiting: boolean): void {
        const platform = this.getPlatformById(id);
        if (platform) {
            platform.passengerWaiting = waiting;
            this.updatePlatformVisuals(platform);
        }
    }

    private updatePlatformVisuals(platform: PlatformVisual): void {
        // Update platform color based on state
        let fillColor = this.colors.platform;
        let textColor = this.colors.text;

        if (platform.isOccupied) {
            fillColor = this.colors.accent;
        } else if (platform.passengerWaiting) {
            fillColor = this.colors.highlight;
            textColor = this.colors.textSecondary;
        }

        platform.sprite.setFillStyle(parseInt(fillColor.replace('#', '0x')));
        platform.labelText.setColor(textColor);
    }

    getRandomPlatform(): PlatformVisual | null {
        if (this.platforms.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * this.platforms.length);
        return this.platforms[randomIndex];
    }

    getAvailablePlatforms(): PlatformVisual[] {
        return this.platforms.filter(platform => !platform.isOccupied);
    }

    getPlatformsWithPassengers(): PlatformVisual[] {
        return this.platforms.filter(platform => platform.passengerWaiting);
    }

    validatePlatformLayout(): { valid: boolean; issues: string[] } {
        const issues: string[] = [];

        // Check for overlapping platforms
        for (let i = 0; i < this.platforms.length; i++) {
            for (let j = i + 1; j < this.platforms.length; j++) {
                const platform1 = this.platforms[i];
                const platform2 = this.platforms[j];
                
                const distance = Math.sqrt(
                    Math.pow(platform1.x - platform2.x, 2) + 
                    Math.pow(platform1.y - platform2.y, 2)
                );

                const minDistance = 100; // Minimum safe distance between platforms
                if (distance < minDistance) {
                    issues.push(`Platforms ${platform1.id} and ${platform2.id} are too close (${distance.toFixed(1)} < ${minDistance})`);
                }
            }
        }

        // Check if platforms are within screen bounds
        const { width, height } = this.scene.scale;
        this.platforms.forEach(platform => {
            if (platform.x < 50 || platform.x > width - 50) {
                issues.push(`Platform ${platform.id} is outside horizontal bounds`);
            }
            if (platform.y < 50 || platform.y > height - 50) {
                issues.push(`Platform ${platform.id} is outside vertical bounds`);
            }
        });

        return {
            valid: issues.length === 0,
            issues
        };
    }

    highlightPlatform(id: string, highlight: boolean): void {
        const platform = this.getPlatformById(id);
        if (platform) {
            if (highlight) {
                // Add pulsing highlight effect
                this.scene.tweens.add({
                    targets: platform.sprite,
                    scaleX: 1.2,
                    scaleY: 1.2,
                    duration: 500,
                    yoyo: true,
                    repeat: -1
                });
                platform.sprite.setStrokeStyle(4, parseInt(this.colors.text.replace('#', '0x')));
            } else {
                // Remove highlight effects
                this.scene.tweens.killTweensOf(platform.sprite);
                platform.sprite.setScale(1);
                platform.sprite.setStrokeStyle(2, parseInt(this.colors.platformBorder.replace('#', '0x')));
            }
        }
    }

    clearPlatforms(): void {
        this.platforms.forEach(platform => {
            platform.sprite.destroy();
            platform.labelText.destroy();
        });
        this.platforms = [];
        this.platformGroup.clear(true, true);
    }

    destroy(): void {
        this.clearPlatforms();
        this.platformGroup.destroy(true);
    }
}