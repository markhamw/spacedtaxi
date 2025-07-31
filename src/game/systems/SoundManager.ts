export class SoundManager {
    private audioContext: AudioContext;
    private masterGain: GainNode;
    private sounds: Map<string, AudioBuffer> = new Map();
    private activeSources: Map<string, AudioBufferSourceNode> = new Map();
    private loops: Map<string, { source: AudioBufferSourceNode; gain: GainNode }> = new Map();

    constructor() {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        this.masterGain.gain.value = 0.3; // Master volume
        
        this.generateSounds();
    }

    private async generateSounds(): Promise<void> {
        // Generate idle sound - low frequency space harley rumble
        const idleBuffer = this.generateIdleSound();
        this.sounds.set('idle', idleBuffer);

        // Generate thrust sound - higher frequency with modulation
        const thrustBuffer = this.generateThrustSound();
        this.sounds.set('thrust', thrustBuffer);
        
        console.log('Sound Manager: Sounds generated');
    }

    private generateIdleSound(): AudioBuffer {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 3; // 3 seconds for smoother loop
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const time = i / sampleRate;
            
            // Deep space engine rumble (35-50 Hz)
            const baseFreq = 42 + Math.sin(time * 0.3) * 8;
            const base = Math.sin(time * baseFreq * 2 * Math.PI) * 0.35;
            
            // Subtle harmonic (70-100 Hz) for richness
            const harmonic = Math.sin(time * baseFreq * 1.7 * 2 * Math.PI) * 0.15;
            
            // Very low sub-bass (20-30 Hz) for depth
            const subBass = Math.sin(time * (25 + Math.sin(time * 0.2) * 5) * 2 * Math.PI) * 0.2;
            
            // Minimal texture noise
            const noise = (Math.random() - 0.5) * 0.01;
            
            // Slow breathing modulation for organic feel
            const breathe = 1 + Math.sin(time * 0.4) * 0.08;
            
            // Combine with modulation
            let sample = (base + harmonic + subBass + noise) * breathe;
            
            // Perfect loop crossfade
            const fadeLength = sampleRate * 0.2; // 200ms crossfade
            if (i < fadeLength) {
                sample *= Math.sin((i / fadeLength) * Math.PI * 0.5);
            } else if (i > data.length - fadeLength) {
                sample *= Math.cos(((i - (data.length - fadeLength)) / fadeLength) * Math.PI * 0.5);
            }
            
            data[i] = sample * 0.3; // Consistent volume
        }

        return buffer;
    }

    private generateThrustSound(): AudioBuffer {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 2; // 2 second loop for consistency
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const time = i / sampleRate;
            
            // Main thrust frequency (100-140 Hz) - builds on idle
            const baseFreq = 120 + Math.sin(time * 1.5) * 20;
            const base = Math.sin(time * baseFreq * 2 * Math.PI) * 0.4;
            
            // Keep some idle rumble (harmonically related)
            const idleRumble = Math.sin(time * (baseFreq * 0.35) * 2 * Math.PI) * 0.15;
            
            // Add thrust harmonics for power
            const harmonic2 = Math.sin(time * baseFreq * 2 * 2 * Math.PI) * 0.18;
            const harmonic3 = Math.sin(time * baseFreq * 3 * 2 * Math.PI) * 0.08;
            
            // Higher frequency sizzle for thrust character (300-500 Hz)
            const sizzle = Math.sin(time * (400 + Math.sin(time * 3) * 100) * 2 * Math.PI) * 0.06;
            
            // Controlled noise for thrust texture
            const noise = (Math.random() - 0.5) * 0.08;
            
            // Pulse modulation for engine power variation
            const pulse = 1 + Math.sin(time * 4) * 0.12;
            
            // Combine all elements
            let sample = (base + idleRumble + harmonic2 + harmonic3 + sizzle + noise) * pulse;
            
            // Perfect loop crossfade matching idle
            const fadeLength = sampleRate * 0.2; // 200ms crossfade
            if (i < fadeLength) {
                sample *= Math.sin((i / fadeLength) * Math.PI * 0.5);
            } else if (i > data.length - fadeLength) {
                sample *= Math.cos(((i - (data.length - fadeLength)) / fadeLength) * Math.PI * 0.5);
            }
            
            data[i] = sample * 0.4; // Consistent volume with idle
        }

        return buffer;
    }

    public playSound(soundName: string, loop: boolean = false, volume: number = 1): void {
        const buffer = this.sounds.get(soundName);
        if (!buffer) {
            console.warn(`Sound not found: ${soundName}`);
            return;
        }

        // Resume audio context if suspended (required by some browsers)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        if (loop) {
            this.playLoopingSound(soundName, volume);
        } else {
            this.playOneShotSound(soundName, volume);
        }
    }

    private playOneShotSound(soundName: string, volume: number): void {
        const buffer = this.sounds.get(soundName);
        if (!buffer) return;

        const source = this.audioContext.createBufferSource();
        const gain = this.audioContext.createGain();
        
        source.buffer = buffer;
        gain.gain.value = volume;
        
        source.connect(gain);
        gain.connect(this.masterGain);
        
        source.start();
        
        // Clean up after sound finishes
        source.onended = () => {
            source.disconnect();
            gain.disconnect();
        };
    }

    private playLoopingSound(soundName: string, volume: number): void {
        // Stop existing loop if playing
        this.stopSound(soundName);
        
        const buffer = this.sounds.get(soundName);
        if (!buffer) return;

        const source = this.audioContext.createBufferSource();
        const gain = this.audioContext.createGain();
        
        source.buffer = buffer;
        source.loop = true;
        gain.gain.value = volume;
        
        source.connect(gain);
        gain.connect(this.masterGain);
        
        source.start();
        
        // Store reference for stopping
        this.loops.set(soundName, { source, gain });
    }

    public stopSound(soundName: string): void {
        const loop = this.loops.get(soundName);
        if (loop) {
            loop.source.stop();
            loop.source.disconnect();
            loop.gain.disconnect();
            this.loops.delete(soundName);
        }
    }

    public fadeSound(soundName: string, targetVolume: number, duration: number): void {
        const loop = this.loops.get(soundName);
        if (!loop) return;

        const currentVolume = loop.gain.gain.value;
        const currentTime = this.audioContext.currentTime;
        
        loop.gain.gain.cancelScheduledValues(currentTime);
        loop.gain.gain.setValueAtTime(currentVolume, currentTime);
        loop.gain.gain.linearRampToValueAtTime(targetVolume, currentTime + duration);
    }

    public setMasterVolume(volume: number): void {
        this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }

    public isPlaying(soundName: string): boolean {
        return this.loops.has(soundName);
    }

    public destroy(): void {
        // Stop all sounds
        for (const soundName of this.loops.keys()) {
            this.stopSound(soundName);
        }
        
        // Close audio context
        if (this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        
        this.sounds.clear();
        this.activeSources.clear();
        this.loops.clear();
    }
}