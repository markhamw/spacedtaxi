import { Scene } from "phaser";
import { MissionOrchestrator } from "../systems/MissionOrchestrator";
import { TaxiStateMachine, TaxiState } from "../systems/TaxiStateMachine";
import { SoundManager } from "../systems/SoundManager";
import { PlatformVisual } from "../systems/PlatformManager";

export class Game extends Scene {
    private orchestrator: MissionOrchestrator | null = null;
    private audioInitialized: boolean = false;
    private taxi?: Phaser.GameObjects.Sprite;
    private taxiStateMachine?: TaxiStateMachine;
    private soundManager?: SoundManager;
    private menuVisible: boolean = false;
    private menuContainer?: Phaser.GameObjects.Container;
    private escText?: Phaser.GameObjects.BitmapText;
    private wasdKeys?: {
        W: Phaser.Input.Keyboard.Key;
        A: Phaser.Input.Keyboard.Key;
        S: Phaser.Input.Keyboard.Key;
        D: Phaser.Input.Keyboard.Key;
    };
    private isThrusting: boolean = false;
    private thrustVector: { x: number; y: number } = { x: 0, y: 0 };
    private readonly THRUST_FORCE = 300;
    private readonly DRAG = 0.98;
    
    // Landing timer tracking
    private landingTimers: Map<string, { timer: Phaser.Time.TimerEvent; startTime: number }> = new Map();

    constructor() {
        super("Game");
    }

    create() {
        const { width, height } = this.scale;

        // Initialize speech synthesis on first load
        this.initializeAudio();

        // Initialize the mission orchestration system
        this.orchestrator = new MissionOrchestrator(this);

        // Start the game
        this.orchestrator.startGame();

        // Create taxi sprite after orchestrator has generated platforms
        this.createTaxi();

        // Set up collision detection after a brief delay to ensure platforms are ready
        this.time.delayedCall(100, () => {
            this.setupCollisions();
        });

        // Set up input handlers for taxi interactions
        this.setupInputHandlers();

        // Create UI elements
        this.createUI();

        // Create landing gear animations
        this.createLandingGearAnimations();

        console.log("Game scene initialized with orchestration system");
    }

    update(): void {
        this.handleTaxiInput();
        this.updateSpeedDisplay();
    }
    
    private updateSpeedDisplay(): void {
        if (!this.taxi || !this.orchestrator) return;
        
        const body = this.taxi.body as Phaser.Physics.Arcade.Body;
        this.orchestrator.updateSpeed(body.velocity.x, body.velocity.y);
    }

    private handleTaxiInput(): void {
        if (!this.taxi || !this.wasdKeys || !this.taxiStateMachine) return;

        const body = this.taxi.body as Phaser.Physics.Arcade.Body;
        this.thrustVector.x = 0;
        this.thrustVector.y = 0;
        let isCurrentlyThrusting = false;

        // Check WASD input
        if (this.wasdKeys.W.isDown) {
            this.thrustVector.y = -1;
            isCurrentlyThrusting = true;
        }
        if (this.wasdKeys.S.isDown) {
            this.thrustVector.y = 1;
            isCurrentlyThrusting = true;
        }
        // Handle horizontal thrust (left/right movement) - only if gear is up
        if (this.taxiStateMachine.isGearUp()) {
            if (this.wasdKeys.A.isDown) {
                this.thrustVector.x = -1;
                isCurrentlyThrusting = true;
                // Face left when pressing A
                this.taxi.setFlipX(false);
            }
            if (this.wasdKeys.D.isDown) {
                this.thrustVector.x = 1;
                isCurrentlyThrusting = true;
                // Face right when pressing D
                this.taxi.setFlipX(true);
            }
        } else {
            // When gear is down, lock horizontal movement
            this.thrustVector.x = 0;
            // Also dampen any existing horizontal velocity
            body.setVelocityX(body.velocity.x * 0.9);
        }

        // Normalize thrust vector for diagonal movement
        if (this.thrustVector.x !== 0 && this.thrustVector.y !== 0) {
            const length = Math.sqrt(this.thrustVector.x * this.thrustVector.x + this.thrustVector.y * this.thrustVector.y);
            this.thrustVector.x /= length;
            this.thrustVector.y /= length;
        }

        // Apply thrust if any keys are pressed
        if (isCurrentlyThrusting) {
            body.setAcceleration(
                this.thrustVector.x * this.THRUST_FORCE,
                this.thrustVector.y * this.THRUST_FORCE
            );
            
            // Switch to thrusting state if not already
            if (this.taxiStateMachine.isIdle()) {
                this.taxiStateMachine.setEngineState(TaxiState.THRUSTING);
            }
        } else {
            // No thrust input
            body.setAcceleration(0, 0);
            
            // Switch to idle state if not already
            if (this.taxiStateMachine.isThrusting()) {
                this.taxiStateMachine.setEngineState(TaxiState.IDLE);
            }
        }

        this.isThrusting = isCurrentlyThrusting;
    }

