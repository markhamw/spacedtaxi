import { Scene } from 'phaser';
import { randFirstName, randLastName, randJobTitle, randCity } from '@ngneat/falso';

export interface Passenger {
    id: string;
    name: string;
    gender: 'male' | 'female';
    pickupPlatform: string;
    destinationPlatform: string;
    personality: PassengerPersonality;
    dialogue: PassengerDialogue;
    voice: SpeechSynthesisVoice | null;
    isPickedUp: boolean;
    isDelivered: boolean;
    sprite?: Phaser.GameObjects.Rectangle;
    nameText?: Phaser.GameObjects.BitmapText;
}

export interface PassengerPersonality {
    type: 'businesslike' | 'friendly' | 'impatient' | 'nervous' | 'casual';
    urgency: number; // 0-1 scale
    chatty: boolean;
}

export interface PassengerDialogue {
    greeting: string;
    destination: string;
    delivered: string;
    waiting?: string[];
}

export interface Mission {
    id: string;
    passenger: Passenger;
    status: 'waiting' | 'active' | 'completed';
    startTime: number;
}

export class PassengerManager {
    private scene: Scene;
    private passengers: Passenger[] = [];
    private missions: Mission[] = [];
    private availableVoices: SpeechSynthesisVoice[] = [];
    private speechSynth: SpeechSynthesis;

    // Color palette
    private readonly colors = {
        passenger: '#f6d6bd',
        passengerBorder: '#c3a38a',
        text: '#08141e'
    };

    constructor(scene: Scene) {
        this.scene = scene;
        this.speechSynth = window.speechSynthesis;
        this.initializeVoices();
    }

    private initializeVoices(): void {
        // Get available voices, filtering for English voices with variety
        const updateVoices = () => {
            const voices = this.speechSynth.getVoices();
            console.log(`Total available voices: ${voices.length}`);
            
            this.availableVoices = voices.filter(voice => 
                voice.lang.startsWith('en') && 
                (voice.name.includes('Google') || voice.name.includes('Microsoft') || voice.default)
            );
            
            console.log(`Filtered English voices: ${this.availableVoices.length}`);
            if (this.availableVoices.length > 0) {
                console.log('Available voices:', this.availableVoices.map(v => v.name));
            } else {
                console.warn('No suitable English voices found, using default voice');
                // Fallback to any available voice
                this.availableVoices = voices.slice(0, 3); // Use first 3 voices as fallback
            }
        };

        updateVoices();
        
        // Voices may load asynchronously
        if (this.speechSynth.onvoiceschanged !== undefined) {
            this.speechSynth.onvoiceschanged = () => {
                console.log('Voice list updated');
                updateVoices();
                // Reassign voices to existing passengers who don't have voices
                this.reassignVoicesToPassengers();
            };
        }
    }

    private reassignVoicesToPassengers(): void {
        if (this.availableVoices.length === 0) return;
        
        // Find passengers without voices and assign them
        this.passengers.forEach(passenger => {
            if (!passenger.voice) {
                passenger.voice = this.selectVoice(passenger.personality, passenger.gender);
                if (passenger.voice) {
                    console.log(`Assigned voice "${passenger.voice.name}" to passenger ${passenger.name}`);
                }
            }
        });
    }

