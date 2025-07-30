import { Scene } from 'phaser';
import { Platform } from './LevelGenerator';

export interface SpaceStationData {
    center: { x: number; y: number };
    shape: 'hexagon' | 'octagon' | 'diamond' | 'cross';
    size: number;
    rotation: number;
    collisionBody: Phaser.GameObjects.Graphics;
    visualBody: Phaser.GameObjects.Graphics;
}

export class SpaceStationManager {
    private scene: Scene;
    private spaceStation: SpaceStationData | null = null;
    private arms: Phaser.GameObjects.Graphics[] = [];
    private stationGroup: Phaser.GameObjects.Group;

    // Color palette from CLAUDE.md
    private readonly colors = {
        station: '#20394f',
        stationBorder: '#997577',
        stationCore: '#816271',
        arms: '#4e495f',
        armsBorder: '#c3a38a',
        accent: '#f6d6bd'
    };

    constructor(scene: Scene) {
        this.scene = scene;
        this.stationGroup = scene.add.group();
    }

    createSpaceStation(center: { x: number; y: number }, levelNumber: number, platforms: Platform[]): SpaceStationData {
        // Clear existing station
        this.clearSpaceStation();

        // Generate station properties based on level
        const stationConfig = this.generateStationConfig(levelNumber);
        
        // Create visual representation
        const visualBody = this.createStationVisual(center, stationConfig);
        
        // Create collision body
        const collisionBody = this.createStationCollision(center, stationConfig);

        // Create arms connecting to platforms
        this.createPlatformArms(center, platforms);

        const spaceStation: SpaceStationData = {
            center,
            shape: stationConfig.shape,
            size: stationConfig.size,
            rotation: stationConfig.rotation,
            collisionBody,
            visualBody
        };

        this.spaceStation = spaceStation;
        this.stationGroup.add(visualBody);
        this.stationGroup.add(collisionBody);

        return spaceStation;
    }

    private generateStationConfig(levelNumber: number) {
        const shapes: SpaceStationData['shape'][] = ['hexagon', 'octagon', 'diamond', 'cross'];
        const shapeIndex = (levelNumber - 1) % shapes.length;
        
        return {
            shape: shapes[shapeIndex],
            size: 60 + (levelNumber * 5), // Grows slightly each level
            rotation: (levelNumber * 15) * (Math.PI / 180) // Rotate 15 degrees per level
        };
    }

    private createStationVisual(center: { x: number; y: number }, config: any): Phaser.GameObjects.Graphics {
        const graphics = this.scene.add.graphics();
        
        graphics.setPosition(center.x, center.y);
        this.drawSpaceStationShape(graphics, 0, 0, config.size, config.shape, config.rotation);
        
        return graphics;
    }

    private createStationCollision(center: { x: number; y: number }, config: any): Phaser.GameObjects.Graphics {
        // Create a slightly smaller collision area than the visual
        const collisionGraphics = this.scene.add.graphics();
        collisionGraphics.setPosition(center.x, center.y);
        
        // Make collision area invisible but still functional
        collisionGraphics.setAlpha(0);
        
        // Simple circular collision for now - could be made more complex
        collisionGraphics.fillStyle(0x000000);
        collisionGraphics.fillCircle(0, 0, config.size * 0.8);
        
        return collisionGraphics;
    }

    private drawSpaceStationShape(
        graphics: Phaser.GameObjects.Graphics,
        x: number,
        y: number,
        size: number,
        shape: SpaceStationData['shape'],
        rotation: number
    ): void {
        graphics.clear();
        
        // Set styles
        graphics.fillStyle(parseInt(this.colors.station.replace('#', '0x')));
        graphics.lineStyle(3, parseInt(this.colors.stationBorder.replace('#', '0x')));

        graphics.save();
        graphics.translateCanvas(x, y);
        graphics.rotateCanvas(rotation);

        switch (shape) {
            case 'hexagon':
                this.drawHexagon(graphics, size);
                break;
            case 'octagon':
                this.drawOctagon(graphics, size);
                break;
            case 'diamond':
                this.drawDiamond(graphics, size);
                break;
            case 'cross':
                this.drawCross(graphics, size);
                break;
        }

        // Add core detail
        graphics.fillStyle(parseInt(this.colors.stationCore.replace('#', '0x')));
        graphics.fillCircle(0, 0, size * 0.3);
        
        // Add accent details
        graphics.lineStyle(2, parseInt(this.colors.accent.replace('#', '0x')));
        graphics.strokeCircle(0, 0, size * 0.5);
        graphics.strokeCircle(0, 0, size * 0.7);

        graphics.restore();
    }