    private createTaxi(): void {
        const { width, height } = this.scale;

        // Get platform positions from orchestrator to determine spawn location
        const gameState = this.orchestrator?.getGameState();
        const platforms = gameState?.platforms || [];
        
        // Find top and bottom platform groups
        const topPlatforms = platforms.filter(p => p.y < height * 0.5);
        const bottomPlatforms = platforms.filter(p => p.y >= height * 0.5);
        
        let spawnX = width / 2;
        let spawnY = height * 0.15;
        
        if (topPlatforms.length > 0 && bottomPlatforms.length > 0) {
            // Find highest top platform and lowest bottom platform
            const highestTopPlatform = topPlatforms.reduce((highest, p) => p.y < highest.y ? p : highest);
            const lowestBottomPlatform = bottomPlatforms.reduce((lowest, p) => p.y > lowest.y ? p : lowest);
            
            // Spawn above highest top platform or below lowest bottom platform
            if (Math.random() < 0.5 && highestTopPlatform.y > 100) {
                // Spawn above top platforms
                spawnY = highestTopPlatform.y - 80;
                spawnX = highestTopPlatform.x + (Math.random() - 0.5) * 200;
            } else if (lowestBottomPlatform.y < height - 100) {
                // Spawn below bottom platforms
                spawnY = lowestBottomPlatform.y + 80;
                spawnX = lowestBottomPlatform.x + (Math.random() - 0.5) * 200;
            }
        }
        
        // Ensure spawn position is within bounds
        spawnX = Math.max(80, Math.min(width - 80, spawnX));
        spawnY = Math.max(60, Math.min(height - 60, spawnY));

        // Create taxi sprite at calculated spawn position (start with gear up)
        this.taxi = this.physics.add.sprite(spawnX, spawnY, "taxi", "taxi2.png");
        this.taxi.setOrigin(0.5);
        this.taxi.setScale(4); // Scale up for better visibility
        
        // Enable physics
        this.taxi.body!.setCollideWorldBounds(true);
        this.taxi.body!.setBounce(0.2); // Small bounce on world bounds
        this.taxi.body!.setDrag(50); // Air resistance/space friction for difficulty
        
        // Set initial hitbox for gear up state
        this.updateTaxiHitbox();

        // Initialize sound manager
        this.soundManager = new SoundManager();

        // Initialize taxi state machine with GEAR_UP state
        this.taxiStateMachine = new TaxiStateMachine(this, this.taxi, TaxiState.GEAR_UP);
        this.taxiStateMachine.setSoundManager(this.soundManager);

        console.log("Taxi created at position:", this.taxi.x, this.taxi.y);
        console.log("Taxi initialized in state:", this.taxiStateMachine.getCurrentState());
    }