    generatePassenger(pickupPlatform: string, destinationPlatform: string): Passenger {
        const gender: 'male' | 'female' = Math.random() > 0.5 ? 'male' : 'female';
        const firstName = randFirstName({ sex: gender });
        const lastName = randLastName();
        const name = `${firstName} ${lastName}`;
        const id = `passenger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const personality = this.generatePersonality();
        const dialogue = this.generateDialogue(name, destinationPlatform, personality);
        const voice = this.selectVoice(personality, gender);

        if (voice) {
            console.log(`Generated ${gender} passenger ${name} with voice: ${voice.name}`);
        } else {
            console.warn(`Generated ${gender} passenger ${name} WITHOUT voice - voices may not be loaded yet`);
        }

        return {
            id,
            name,
            gender,
            pickupPlatform,
            destinationPlatform,
            personality,
            dialogue,
            voice,
            isPickedUp: false,
            isDelivered: false
        };
    }

    private generatePersonality(): PassengerPersonality {
        const types: PassengerPersonality['type'][] = ['businesslike', 'friendly', 'impatient', 'nervous', 'casual'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        let urgency: number;
        let chatty: boolean;

        switch (type) {
            case 'businesslike':
                urgency = 0.7 + Math.random() * 0.3;
                chatty = false;
                break;
            case 'friendly':
                urgency = 0.3 + Math.random() * 0.4;
                chatty = true;
                break;
            case 'impatient':
                urgency = 0.8 + Math.random() * 0.2;
                chatty = Math.random() > 0.5;
                break;
            case 'nervous':
                urgency = 0.5 + Math.random() * 0.4;
                chatty = Math.random() > 0.3;
                break;
            case 'casual':
                urgency = 0.1 + Math.random() * 0.5;
                chatty = Math.random() > 0.4;
                break;
        }

        return { type, urgency, chatty };
    }

    private generateDialogue(name: string, destination: string, personality: PassengerPersonality): PassengerDialogue {
        const greetings = {
            businesslike: [`Hello, I need to get to ${destination} quickly.`, `Good day, ${destination} please.`],
            friendly: [`Hi there! I'm ${name}, heading to ${destination}.`, `Hello! Beautiful day, isn't it? I need to go to ${destination}.`],
            impatient: [`Finally! I need to get to ${destination} NOW!`, `About time! ${destination}, and step on it!`],
            nervous: [`Um, hello... I need to get to ${destination}, please.`, `Hi... is this safe? I need to go to ${destination}.`],
            casual: [`Hey, can you take me to ${destination}?`, `What's up? Need a ride to ${destination}.`]
        };

        const destinations = {
            businesslike: [`${destination}, please. I have a meeting.`, `${destination}. Time is money, you know.`],
            friendly: [`${destination}, please! Thanks so much!`, `I'm going to ${destination}. How's your day going?`],
            impatient: [`${destination}! And hurry up!`, `Get me to ${destination} ASAP!`],
            nervous: [`${destination}... if that's okay?`, `Um, ${destination} please... safely?`],
            casual: [`${destination}, thanks.`, `Drop me at ${destination}, mate.`]
        };

        const delivered = {
            businesslike: [`Perfect timing. Thank you.`, `Excellent service. Good day.`],
            friendly: [`Thank you so much! Have a wonderful day!`, `You're the best! Thanks for the ride!`],
            impatient: [`Finally! Here's your fare.`, `Took long enough. Thanks, I guess.`],
            nervous: [`Oh thank goodness! Thank you so much!`, `We made it! Thank you for being so careful!`],
            casual: [`Cool, thanks for the ride.`, `Cheers, mate. Catch you later.`]
        };

        const waiting = personality.chatty ? [
            `Are we there yet?`,
            `How much longer?`,
            `This is quite a view up here!`,
            `I've never been in a space taxi before.`
        ] : undefined;

