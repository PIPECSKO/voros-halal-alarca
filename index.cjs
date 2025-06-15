const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files (your game) from the client directory
app.use(express.static(path.join(__dirname, '../client')));

// --- Simple signaling logic for peer-to-peer ---
let peers = {};

wss.on('connection', function connection(ws) {
    let peerId = null;

    ws.on('message', function incoming(message) {
        let data;
        try {
            data = JSON.parse(message);
        } catch (e) {
            return;
        }

        if (data.type === 'register') {
            peerId = data.peerId;
            peers[peerId] = ws;
            ws.send(JSON.stringify({ type: 'registered', peerId }));
        }

        if (data.type === 'signal' && data.target) {
            const targetWs = peers[data.target];
            if (targetWs) {
                targetWs.send(JSON.stringify({
                    type: 'signal',
                    from: peerId,
                    signal: data.signal
                }));
            }
        }
    });

    ws.on('close', function () {
        if (peerId && peers[peerId]) {
            delete peers[peerId];
        }
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});