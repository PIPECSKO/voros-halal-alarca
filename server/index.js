import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

// These two lines are needed to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use('/js', express.static(path.join(__dirname, '../js')));
app.use('/p2p', express.static(path.join(__dirname, '../p2p')));
app.use(express.static(path.join(__dirname, '../client')));

wss.on('connection', ws => {
    ws.on('message', message => {
        wss.clients.forEach(client => {
            if (client !== ws && client.readyState === ws.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => {
        const disconnectMsg = JSON.stringify({ type: 'peer-disconnected' });
        wss.clients.forEach(client => {
            if (client.readyState === ws.OPEN) {
                client.send(disconnectMsg);
            }
        });
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Signaling server running at http://localhost:${PORT}/`);
});