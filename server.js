const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

// Game constants
const MAX_PLAYERS = 30;
const MIN_PLAYERS = 1;
const ROUND_TIME = 90; // seconds
const DISCUSSION_TIME_BASE = 4; // seconds per hour
const GAME_HOURS = [18, 19, 20, 21, 22, 23, 24]; // Game starts at 18:00 and ends at 24:00

// Game state variables
const games = {};

const app = express();
const server = http.createServer(app);

// Get port from environment variable or default to 3001
const PORT = process.env.PORT || 3001;

const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: false
  },
  connectTimeout: 30000,
  pingTimeout: 20000,
  pingInterval: 5000,
  upgradeTimeout: 20000,
  transports: ['websocket', 'polling'],
  allowUpgrades: true,
  perMessageDeflate: {
    threshold: 512
  },
  maxHttpBufferSize: 5e5,
  compression: true,
  httpCompression: true,
  cookie: false,
  serveClient: false
});

// Debug middleware for socket.io connections
io.use((socket, next) => {
  const address = socket.handshake.address;
  console.log(`New connection attempt from: ${address}`);
  console.log(`Transport: ${socket.conn.transport.name}`);
  
  socket.connectionTime = new Date();
  next();
});

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Root route serves the index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Add a route for testing connection
app.get('/ping', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Handle socket connections
io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id} at ${new Date().toISOString()}`);

  socket.emit('connection_ack', { 
    status: 'connected',
    id: socket.id,
    serverTime: new Date().toISOString()
  });

  // Handle ping for connection testing
  socket.on('ping', (data, callback) => {
    if (typeof callback === 'function') {
      // Send acknowledgment back
      callback();
    }
  });
  
  // Handle pong for connection testing
  socket.on('pong', (data) => {
    // Echo back with server timestamp
    socket.emit('pong', {
      ...data,
      serverTime: new Date().toISOString()
    });
  });

  // Handle host game event
  socket.on('hostGame', (username) => {
    const gameCode = generateGameCode();
    
    games[gameCode] = {
      host: socket.id,
      players: [{
        id: socket.id,
        name: username,
        ready: false
      }],
      started: false,
      round: 0,
      gameState: 'lobby',
      roles: {},
      nobleGroups: {},
      tasks: {},
      deaths: []
    };

    socket.join(gameCode);
    socket.gameCode = gameCode;

    // Send the game code to the host
    socket.emit('gameCreated', gameCode);
    console.log(`Game created with code: ${gameCode} by ${username} (${socket.id})`);
    io.to(gameCode).emit('updatePlayerList', games[gameCode].players);
  });

  // Handle join game event
  socket.on('joinGame', ({ gameCode, username, character }) => {
    // Check if the game exists
    if (!games[gameCode]) {
      socket.emit('error', 'Ez a szoba nem található');
      return;
    }

    // Check if the game is already started
    if (games[gameCode].started) {
      socket.emit('error', 'A játék már elkezdődött');
      return;
    }

    // Check if the player limit is reached
    if (games[gameCode].players.length >= MAX_PLAYERS) {
      socket.emit('error', 'A szoba tele van');
      return;
    }

    // Add player to the game
    const player = {
      id: socket.id,
      name: username || `Player ${Math.floor(Math.random() * 1000)}`,
      position: { x: Math.random() * 500, y: Math.random() * 300 },
      room: 'lobby',
      character: character || 0,
      isDead: false,
      isGhost: false,
      isMoving: false,
      direction: 'right',
      animationFrame: 0
    };
    games[gameCode].players.push(player);

    // Join the socket room
    socket.join(gameCode);
    socket.gameCode = gameCode;

    // Notify everyone in the room
    socket.emit('gameJoined', gameCode);
    io.to(gameCode).emit('updatePlayerList', games[gameCode].players);
  });

  // Handle ready toggle
  socket.on('toggleReady', () => {
    const gameCode = socket.gameCode;
    const game = games[gameCode];
    
    if (!game) return;
    
    const player = game.players.find(p => p.id === socket.id);
    if (player) {
      player.ready = !player.ready;
      console.log(`Player ${player.name} ready status: ${player.ready}`);
      io.to(gameCode).emit('updatePlayerList', game.players);
    }
  });

  // Handle start game event
  socket.on('startGame', () => {
    const gameCode = socket.gameCode;
    const game = games[gameCode];
    
    if (!game) return;
    
    // Check if the player is the host
    if (socket.id !== game.host) {
      socket.emit('error', 'Csak a szoba tulajdonosa indíthatja el a játékot');
      return;
    }
    
    // Check if all players are ready
    const allReady = game.players.every(player => player.ready);
    if (!allReady) {
      socket.emit('error', 'Nem minden játékos készre jelentkezett');
      return;
    }
    
    // Start the game
    initializeGame(gameCode);
  });

  // Handle player movement
  socket.on('playerMove', (data) => {
    const gameCode = socket.gameCode;
    const game = games[gameCode];
    
    if (!game) return;
    
    const player = game.players.find(p => p.id === socket.id);
    if (player) {
      player.position = data.position;
      player.isMoving = data.isMoving;
      player.direction = data.direction;
      
      // Broadcast to other players
      socket.to(gameCode).emit('playerMoved', {
        id: socket.id,
        position: data.position,
        isMoving: data.isMoving,
        direction: data.direction
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    console.log(`Client disconnected: ${socket.id} (${reason})`);
    
    const gameCode = socket.gameCode;
    if (gameCode && games[gameCode]) {
      const game = games[gameCode];
      
      // Remove player from the game
      game.players = game.players.filter(player => player.id !== socket.id);
      
      // If the host left, assign a new host
      if (game.host === socket.id && game.players.length > 0) {
        game.host = game.players[0].id;
        io.to(gameCode).emit('newHost', game.host);
      }
      
      // Update player list
      io.to(gameCode).emit('updatePlayerList', game.players);
      
      // Broadcast player left
      socket.to(gameCode).emit('playerLeft', socket.id);
      
      // If no players left, delete the game
      if (game.players.length === 0) {
        delete games[gameCode];
        console.log(`Game ${gameCode} deleted - no players left`);
      }
    }
  });
});

// Utility functions
function getCurrentGame(socketId) {
  for (const gameCode in games) {
    const game = games[gameCode];
    if (game.players.some(player => player.id === socketId)) {
      return { gameCode, game };
    }
  }
  return null;
}

function generateGameCode() {
  let code;
  do {
    code = Math.floor(Math.random() * 90000 + 10000).toString();
  } while (games[code]);
  return code;
}

function initializeGame(gameCode) {
  const game = games[gameCode];
  if (!game) return;
  
  game.started = true;
  game.round = 1;
  game.gameState = 'round';
  
  // Assign roles to players
  assignRoles(gameCode);
  
  // Assign tasks to players
  assignTasks(gameCode);
  
  // Notify all players that the game has started
  io.to(gameCode).emit('gameStarted');
  
  // Start the first round
  startRound(gameCode);
}

function assignRoles(gameCode) {
  const game = games[gameCode];
  const players = game.players;
  const numPlayers = players.length;
  
  // Simple role assignment for testing/single player
  if (numPlayers === 1) {
    // Single player gets commoner role for testing
    game.roles[players[0].id] = 'commoner';
    io.to(players[0].id).emit('roleAssigned', {
      role: 'commoner'
    });
    console.log(`Role assigned for single player game ${gameCode}: commoner`);
    return;
  }
  
  // Role distribution based on player count (for 2+ players)
  let numNobles, numPlagueMembers;
  
  if (numPlayers <= 4) {
    numNobles = 1;
    numPlagueMembers = 1;
  } else if (numPlayers <= 6) {
    numNobles = 2;
    numPlagueMembers = 1;
  } else if (numPlayers <= 8) {
    numNobles = 2;
    numPlagueMembers = 2;
  } else if (numPlayers <= 12) {
    numNobles = 3;
    numPlagueMembers = 2;
  } else if (numPlayers <= 16) {
    numNobles = 4;
    numPlagueMembers = 3;
  } else {
    numNobles = Math.floor(numPlayers * 0.25);
    numPlagueMembers = Math.floor(numPlayers * 0.2);
  }
  
  // Always have one prince (for multiplayer)
  const numPrinces = 1;
  const numCommoners = Math.max(0, numPlayers - numNobles - numPlagueMembers - numPrinces);
  
  // Create role array
  const roles = [
    ...Array(numPrinces).fill('prince'),
    ...Array(numNobles).fill('noble'),
    ...Array(numPlagueMembers).fill('plague'),
    ...Array(numCommoners).fill('commoner')
  ];
  
  // Shuffle roles
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }
  
  // Assign roles to players
  players.forEach((player, index) => {
    game.roles[player.id] = roles[index];
    
    // Send role to player
    io.to(player.id).emit('roleAssigned', {
      role: roles[index]
    });
  });
  
  console.log(`Roles assigned for game ${gameCode}:`, game.roles);
}

function assignTasks(gameCode) {
  const game = games[gameCode];
  const players = game.players;
  
  // Define available tasks
  const availableTasks = [
    { id: 1, room: 'library', description: 'Rendezd át a könyveket', duration: 5 },
    { id: 2, room: 'kitchen', description: 'Főzz egy ételt', duration: 7 },
    { id: 3, room: 'garden', description: 'Öntözd meg a virágokat', duration: 4 },
    { id: 4, room: 'ballroom', description: 'Táncolj egy dalt', duration: 6 },
    { id: 5, room: 'study', description: 'Írj egy levelet', duration: 5 }
  ];
  
  // Assign random tasks to each player
  players.forEach(player => {
    const playerTasks = [];
    const numTasks = Math.floor(Math.random() * 3) + 2; // 2-4 tasks per player
    
    for (let i = 0; i < numTasks; i++) {
      const randomTask = availableTasks[Math.floor(Math.random() * availableTasks.length)];
      playerTasks.push({
        ...randomTask,
        id: `${player.id}_task_${i}`,
        completed: false
      });
    }
    
    game.tasks[player.id] = playerTasks;
    
    // Send tasks to player
    io.to(player.id).emit('tasksAssigned', {
      tasks: playerTasks
    });
  });
  
  console.log(`Tasks assigned for game ${gameCode}`);
}

function startRound(gameCode) {
  const game = games[gameCode];
  if (!game) return;
  
  console.log(`Starting round ${game.round} for game ${gameCode}`);
  
  // Notify players about the round start
  io.to(gameCode).emit('roundStarted', {
    round: game.round,
    duration: ROUND_TIME
  });
  
  // Set timer for round end
  setTimeout(() => {
    endRound(gameCode);
  }, ROUND_TIME * 1000);
}

function endRound(gameCode) {
  const game = games[gameCode];
  if (!game) return;
  
  console.log(`Ending round ${game.round} for game ${gameCode}`);
  
  // Check for task completion
  checkTaskCompletion(gameCode);
  
  // Start discussion phase
  startDiscussion(gameCode);
}

function checkTaskCompletion(gameCode) {
  const game = games[gameCode];
  if (!game) return;
  
  // Check if all tasks are completed
  let allTasksCompleted = true;
  
  for (const playerId in game.tasks) {
    const playerTasks = game.tasks[playerId];
    if (playerTasks.some(task => !task.completed)) {
      allTasksCompleted = false;
      break;
    }
  }
  
  if (allTasksCompleted) {
    // Good team wins
    endGame(gameCode, 'good');
  }
}

function startDiscussion(gameCode) {
  const game = games[gameCode];
  if (!game) return;
  
  const currentHour = GAME_HOURS[game.round - 1] || 24;
  const discussionDuration = DISCUSSION_TIME_BASE * currentHour;
  
  console.log(`Starting discussion for round ${game.round}, hour ${currentHour}`);
  
  // Determine discussion type based on round
  let discussionType = 'noble'; // Default to noble discussion
  if (game.round >= 4) {
    discussionType = 'prince'; // Prince discussions in rounds 4-5
  }
  
  // Notify players about discussion start
  io.to(gameCode).emit('discussionStarted', {
    type: discussionType,
    hour: currentHour,
    duration: discussionDuration
  });
  
  // Set timer for discussion end
  setTimeout(() => {
    // Move to next round or end game
    game.round++;
    if (game.round > GAME_HOURS.length) {
      // Game ends, plague wins if they survived
      endGame(gameCode, 'plague');
    } else {
      startRound(gameCode);
    }
  }, discussionDuration * 1000);
}

function killPlayer(gameCode, playerId, cause) {
  const game = games[gameCode];
  if (!game) return;
  
  const player = game.players.find(p => p.id === playerId);
  if (!player) return;
  
  player.isDead = true;
  player.isGhost = true;
  
  // Record the death
  game.deaths.push({
    playerId,
    cause,
    round: game.round,
    time: new Date()
  });
  
  // Notify all players
  io.to(gameCode).emit('playerDied', {
    id: playerId,
    cause
  });
  
  // Notify the dead player
  io.to(playerId).emit('died', {
    cause
  });
  
  console.log(`Player ${player.name} died in game ${gameCode} (cause: ${cause})`);
}

function endGame(gameCode, winner) {
  const game = games[gameCode];
  if (!game) return;
  
  let message = '';
  switch (winner) {
    case 'good':
      message = 'A jók győztek! Minden feladatot teljesítettek.';
      break;
    case 'plague':
      message = 'A Pestis győzött! Túlélték az éjszakát.';
      break;
    case 'prince':
      message = 'A Herceg győzött! Megtalálta és kiiktatta a Pestist.';
      break;
  }
  
  console.log(`Game ${gameCode} ended. Winner: ${winner}`);
  
  // Notify all players
  io.to(gameCode).emit('gameEnded', {
    winner,
    message
  });
  
  // Clean up game
  setTimeout(() => {
    delete games[gameCode];
  }, 30000); // Delete game after 30 seconds
}

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the game at: http://localhost:${PORT}`);
}); 