    private drawHexagon(graphics: Phaser.GameObjects.Graphics, size: number): void {
        const points: number[] = [];
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2) / 6;
            points.push(Math.cos(angle) * size, Math.sin(angle) * size);
        }
        graphics.beginPath();
        graphics.moveTo(points[0], points[1]);
        for (let i = 2; i < points.length; i += 2) {
            graphics.lineTo(points[i], points[i + 1]);
        }
        graphics.closePath();
        graphics.fillPath();
        graphics.strokePath();
    }

    private drawOctagon(graphics: Phaser.GameObjects.Graphics, size: number): void {
        const points: number[] = [];
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            points.push(Math.cos(angle) * size, Math.sin(angle) * size);
        }
        graphics.beginPath();
        graphics.moveTo(points[0], points[1]);
        for (let i = 2; i < points.length; i += 2) {
            graphics.lineTo(points[i], points[i + 1]);
        }
        graphics.closePath();
        graphics.fillPath();
        graphics.strokePath();
    }

    private drawDiamond(graphics: Phaser.GameObjects.Graphics, size: number): void {
        graphics.beginPath();
        graphics.moveTo(0, -size);
        graphics.lineTo(size * 0.7, 0);
        graphics.lineTo(0, size);
        graphics.lineTo(-size * 0.7, 0);
        graphics.closePath();
        graphics.fillPath();
        graphics.strokePath();
    }

    private drawCross(graphics: Phaser.GameObjects.Graphics, size: number): void {
        const thickness = size * 0.4;
        
        // Vertical bar
        graphics.fillRect(-thickness/2, -size, thickness, size * 2);
        
        // Horizontal bar
        graphics.fillRect(-size, -thickness/2, size * 2, thickness);
        
        // Stroke the cross
        graphics.strokeRect(-thickness/2, -size, thickness, size * 2);
        graphics.strokeRect(-size, -thickness/2, size * 2, thickness);
    }

    private createPlatformArms(center: { x: number; y: number }, platforms: Platform[]): void {
        // Clear existing arms
        this.clearArms();

        platforms.forEach(platform => {
            const arm = this.createArmToPlatform(center, platform);
            this.arms.push(arm);
            this.stationGroup.add(arm);
        });
    }

    private createArmToPlatform(center: { x: number; y: number }, platform: Platform): Phaser.GameObjects.Graphics {
        const arm = this.scene.add.graphics();
        
        // Platform dimensions (should match PlatformManager)
        const platformHeight = 30;
        
        // Calculate arm path - connect to platform base (bottom center)
        const platformBaseX = platform.x;
        const platformBaseY = platform.y + platformHeight / 2; // Bottom of platform
        
        const dx = platformBaseX - center.x;
        const dy = platformBaseY - center.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Arm starts from station edge, not center
        const stationRadius = this.spaceStation?.size || 60;
        const startX = center.x + (dx / distance) * stationRadius;
        const startY = center.y + (dy / distance) * stationRadius;
        
        // Calculate midpoint with angular offset for more dynamic look
        const midDistance = distance * 0.6;
        const midAngle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.3; // ±0.15 radian variance
        const midX = startX + Math.cos(midAngle) * midDistance;
        const midY = startY + Math.sin(midAngle) * midDistance;
        
        // Arm styling - create segmented arm with angle changes
        arm.lineStyle(4, parseInt(this.colors.arms.replace('#', '0x')));
        
        // First segment: station to midpoint
        arm.beginPath();
        arm.moveTo(startX, startY);
        arm.lineTo(midX, midY);
        arm.strokePath();
        
        // Second segment: midpoint to platform base
        arm.beginPath();
        arm.moveTo(midX, midY);
        arm.lineTo(platformBaseX, platformBaseY);
        arm.strokePath();
        
        // Add arm detail/joints
        arm.fillStyle(parseInt(this.colors.armsBorder.replace('#', '0x')));
        arm.fillCircle(midX, midY, 4); // Joint at angle change
        arm.fillCircle(platformBaseX, platformBaseY, 3); // Connection at platform base
        
        // Add station connection point
        arm.fillCircle(startX, startY, 3);

        return arm;
    }

    getSpaceStation(): SpaceStationData | null {
        return this.spaceStation;
    }

    checkCollisionWithStation(x: number, y: number): boolean {
        if (!this.spaceStation) return false;
        
        const dx = x - this.spaceStation.center.x;
        const dy = y - this.spaceStation.center.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance <= this.spaceStation.size * 0.8; // Use collision radius
    }

    private clearArms(): void {
        this.arms.forEach(arm => arm.destroy());
        this.arms = [];
    }

    clearSpaceStation(): void {
        this.clearArms();
        
        if (this.spaceStation) {
            this.spaceStation.visualBody.destroy();
            this.spaceStation.collisionBody.destroy();
            this.spaceStation = null;
        }
        
        this.stationGroup.clear(true, true);
    }

    destroy(): void {
        this.clearSpaceStation();
        this.stationGroup.destroy(true);
    }
}