        return {
            greeting: greetings[personality.type][Math.floor(Math.random() * greetings[personality.type].length)],
            destination: destinations[personality.type][Math.floor(Math.random() * destinations[personality.type].length)],
            delivered: delivered[personality.type][Math.floor(Math.random() * delivered[personality.type].length)],
            waiting
        };
    }

    private selectVoice(personality: PassengerPersonality, gender: 'male' | 'female'): SpeechSynthesisVoice | null {
        // If no voices are available yet, try to get them again
        if (this.availableVoices.length === 0) {
            const voices = this.speechSynth.getVoices();
            if (voices.length > 0) {
                console.log(`Found ${voices.length} voices during voice selection`);
                // Update our available voices list
                this.availableVoices = voices.filter(voice => 
                    voice.lang.startsWith('en') && 
                    (voice.name.includes('Google') || voice.name.includes('Microsoft') || voice.default)
                );
                
                if (this.availableVoices.length === 0) {
                    // Still no suitable voices, use any available voice as fallback
                    this.availableVoices = voices.slice(0, 3);
                    console.log('Using fallback voices:', this.availableVoices.map(v => v.name));
                }
            } else {
                console.warn('No voices available for passenger');
                return null;
            }
        }

        // Try to match voice characteristics to personality
        let preferredVoices = this.availableVoices;

        // Filter voices by gender
        const maleVoices = this.availableVoices.filter(v => 
            v.name.toLowerCase().includes('male') || 
            v.name.toLowerCase().includes('david') ||
            v.name.toLowerCase().includes('mark') ||
            v.name.toLowerCase().includes('james') ||
            v.name.toLowerCase().includes('daniel') ||
            v.name.toLowerCase().includes('george') ||
            v.name.toLowerCase().includes('microsoft david') ||
            v.name.toLowerCase().includes('google uk english male')
        );
        
        const femaleVoices = this.availableVoices.filter(v => 
            v.name.toLowerCase().includes('female') || 
            v.name.toLowerCase().includes('zira') ||
            v.name.toLowerCase().includes('susan') ||
            v.name.toLowerCase().includes('hazel') ||
            v.name.toLowerCase().includes('samantha') ||
            v.name.toLowerCase().includes('karen') ||
            v.name.toLowerCase().includes('microsoft zira') ||
            v.name.toLowerCase().includes('google uk english female')
        );

        // Select voices based on passenger gender
        if (gender === 'male' && maleVoices.length > 0) {
            preferredVoices = maleVoices;
        } else if (gender === 'female' && femaleVoices.length > 0) {
            preferredVoices = femaleVoices;
        } else {
            // Fallback to gender-appropriate voices if specific gender voices aren't available
            if (gender === 'male') {
                preferredVoices = maleVoices.length > 0 ? maleVoices : this.availableVoices;
            } else {
                preferredVoices = femaleVoices.length > 0 ? femaleVoices : this.availableVoices;
            }
        }

        return preferredVoices[Math.floor(Math.random() * preferredVoices.length)];
    }

    createMission(pickupPlatform: string, destinationPlatform: string): Mission {
        const passenger = this.generatePassenger(pickupPlatform, destinationPlatform);
        const mission: Mission = {
            id: `mission_${Date.now()}`,
            passenger,
            status: 'waiting',
            startTime: Date.now()
        };

        this.passengers.push(passenger);
        this.missions.push(mission);

        // Create visual representation
        this.createPassengerVisual(passenger);

        return mission;
    }

    private createPassengerVisual(passenger: Passenger): void {
        // This will be called by PlatformManager to position the passenger
        // For now, create basic visual elements that will be positioned later
        const sprite = this.scene.add.rectangle(0, 0, 15, 25, parseInt(this.colors.passenger.replace('#', '0x')));
        sprite.setStrokeStyle(1, parseInt(this.colors.passengerBorder.replace('#', '0x')));
        sprite.setVisible(false); // Will be made visible when positioned

        const nameText = this.scene.add.bitmapText(0, 0, 'thick_8x8', passenger.name, 8)
            .setOrigin(0.5)
            .setTint(parseInt(this.colors.text.replace('#', '0x')));
        nameText.setVisible(false);

        passenger.sprite = sprite;
        passenger.nameText = nameText;
    }

    showPassengerAtPlatform(passengerId: string, x: number, y: number): void {
        const passenger = this.passengers.find(p => p.id === passengerId);
        if (passenger && passenger.sprite && passenger.nameText) {
            passenger.sprite.setPosition(x, y - 15);
            passenger.sprite.setVisible(true);
            
            passenger.nameText.setPosition(x, y - 45);
            passenger.nameText.setVisible(true);
        }
    }

    hidePassenger(passengerId: string): void {
        const passenger = this.passengers.find(p => p.id === passengerId);
        if (passenger && passenger.sprite && passenger.nameText) {
            passenger.sprite.setVisible(false);
            passenger.nameText.setVisible(false);
        }
    }

    speakPassengerLine(passengerId: string, lineType: 'greeting' | 'destination' | 'delivered' | 'waiting'): void {
        const passenger = this.passengers.find(p => p.id === passengerId);
        if (!passenger) {
            console.warn(`Passenger ${passengerId} not found for speech`);
            return;
        }
        
        if (!passenger.voice) {
            console.warn(`No voice assigned to passenger ${passengerId}`);
            return;
        }

        // Check if speech synthesis is available and active
        if (!window.speechSynthesis) {
            console.warn('Speech synthesis not available');
            return;
        }

        let text: string;
        switch (lineType) {
            case 'greeting':
                text = passenger.dialogue.greeting;
                break;
            case 'destination':
                text = passenger.dialogue.destination;
                break;
            case 'delivered':
                text = passenger.dialogue.delivered;
                break;
            case 'waiting':
                if (passenger.dialogue.waiting && passenger.dialogue.waiting.length > 0) {
                    text = passenger.dialogue.waiting[Math.floor(Math.random() * passenger.dialogue.waiting.length)];
                } else {
                    return;
                }
                break;
            default:
                return;
        }

        try {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = passenger.voice;
            utterance.rate = passenger.personality.urgency * 0.5 + 0.7; // Rate between 0.7-1.2
            utterance.pitch = Math.random() * 0.4 + 0.8; // Pitch between 0.8-1.2
            utterance.volume = 0.8; // Ensure good volume
            
            // Add event listeners for debugging
            utterance.onstart = () => {
                console.log(`Speaking: "${text}" (${lineType}) for ${passenger.name}`);
            };
            
            utterance.onerror = (event) => {
                console.error(`Speech synthesis error for ${passenger.name}:`, event.error);
            };
            
            utterance.onend = () => {
                console.log(`Finished speaking for ${passenger.name}`);
            };

            // Cancel any ongoing speech before starting new one
            this.speechSynth.cancel();
            
            // Small delay to ensure cancellation is processed
            setTimeout(() => {
                this.speechSynth.speak(utterance);
            }, 100);
            
        } catch (error) {
            console.error(`Error creating speech for ${passenger.name}:`, error);
        }
    }

    pickupPassenger(passengerId: string): boolean {
        const passenger = this.passengers.find(p => p.id === passengerId);
        const mission = this.missions.find(m => m.passenger.id === passengerId);
        
        if (passenger && mission && !passenger.isPickedUp) {
            passenger.isPickedUp = true;
            mission.status = 'active';
            this.hidePassenger(passengerId);
            this.speakPassengerLine(passengerId, 'destination');
            return true;
        }
        
        return false;
    }

    deliverPassenger(passengerId: string): boolean {
        const passenger = this.passengers.find(p => p.id === passengerId);
        const mission = this.missions.find(m => m.passenger.id === passengerId);
        
        if (passenger && mission && passenger.isPickedUp && !passenger.isDelivered) {
            passenger.isDelivered = true;
            mission.status = 'completed';
            this.speakPassengerLine(passengerId, 'delivered');
            return true;
        }
        
        return false;
    }

    getActiveMissions(): Mission[] {
        return this.missions.filter(m => m.status === 'waiting' || m.status === 'active');
    }

    getCompletedMissions(): Mission[] {
        return this.missions.filter(m => m.status === 'completed');
    }

    getCurrentPassenger(): Passenger | null {
        const activeMissions = this.missions.filter(m => m.status === 'active');
        return activeMissions.length > 0 ? activeMissions[0].passenger : null;
    }

    clearAllPassengers(): void {
        this.passengers.forEach(passenger => {
            if (passenger.sprite) passenger.sprite.destroy();
            if (passenger.nameText) passenger.nameText.destroy();
        });
        this.passengers = [];
        this.missions = [];
    }

    destroy(): void {
        this.clearAllPassengers();
        this.speechSynth.cancel();
    }
}