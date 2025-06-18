const express = require('express');
const http = require('http');
const path = require('path');

// Game constants
const MAX_PLAYERS = 30;
const MIN_PLAYERS = 1;
const ROUND_TIME = 90; // seconds
const DISCUSSION_TIME_BASE = 4; // seconds per hour
const GAME_HOURS = [18, 19, 20, 21, 22, 23, 24]; // Game starts at 18:00 and ends at 24:00

const app = express();
const server = http.createServer(app);

// Get port from environment variable or default to 3001
const PORT = process.env.PORT || 3001;

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '../')));

// Root route serves the index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Add a route for testing connection
app.get('/ping', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Add a route for the connection test page
app.get('/connection-test', (req, res) => {
  res.sendFile(path.join(__dirname, '../test_join.html'));
});

// Add a route for the speed test
app.get('/test_connection_speed.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../test_connection_speed.html'));
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 