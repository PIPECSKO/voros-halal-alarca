console.log(window.SimplePeer); // Should NOT be undefined
const peer = new window.SimplePeer({ initiator: true });

class PeerConnection {
  constructor(network, isInitiator) {
    this.network = network;
    this.peer = new SimplePeer({
      initiator: isInitiator,
      trickle: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.peer.on('signal', (signal) => {
      this.network.signaling.sendSignal(this.remotePeerId, signal);
    });

    this.peer.on('connect', () => {
      console.log('Peer connection established');
    });

    this.peer.on('data', (data) => {
      this.handleData(data);
    });

    this.peer.on('error', (err) => {
      console.error('Peer connection error:', err);
    });
  }

  signal(signal) {
    this.peer.signal(signal);
  }

  send(data) {
    if (this.peer.connected) {
      this.peer.send(data);
    }
  }

  handleData(data) {
    if (this.onData) {
      this.onData(data);
    }
  }
}

window.PeerConnection = PeerConnection;