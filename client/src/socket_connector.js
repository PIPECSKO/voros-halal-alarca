/**
 * Socket Connector Module
 * Handles all socket.io connection logic for Glitch.com hosting
 */

const SocketConnector = {
  // Socket instance
  socket: null,
  
  // Connection state
  isConnected: false,
  connectionAttempts: 0,
  maxReconnectAttempts: 5,
  
  // Connection details
  get serverUrl() {
    // Check if we're running from a file:// URL (direct HTML opening)
    if (window.location.protocol === 'file:') {
      // For local development, use localhost
      return 'http://localhost:3001';
    }
    
    // If running from a web server, detect hosting platform
    const hostname = window.location.hostname;
    
    // Check for Glitch.com hosting
    if (hostname.includes('glitch.me')) {
      // Use the same origin (Glitch handles the routing)
      return window.location.origin;
    }
    
    // For other hosting platforms
    if (hostname.includes('render.com') || 
        hostname.includes('railway.app') || 
        hostname.includes('herokuapp.com') ||
        hostname.includes('vercel.app') ||
        hostname.includes('netlify.app')) {
      return window.location.origin;
    }
    
    // For local development or other servers, use the same host but port 3001
    return `http://${hostname}:3001`;
  },
  
  // Callbacks
  onConnect: null,
  onDisconnect: null,
  onError: null,
  onReconnecting: null,
  onReconnectFailed: null,
  
  /**
   * Initialize the socket connection
   */
  async init(options = {}) {
    console.log("Initializing socket connection...");
    
    // Set callbacks
    this.onConnect = options.onConnect || (() => console.log("Socket connected"));
    this.onDisconnect = options.onDisconnect || (() => console.log("Socket disconnected"));
    this.onError = options.onError || ((err) => console.error("Socket error:", err));
    this.onReconnecting = options.onReconnecting || ((attempt) => console.log(`Reconnecting, attempt ${attempt}`));
    this.onReconnectFailed = options.onReconnectFailed || (() => console.error("Reconnection failed"));
    
    // Update connection status UI initially to "connecting"
    this.updateConnectionStatusUI('connecting', 'Kapcsolódás...');
    
    try {
      // Handle case where socket.io is not loaded
      if (typeof io === 'undefined') {
        console.error("Socket.io not loaded! Using offline fallback.");
        this.createOfflineFallback();
        return;
      }
      
      // Get server URL (with auto-detection for ngrok)
      const serverUrl = this.serverUrl;
      console.log('🔗 Kapcsolódás ide:', serverUrl);
      
      // Initialize socket with robust configuration
      this.socket = io(serverUrl, {
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        // Try WebSocket first, then fall back to polling
        transports: ['websocket', 'polling']
      });
      
      // Setup listeners
      this.setupEventListeners();
      
      // Set up heartbeat response
      this.socket.on('heartbeat', () => {
        this.socket.emit('heartbeat_response');
      });
      
      // Check connection acknowledgment 
      this.socket.on('connection_ack', (data) => {
        console.log('Connection acknowledged by server:', data);
      });
      
    } catch (error) {
      console.error("Error initializing socket:", error);
      this.createOfflineFallback();
    }
  },
  
  /**
   * Set up socket event listeners
   */
  setupEventListeners() {
    if (!this.socket) return;
    
    // Connection events
    this.socket.on('connect', () => {
      console.log("Socket connected successfully");
      this.isConnected = true;
      this.connectionAttempts = 0;
      this.updateConnectionStatusUI('connected', 'Kapcsolódva');
      this.onConnect(this.socket);
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log("Socket disconnected:", reason);
      this.isConnected = false;
      this.updateConnectionStatusUI('disconnected', 'Kapcsolat megszakítva');
      this.onDisconnect(reason);
    });
    
    this.socket.on('connect_error', (error) => {
      console.error("Connection error:", error);
      this.onError(error);
      
      // If this is the first error, try switching to polling
      if (this.connectionAttempts === 0) {
        console.log("Trying fallback transport: polling");
        this.socket.io.opts.transports = ['polling', 'websocket'];
        this.updateConnectionStatusUI('connecting', 'Újracsatlakozás más módon...');
      }
      
      this.connectionAttempts++;
    });
    
    this.socket.on('reconnect_attempt', (attempt) => {
      console.log(`Reconnection attempt ${attempt}/${this.maxReconnectAttempts}`);
      this.updateConnectionStatusUI('connecting', `Újracsatlakozás (${attempt}/${this.maxReconnectAttempts})...`);
      this.onReconnecting(attempt);
    });
    
    this.socket.on('reconnect_failed', () => {
      console.error("Failed to reconnect after maximum attempts");
      this.updateConnectionStatusUI('disconnected', 'Újracsatlakozás sikertelen');
      this.onReconnectFailed();
      
      // Switch to offline mode after a delay
      setTimeout(() => {
        this.createOfflineFallback();
      }, 3000);
    });
    
    // Custom error event from server
    this.socket.on('error', (errorMsg) => {
      console.error("Server error:", errorMsg);
      this.onError(errorMsg);
    });
  },
  
  /**
   * Create an offline fallback when connection fails
   */
  createOfflineFallback() {
    console.log("Creating offline fallback socket");
    
    // Create mock socket object with no-op methods
    this.socket = {
      id: `offline-${Date.now()}`,
      connected: false,
      disconnected: true,
      on: (event, callback) => {},
      emit: (event, ...args) => {
        console.log(`[OFFLINE] Emitted "${event}" event with:`, args);
        return false;
      },
      // Mock other socket.io methods as needed
      connect: () => {},
      disconnect: () => {}
    };
    
    this.isOfflineMode = true;
    this.updateConnectionStatusUI('offline', 'Offline mód');
  },
  
  /**
   * Update the connection status UI indicator
   * @param {string} status - Status string: 'connected', 'connecting', 'disconnected', 'offline'
   * @param {string} text - Text to display
   */
  updateConnectionStatusUI(status, text) {
    const statusElement = document.getElementById('connection-status');
    const textElement = document.getElementById('connection-text');
    
    if (statusElement && textElement) {
      // Remove all status classes
      statusElement.classList.remove(
        'status-connected', 
        'status-connecting', 
        'status-disconnected',
        'status-offline'
      );
      
      // Add the current status class
      statusElement.classList.add(`status-${status}`);
      
      // Update the text
      textElement.textContent = text;
    }
  },
  
  /**
   * Check if socket is connected
   * @returns {boolean}
   */
  isSocketConnected() {
    return this.socket && (this.socket.connected === true);
  },
  
  /**
   * Emit an event to the server with error handling
   * @param {string} event - Event name
   * @param {*} data - Data to send
   * @returns {boolean} - True if emit was successful
   */
  emit(event, data) {
    if (!this.socket) return false;
    
    try {
      console.log(`Emitting "${event}" event with:`, data);
      this.socket.emit(event, data);
      return true;
    } catch (error) {
      console.error(`Error emitting "${event}" event:`, error);
      return false;
    }
  },
  
  /**
   * Register an event handler
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   */
  on(event, callback) {
    if (!this.socket) return;
    
    try {
      this.socket.on(event, callback);
    } catch (error) {
      console.error(`Error registering "${event}" handler:`, error);
    }
  },
  
  /**
   * Force a reconnection
   */
  reconnect() {
    if (!this.socket) return;
    
    console.log("Forcing reconnection...");
    this.updateConnectionStatusUI('connecting', 'Újracsatlakozás...');
    this.socket.disconnect();
    this.socket.connect();
  }
};

export default SocketConnector; 