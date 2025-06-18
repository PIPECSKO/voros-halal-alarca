const { PeerServer } = require('peerjs-server');
const peerServer = PeerServer({ port: 3002, path: '/peerjs' });
console.log('PeerJS server running at ws://localhost:3002/peerjs'); 