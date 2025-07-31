import { Scene } from 'phaser';

export enum TaxiState {
    GEAR_UP = 'gearup',
    GEAR_DOWN = 'geardown',
    IDLE = 'idle',
    THRUSTING = 'thrusting'
}

export interface StateTransition {
    from: TaxiState;
    to: TaxiState;
    action?: () => void;
}

export class TaxiStateMachine {
    private gearState: TaxiState = TaxiState.GEAR_UP;
    private engineState: TaxiState = TaxiState.IDLE;
    private taxi: Phaser.GameObjects.Sprite;
    private scene: Scene;
    private gearTransitions: Map<string, StateTransition> = new Map();
    private engineTransitions: Map<string, StateTransition> = new Map();
    private soundManager?: any; // Will be injected

    constructor(scene: Scene, taxi: Phaser.GameObjects.Sprite, initialGearState: TaxiState = TaxiState.GEAR_UP) {
        this.scene = scene;
        this.taxi = taxi;
        this.gearState = initialGearState;
        this.setupTransitions();
        this.enterGearState(this.gearState);
        this.enterEngineState(this.engineState);
    }

    private setupTransitions(): void {
        // Gear state transitions
        this.addGearTransition(TaxiState.GEAR_UP, TaxiState.GEAR_DOWN, () => {
            this.taxi.play('lowergear');
            console.log('Taxi state: GEAR_UP -> GEAR_DOWN');
        });

        this.addGearTransition(TaxiState.GEAR_DOWN, TaxiState.GEAR_UP, () => {
            this.taxi.play('raisegear');
            console.log('Taxi state: GEAR_DOWN -> GEAR_UP');
        });

        // Engine state transitions
        this.addEngineTransition(TaxiState.IDLE, TaxiState.THRUSTING, () => {
            if (this.soundManager) {
                this.soundManager.stopSound('idle');
                this.soundManager.playSound('thrust', true, 0.6);
            }
            console.log('Taxi state: IDLE -> THRUSTING');
        });

        this.addEngineTransition(TaxiState.THRUSTING, TaxiState.IDLE, () => {
            if (this.soundManager) {
                this.soundManager.stopSound('thrust');
                this.soundManager.playSound('idle', true, 0.4);
            }
            console.log('Taxi state: THRUSTING -> IDLE');
        });
    }

    private addGearTransition(from: TaxiState, to: TaxiState, action?: () => void): void {
        const key = `${from}->${to}`;
        this.gearTransitions.set(key, { from, to, action });
    }

    private addEngineTransition(from: TaxiState, to: TaxiState, action?: () => void): void {
        const key = `${from}->${to}`;
        this.engineTransitions.set(key, { from, to, action });
    }

    private transitionGearState(newState: TaxiState): boolean {
        if (this.gearState === newState) {
            return false;
        }

        const transitionKey = `${this.gearState}->${newState}`;
        const transition = this.gearTransitions.get(transitionKey);

        if (!transition) {
            console.warn(`Invalid gear transition: ${this.gearState} -> ${newState}`);
            return false;
        }

        // Exit current gear state
        this.exitGearState(this.gearState);

        // Execute transition action
        if (transition.action) {
            transition.action();
        }

        // Update gear state
        this.gearState = newState;

        // Enter new gear state
        this.enterGearState(newState);

        return true;
    }

    private transitionEngineState(newState: TaxiState): boolean {
        if (this.engineState === newState) {
            return false;
        }

        const transitionKey = `${this.engineState}->${newState}`;
        const transition = this.engineTransitions.get(transitionKey);

        if (!transition) {
            console.warn(`Invalid engine transition: ${this.engineState} -> ${newState}`);
            return false;
        }

        // Exit current engine state
        this.exitEngineState(this.engineState);

        // Execute transition action
        if (transition.action) {
            transition.action();
        }

        // Update engine state
        this.engineState = newState;

        // Enter new engine state
        this.enterEngineState(newState);

        return true;
    }

    private enterGearState(state: TaxiState): void {
        // Let Phaser animations handle frame changes
        // No manual frame setting needed
    }

    private exitGearState(state: TaxiState): void {
        // Handle any cleanup when leaving a gear state
        // Currently no cleanup needed for gear states
    }

    private enterEngineState(state: TaxiState): void {
        // Handle entering engine state
        // Could add engine-specific visual/audio effects here
    }

    private exitEngineState(state: TaxiState): void {
        // Handle any cleanup when leaving an engine state
        // Currently handled by the transition actions
    }

    public getCurrentState(): TaxiState {
        // Return the gear state as the "main" state for compatibility
        return this.gearState;
    }

    public isInState(state: TaxiState): boolean {
        return this.gearState === state || this.engineState === state;
    }

    public setSoundManager(soundManager: any): void {
        this.soundManager = soundManager;
        // Start idle sound
        this.setEngineState(TaxiState.IDLE);
    }

    public toggleGear(): boolean {
        const targetState = this.gearState === TaxiState.GEAR_UP ? TaxiState.GEAR_DOWN : TaxiState.GEAR_UP;
        return this.transitionGearState(targetState);
    }

    public setEngineState(newState: TaxiState): boolean {
        if (newState !== TaxiState.IDLE && newState !== TaxiState.THRUSTING) {
            console.warn(`Invalid engine state: ${newState}`);
            return false;
        }

        return this.transitionEngineState(newState);
    }

    public getGearState(): TaxiState {
        return this.gearState;
    }

    public getEngineState(): TaxiState {
        return this.engineState;
    }

    public isGearUp(): boolean {
        return this.gearState === TaxiState.GEAR_UP;
    }

    public isGearDown(): boolean {
        return this.gearState === TaxiState.GEAR_DOWN;
    }

    public isThrusting(): boolean {
        return this.engineState === TaxiState.THRUSTING;
    }

    public isIdle(): boolean {
        return this.engineState === TaxiState.IDLE;
    }

    public canTransitionTo(state: TaxiState): boolean {
        // Check if it's a valid gear transition
        if (state === TaxiState.GEAR_UP || state === TaxiState.GEAR_DOWN) {
            if (this.gearState === state) return false;
            const transitionKey = `${this.gearState}->${state}`;
            return this.gearTransitions.has(transitionKey);
        }
        
        // Check if it's a valid engine transition
        if (state === TaxiState.IDLE || state === TaxiState.THRUSTING) {
            if (this.engineState === state) return false;
            const transitionKey = `${this.engineState}->${state}`;
            return this.engineTransitions.has(transitionKey);
        }
        
        return false;
    }

    public getValidTransitions(): TaxiState[] {
        const validStates: TaxiState[] = [];
        
        // Add valid gear transitions
        for (const [key, transition] of this.gearTransitions) {
            if (transition.from === this.gearState) {
                validStates.push(transition.to);
            }
        }
        
        // Add valid engine transitions
        for (const [key, transition] of this.engineTransitions) {
            if (transition.from === this.engineState) {
                validStates.push(transition.to);
            }
        }
        
        return validStates;
    }

    public destroy(): void {
        this.gearTransitions.clear();
        this.engineTransitions.clear();
    }
}