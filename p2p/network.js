import PeerConnection from './peer-connection.js';
import Signaling from './signaling.js';
import StateManager from './state-manager.js';

class P2PNetwork {
  constructor() {
    this.connections = new Map();
    this.localPeerId = this.generatePeerId();
    this.isHost = false;
    this.gameCode = null;
    
    this.signaling = new Signaling(this);
    this.stateManager = new StateManager(this);
  }

  generatePeerId() {
    return `peer-${Math.random().toString(36).substr(2, 9)}`;
  }

  async hostGame(username) {
    this.isHost = true;
    this.username = username;
    this.gameCode = this.generateGameCode();
    
    // Initialize game state
    await this.stateManager.initializeHostState(username);
    
    // Start listening for peer connections
    this.signaling.startHost(this.gameCode);
    
    return this.gameCode;
  }

  async joinGame(gameCode, username) {
    this.isHost = false;
    this.username = username;
    this.gameCode = gameCode;
    
    // Connect to host
    await this.signaling.connectToHost(gameCode, username);
    
    // Initialize peer state
    await this.stateManager.initializePeerState(username);
  }

  addConnection(peerId, connection) {
    this.connections.set(peerId, connection);
    
    connection.on('data', (data) => {
      this.handlePeerMessage(peerId, data);
    });
    
    connection.on('close', () => {
      this.removeConnection(peerId);
    });
  }

  handlePeerMessage(peerId, data) {
    try {
      const message = JSON.parse(data);
      this.stateManager.handleNetworkMessage(message);
    } catch (error) {
      console.error('Error handling peer message:', error);
    }
  }

  broadcast(message) {
    const data = JSON.stringify(message);
    this.connections.forEach(connection => {
      if (connection.readyState === 'open') {
        connection.send(data);
      }
    });
  }

  generateGameCode() {
    return Math.random().toString(36).substr(2, 5).toUpperCase();
  }
}

export default P2PNetwork;