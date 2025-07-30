import { Scene } from "phaser";
import { MissionOrchestrator } from "../systems/MissionOrchestrator";

export class Game extends Scene {
    private orchestrator: MissionOrchestrator | null = null;

    constructor() {
        super("Game");
    }

    create() {
        const { width, height } = this.scale;
        
        // Initialize the mission orchestration system
        this.orchestrator = new MissionOrchestrator(this);
        
        // Start the game
        this.orchestrator.startGame();
        
        // Set up input handlers for taxi interactions
        this.setupInputHandlers();
        
        console.log('Game scene initialized with orchestration system');
    }

    private setupInputHandlers(): void {
        if (!this.orchestrator) return;
        
        // For now, add keyboard shortcuts for testing
        // Later these will be replaced with taxi collision detection
        
        // P key for pickup attempt (temporary - will be collision-based)
        this.input.keyboard?.on('keydown-P', () => {
            // This is temporary - in the real game, this will be triggered by taxi collision
            const platforms = this.orchestrator?.getGameState();
            console.log('Pickup attempt (press P on platform)');
            // TODO: Implement collision detection with platforms
        });
        
        // D key for delivery attempt (temporary - will be collision-based)
        this.input.keyboard?.on('keydown-D', () => {
            // This is temporary - in the real game, this will be triggered by taxi collision
            console.log('Delivery attempt (press D on platform)');
            // TODO: Implement collision detection with platforms
        });
        
        // ESC key to pause game
        this.input.keyboard?.on('keydown-ESC', () => {
            this.orchestrator?.pauseGame();
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

    public pauseGame(): void {
        this.orchestrator?.pauseGame();
    }

    public resumeGame(): void {
        this.orchestrator?.resumeGame();
    }

    destroy(): void {
        if (this.orchestrator) {
            this.orchestrator.destroy();
            this.orchestrator = null;
        }
        super.destroy();
    }
}
