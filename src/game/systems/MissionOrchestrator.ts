import { Scene } from 'phaser';
import { LevelGenerator, LevelData } from './LevelGenerator';
import { PlatformManager, PlatformVisual } from './PlatformManager';
import { PassengerManager, Mission, Passenger } from './PassengerManager';
import { BackgroundRenderer } from './BackgroundRenderer';
import { SpaceStationManager } from './SpaceStationManager';

export interface GameState {
    currentLevel: number;
    score: number;
    completedMissions: number;
    totalMissions: number;
    gameStatus: 'loading' | 'ready' | 'playing' | 'paused' | 'level_complete' | 'game_over';
    timeRemaining: number;
}

export interface UIElements {
    levelText: Phaser.GameObjects.BitmapText;
    scoreText: Phaser.GameObjects.BitmapText;
    missionText: Phaser.GameObjects.BitmapText;
    objectiveText: Phaser.GameObjects.BitmapText;
    timerText: Phaser.GameObjects.BitmapText;
}

export class MissionOrchestrator {
    private scene: Scene;
    private levelGenerator: LevelGenerator;
    private platformManager: PlatformManager;
    private passengerManager: PassengerManager;
    private backgroundRenderer: BackgroundRenderer;
    private spaceStationManager: SpaceStationManager;
    
    private gameState: GameState;
    private currentLevelData: LevelData | null = null;
    private uiElements: UIElements | null = null;
    private pickupTimer: Phaser.Time.TimerEvent | null = null;
    private timerUpdateEvent: Phaser.Time.TimerEvent | null = null;
    
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
        this.spaceStationManager = new SpaceStationManager(scene);
        