    private updateTaxiHitbox(): void {
        if (!this.taxi || !this.taxiStateMachine) return;
        
        const body = this.taxi.body as Phaser.Physics.Arcade.Body;
        
        if (this.taxiStateMachine.isGearDown()) {
            // Larger hitbox when gear is down (landing gear extended)
            body.setSize(16, 14); // Include landing gear
            body.setOffset(0, 2);
        } else {
            // Smaller hitbox when gear is up (more streamlined)
            body.setSize(16, 10); // Just the main body
            body.setOffset(0, 4);
        }
    }

    private createLandingGearAnimations(): void {
        if (!this.taxi) return;
        
        // Create raise gear animation (taxi0 -> taxi2) at 1.5 FPS
        this.anims.create({
            key: 'raisegear',
            frames: [
                { key: 'taxi', frame: 'taxi0.png' },
                { key: 'taxi', frame: 'taxi1.png' },
                { key: 'taxi', frame: 'taxi2.png' }
            ],
            frameRate: 1.5,
            repeat: 0
        });
        
        // Create lower gear animation (taxi2 -> taxi0) at 1.5 FPS
        this.anims.create({
            key: 'lowergear',
            frames: [
                { key: 'taxi', frame: 'taxi2.png' },
                { key: 'taxi', frame: 'taxi1.png' },
                { key: 'taxi', frame: 'taxi0.png' }
            ],
            frameRate: 1.5,
            repeat: 0
        });
    }

    private createUI(): void {
        const { width, height } = this.scale;
        
        // Add ESC - Menu text at bottom of screen
        this.escText = this.add.bitmapText(width / 2, height - 30, 'thick_8x8', 'ESC - Menu', 16)
            .setOrigin(0.5)
            .setTint(0xc3a38a);
    }

    private toggleLandingGear(): void {
        if (!this.taxiStateMachine) return;
        
        const success = this.taxiStateMachine.toggleGear();
        if (success) {
            // Update hitbox after gear state change
            this.updateTaxiHitbox();
            const gearState = this.taxiStateMachine.getGearState();
            console.log('Landing gear toggled to:', gearState);
        }
    }

    private toggleMenu(): void {
        this.menuVisible = !this.menuVisible;
        
        if (this.menuVisible) {
            this.showMenu();
        } else {
            this.hideMenu();
        }
    }

    private showMenu(): void {
        const { width, height } = this.scale;
        
        // Create menu container
        this.menuContainer = this.add.container(width / 2, height / 2);
        
        // Create background like Title screen
        const graphics = this.add.graphics();
        graphics.fillGradientStyle(0x08141e, 0x08141e, 0x0f2a3f, 0x20394f, 1);
        graphics.fillRoundedRect(-300, -200, 600, 400, 20);
        
        // Create decorative border
        const borderGraphics = this.add.graphics();
        borderGraphics.lineStyle(4, 0x997577);
        borderGraphics.strokeRoundedRect(-300, -200, 600, 400, 20);
        borderGraphics.lineStyle(2, 0x816271);
        borderGraphics.strokeRoundedRect(-295, -195, 590, 390, 18);
        
        // Menu title
        const titleText = this.add.bitmapText(0, -120, 'thick_8x8', 'GAME MENU', 32)
            .setOrigin(0.5)
            .setTint(0xf6d6bd);
        
        // Instructions
        const instructionsText = [
            'CONTROLS:',
            '',
            'WASD - Thrust Control',
            'SPACEBAR - Toggle Landing Gear',
            '',
            'ESC - Close Menu'
        ];
        
        const instructionY = -40;
        instructionsText.forEach((line, index) => {
            const text = this.add.bitmapText(0, instructionY + (index * 25), 'thick_8x8', line, 16)
                .setOrigin(0.5)
                .setTint(index === 0 ? 0xf6d6bd : 0xc3a38a);
            this.menuContainer!.add(text);
        });
        
        // Add all graphics to container
        this.menuContainer.add([graphics, borderGraphics, titleText]);
        
        // Pause the game while menu is open
        this.orchestrator?.pauseGame();
    }

    private hideMenu(): void {
        if (this.menuContainer) {
            this.menuContainer.destroy();
            this.menuContainer = undefined;
        }
        
        // Resume the game
        this.orchestrator?.resumeGame();
    }

