const { spawn } = require('child_process');
const path = require('path');

// Start Express game server
const gameServer = spawn('node', [path.join(__dirname, 'index.js')], { stdio: 'inherit' });
console.log('Started game server (Express)');

// Start PeerJS signaling server
const peerServer = spawn('node', [path.join(__dirname, 'peer-server.js')], { stdio: 'inherit' });
console.log('Started PeerJS signaling server');

// Optional: handle exit
[gameServer, peerServer].forEach(proc => {
  proc.on('exit', (code) => {
    console.log(`Process ${proc.spawnargs[1]} exited with code ${code}`);
  });
}); 