const express = require('express');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const games = new Map(); // gameCode -> { hostId, peers: Set }

wss.on('connection', (ws) => {
  let peerId = null;
  let gameCode = null;
  let isHost = false;

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    
    switch (data.type) {
      case 'register-host':
        registerHost(data, ws);
        break;
      case 'register-peer':
        registerPeer(data, ws);
        break;
      case 'signal':
        forwardSignal(data);
        break;
    }
  });

  function registerHost(data) {
    gameCode = data.gameCode;
    peerId = data.peerId;
    isHost = true;
    
    games.set(gameCode, {
      hostId: peerId,
      hostWs: ws,
      peers: new Map()
    });
  }

  function registerPeer(data) {
    gameCode = data.gameCode;
    peerId = data.peerId;
    
    const game = games.get(gameCode);
    if (!game) {
      ws.close(1008, 'Game not found');
      return;
    }
    
    // Store peer connection
    game.peers.set(peerId, ws);
    
    // Notify host about new peer
    if (game.hostWs) {
      game.hostWs.send(JSON.stringify({
        type: 'new-peer',
        peerId,
        username: data.username
      }));
    }
  }

  function forwardSignal(data) {
    const game = games.get(gameCode);
    if (!game) return;
    
    const targetWs = data.to === game.hostId ? game.hostWs : game.peers.get(data.to);
    if (targetWs) {
      targetWs.send(JSON.stringify({
        type: 'signal',
        from: peerId,
        signal: data.signal
      }));
    }
  }

  ws.on('close', () => {
    if (gameCode && peerId) {
      const game = games.get(gameCode);
      if (game) {
        if (isHost) {
          // Host disconnected - close game
          games.delete(gameCode);
        } else {
          // Peer disconnected
          game.peers.delete(peerId);
        }
      }
    }
  });
});

server.listen(3001, () => {
  console.log('Signaling server running on port 3001');
});