/**
 * Peer Connector Module
 * Handles all WebRTC peer-to-peer connection logic
 */

const PeerConnector = {
  // Peer instance
  peer: null,
  
  // Connection state
  isConnected: false,
  connectionAttempts: 0,
  maxReconnectAttempts: 5,
  
  // Connected peers
  peers: new Map(),
  
  // Game room
  currentRoom: null,
  
  // Event handlers
  eventHandlers: new Map(),
  
  // Callbacks
  onConnect: null,
  onDisconnect: null,
  onError: null,
  onReconnecting: null,
  onReconnectFailed: null,
  
  /**
   * Initialize the peer connection
   */
  async init(options = {}) {
    console.log("Initializing peer connection...");
    
    // Set callbacks
    this.onConnect = options.onConnect || (() => console.log("Peer connected"));
    this.onDisconnect = options.onDisconnect || (() => console.log("Peer disconnected"));
    this.onError = options.onError || ((err) => console.error("Peer error:", err));
    this.onReconnecting = options.onReconnecting || ((attempt) => console.log(`Reconnecting, attempt ${attempt}`));
    this.onReconnectFailed = options.onReconnectFailed || (() => console.error("Reconnection failed"));
    
    // Update connection status UI initially to "connecting"
    this.updateConnectionStatusUI('connecting', 'Kapcsolódás...');
    
    try {
      // Handle case where PeerJS is not loaded
      if (typeof Peer === 'undefined') {
        console.error("PeerJS not loaded! Using offline fallback.");
        this.createOfflineFallback();
        return;
      }
      
      // Generate a random peer ID
      const peerId = 'player_' + Math.random().toString(36).substr(2, 9);
      
      // Initialize peer with configuration
      this.peer = new Peer(peerId, {
        debug: 2,
        config: {
          'iceServers': [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
          ]
        }
      });
      
      // Setup listeners
      this.setupEventListeners();
      
    } catch (error) {
      console.error("Error initializing peer:", error);
      this.createOfflineFallback();
    }
  },
  
  /**
   * Set up peer event listeners
   */
  setupEventListeners() {
    if (!this.peer) return;
    
    // Connection events
    this.peer.on('open', (id) => {
      console.log("Peer connected successfully with ID:", id);
      this.isConnected = true;
      this.connectionAttempts = 0;
      this.updateConnectionStatusUI('connected', 'Kapcsolódva');
      this.onConnect(this.peer);
      
      // Notify the game that we're connected
      if (window.Game) {
        window.Game.handlePeerConnection();
      }
    });
    
    this.peer.on('close', () => {
      console.log("Peer disconnected");
      this.isConnected = false;
      this.updateConnectionStatusUI('disconnected', 'Kapcsolat megszakítva');
      this.onDisconnect();
      
      // Notify the game that we're disconnected
      if (window.Game) {
        window.Game.handlePeerDisconnection();
      }
    });
    
    this.peer.on('error', (error) => {
      console.error("Connection error:", error);
      this.onError(error);
      
      this.connectionAttempts++;
      if (this.connectionAttempts >= this.maxReconnectAttempts) {
        this.onReconnectFailed();
      } else {
        this.onReconnecting(this.connectionAttempts);
      }
      
      // Notify the game of the error
      if (window.Game) {
        window.Game.handlePeerDisconnection();
      }
    });
    
    // Handle incoming connections
    this.peer.on('connection', (conn) => {
      console.log("Incoming connection from:", conn.peer);
      this.setupDataConnection(conn);
    });
  },
  
  /**
   * Set up a data connection with another peer
   */
  setupDataConnection(conn) {
    conn.on('open', () => {
      console.log("Data connection opened with:", conn.peer);
      this.peers.set(conn.peer, conn);
      
      // Handle incoming data
      conn.on('data', (data) => {
        this.handleIncomingData(conn.peer, data);
      });
      
      // Handle connection close
      conn.on('close', () => {
        console.log("Data connection closed with:", conn.peer);
        this.peers.delete(conn.peer);
        this.emit('peerLeft', { peerId: conn.peer });
      });
    });
  },
  
  /**
   * Connect to another peer
   */
  connectToPeer(peerId) {
    if (!this.peer) return null;
    
    try {
      const conn = this.peer.connect(peerId);
      this.setupDataConnection(conn);
      return conn;
    } catch (error) {
      console.error("Error connecting to peer:", error);
      return null;
    }
  },
  
  /**
   * Join a game room
   */
  joinRoom(roomId) {
    this.currentRoom = roomId;
    // Connect to the host (first peer in the room)
    const hostId = roomId.split('_')[0];
    if (hostId !== this.peer.id) {
      this.connectToPeer(hostId);
    }
  },
  
  /**
   * Leave the current room
   */
  leaveRoom() {
    if (this.currentRoom) {
      this.emit('leaveRoom', { peerId: this.peer.id });
      this.peers.clear();
      this.currentRoom = null;
    }
  },
  
  /**
   * Register an event handler
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(handler);
  },
  
  /**
   * Remove an event handler
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function to remove
   */
  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).delete(handler);
    }
  },
  
  /**
   * Emit an event to all connected peers
   * @param {string} event - Event name
   * @param {*} data - Data to send
   */
  emit(event, data) {
    const message = {
      event,
      data,
      sender: this.peer.id,
      timestamp: Date.now()
    };
    
    // Send to all connected peers
    this.peers.forEach((conn) => {
      if (conn.open) {
        conn.send(message);
      }
    });
    
    // Also trigger local handlers
    this.triggerEventHandlers(event, data);
  },
  
  /**
   * Trigger event handlers for an event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  triggerEventHandlers(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  },
  
  /**
   * Handle incoming data from peers
   */
  handleIncomingData(senderId, data) {
    if (data.event) {
      this.triggerEventHandlers(data.event, data.data);
    }
  },
  
  /**
   * Create an offline fallback when connection fails
   */
  createOfflineFallback() {
    console.log("Creating offline fallback peer");
    
    // Create mock peer object with no-op methods
    this.peer = {
      id: `offline-${Date.now()}`,
      connected: false,
      disconnected: true,
      on: (event, callback) => {},
      connect: () => ({
        on: () => {},
        send: () => console.log("[OFFLINE] Sending message"),
        close: () => {}
      })
    };
    
    this.isOfflineMode = true;
    this.updateConnectionStatusUI('offline', 'Offline mód');
  },
  
  /**
   * Update the connection status UI indicator
   */
  updateConnectionStatusUI(status, text) {
    const statusElement = document.getElementById('connection-status');
    const textElement = document.getElementById('connection-text');
    
    if (statusElement && textElement) {
      statusElement.classList.remove(
        'status-connected', 
        'status-connecting', 
        'status-disconnected',
        'status-offline'
      );
      
      statusElement.classList.add(`status-${status}`);
      textElement.textContent = text;
    }
  },
  
  /**
   * Check if peer is connected
   */
  isPeerConnected() {
    return this.peer && this.peer.connected;
  },
  
  /**
   * Disconnect from all peers
   */
  disconnect() {
    if (!this.peer) return;
    
    console.log("Disconnecting from peers...");
    this.isConnected = false;
    
    try {
      this.peers.forEach(conn => conn.close());
      this.peers.clear();
      this.peer.destroy();
      this.updateConnectionStatusUI('disconnected', 'Kapcsolat bontva');
    } catch (error) {
      console.error("Error during disconnect:", error);
    }
  }
};

export default PeerConnector; 