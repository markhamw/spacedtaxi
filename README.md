# Spaced Taxi

A retro-style space taxi game built with Phaser 3 and TypeScript. Navigate your taxi through procedurally generated levels, picking up passengers and delivering them to their destinations before time runs out.

🚀 **[Play Spaced Taxi](https://spacedtaxi.web.app)**

![Spaced Taxi Screenshot](screenshot.png)

## Game Features

- **Time-Based Missions**: 20-second timer for each pickup and delivery
- **Procedural Levels**: Dynamically generated space stations with platform arms
- **Smart Passengers**: AI-driven passengers with unique personalities and spoken dialogue
- **Progressive Difficulty**: More platforms and passengers as you advance
- **Dynamic Background**: Twinkling stars and moving spacecraft in a nebula setting
- **Realistic Physics**: Thrust-based taxi controls with momentum and landing mechanics

## How to Play

- **Arrow Keys**: Control your space taxi
- **Objective**: Pick up passengers (yellow indicators) and deliver them to their destinations (highlighted platforms)
- **Time Limit**: Complete each pickup/delivery within 20 seconds or game over
- **Platform IDs**: Navigate using unique platform identifiers (C11, K2, N88, etc.)
- **Scoring**: Earn points for successful deliveries with time bonuses

## Game Systems

- **Mission Orchestration**: Central game state with timer management
- **Passenger AI**: Personality-driven dialogue using Web Speech API
- **Level Generation**: Procedural platform placement with collision optimization
- **Visual Effects**: Parallax starfield with animated background elements

## Development

This game is built with modern web technologies:

- **Phaser 3**: Game engine with physics and graphics
- **TypeScript**: Type-safe development
- **Vite**: Fast bundling and hot-reload development
- **Firebase**: Hosting and deployment

### Local Development

```bash
npm install
npm run build-deploy  # Deploy to Firebase for testing
```

The game uses Firebase hosting for testing. Local development server is not accessible for browser testing.

## Technical Details

- **Color Palette**: Space-themed blues and warm tones (#08141e, #f6d6bd, #c3a38a)
- **Font**: Custom bitmap font (thick_8x8) for retro UI aesthetics  
- **Audio**: Browser-native Web Speech API for passenger dialogue
- **Assets**: Custom sprite sheets and procedurally generated graphics

---

*Built with Phaser 3, TypeScript, and modern web APIs*