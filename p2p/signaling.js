class Signaling {
  constructor(network) {
    this.network = network;
    this.socket = null;
  }

  startHost(gameCode) {
    this.socket = new WebSocket(`wss://${window.location.host}/signal`);
    
    this.socket.onopen = () => {
      this.socket.send(JSON.stringify({
        type: 'register-host',
        gameCode,
        peerId: this.network.localPeerId
      }));
    };
    
    this.setupMessageHandlers();
  }

  async connectToHost(gameCode, username) {
    this.socket = new WebSocket(`wss://${window.location.host}/signal`);
    
    await new Promise((resolve) => {
      this.socket.onopen = () => {
        this.socket.send(JSON.stringify({
          type: 'register-peer',
          gameCode,
          peerId: this.network.localPeerId,
          username
        }));
        resolve();
      };
    });
    
    this.setupMessageHandlers();
  }

  setupMessageHandlers() {
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'signal':
          this.handleSignal(message);
          break;
        case 'peer-list':
          this.handlePeerList(message);
          break;
        case 'host-info':
          this.connectToHostPeer(message);
          break;
      }
    };
  }

  handleSignal(message) {
    const connection = this.network.connections.get(message.from) || 
      new PeerConnection(this.network, false);
      
    connection.signal(message.signal);
    
    if (!this.network.connections.has(message.from)) {
      this.network.addConnection(message.from, connection);
    }
  }

  sendSignal(to, signal) {
    this.socket.send(JSON.stringify({
      type: 'signal',
      from: this.network.localPeerId,
      to,
      signal
    }));
  }
}

export default Signaling;