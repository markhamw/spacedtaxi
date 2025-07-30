import { Scene } from 'phaser';
import { LevelGenerator, LevelData } from './LevelGenerator';
import { PlatformManager, PlatformVisual } from './PlatformManager';
import { PassengerManager, Mission, Passenger } from './PassengerManager';
import { BackgroundRenderer } from './BackgroundRenderer';

export interface GameState {
    currentLevel: number;
    score: number;
    completedMissions: number;
    totalMissions: number;
    gameStatus: 'loading' | 'ready' | 'playing' | 'paused' | 'level_complete' | 'game_over';
}

export interface UIElements {
    levelText: Phaser.GameObjects.Text;
    scoreText: Phaser.GameObjects.Text;
    missionText: Phaser.GameObjects.Text;
    objectiveText: Phaser.GameObjects.Text;
}

export class MissionOrchestrator {
    private scene: Scene;
    private levelGenerator: LevelGenerator;
    private platformManager: PlatformManager;
    private passengerManager: PassengerManager;
    private backgroundRenderer: BackgroundRenderer;
    
    private gameState: GameState;
    private currentLevelData: LevelData | null = null;
    private uiElements: UIElements | null = null;
    
    // Color palette
    private readonly colors = {
        uiText: '#f6d6bd',
        uiSecondary: '#c3a38a',
        uiBackground: '#08141e'
    };

    constructor(scene: Scene) {
        this.scene = scene;
        this.levelGenerator = new LevelGenerator(scene);
        this.platformManager = new PlatformManager(scene);
        this.passengerManager = new PassengerManager(scene);
        this.backgroundRenderer = new BackgroundRenderer(scene);
        
        this.gameState = {
            currentLevel: 1,
            score: 0,
            completedMissions: 0,
            totalMissions: 0,
            gameStatus: 'loading'
        };
    }

    async startGame(): Promise<void> {
        this.gameState.gameStatus = 'loading';
        
        // Create background first
        this.backgroundRenderer.createBackground();
        
        // Generate first level
        await this.loadLevel(1);
        
        // Create UI
        this.createUI();
        
        // Start first missions
        this.startLevelMissions();
        
        this.gameState.gameStatus = 'playing';
        
        console.log('Game started successfully');
    }

    private async loadLevel(levelNumber: number): Promise<void> {
        // Clear previous level
        this.platformManager.clearPlatforms();
        this.passengerManager.clearAllPassengers();
        
        // Generate new level
        this.currentLevelData = this.levelGenerator.generateLevel(levelNumber);
        
        // Validate level layout
        const platforms = this.platformManager.createPlatforms(this.currentLevelData.platforms);
        const validation = this.platformManager.validatePlatformLayout();
        
        if (!validation.valid) {
            console.warn('Level layout issues detected:', validation.issues);
            // Could regenerate level here if needed
        }
        
        // Update game state
        this.gameState.currentLevel = levelNumber;
        this.gameState.totalMissions = this.currentLevelData.config.passengerCount;
        this.gameState.completedMissions = 0;
        
        console.log(`Level ${levelNumber} loaded with ${platforms.length} platforms`);
    }

    private createUI(): void {
        const { width, height } = this.scene.scale;
        
        // Level indicator
        const levelText = this.scene.add.text(20, 20, `Level: ${this.gameState.currentLevel}`, {
            fontFamily: 'Sixtyfour',
            fontSize: '24px',
            color: this.colors.uiText
        });
        
        // Score display
        const scoreText = this.scene.add.text(20, 50, `Score: ${this.gameState.score}`, {
            fontFamily: 'Sixtyfour',
            fontSize: '18px',
            color: this.colors.uiText
        });
        
        // Mission progress
        const missionText = this.scene.add.text(20, 75, 
            `Missions: ${this.gameState.completedMissions}/${this.gameState.totalMissions}`, {
            fontFamily: 'Sixtyfour',
            fontSize: '18px',
            color: this.colors.uiText
        });
        
        // Current objective
        const objectiveText = this.scene.add.text(width / 2, height - 40, '', {
            fontFamily: 'Sixtyfour',
            fontSize: '16px',
            color: this.colors.uiSecondary
        }).setOrigin(0.5);
        
        this.uiElements = {
            levelText,
            scoreText,
            missionText,
            objectiveText
        };
    }

    private startLevelMissions(): void {
        if (!this.currentLevelData) return;
        
        // Create initial missions for the level
        const missionCount = Math.min(2, this.currentLevelData.config.passengerCount); // Start with 1-2 missions
        
        for (let i = 0; i < missionCount; i++) {
            this.createRandomMission();
        }
        
        this.updateObjectiveDisplay();
    }

    private createRandomMission(): void {
        if (!this.currentLevelData) return;
        
        const platforms = this.currentLevelData.platforms;
        if (platforms.length < 2) return; // Need at least 2 platforms
        
        // Select random pickup and destination platforms
        const pickupIndex = Math.floor(Math.random() * platforms.length);
        let destinationIndex;
        do {
            destinationIndex = Math.floor(Math.random() * platforms.length);
        } while (destinationIndex === pickupIndex);
        
        const pickupPlatform = platforms[pickupIndex];
        const destinationPlatform = platforms[destinationIndex];
        
        // Create mission
        const mission = this.passengerManager.createMission(pickupPlatform.id, destinationPlatform.id);
        
        // Position passenger at pickup platform
        this.passengerManager.showPassengerAtPlatform(
            mission.passenger.id,
            pickupPlatform.x,
            pickupPlatform.y
        );
        
        // Mark platform as having a passenger
        this.platformManager.setPlatformPassengerWaiting(pickupPlatform.id, true);
        
        // Speak greeting after a short delay
        this.scene.time.delayedCall(1000, () => {
            this.passengerManager.speakPassengerLine(mission.passenger.id, 'greeting');
        });
        
        console.log(`Mission created: ${mission.passenger.name} from ${pickupPlatform.id} to ${destinationPlatform.id}`);
    }

