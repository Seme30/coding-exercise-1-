# Name
Semahegn Adugna

# Multi-Round Points Game

A real-time multiplayer game where players compete for points across multiple rounds. Built with NestJS (backend) and React (frontend).

## Features

- Real-time multiplayer gameplay using WebSocket
- Multiple rounds of competition
- Points-based scoring system
- Robust disconnection handling
- Auto-start functionality
- Player state management
- Round-based gameplay with animations
- Responsive UI with player status indicators

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A modern web browser

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run start:dev
```

The backend server will start on port 3000 by default.

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend application will start on port 5173 and automatically open in your default browser.

## Game Configuration

The following values are hardcoded in the game:

- Minimum players to start: 4
- Total rounds per game: 5
- Round duration: 5000ms (5 seconds)
- Countdown duration: 3000ms (3 seconds)
- Auto-start delay: 10000ms (10 seconds)
- Leave game timeout: 20000ms (20 seconds)

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── game/           # Game logic and WebSocket handlers
│   │   ├── constants.ts    # Game configuration constants
│   │   └── main.ts        # Application entry point
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/    # React components
    │   ├── context/      # Game state management
    │   ├── hooks/       # Custom hooks including WebSocket
    │   └── App.tsx     # Root component
    └── package.json
```

## Key Design Decisions

1. **Connection Management**
   - Players remain in the game until explicitly leaving
   - No automatic removal on temporary disconnections
   - Confirmation required when closing tab/window
   - Visual indicators for disconnected players

2. **Game Flow**
   - Auto-start when minimum players join
   - Round-based gameplay with synchronized timing
   - Random winner selection per round
   - Cumulative scoring system

3. **State Management**
   - Centralized game state on backend
   - Real-time state synchronization
   - Player state tracking (connected/disconnected)
   - Round history tracking

4. **Error Handling**
   - Graceful disconnection handling
   - Automatic reconnection attempts
   - User confirmation for intentional leaves
   - Error messages for edge cases

## Browser Support

The game is tested and supported on:
- Chrome (latest)
- Firefox (latest)
- Edge (latest)