class StateManager {
  constructor(network) {
    this.network = network;
    this.gameState = null;
  }

  async initializeHostState(username) {
    this.gameState = {
      hostId: this.network.localPeerId,
      players: [{
        id: this.network.localPeerId,
        name: username,
        ready: false,
        position: { x: 0, y: 0 },
        character: 0,
        isDead: false
      }],
      started: false,
      round: 0,
      gameState: 'lobby',
      roles: {},
      nobleGroups: {},
      tasks: {},
      deaths: []
    };
    
    // Broadcast state every second
    this.syncInterval = setInterval(() => {
      this.broadcastState();
    }, 1000);
  }

  async initializePeerState(username) {
    // Peer will receive initial state from host
    this.gameState = null;
  }

  broadcastState() {
    if (!this.network.isHost) return;
    
    this.network.broadcast({
      type: 'state-update',
      state: this.gameState
    });
  }

  handleNetworkMessage(message) {
    switch (message.type) {
      case 'state-update':
        this.handleStateUpdate(message.state);
        break;
      case 'player-action':
        this.handlePlayerAction(message);
        break;
      // Add other message types as needed
    }
  }

  handleStateUpdate(newState) {
    if (this.network.isHost) return; // Host ignores state updates
    
    // Merge new state with local state
    this.gameState = {...this.gameState, ...newState};
    
    // Trigger game update
    if (window.game) {
      window.game.onStateUpdate(this.gameState);
    }
  }

  // Add your game logic functions here (modified for P2P)
  assignRoles() {
    if (!this.network.isHost) return;
    
    // Your existing role assignment logic
    // ...
    
    this.broadcastState();
  }
  
  // Other game functions...
}

export default StateManager;