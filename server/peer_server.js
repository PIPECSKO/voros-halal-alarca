// Simple PeerJS server for local/LAN multiplayer
const { PeerServer } = require('peer');

const server = PeerServer({
  port: 9000,
  path: '/myapp',
  // Uncomment the following line to allow all origins (for development)
  // allow_discovery: true
});

console.log('PeerJS server running on ws://localhost:9000/myapp'); 