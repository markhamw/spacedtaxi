import { Scene } from 'phaser';
import { Platform } from './LevelGenerator';

export interface PlatformVisual extends Platform {
    sprite: Phaser.GameObjects.Graphics;
    labelText: Phaser.GameObjects.BitmapText;
    collisionBody: Phaser.GameObjects.Rectangle;
    supportArm: Phaser.GameObjects.Graphics;
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
            this.platformGroup.add(visual.supportArm);
            this.platformGroup.add(visual.sprite);
            this.platformGroup.add(visual.labelText);
            this.platformGroup.add(visual.collisionBody);
        });

        return this.platforms;
    }

    private createPlatformVisual(platform: Platform): PlatformVisual {
        // Platform dimensions - made larger for better visibility
        const platformWidth = 120;
        const platformHeight = 30;
        const skewOffset = 20; // Parallelogram skew amount

        // Create support arm first (drawn behind platform)
        const supportArm = this.createPlatformSupportArm(platform);

        // Create platform sprite as parallelogram using Graphics
        const sprite = this.scene.add.graphics();
        this.drawPlatformParallelogram(
            sprite,
            0, 0, // Position relative to the graphics object
            platformWidth,
            platformHeight,
            skewOffset,
            parseInt(this.colors.platform.replace('#', '0x')),
            parseInt(this.colors.platformBorder.replace('#', '0x'))
        );

        // Position the graphics object
        sprite.setPosition(platform.x, platform.y);

        // Create collision body (bottom 50% only for 2.5D effect)
        const collisionBody = this.scene.add.rectangle(
            platform.x,
            platform.y + platformHeight * 0.25, // Offset down by 25% of height
            platformWidth,
            platformHeight * 0.5, // Only bottom 50%
            0x000000 // Color doesn't matter, will be invisible
        );
        collisionBody.setAlpha(0); // Make invisible
        
        // Create platform label
        const labelText = this.scene.add.bitmapText(
            platform.x,
            platform.y - 35,
            'thick_8x8',
            platform.id,
            12
        ).setOrigin(0.5).setTint(parseInt(this.colors.text.replace('#', '0x')));

        return {
            ...platform,
            sprite,
            labelText,
            collisionBody,
            supportArm,
            isOccupied: false,
            passengerWaiting: false
        };
    }

    private drawPlatformParallelogram(
        graphics: Phaser.GameObjects.Graphics,
        x: number,
        y: number,
        width: number,
        height: number,
        skewOffset: number,
        fillColor: number,
        strokeColor: number
    ): void {
        graphics.clear();
        
        // Set fill and stroke styles
        graphics.fillStyle(fillColor);
        graphics.lineStyle(2, strokeColor);

        // Draw parallelogram
        // Start from top-left, go clockwise
        graphics.beginPath();
        graphics.moveTo(x - width/2 + skewOffset, y - height/2); // Top-left (skewed)
        graphics.lineTo(x + width/2 + skewOffset, y - height/2); // Top-right (skewed)
        graphics.lineTo(x + width/2 - skewOffset, y + height/2); // Bottom-right (skewed)
        graphics.lineTo(x - width/2 - skewOffset, y + height/2); // Bottom-left (skewed)
        graphics.closePath();
        
        graphics.fillPath();
        graphics.strokePath();
    }

    private createPlatformSupportArm(platform: Platform): Phaser.GameObjects.Graphics {
        const supportArm = this.scene.add.graphics();
        
        // Support arm extends downward from platform
        const armLength = 25;
        const armWidth = 6;
        
        // Main support beam
        supportArm.fillStyle(parseInt(this.colors.platformBorder.replace('#', '0x')));
        supportArm.fillRect(platform.x - armWidth/2, platform.y + 10, armWidth, armLength);
        
        // Support struts (diagonal supports)
        supportArm.lineStyle(2, parseInt(this.colors.accent.replace('#', '0x')));
        
        // Left strut
        supportArm.beginPath();
        supportArm.moveTo(platform.x - 20, platform.y + 10);
        supportArm.lineTo(platform.x - 3, platform.y + armLength + 10);
        supportArm.strokePath();
        
        // Right strut
        supportArm.beginPath();
        supportArm.moveTo(platform.x + 20, platform.y + 10);
        supportArm.lineTo(platform.x + 3, platform.y + armLength + 10);
        supportArm.strokePath();
        
        // Connection brackets
        supportArm.fillStyle(parseInt(this.colors.accent.replace('#', '0x')));
        supportArm.fillCircle(platform.x - 3, platform.y + armLength + 10, 3);
        supportArm.fillCircle(platform.x + 3, platform.y + armLength + 10, 3);
        
        return supportArm;
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

        // Redraw the parallelogram with new colors
        const platformWidth = 120;
        const platformHeight = 30;
        const skewOffset = 20;
        
        this.drawPlatformParallelogram(
            platform.sprite,
            0, 0, // Position relative to the graphics object
            platformWidth,
            platformHeight,
            skewOffset,
            parseInt(fillColor.replace('#', '0x')),
            parseInt(this.colors.platformBorder.replace('#', '0x'))
        );

        platform.labelText.setTint(parseInt(textColor.replace('#', '0x')));
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

                const minDistance = 150; // Minimum safe distance between platforms - increased for better spacing
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
                // Redraw with highlight border (no pulsing animation)
                const platformWidth = 120;
                const platformHeight = 30;
                const skewOffset = 20;
                
                this.drawPlatformParallelogram(
                    platform.sprite,
                    0, 0,
                    platformWidth,
                    platformHeight,
                    skewOffset,
                    parseInt(this.colors.platform.replace('#', '0x')),
                    parseInt(this.colors.text.replace('#', '0x')) // Highlighted border
                );
            } else {
                // Redraw with normal border
                this.updatePlatformVisuals(platform);
            }
        }
    }

    checkCollisionWithPlatform(x: number, y: number, platformId?: string): PlatformVisual | null {
        // Check collision with specific platform or all platforms
        const platformsToCheck = platformId 
            ? [this.getPlatformById(platformId)].filter(p => p !== undefined) as PlatformVisual[]
            : this.platforms;

        for (const platform of platformsToCheck) {
            const collision = platform.collisionBody;
            const bounds = collision.getBounds();
            
            if (x >= bounds.left && x <= bounds.right && 
                y >= bounds.top && y <= bounds.bottom) {
                return platform;
            }
        }
        
        return null;
    }

    getPlatformCollisionBounds(platformId: string): Phaser.Geom.Rectangle | null {
        const platform = this.getPlatformById(platformId);
        return platform ? platform.collisionBody.getBounds() : null;
    }

    clearPlatforms(): void {
        this.platforms.forEach(platform => {
            platform.sprite.destroy();
            platform.labelText.destroy();
            platform.collisionBody.destroy();
            platform.supportArm.destroy();
        });
        this.platforms = [];
        this.platformGroup.clear(true, true);
    }

    destroy(): void {
        this.clearPlatforms();
        this.platformGroup.destroy(true);
    }
}