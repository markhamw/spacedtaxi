# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## AppURL for playwright

https://spacedtaxi.web.app

## Development Commands

-   `npm run dev` - Start development server on http://localhost:8080 with hot-reload
-   `npm run build` - Create production build in `dist` folder
-   `npm run dev-nolog` - Development server without analytics
-   `npm run build-nolog` - Production build without analytics

## Architecture

This is a Phaser 3 TypeScript game using Vite for bundling. The game is a Space Taxi clone with platform-based passenger pickup/dropoff mechanics.

### Project Structure

-   `src/game/main.ts` - Game configuration and initialization
-   `src/game/scenes/` - Game scenes
    -   `Game.ts` - Main game scene with taxi controls and physics
    -   `Pre.ts` - Preloader scene for assets
    -   `Title.ts` - Title screen with menu
    -   `GameOver.ts` - Game over screen with score display
-   `src/game/systems/` - Core game systems
    -   `MissionOrchestrator.ts` - Central game state and mission management
    -   `LevelGenerator.ts` - Procedural level generation with platform placement
    -   `PlatformManager.ts` - Platform creation, rendering, and interaction
    -   `PassengerManager.ts` - Passenger AI, dialogue, and mission logic
    -   `BackgroundRenderer.ts` - Dynamic background with twinkling stars and moving vessels
    -   `SpaceStationManager.ts` - Space station rendering and platform arm connections
-   `src/main.ts` - Application entry point
-   `public/assets/` - Static game assets
    -   `sprites/` - Sprite sheets (taxi.png, taxi.json)
    -   `fonts/` - Bitmap fonts (thick_8x8.png, thick_8x8.xml)
    -   Game background and logo images
-   `vite/config.dev.mjs` - Development Vite configuration
-   `vite/config.prod.mjs` - Production Vite configuration with Terser minification

### Game Design

-   Space taxi clone with procedurally generated levels
-   Central space station with extending arms to platforms
-   Platform arms spawning 2-4 platforms each with unique identifiers (e.g., C11, K2, N88)
-   Time-based gameplay: 20-second timer for passenger pickup/delivery
-   Sequential passenger pickup/dropoff missions with scoring system
-   Taxi physics with thrust controls and landing mechanics
-   Game is set around a space station in a nebula
-   Dynamic background with twinkling stars, meteorites, and moving vessels
-   Progressive difficulty scaling with more platforms and passengers per level
-   Game over on timer expiration, level progression on mission completion

### Assets

-   **Font**: Sixtyfour Convergence (Google Fonts), thick_8x8 bitmap font for UI
-   **Sprites**: Custom taxi sprite with Phaser JSON atlas format
-   **Audio**: Web Speech API for passenger dialogue (no static audio files)

### Color Palette

#08141e, #0f2a3f, #20394f, #f6d6bd, #c3a38a, #997577, #816271, #4e495f

### Game Systems

#### Mission System
-   **MissionOrchestrator**: Central game state management, timer system, UI updates
-   **PassengerManager**: Passenger generation, AI personalities, dialogue system
-   **Timer-based gameplay**: 20-second pickup/delivery cycles with game over on timeout
-   **Scoring system**: Base score + time bonus for efficient deliveries
-   **Progressive missions**: Continuous passenger generation after deliveries

#### Level Generation
-   **LevelGenerator**: Procedural platform placement with configurable difficulty
-   **PlatformManager**: Platform rendering, collision detection, passenger interaction
-   **SpaceStationManager**: Central station with arms connecting to platforms
-   **Dynamic layout**: 2-4 arms with 2-4 platforms each, optimized spacing
-   **Unique identifiers**: Alphanumeric platform IDs (C11, K2, N88, etc.)

#### Visual Systems
-   **BackgroundRenderer**: Parallax starfield with twinkling animations
-   **Moving vessels**: Randomly positioned spacecraft crossing the screen
-   **Platform highlighting**: Visual feedback for pickup/delivery objectives
-   **UI system**: Real-time score, timer, mission progress, and objectives

### Libraries and APIs

-   **Phaser 3**: Game engine with physics, graphics, and input systems
-   **Falso** (`@ngneat/falso`) - Random data generation for passenger names and personalities
-   **Web Speech API** - Browser-native text-to-speech for passenger dialogue
    -   Voice matching: Gender-appropriate voice selection
    -   Personality-based speech rate and pitch adjustment
    -   Fallback voice selection for browser compatibility
    -   Multi-language support (English voices prioritized)

### Development Notes

-   **Testing**: Use Firebase hosted version at https://spacedtaxi.web.app for testing
-   **Build process**: `npm run build-deploy` for deployment (avoid `npm run dev` per local config)
-   **Game controls**: Arrow keys for taxi movement, collision-based pickup/delivery
-   **Scene flow**: Pre → Title → Game → GameOver → (restart cycle)

## Deployment

-   **Target platform**: Firebase hosting - WORKING
-   **Production builds**: Use Terser for compression and optimization - WORKING  
-   **Firestore rules**: Configured for potential future save data storage
-   **Storage rules**: Ready for asset uploads if needed
