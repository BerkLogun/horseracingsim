# Horse Racing Simulation Webapp

A self-playing 2D simulation game where 8 colored squares (horses) move around a map trying to reach a coin. The first horse to touch the coin wins.

## Features

- **Self-Playing Simulation**: Watch as 8 horses navigate the map automatically
- **Physics**: Horses maintain constant speed and bounce realistically off walls and each other
- **Custom Maps**: Future feature to draw your own maps directly on the canvas
- **Visual Feedback**: Clear indication of game status and winners

## Game Rules

1. Each horse (represented by a colored square) moves at a constant speed
2. Horses bounce off walls and each other according to physics rules
3. The game ends when any horse touches the coin
4. The simulation restarts automatically after a winner is determined

## Technical Details

- Built with NextJS and TypeScript
- Canvas-based rendering for smooth animations
- Collision detection system for interactions
- Responsive design that works on various screen sizes

## Development Roadmap

- Phase 1: Core simulation with predefined map
- Phase 2: Statistics and visual enhancements
- Phase 3: Map creator feature allowing custom maps to be drawn on canvas
- Phase 4: Additional game modes and settings

## Getting Started

```
npm install
npm start
```

Visit `http://localhost:3000` to view the simulation.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