        this.gameState = {
            currentLevel: 1,
            score: 0,
            completedMissions: 0,
            totalMissions: 0,
            gameStatus: 'loading',
            timeRemaining: 20
        };
    }

    startGame(): void {
        this.gameState.gameStatus = 'loading';
        
        // Create background first
        this.backgroundRenderer.createBackground();
        
        // Generate first level
        this.loadLevel(1);
        
        // Create UI
        this.createUI();
        
        // Start first missions
        this.startLevelMissions();
        
        this.gameState.gameStatus = 'playing';
        
        console.log('Game started successfully');
    }

    private loadLevel(levelNumber: number): void {
        // Clear previous level
        this.platformManager.clearPlatforms();
        this.passengerManager.clearAllPassengers();
        this.spaceStationManager.clearSpaceStation();
        
        // Generate new level
        this.currentLevelData = this.levelGenerator.generateLevel(levelNumber);
        console.log(`Generated ${this.currentLevelData.platforms.length} platforms for level ${levelNumber}:`, this.currentLevelData.platforms);
        
        // Create space station with arms to platforms FIRST (renders behind)
        this.spaceStationManager.createSpaceStation(
            this.currentLevelData.spaceStationCenter, 
            levelNumber, 
            this.currentLevelData.platforms
        );
        
        // Create platforms AFTER (renders in front of arms)
        const platforms = this.platformManager.createPlatforms(this.currentLevelData.platforms);
        console.log(`Created ${platforms.length} platform visuals`);
        
        // Validate level layout
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
        const levelText = this.scene.add.bitmapText(20, 20, 'thick_8x8', `Level: ${this.gameState.currentLevel}`, 16)
            .setTint(parseInt(this.colors.uiText.replace('#', '0x')));
        
        // Score display
        const scoreText = this.scene.add.bitmapText(20, 50, 'thick_8x8', `Score: ${this.gameState.score}`, 12)
            .setTint(parseInt(this.colors.uiText.replace('#', '0x')));
        
        // Mission progress
        const missionText = this.scene.add.bitmapText(20, 75, 'thick_8x8', 
            `Missions: ${this.gameState.completedMissions}/${this.gameState.totalMissions}`, 12)
            .setTint(parseInt(this.colors.uiText.replace('#', '0x')));
        
        // Current objective - moved to top middle
        const objectiveText = this.scene.add.bitmapText(width / 2, 60, 'thick_8x8', '', 14)
            .setOrigin(0.5)
            .setTint(parseInt(this.colors.uiText.replace('#', '0x')));
        
        // Timer display - top right
        const timerText = this.scene.add.bitmapText(width - 20, 20, 'thick_8x8', `Time: ${this.gameState.timeRemaining}`, 16)
            .setOrigin(1, 0)
            .setTint(parseInt(this.colors.uiText.replace('#', '0x')));
        
        this.uiElements = {
            levelText,
            scoreText,
            missionText,
            objectiveText,
            timerText
        };
    }

    private startLevelMissions(): void {
        if (!this.currentLevelData) return;
        
        // Start with just ONE passenger at a time
        this.createRandomMission();
        this.updateObjectiveDisplay();
        
        // Start 20-second pickup timer
        this.startPickupTimer();
    }

    private startPickupTimer(): void {
        // Reset timer
        this.gameState.timeRemaining = 20;
        
        // Clear existing timers
        if (this.pickupTimer) {
            this.pickupTimer.destroy();
        }
        if (this.timerUpdateEvent) {
            this.timerUpdateEvent.destroy();
        }
        
        // Create main timer - game over after 20 seconds
        this.pickupTimer = this.scene.time.delayedCall(20000, () => {
            this.triggerGameOver();
        });
        
        // Create update timer - countdown every second
        this.timerUpdateEvent = this.scene.time.addEvent({
            delay: 1000,
            callback: () => {
                this.gameState.timeRemaining--;
                this.updateTimerDisplay();
                
                if (this.gameState.timeRemaining <= 0) {
                    this.triggerGameOver();
                }
            },
            repeat: 19 // Run 20 times total (20 seconds)
        });
        
        this.updateTimerDisplay();
    }

    private updateTimerDisplay(): void {
        if (this.uiElements?.timerText) {
            const timeColor = this.gameState.timeRemaining <= 5 ? '#ff4444' : this.colors.uiText;
            this.uiElements.timerText.setText(`Time: ${this.gameState.timeRemaining}`)
                .setTint(parseInt(timeColor.replace('#', '0x')));
        }
    }

    private triggerGameOver(): void {
        this.gameState.gameStatus = 'game_over';
        
        // Clear timers
        if (this.pickupTimer) {
            this.pickupTimer.destroy();
            this.pickupTimer = null;
        }
        if (this.timerUpdateEvent) {
            this.timerUpdateEvent.destroy();
            this.timerUpdateEvent = null;
        }
        
        // Transition to GameOver scene
        console.log('Game Over: Time ran out!');
        this.scene.scene.start('GameOver', {
            score: this.gameState.score,
            reason: 'Time ran out!'
        });
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
        this.updateTimerDisplay();
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
                
                // Restart timer for delivery
                this.startPickupTimer();
                
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
            
            // Always create a new passenger after delivery (continuous gameplay)
            this.scene.time.delayedCall(2000, () => {
                this.createRandomMission();
                this.updateObjectiveDisplay();
                this.startPickupTimer(); // Start new 20-second timer for pickup
            });
            
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
                this.scene.add.bitmapText(
                    this.scene.scale.width / 2,
                    this.scene.scale.height / 2,
                    'thick_8x8',
                    `Level ${this.gameState.currentLevel} Complete!\nPress SPACE for next level`,
                    20
                ).setOrigin(0.5).setTint(parseInt(this.colors.uiText.replace('#', '0x')));
            }
            
            // Listen for level advance
            this.scene.input.keyboard?.once('keydown-SPACE', () => {
                this.advanceToNextLevel();
            });
            
            console.log(`Level ${this.gameState.currentLevel} completed!`);
        }
    }

    private advanceToNextLevel(): void {
        const nextLevel = this.gameState.currentLevel + 1;
        this.loadLevel(nextLevel);
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
        // Clean up timers
        if (this.pickupTimer) {
            this.pickupTimer.destroy();
            this.pickupTimer = null;
        }
        if (this.timerUpdateEvent) {
            this.timerUpdateEvent.destroy();
            this.timerUpdateEvent = null;
        }
        
        this.platformManager.destroy();
        this.passengerManager.destroy();
        this.backgroundRenderer.destroy();
        this.spaceStationManager.destroy();
        
        if (this.uiElements) {
            Object.values(this.uiElements).forEach(element => element.destroy());
        }
    }
}