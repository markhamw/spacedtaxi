import { Scene } from 'phaser';

export interface LevelConfig {
    levelNumber: number;
    platformCount: number;
    passengerCount: number;
    difficulty: number;
    seed?: number;
}

export interface Platform {
    id: string;
    x: number;
    y: number;
    armIndex: number;
    platformIndex: number;
}

export interface LevelData {
    platforms: Platform[];
    config: LevelConfig;
    spaceStationCenter: { x: number; y: number };
}

export class LevelGenerator {
    private scene: Scene;
    private currentLevel: number = 1;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    generateLevel(levelNumber: number, seed?: number): LevelData {
        const config = this.createLevelConfig(levelNumber, seed);
        const spaceStationCenter = this.getSpaceStationCenter();
        const platforms = this.generatePlatforms(config, spaceStationCenter);

        return {
            platforms,
            config,
            spaceStationCenter
        };
    }

    private createLevelConfig(levelNumber: number, seed?: number): LevelConfig {
        // Progressive difficulty scaling
        const basePlatformCount = 6;
        const basePassengerCount = 2;
        
        // Increase platforms and passengers every few levels
        const platformIncrease = Math.floor((levelNumber - 1) / 3);
        const passengerIncrease = Math.floor((levelNumber - 1) / 2);
        
        return {
            levelNumber,
            platformCount: Math.min(basePlatformCount + platformIncrease, 16), // Cap at 16 platforms
            passengerCount: Math.min(basePassengerCount + passengerIncrease, 8), // Cap at 8 passengers
            difficulty: Math.min(levelNumber * 0.2, 2.0), // Difficulty scale 0.2 to 2.0
            seed: seed || this.generateSeed()
        };
    }

    private getSpaceStationCenter(): { x: number; y: number } {
        const { width, height } = this.scene.scale;
        return {
            x: width / 2,
            y: height / 2
        };
    }

    private generatePlatforms(config: LevelConfig, center: { x: number; y: number }): Platform[] {
        const platforms: Platform[] = [];
        const { platformCount } = config;
        
        // Determine number of arms (2-4 arms based on platform count)
        const armCount = Math.min(Math.max(2, Math.ceil(platformCount / 4)), 4);
        const platformsPerArm = Math.ceil(platformCount / armCount);
        
        // Generate platforms for each arm
        for (let armIndex = 0; armIndex < armCount; armIndex++) {
            const actualPlatformsThisArm = Math.min(
                platformsPerArm,
                platformCount - platforms.length
            );
            
            const armPlatforms = this.generateArmPlatforms(
                armIndex,
                actualPlatformsThisArm,
                center,
                config
            );
            
            platforms.push(...armPlatforms);
            
            if (platforms.length >= platformCount) break;
        }

        return platforms;
    }

    private generateArmPlatforms(
        armIndex: number,
        platformCount: number,
        center: { x: number; y: number },
        config: LevelConfig
    ): Platform[] {
        const platforms: Platform[] = [];
        const { width, height } = this.scene.scale;
        
        // Calculate arm angle (evenly distributed around circle)
        const totalArms = Math.min(4, Math.ceil(config.platformCount / 4));
        const armAngle = (armIndex * (Math.PI * 2)) / totalArms;
        
        // Base distance from center and variation
        const baseDistance = Math.min(width, height) * 0.15;
        const maxDistance = Math.min(width, height) * 0.4;
        
        for (let platformIndex = 0; platformIndex < platformCount; platformIndex++) {
            // Distance increases along the arm
            const distanceRatio = (platformIndex + 1) / (platformCount + 1);
            const distance = baseDistance + (maxDistance - baseDistance) * distanceRatio;
            
            // Add slight random variation to prevent perfect alignment
            const angleVariation = (Math.random() - 0.5) * 0.3 * config.difficulty;
            const distanceVariation = (Math.random() - 0.5) * 20 * config.difficulty;
            
            const finalAngle = armAngle + angleVariation;
            const finalDistance = distance + distanceVariation;
            
            const x = center.x + Math.cos(finalAngle) * finalDistance;
            const y = center.y + Math.sin(finalAngle) * finalDistance;
            
            // Generate unique platform identifier
            const id = this.generatePlatformId(armIndex, platformIndex);
            
            platforms.push({
                id,
                x: Math.max(50, Math.min(width - 50, x)), // Keep within bounds
                y: Math.max(50, Math.min(height - 50, y)), // Keep within bounds
                armIndex,
                platformIndex
            });
        }

        return platforms;
    }

    private generatePlatformId(armIndex: number, platformIndex: number): string {
        // Generate alphanumeric IDs like C11, K2, N88
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const letter = letters[armIndex % letters.length];
        const number = (platformIndex + 1) + (armIndex * 10);
        return `${letter}${number}`;
    }

    private generateSeed(): number {
        return Math.floor(Math.random() * 1000000);
    }

    getCurrentLevel(): number {
        return this.currentLevel;
    }

    setCurrentLevel(level: number): void {
        this.currentLevel = level;
    }
}