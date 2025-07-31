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
        // Space station positioned in bottom third
        return {
            x: width / 2,
            y: height * 0.8 // 80% down from top = lower portion of screen
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

        // Apply additional spacing optimization
        this.optimizePlatformSpacing(platforms, center);

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
        
        // Base distance from center and variation - increased for much more dynamic positioning
        const baseDistance = Math.min(width, height) * 0.15;
        const maxDistance = Math.min(width, height) * 0.6;
        
        for (let platformIndex = 0; platformIndex < platformCount; platformIndex++) {
            // Distance increases along the arm with better spacing
            const distanceRatio = (platformIndex + 1) / (platformCount + 1);
            const distance = baseDistance + (maxDistance - baseDistance) * distanceRatio;
            
            // Add significant random variation for more natural positioning
            const angleVariation = (Math.random() - 0.5) * 0.4 * config.difficulty;
            const distanceVariation = (Math.random() - 0.5) * 60 * config.difficulty;
            
            const finalAngle = armAngle + angleVariation;
            const finalDistance = distance + distanceVariation;
            
            // Calculate base position
            let x = center.x + Math.cos(finalAngle) * finalDistance;
            let y = center.y + Math.sin(finalAngle) * finalDistance;
            
            // Add MUCH more significant Y variance for dramatic height differences
            const yVariance = (Math.random() - 0.5) * (height * 0.8); // Up to 80% of screen height variance
            y += yVariance;
            
            // Generate unique platform identifier
            const id = this.generatePlatformId(armIndex, platformIndex);
            
            platforms.push({
                id,
                x: Math.max(80, Math.min(width - 80, x)), // Keep within bounds with more margin
                y: Math.max(40, Math.min(height * 0.9, y)), // Allow platforms much lower - up to 90% down screen
                armIndex,
                platformIndex
            });
        }

        return platforms;
    }

    private optimizePlatformSpacing(platforms: Platform[], center: { x: number; y: number }): void {
        const minDistance = 150;
        const { width, height } = this.scene.scale;
        const maxIterations = 10;
        
        for (let iteration = 0; iteration < maxIterations; iteration++) {
            let moved = false;
            
            for (let i = 0; i < platforms.length; i++) {
                for (let j = i + 1; j < platforms.length; j++) {
                    const platform1 = platforms[i];
                    const platform2 = platforms[j];
                    
                    const dx = platform1.x - platform2.x;
                    const dy = platform1.y - platform2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < minDistance && distance > 0) {
                        // Calculate push direction
                        const pushForce = (minDistance - distance) / 2;
                        const pushAngle = Math.atan2(dy, dx);
                        
                        // Push platforms apart
                        const pushX = Math.cos(pushAngle) * pushForce;
                        const pushY = Math.sin(pushAngle) * pushForce;
                        
                        // Apply push while keeping within bounds
                        platform1.x = Math.max(80, Math.min(width - 80, platform1.x + pushX));
                        platform1.y = Math.max(80, Math.min(height - 80, platform1.y + pushY));
                        platform2.x = Math.max(80, Math.min(width - 80, platform2.x - pushX));
                        platform2.y = Math.max(80, Math.min(height - 80, platform2.y - pushY));
                        
                        moved = true;
                    }
                }
            }
            
            // If no platforms moved, spacing is optimized
            if (!moved) break;
        }
    }

    private generatePlatformId(armIndex: number, platformIndex: number): string {
        // Generate sci-fi themed platform names with numbers
        const sciFiNames = [
            'Armory', 'Bridge', 'Cargo', 'Deck', 'Engine', 'Fusion', 'Gravity', 'Hangar',
            'Ion', 'Reactor', 'Kinetic', 'Launch', 'Matrix', 'Neural', 'Orbital', 'Plasma',
            'Quantum', 'Relay', 'Solar', 'Thermal', 'Ultra', 'Vector', 'Warp', 'Xenon',
            'Hydro', 'Zero', 'Bio', 'Cryo', 'Data', 'Echo', 'Field', 'Grid',
            'Hub', 'Lab', 'Med', 'Nav', 'Ops', 'Port', 'Comm', 'Tech'
        ];
        
        const animalNames = [
            'Falcon', 'Hawk', 'Eagle', 'Wolf', 'Tiger', 'Shark', 'Raven', 'Viper',
            'Phoenix', 'Dragon', 'Lynx', 'Cobra', 'Panther', 'Stallion', 'Raptor', 'Bear',
            'Fox', 'Hound', 'Lion', 'Owl', 'Stag', 'Swan', 'Tuna', 'Whale'
        ];
        
        // Combine sci-fi and animal names for variety
        const allNames = [...sciFiNames, ...animalNames];
        
        // Select name based on arm and platform index with some randomness
        const nameVariance = Math.floor(Math.random() * 3); // 0-2 offset for variety
        const nameIndex = (armIndex * 7 + platformIndex * 3 + nameVariance) % allNames.length;
        const name = allNames[nameIndex];
        
        // Generate varied numbering - not just sequential
        const baseNumber = platformIndex + 1;
        const numberVariants = [baseNumber, baseNumber * 2, baseNumber + 10, baseNumber * 3 + 5];
        const number = numberVariants[Math.floor(Math.random() * numberVariants.length)];
        
        return `${name}${Math.min(number, 99)}`; // Cap at 99 for readability
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