    private updateObjectiveDisplay(): void {
        if (!this.uiElements) return;
        
        const activeMissions = this.passengerManager.getActiveMissions();
        const currentPassenger = this.passengerManager.getCurrentPassenger();
        
        let objectiveText = '';
        
        if (currentPassenger) {
            // Player has a passenger aboard
            objectiveText = `Deliver ${currentPassenger.name} to ${currentPassenger.destinationPlatform}`;
            this.platformManager.highlightPlatform(currentPassenger.destinationPlatform, true);
            
            // Remove highlight from pickup platforms
            activeMissions.forEach(mission => {
                if (mission.passenger.id !== currentPassenger.id) {
                    this.platformManager.highlightPlatform(mission.passenger.pickupPlatform, false);
                }
            });
        } else if (activeMissions.length > 0) {
            // Show next pickup objective
            const nextMission = activeMissions[0];
            objectiveText = `Pick up ${nextMission.passenger.name} at ${nextMission.passenger.pickupPlatform}`;
            this.platformManager.highlightPlatform(nextMission.passenger.pickupPlatform, true);
            
            // Remove destination highlights
            activeMissions.forEach(mission => {
                this.platformManager.highlightPlatform(mission.passenger.destinationPlatform, false);
            });
        } else {
            objectiveText = 'All missions complete!';
            this.checkLevelComplete();
        }
        
        this.uiElements.objectiveText.setText(objectiveText);
    }

    private updateUI(): void {
        if (!this.uiElements) return;
        
        this.uiElements.levelText.setText(`Level: ${this.gameState.currentLevel}`);
        this.uiElements.scoreText.setText(`Score: ${this.gameState.score}`);
        this.uiElements.missionText.setText(
            `Missions: ${this.gameState.completedMissions}/${this.gameState.totalMissions}`
        );
    }

    // Public methods for game interactions
    
    public attemptPickup(platformId: string): boolean {
        const platform = this.platformManager.getPlatformById(platformId);
        if (!platform || !platform.passengerWaiting) return false;
        
        // Find passenger at this platform
        const activeMissions = this.passengerManager.getActiveMissions();
        const mission = activeMissions.find(m => 
            m.passenger.pickupPlatform === platformId && 
            m.status === 'waiting'
        );
        
        if (mission) {
            const success = this.passengerManager.pickupPassenger(mission.passenger.id);
            if (success) {
                this.platformManager.setPlatformPassengerWaiting(platformId, false);
                this.updateObjectiveDisplay();
                console.log(`Picked up ${mission.passenger.name} from ${platformId}`);
                return true;
            }
        }
        
        return false;
    }

    public attemptDelivery(platformId: string): boolean {
        const currentPassenger = this.passengerManager.getCurrentPassenger();
        if (!currentPassenger || currentPassenger.destinationPlatform !== platformId) {
            return false;
        }
        
        const success = this.passengerManager.deliverPassenger(currentPassenger.id);
        if (success) {
            // Calculate score based on delivery
            const baseScore = 100;
            const timeBonus = Math.max(0, 50 - Math.floor((Date.now() - Date.now()) / 1000)); // Simplified
            this.gameState.score += baseScore + timeBonus;
            this.gameState.completedMissions++;
            
            this.updateUI();
            this.updateObjectiveDisplay();
            
            // Create new mission if needed
            if (this.gameState.completedMissions < this.gameState.totalMissions) {
                this.scene.time.delayedCall(2000, () => {
                    this.createRandomMission();
                    this.updateObjectiveDisplay();
                });
            }
            
            console.log(`Delivered ${currentPassenger.name} to ${platformId}. Score: +${baseScore + timeBonus}`);
            return true;
        }
        
        return false;
    }

    private checkLevelComplete(): void {
        if (this.gameState.completedMissions >= this.gameState.totalMissions) {
            this.gameState.gameStatus = 'level_complete';
            
            // Show level complete message
            if (this.uiElements) {
                this.scene.add.text(
                    this.scene.scale.width / 2,
                    this.scene.scale.height / 2,
                    `Level ${this.gameState.currentLevel} Complete!\nPress SPACE for next level`,
                    {
                        fontFamily: 'Sixtyfour',
                        fontSize: '32px',
                        color: this.colors.uiText,
                        align: 'center'
                    }
                ).setOrigin(0.5);
            }
            
            // Listen for level advance
            this.scene.input.keyboard?.once('keydown-SPACE', () => {
                this.advanceToNextLevel();
            });
            
            console.log(`Level ${this.gameState.currentLevel} completed!`);
        }
    }

    private async advanceToNextLevel(): Promise<void> {
        const nextLevel = this.gameState.currentLevel + 1;
        await this.loadLevel(nextLevel);
        this.createUI();
        this.startLevelMissions();
        this.gameState.gameStatus = 'playing';
        
        console.log(`Advanced to level ${nextLevel}`);
    }

    public getGameState(): GameState {
        return { ...this.gameState };
    }

    public pauseGame(): void {
        if (this.gameState.gameStatus === 'playing') {
            this.gameState.gameStatus = 'paused';
            this.scene.scene.pause();
        }
    }

    public resumeGame(): void {
        if (this.gameState.gameStatus === 'paused') {
            this.gameState.gameStatus = 'playing';
            this.scene.scene.resume();
        }
    }

    public destroy(): void {
        this.platformManager.destroy();
        this.passengerManager.destroy();
        this.backgroundRenderer.destroy();
        
        if (this.uiElements) {
            Object.values(this.uiElements).forEach(element => element.destroy());
        }
    }
}