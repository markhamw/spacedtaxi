import { Scene } from 'phaser';

export class BackgroundRenderer {
    private scene: Scene;
    private stars: Phaser.GameObjects.Graphics[] = [];
    private vessels: Phaser.GameObjects.Graphics[] = [];
    private starTweens: Phaser.Tweens.Tween[] = [];

    // Color palette
    private readonly colors = {
        background: 0x08141e,
        stars: [0xf6d6bd, 0xc3a38a, 0x997577],
        vessel: 0x4e495f,
        vesselAccent: 0x20394f
    };

    constructor(scene: Scene) {
        this.scene = scene;
    }

    createBackground(): void {
        const { width, height } = this.scene.scale;

        // Create solid background
        this.createSolidBackground();
        
        // Create twinkling stars
        this.createStars(50);
        
        // Create moving vessels
        this.createVessels(3);
        
        console.log('Background created with dynamic elements');
    }

    private createSolidBackground(): void {
        const { width, height } = this.scene.scale;
        
        // Create a solid dark background
        const background = this.scene.add.graphics();
        background.fillStyle(this.colors.background); // Use the darkest color: 0x08141e
        background.fillRect(0, 0, width, height);
        
        // Send to back
        background.setDepth(-100);
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
        this.vessels.forEach(vessel => vessel.destroy());
        
        this.stars = [];
        this.vessels = [];
    }
}