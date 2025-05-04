# Horse Racing Simulation Webapp - TODO List

## 1. Project Setup
- [X] Initialize NextJS application with TypeScript
- [X] Set up project structure:
  - `/app/components/` for UI components
  - `/app/game/` for game logic
  - `/app/utils/` for helper functions
  - `/app/assets/` for images and sounds
- [X] Install dependencies:
  - React
  - TypeScript
  - Canvas libraries (if needed)
- [X] Set up linting and formatting tools

## 2. UI Components
- [X] Create App component as the main container
- [X] Implement GameContainer component (centered square)
- [X] Add StatusBar component to display game state/winner
- [X] Design responsive layout that maintains square aspect ratio
- [X] Create GameControls component for restart/settings (if needed)

## 3. Game Canvas Setup
- [X] Create Canvas component to render the game
- [X] Set up canvas context and drawing functions
- [X] Implement game loop using requestAnimationFrame
- [X] Add resize handlers to maintain proper dimensions

## 4. Game Entities
- [X] Implement Horse class:
  - Properties: position, velocity, color, size
  - Methods: update, draw, checkCollision
- [X] Create Coin class:
  - Properties: position, size
  - Methods: draw, checkCollision
- [X] Implement Map class:
  - Properties: dimensions, walls/obstacles
  - Methods: draw, checkCollision
- [X] Set up GameState management system

## 5. Physics System
- [X] Implement constant velocity movement
- [X] Create collision detection between entities
- [X] Program realistic bouncing physics:
  - Horse-to-wall collisions
  - Horse-to-horse collisions
- [X] Ensure velocity magnitude remains constant after collisions

## 6. Game Logic
- [X] Set up initial game state with random horse positions
- [X] Generate starting velocities and directions
- [X] Implement win condition detection (horse touching coin)
- [X] Add game reset functionality
- [X] Add horse movement

## 7. Default Map Implementation
- [X] Create simple default map with walls
- [X] Implement obstacle rendering
- [X] Add collision detection for map boundaries
- [X] Design default starting positions

## 8. Map Creator Functionality
- [ ] Create separate MapCreator component
- [ ] Implement canvas drawing functionality:
  - Draw walls/obstacles with mouse
  - Erase feature
  - Clear all feature
- [ ] Add save/load map functionality
- [ ] Create UI controls for the map creator
- [ ] Implement switching between game and map creator modes

## 9. Visual Enhancements
- [ ] Add colors for different horses
- [ ] Implement simple animations for collisions
- [ ] Create visual indicators for wins
- [ ] Add optional movement trails for horses
- [ ] Design start/end game animations

## 10. State Management & Performance
- [ ] Optimize collision detection algorithms
- [ ] Implement efficient rendering (only redraw changed areas)
- [ ] Add game state persistence (if needed)
- [ ] Test and optimize for various screen sizes and devices

## 11. Additional Features
- [ ] Add statistics tracking (wins per horse)
- [ ] Implement game speed controls
- [ ] Create multiple map layouts
- [ ] Add sound effects
- [ ] Implement a simple settings menu

## 12. Testing & Deployment
- [ ] Test game mechanics thoroughly
- [ ] Ensure browser compatibility
- [ ] Optimize for mobile devices
- [ ] Deploy to hosting service
- [ ] Create production build with optimizations