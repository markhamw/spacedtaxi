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
-   `src/game/scenes/Game.ts` - Main game scene
-   `src/main.ts` - Application entry point
-   `public/assets/` - Static game assets (sprites, images)
-   `vite/config.dev.mjs` - Development Vite configuration
-   `vite/config.prod.mjs` - Production Vite configuration with Terser minification

### Game Design

-   Space taxi clone with platform arms spawning 2-4 platforms each
-   Platform identifiers (e.g., C11, K2, N88) for navigation
-   Sequential passenger pickup/dropoff system
-   Taxi lands at generated endpoint platforms
-   Game is set around a space station in a nebula
-   Background is dynamic and has twinkling stars and meteorites and moving vessels

### font

Sixtyfour Convergence

### Color Palette

#08141e, #0f2a3f, #20394f, #f6d6bd, #c3a38a, #997577, #816271, #4e495f

### Libraries and APIs

-   **Falso** (`@ngneat/falso`) - Random data generation library for passenger names, destinations, and other game content
-   **Web Speech API** - Browser-native text-to-speech for passenger dialogue
    -   Use `speechSynthesis.getVoices()` to get available voices
    -   Prefer voices with good quality and natural speech patterns
    -   Filter for English voices with variety (male/female, different accents)
    -   Use `SpeechSynthesisUtterance` for passenger lines with appropriate rate/pitch settings

### Audio Implementation

-   All passenger dialogue should be spoken using Web Speech API
-   Randomize voice selection per passenger for variety
-   Consider voice characteristics that match passenger personality/destination
-   Implement fallback for browsers without speech synthesis support

## Deployment

-   Target platform: Firebase hosting - WORKING
-   Production builds use Terser for compression and optimization - WORKING
