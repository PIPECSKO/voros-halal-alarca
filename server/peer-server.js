const { PeerServer } = require('peerjs-server');

const peerServer = PeerServer({ 
  port: 3002, 
  path: '/peerjs',
  allow_discovery: true,
  proxied: false,
  key: 'peerjs',
  concurrent_limit: 5000,
  cleanup_out_msgs: 1000,
  alive_timeout: 60000,
  expire_timeout: 5000,
  max_concurrent_connections: 5000
});

console.log('PeerJS server running at ws://localhost:3002/peerjs');

// Handle server events
peerServer.on('connection', (client) => {
  console.log('Client connected:', client.getId());
});

peerServer.on('disconnect', (client) => {
  console.log('Client disconnected:', client.getId());
}); 