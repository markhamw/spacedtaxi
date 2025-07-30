import { Scene } from 'phaser';

export class BackgroundRenderer {
    private scene: Scene;
    private stars: Phaser.GameObjects.Graphics[] = [];
    private meteorites: Phaser.GameObjects.Graphics[] = [];
    private vessels: Phaser.GameObjects.Graphics[] = [];
    private starTweens: Phaser.Tweens.Tween[] = [];

    // Color palette
    private readonly colors = {
        background: 0x08141e,
        stars: [0xf6d6bd, 0xc3a38a, 0x997577],
        meteorite: 0x816271,
        vessel: 0x4e495f,
        vesselAccent: 0x20394f
    };

    constructor(scene: Scene) {
        this.scene = scene;
    }

    createBackground(): void {
        const { width, height } = this.scene.scale;

        // Create gradient background
        this.createGradientBackground();
        
        // Create twinkling stars
        this.createStars(50);
        
        // Create moving meteorites
        this.createMeteorites(5);
        
        // Create moving vessels
        this.createVessels(3);
        
        console.log('Background created with dynamic elements');
    }

    private createGradientBackground(): void {
        const { width, height } = this.scene.scale;
        
        // Create a graphics object for the gradient
        const gradient = this.scene.add.graphics();
        
        // Create gradient effect using multiple rectangles with varying alpha
        const colors = [0x08141e, 0x0f2a3f, 0x20394f];
        const steps = height / colors.length;
        
        for (let i = 0; i < colors.length; i++) {
            const alpha = 1 - (i * 0.3);
            gradient.fillStyle(colors[i], alpha);
            gradient.fillRect(0, i * steps, width, steps + 10); // +10 for overlap
        }
        
        // Send to back
        gradient.setDepth(-100);
    }

    private createStars(count: number): void {
        const { width, height } = this.scene.scale;
        
        for (let i = 0; i < count; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const colorIndex = Math.floor(Math.random() * this.colors.stars.length);
            const color = this.colors.stars[colorIndex];
            const size = Math.random() * 2 + 1; // Size between 1-3
            
            const star = this.scene.add.graphics();
            star.fillStyle(color);
            star.fillCircle(x, y, size);
            star.setDepth(-50);
            
            this.stars.push(star);
            
            // Add twinkling effect
            const tween = this.scene.tweens.add({
                targets: star,
                alpha: 0.3,
                duration: Math.random() * 2000 + 1000, // 1-3 seconds
                yoyo: true,
                repeat: -1,
                delay: Math.random() * 2000 // Random start delay
            });
            
            this.starTweens.push(tween);
        }
    }

    private createMeteorites(count: number): void {
        const { width, height } = this.scene.scale;
        
        for (let i = 0; i < count; i++) {
            const meteorite = this.scene.add.graphics();
            meteorite.fillStyle(this.colors.meteorite);
            
            // Create irregular meteorite shape
            const size = Math.random() * 8 + 4; // Size between 4-12
            const x = -size; // Start off-screen
            const y = Math.random() * height;
            
            meteorite.fillCircle(0, 0, size);
            meteorite.fillCircle(size * 0.3, size * 0.2, size * 0.6); // Add irregular bump
            meteorite.setPosition(x, y);
            meteorite.setDepth(-40);
            
            this.meteorites.push(meteorite);
            
            // Add movement across screen
            this.scene.tweens.add({
                targets: meteorite,
                x: width + size,
                duration: Math.random() * 10000 + 15000, // 15-25 seconds to cross
                ease: 'Linear',
                repeat: -1,
                delay: Math.random() * 5000, // Stagger start times
                onRepeat: () => {
                    // Reset position and randomize Y
                    meteorite.setPosition(-size, Math.random() * height);
                }
            });
            
            // Add slow rotation
            this.scene.tweens.add({
                targets: meteorite,
                rotation: Math.PI * 2,
                duration: Math.random() * 8000 + 5000, // 5-13 seconds per rotation
                repeat: -1,
                ease: 'Linear'
            });
        }
    }

    private createVessels(count: number): void {
        const { width, height } = this.scene.scale;
        
        for (let i = 0; i < count; i++) {
            const vessel = this.scene.add.graphics();
            
            // Create simple vessel shape
            vessel.fillStyle(this.colors.vessel);
            vessel.fillRect(-15, -4, 30, 8); // Main body
            vessel.fillStyle(this.colors.vesselAccent);
            vessel.fillRect(-20, -2, 10, 4); // Front section
            vessel.fillRect(15, -1, 8, 2); // Engine
            
            const startX = Math.random() > 0.5 ? -30 : width + 30;
            const y = Math.random() * (height * 0.8) + (height * 0.1); // Keep in middle 80%
            const direction = startX < 0 ? 1 : -1;
            
            vessel.setPosition(startX, y);
            vessel.setDepth(-30);
            
            this.vessels.push(vessel);
            
            // Add movement
            this.scene.tweens.add({
                targets: vessel,
                x: direction > 0 ? width + 30 : -30,
                duration: Math.random() * 20000 + 25000, // 25-45 seconds to cross
                ease: 'Linear',
                repeat: -1,
                delay: Math.random() * 10000, // Stagger start times
                onRepeat: () => {
                    // Reset position and randomize Y and direction
                    const newDirection = Math.random() > 0.5 ? 1 : -1;
                    const newStartX = newDirection > 0 ? -30 : width + 30;
                    const newY = Math.random() * (height * 0.8) + (height * 0.1);
                    vessel.setPosition(newStartX, newY);
                    
                    // Update tween target
                    const tween = this.scene.tweens.getTweensOf(vessel)[0];
                    if (tween) {
                        tween.updateTo('x', newDirection > 0 ? width + 30 : -30, true);
                    }
                }
            });
            
            // Add subtle vertical bobbing
            this.scene.tweens.add({
                targets: vessel,
                y: y + (Math.random() * 20 - 10),
                duration: Math.random() * 3000 + 2000, // 2-5 seconds
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    public addParallaxEffect(cameraX: number, cameraY: number): void {
        // Move background elements at different speeds for parallax
        this.stars.forEach((star, index) => {
            const parallaxFactor = 0.1 + (index % 3) * 0.05; // Different speeds
            star.x -= cameraX * parallaxFactor;
            star.y -= cameraY * parallaxFactor;
        });
        
        this.meteorites.forEach(meteorite => {
            // Meteorites move independently, no parallax needed
        });
        
        this.vessels.forEach(vessel => {
            // Vessels move independently, no parallax needed
        });
    }

    public destroy(): void {
        // Stop all tweens
        this.starTweens.forEach(tween => tween.destroy());
        this.starTweens = [];
        
        // Destroy graphics objects
        this.stars.forEach(star => star.destroy());
        this.meteorites.forEach(meteorite => meteorite.destroy());
        this.vessels.forEach(vessel => vessel.destroy());
        
        this.stars = [];
        this.meteorites = [];
        this.vessels = [];
    }
}