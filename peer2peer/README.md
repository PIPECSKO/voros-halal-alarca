# Peer-to-Peer Multiplayer Game

This project is a peer-to-peer multiplayer game that allows players to connect and interact with each other in real-time. The game utilizes WebRTC for establishing peer connections and a signaling server for managing the connection process.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Game Logic](#game-logic)
- [Network Management](#network-management)
- [Utilities](#utilities)
- [Types](#types)
- [Contributing](#contributing)
- [License](#license)

## Installation

To get started with the project, clone the repository and install the dependencies:

```bash
git clone <repository-url>
cd peer2peer-multiplayer-game
npm install
```

## Usage

To run the game, use the following command:

```bash
npm start
```

This will start the game and open it in your default web browser. You can invite friends to join by sharing the connection link.

## Game Logic

The main entry point for the game logic is located in `src/game.ts`. This file initializes the game, manages the game loop, and handles player interactions.

## Network Management

The network functionality is handled in the `src/network` directory:

- `peer.ts`: Manages peer-to-peer connections, including methods for connecting, disconnecting, and sending data between peers.
- `signaling.ts`: Handles the signaling process required for establishing peer connections.

## Utilities

Utility functions that assist with various tasks in the game can be found in `src/utils/helpers.ts`. These functions include generating unique IDs, formatting data, and handling errors.

## Types

The project uses TypeScript for type safety. The interfaces and types used throughout the project are defined in `src/types/index.ts`, including structures for Player, GameState, and SignalMessage.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.