    private initializeAudio(): void {
        if (this.audioInitialized) return;

        try {
            // Test if speech synthesis is available
            if ("speechSynthesis" in window) {
                // Get voices to ensure speech synthesis is ready
                const voices = window.speechSynthesis.getVoices();
                const highQualityVoices = this.filterHighQualityVoices(voices);
                console.log(
                    `Speech synthesis initialized. High quality voices: ${highQualityVoices.length}/${voices.length}`
                );

                // If no voices are loaded yet, wait for them
                if (voices.length === 0) {
                    window.speechSynthesis.onvoiceschanged = () => {
                        const updatedVoices = window.speechSynthesis.getVoices();
                        const updatedHighQualityVoices = this.filterHighQualityVoices(updatedVoices);
                        console.log(
                            `Speech synthesis voices loaded: ${updatedHighQualityVoices.length}/${updatedVoices.length} high quality`
                        );
                        this.audioInitialized = true;
                    };
                } else {
                    this.audioInitialized = true;
                }

                // Play a brief test sound to activate audio context
                this.time.delayedCall(500, () => {
                    this.playAudioTest();
                });
            } else {
                console.warn("Speech synthesis not supported in this browser");
            }
        } catch (error) {
            console.error("Error initializing audio:", error);
        }
    }

    private filterHighQualityVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
        // Filter for high quality voices (typically non-remote, native voices)
        // Prefer voices that are not remote and have good quality indicators
        return voices.filter((voice) => {
            // Prioritize local voices over remote ones
            if (!voice.localService) return false;

            // Look for quality indicators in voice names
            const name = voice.name.toLowerCase();
            const isHighQuality =
                name.includes("premium") ||
                name.includes("enhanced") ||
                name.includes("neural") ||
                name.includes("natural") ||
                name.includes("hd") ||
                name.includes("plus") ||
                // Common high-quality voice patterns
                (!name.includes("compact") && !name.includes("lite"));

            return isHighQuality;
        });
    }

    private playAudioTest(): void {
        if (!this.audioInitialized) return;

        try {
            // Create a very brief, quiet test utterance
            const testUtterance = new SpeechSynthesisUtterance(" "); // Single space
            testUtterance.volume = 0.01; // Very quiet
            testUtterance.rate = 2; // Fast
            testUtterance.pitch = 1;

            // Use this to activate the speech synthesis without disturbing gameplay
            window.speechSynthesis.speak(testUtterance);
            console.log("Audio test completed - speech synthesis should now be active");
        } catch (error) {
            console.error("Audio test failed:", error);
        }
    }

    private setupCollisions(): void {
        if (!this.taxi || !this.orchestrator) return;

        // Get platform manager directly from orchestrator
        const platformManager = this.orchestrator.getPlatformManager();
        const platforms = platformManager.getAllPlatforms();
        
        if (platforms.length > 0) {
            console.log(`Setting up collisions for ${platforms.length} platforms`);
            
            // Set up collision between taxi and each platform
            platforms.forEach(platform => {
                this.physics.add.collider(this.taxi!, platform.collisionBody, (taxi, platformBody) => {
                    this.handlePlatformCollision(platform);
                });
            });
        } else {
            console.warn('No platforms found for collision setup');
        }
    }

    private handlePlatformCollision(platform: PlatformVisual): void {
        console.log(`COLLISION DETECTED with platform: ${platform.id}`);
        console.log(`Taxi gear state: ${this.taxiStateMachine?.getCurrentState()}`);
        
        // Check for crash: any collision with gear up
        if (!this.taxiStateMachine?.isGearDown()) {
            console.log(`CRASH! Collided with platform ${platform.id} with gear up`);
            this.handleTaxiCrash(platform);
            return;
        }

        console.log(`Taxi landed on platform: ${platform.id}`);
        
        // Start landing timer for this platform (0.5 second requirement)
        this.startLandingTimer(platform.id);
    }
    
    private startLandingTimer(platformId: string): void {
        // If timer already exists for this platform, don't restart it
        if (this.landingTimers.has(platformId)) {
            return;
        }
        
        const startTime = Date.now();
        const timer = this.time.delayedCall(500, () => {
            // After 0.5 seconds of landing, attempt pickup/delivery
            this.attemptPlatformActions(platformId);
            this.landingTimers.delete(platformId);
        });
        
        this.landingTimers.set(platformId, { timer, startTime });
        console.log(`Started 0.5s landing timer for platform ${platformId}`);
    }
    
    private attemptPlatformActions(platformId: string): void {
        // Check if we can pick up or deliver here
        const gameState = this.orchestrator?.getGameState();
        if (!gameState) return;

        // Try pickup first
        if (gameState.currentMission?.pickupPlatformId === platformId) {
            const success = this.orchestrator?.attemptPickup(platformId);
            if (success) {
                console.log(`Passenger picked up from ${platformId} after 0.5s landing`);
            }
        }
        // Try delivery if we have a passenger
        else if (gameState.currentMission?.deliveryPlatformId === platformId && gameState.passengerOnBoard) {
            const success = this.orchestrator?.attemptDelivery(platformId);
            if (success) {
                console.log(`Passenger delivered to ${platformId} after 0.5s landing`);
            }
        }
    }

    private handleTaxiCrash(platform: PlatformVisual): void {
        if (!this.taxi) return;

        console.log('Starting taxi crash sequence...');
        
        // Disable input during crash
        this.wasdKeys = undefined;
        
        // Stop taxi movement
        const body = this.taxi.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);
        body.setImmovable(true);
        
        // Create explosion effect
        this.createExplosionEffect(this.taxi.x, this.taxi.y);
        
        // Start taxi destruction animation
        this.startTaxiDestructionAnimation();
    }
    
    private createExplosionEffect(x: number, y: number): void {
        if (!this.taxi) return;
        
        // Create explosion particles using built-in particle system
        const particles = this.add.particles(x, y, 'taxi', {
            frame: 'taxi2.png',
            scale: { start: 0.3, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: [0xff6600, 0xff9900, 0xffcc00, 0xff3300],
            speed: { min: 50, max: 200 },
            lifespan: 800,
            quantity: 15,
            blendMode: 'ADD'
        });
        
        // Create debris particles (smaller pieces)
        const debris = this.add.particles(x, y, 'taxi', {
            frame: 'taxi2.png',
            scale: { start: 0.1, end: 0.05 },
            alpha: { start: 0.8, end: 0 },
            tint: [0x666666, 0x999999, 0xcccccc],
            speed: { min: 100, max: 300 },
            lifespan: 1500,
            quantity: 20,
            gravity: { x: 0, y: 100 }
        });
        
        // Screen shake effect
        this.cameras.main.shake(1000, 0.02);
        
        // Stop particles after explosion
        this.time.delayedCall(1000, () => {
            particles.destroy();
        });
        
        this.time.delayedCall(2000, () => {
            debris.destroy();
        });
    }
    
    private startTaxiDestructionAnimation(): void {
        if (!this.taxi) return;
        
        // Flash the taxi red to indicate damage
        this.taxi.setTint(0xff0000);
        
        // Shake animation - rapid random movements
        const shakeIntensity = 5;
        const originalX = this.taxi.x;
        const originalY = this.taxi.y;
        
        const shakeTimer = this.time.addEvent({
            delay: 50,
            repeat: 20,
            callback: () => {
                if (!this.taxi) return;
                const offsetX = (Math.random() - 0.5) * shakeIntensity;
                const offsetY = (Math.random() - 0.5) * shakeIntensity;
                this.taxi.setPosition(originalX + offsetX, originalY + offsetY);
            }
        });
        
        // After shaking, start shrinking animation
        this.time.delayedCall(1000, () => {
            if (!this.taxi) return;
            
            // Reset position and start shrinking
            this.taxi.setPosition(originalX, originalY);
            
            // Shrink and fade out
            this.tweens.add({
                targets: this.taxi,
                scaleX: 0,
                scaleY: 0,
                alpha: 0,
                angle: 360,
                duration: 1000,
                ease: 'Power2',
                onComplete: () => {
                    // Trigger game over after animation
                    this.triggerCrashGameOver();
                }
            });
        });
    }
    
    private triggerCrashGameOver(): void {
        console.log('Taxi crashed - triggering game over');
        
        // Trigger game over through orchestrator
        if (this.orchestrator) {
            this.orchestrator.endGame('Taxi crashed!');
        } else {
            // Fallback: go directly to game over scene
            this.scene.start('GameOver', { 
                score: 0, 
                reason: 'Taxi crashed!' 
            });
        }
    }

    private setupInputHandlers(): void {
        if (!this.orchestrator) return;

        // Create WASD keys
        this.wasdKeys = this.input.keyboard?.addKeys('W,S,A,D') as any;

        // SPACEBAR to toggle landing gear
        this.input.keyboard?.on("keydown-SPACE", () => {
            this.toggleLandingGear();
        });

        // ESC key to toggle menu
        this.input.keyboard?.on("keydown-ESC", () => {
            this.toggleMenu();
        });

        // For now, add keyboard shortcuts for testing
        // Later these will be replaced with taxi collision detection

        // P key for pickup attempt (temporary - will be collision-based)
        this.input.keyboard?.on("keydown-P", () => {
            // This is temporary - in the real game, this will be triggered by taxi collision
            const platforms = this.orchestrator?.getGameState();
            console.log("Pickup attempt (press P on platform)");
            // TODO: Implement collision detection with platforms
        });

        // D key for delivery attempt (temporary - will be collision-based)
        this.input.keyboard?.on("keydown-D", () => {
            // This is temporary - in the real game, this will be triggered by taxi collision
            console.log("Delivery attempt (press D on platform)");
            // TODO: Implement collision detection with platforms
        });

        // X key for manual crash testing
        this.input.keyboard?.on('keydown-X', () => {
            console.log('Manual crash triggered by X key');
            this.handleTaxiCrash({ id: 'ManualTestCrash' } as any);
        });
    }

    // Public methods that will be called by taxi/physics system later
    public attemptPickupAtPlatform(platformId: string): boolean {
        return this.orchestrator?.attemptPickup(platformId) || false;
    }

    public attemptDeliveryAtPlatform(platformId: string): boolean {
        return this.orchestrator?.attemptDelivery(platformId) || false;
    }

    public getGameState() {
        return this.orchestrator?.getGameState();
    }

    public getHighQualityVoices(): SpeechSynthesisVoice[] {
        const voices = window.speechSynthesis.getVoices();
        return this.filterHighQualityVoices(voices);
    }

    public getTaxiState(): TaxiState | undefined {
        return this.taxiStateMachine?.getCurrentState();
    }

    public canTaxiTransitionTo(state: TaxiState): boolean {
        return this.taxiStateMachine?.canTransitionTo(state) || false;
    }

    public pauseGame(): void {
        this.orchestrator?.pauseGame();
    }

    public resumeGame(): void {
        this.orchestrator?.resumeGame();
    }

    destroy(): void {
        // Clear landing timers
        this.landingTimers.forEach(({ timer }) => {
            timer.destroy();
        });
        this.landingTimers.clear();
        
        if (this.orchestrator) {
            this.orchestrator.destroy();
            this.orchestrator = null;
        }
        if (this.menuContainer) {
            this.menuContainer.destroy();
            this.menuContainer = undefined;
        }
        if (this.taxiStateMachine) {
            this.taxiStateMachine.destroy();
            this.taxiStateMachine = undefined;
        }
        if (this.soundManager) {
            this.soundManager.destroy();
            this.soundManager = undefined;
        }
        this.taxi = undefined;
        this.escText = undefined;
        this.wasdKeys = undefined;
        super.destroy();
    }
}
