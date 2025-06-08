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
  connectTimeout: 10000,      // Csökkentett timeout
  pingTimeout: 10000,         // Gyorsabb ping timeout
  pingInterval: 2000,         // Gyakoribb ping check
  upgradeTimeout: 10000,      // Gyorsabb upgrade
  transports: ['websocket', 'polling'],
  allowUpgrades: true,
  perMessageDeflate: false,   // Kikapcsolt tömörítés a sebesség érdekében
  maxHttpBufferSize: 1e5,     // Kisebb buffer méret
  compression: false,         // Kikapcsolt kompresszió
  httpCompression: false,     // Kikapcsolt HTTP kompresszió
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

// Serve static files from the root directory (where files are currently located)
app.use(express.static(path.join(__dirname, '../')));

// Root route serves the index.html from root directory
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

// Handle socket connections
io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id} at ${new Date().toISOString()}`);

  socket.emit('connection_ack', { 
    status: 'connected',
    id: socket.id,
    serverTime: new Date().toISOString()
  });

  // Use Socket.IO's dynamic ping measurement
  const latency = socket.conn.ping || 50; // socket.io's internal ping measurement  
  socket.latency = latency;
  console.log(`Client ${socket.id} using measured ping latency: ${latency}ms`);
  
  // Handle ping for connection testing with proper latency measurement
  socket.on('ping', (data, callback) => {
    if (typeof callback === 'function') {
      const serverReceiveTime = Date.now();
      // Send acknowledgment back immediately
      callback({
        clientSentTime: data ? data.timestamp : null,
        serverReceiveTime: serverReceiveTime
      });
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

    // Send existing players to the new player
    games[gameCode].players.forEach(existingPlayer => {
      if (existingPlayer.id !== socket.id) {
        socket.emit('playerJoined', {
          id: existingPlayer.id,
          name: existingPlayer.name,
          position: existingPlayer.position,
          role: games[gameCode].roles ? games[gameCode].roles[existingPlayer.id] : 'commoner',
          isDead: existingPlayer.isDead || false,
          isGhost: existingPlayer.isGhost || false,
          isMoving: existingPlayer.isMoving,
          direction: existingPlayer.direction,
          animationFrame: existingPlayer.animationFrame
        });
      }
    });
    
    // Broadcast new player to all other players
    io.to(gameCode).emit('playerJoined', {
      id: socket.id,
      name: player.name,
      position: player.position,
      role: games[gameCode].roles ? games[gameCode].roles[socket.id] : 'commoner',
      isDead: player.isDead,
      isGhost: player.isGhost,
      isMoving: player.isMoving,
      direction: player.direction,
      animationFrame: player.animationFrame,
      ready: player.ready
    });
  });

  // Handle player ready status
  socket.on('toggleReady', () => {
    const gameCode = socket.gameCode;
    if (!gameCode || !games[gameCode]) {
      console.log('toggleReady: No game found for socket', socket.id);
      return;
    }

    const player = games[gameCode].players.find(p => p.id === socket.id);
    if (player) {
      player.ready = !player.ready;
      console.log(`Player ${player.name} (${socket.id}) toggled ready to: ${player.ready}`);
      console.log('Current players in game:', games[gameCode].players.map(p => ({
        id: p.id, 
        name: p.name, 
        ready: p.ready
      })));
      
      // Emit to ALL players in the game room
      io.to(gameCode).emit('updatePlayerList', games[gameCode].players);
      console.log(`Emitted updatePlayerList to room ${gameCode} with ${games[gameCode].players.length} players`);
    } else {
      console.log('toggleReady: Player not found in game', socket.id);
    }
  });

  // Handle start game event
  socket.on('startGame', () => {
    const gameCode = socket.gameCode;
    if (!gameCode || !games[gameCode]) return;

    // Debug log: játékosok listája és ready állapot
    console.log('START GAME DEBUG:', games[gameCode].players.map(p => ({id: p.id, name: p.name, ready: p.ready})));

    // Check if the requester is the host
    if (socket.id !== games[gameCode].host) {
      socket.emit('error', 'Csak a házigazda indíthatja el a játékot');
      return;
    }

    // Check if all players are ready
    const allReady = games[gameCode].players.every(player => player.ready);
    if (!allReady) {
      socket.emit('error', 'Nem minden játékos áll készen');
      return;
    }

    // Check if there are enough players
    const playerCount = games[gameCode].players.length;
    if (playerCount < MIN_PLAYERS) {
      socket.emit('error', `Legalább ${MIN_PLAYERS} játékos szükséges a játékhoz`);
      return;
    }

    // Mark game as started
    games[gameCode].started = true;

    // Initialize game state
    initializeGame(gameCode);
    
    // Notify ALL players that the game has started
    console.log(`Starting game ${gameCode} for ${playerCount} players`);
    io.to(gameCode).emit('gameStarted', {
      gameCode: gameCode,
      players: games[gameCode].players,
      roles: games[gameCode].roles
    });
  });

  // Handle player movement
  socket.on('updatePosition', (position) => {
    const gameCode = socket.gameCode;
    if (!gameCode || !games[gameCode]) return;
    
    // Get the player
    const player = games[gameCode].players.find(p => p.id === socket.id);
    if (!player) return;
    
    // Update player position
    player.position = position.position;
    player.isMoving = position.isMoving || false;
    player.direction = position.direction || 'right';
    player.animationFrame = position.animationFrame || 0;
    
    // Broadcast position to other players in the same game
    socket.to(gameCode).emit('playerMoved', {
      id: socket.id,
      name: player.name,
      position: player.position,
      role: games[gameCode].roles ? games[gameCode].roles[socket.id] : 'commoner',
      isDead: player.isDead || false,
      isGhost: player.isGhost || false,
      isMoving: player.isMoving,
      direction: player.direction,
      animationFrame: player.animationFrame
    });
  });

  // Task completion
  socket.on('completeTask', (taskId) => {
    const gameCode = socket.gameCode;
    if (!gameCode || !games[gameCode] || !games[gameCode].started) return;
    
    // Check if player has this task
    const playerTasks = games[gameCode].tasks[socket.id];
    if (!playerTasks || !playerTasks.includes(taskId)) return;

    // Complete the task
    games[gameCode].tasks[socket.id] = playerTasks.filter(t => t !== taskId);
    
    // Notify the player
    socket.emit('taskCompleted', taskId);
    
    // Check if all tasks are completed
    if (games[gameCode].tasks[socket.id].length === 0) {
      socket.emit('allTasksCompleted');
    }
  });

  // Plague infection
  socket.on('infect', (targetId) => {
    const gameCode = socket.gameCode;
    if (!gameCode || !games[gameCode] || !games[gameCode].started) return;
    
    // Check if player is the plague
    if (games[gameCode].roles[socket.id] !== 'plague') {
      return;
    }
    
    // Schedule death after 5 seconds
    setTimeout(() => {
      killPlayer(gameCode, targetId, 'plague');
      io.to(gameCode).emit('playerDied', {
        id: targetId,
        cause: 'plague'
      });
    }, 5000);
  });

  // Prince stab
  socket.on('stab', (targetId) => {
    const gameCode = socket.gameCode;
    if (!gameCode || !games[gameCode] || !games[gameCode].started) return;
    
    // Check if player is the prince
    if (games[gameCode].roles[socket.id] !== 'prince') {
      return;
    }
    
    // Kill the target
    killPlayer(gameCode, targetId, 'prince');
    io.to(gameCode).emit('playerDied', {
      id: targetId,
      cause: 'prince'
    });
    
    // Check if the target was the plague
    if (games[gameCode].roles[targetId] === 'plague') {
      endGame(gameCode, 'nobility');
    }
  });

  // Clean up body
  socket.on('cleanBody', (bodyId) => {
    const gameCode = socket.gameCode;
    if (!gameCode || !games[gameCode] || !games[gameCode].started) return;
    
    // Remove the body
    io.to(gameCode).emit('bodyRemoved', bodyId);
  });

  // Add a heartbeat mechanism to detect disconnections more quickly
  const heartbeatInterval = setInterval(() => {
    socket.emit('heartbeat', { serverTime: new Date().toISOString() });
  }, 15000); // 10000 -> 15000 (ritkább heartbeat nagy késleltetés esetén)
  
  socket.on('heartbeat_response', (data) => {
    // Client is still connected and responsive
    socket.lastHeartbeat = new Date();
    
    // Disabled flawed timestamp-based calculation
    // const roundTripTime = Date.now() - data.clientTime;
    // Use Socket.IO's dynamic ping measurement
    const latency = socket.conn.ping || 50; // socket.io's internal ping measurement
    socket.latency = latency;
    console.log(`Client ${socket.id} using measured ping latency: ${latency}ms`);
  });
  
  // Disconnect handler
  socket.on('disconnect', (reason) => {
    console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
    clearInterval(heartbeatInterval);
    
    // Handle player leaving a game
    const gameCode = socket.gameCode;
    if (gameCode && games[gameCode]) {
      // Log detailed information about the disconnection
      console.log(`Player left game ${gameCode}, connected for: ${
        (new Date() - socket.connectionTime) / 1000
      } seconds`);
      
      games[gameCode].players = games[gameCode].players.filter(p => p.id !== socket.id);
      
      // If the host left, assign a new host or delete the game
      if (socket.id === games[gameCode].host) {
        if (games[gameCode].players.length > 0) {
          games[gameCode].host = games[gameCode].players[0].id;
          console.log(`New host assigned in game ${gameCode}: ${games[gameCode].host}`);
          io.to(gameCode).emit('newHost', games[gameCode].host);
        } else {
          console.log(`Game ${gameCode} deleted due to no players remaining`);
          delete games[gameCode];
          return;
        }
      }
      
      // Update player list
      io.to(gameCode).emit('updatePlayerList', games[gameCode].players);
      
      // If the game is in progress, handle player death
      if (games[gameCode].started) {
        killPlayer(gameCode, socket.id, 'disconnected');
      }
    }
  });
});

// Helper functions
function getCurrentGame(socketId) {
  // Find which game this socket belongs to
  for (const gameCode in games) {
    const game = games[gameCode];
    if (game.players.find(p => p.id === socketId)) {
      return game;
    }
  }
  return null;
}

function generateGameCode() {
  const digits = '0123456789';
  let gameCode;
  
  do {
    gameCode = '';
    for (let i = 0; i < 5; i++) {
      gameCode += digits.charAt(Math.floor(Math.random() * digits.length));
    }
  } while (games[gameCode]); // Ensure the code is unique
  
  return gameCode;
}

function initializeGame(gameCode) {
  const game = games[gameCode];
  game.started = true;
  game.round = 0;
  game.gameState = 'round';
  game.currentHour = GAME_HOURS[0];
  
  // Assign roles
  assignRoles(gameCode);
  
  // Assign tasks
  assignTasks(gameCode);
}

function assignRoles(gameCode) {
  const game = games[gameCode];
  const playerCount = game.players.length;
  const roles = {};
  
  // Determine number of nobles based on player count (modified for testing)
  let nobleCount;
  if (playerCount >= 26) {
    nobleCount = 5;
  } else if (playerCount >= 21) {
    nobleCount = 4;
  } else if (playerCount >= 16) {
    nobleCount = 3;
  } else if (playerCount >= 4) {
    nobleCount = 2;
  } else if (playerCount >= 2) {
    nobleCount = 1;
  } else {
    // For single player testing, make them the prince
    nobleCount = 0;
  }
  
  // Create shuffled array of player IDs
  const playerIds = game.players.map(p => p.id);
  for (let i = playerIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [playerIds[i], playerIds[j]] = [playerIds[j], playerIds[i]];
  }
  
  // Assign prince if we have enough players
  let prince = null;
  if (playerCount > 0) {
    prince = playerIds.pop();
    roles[prince] = 'prince';
  }
  
  // Assign nobles if we have enough players
  const nobles = [];
  for (let i = 0; i < nobleCount && playerIds.length > 0; i++) {
    const noble = playerIds.pop();
    roles[noble] = 'noble';
    nobles.push(noble);
  }
  
  // Assign plague if we have enough players
  if (playerIds.length > 0 || nobles.length > 0) {
    const plagueIsNoble = Math.random() < 0.5 && nobles.length > 0;
    let plague;
    if (plagueIsNoble) {
      plague = nobles[Math.floor(Math.random() * nobles.length)];
    } else if (playerIds.length > 0) {
      plague = playerIds[Math.floor(Math.random() * playerIds.length)];
    } else if (prince) {
      // If we only have prince and nobles, make a noble the plague
      plague = nobles[Math.floor(Math.random() * nobles.length)];
    }
    if (plague) {
      roles[plague] = 'plague';
    }
  }
  
  // Assign commoners
  playerIds.forEach(id => {
    if (!roles[id]) {
      roles[id] = 'commoner';
    }
  });
  
  game.roles = roles;
  
  // Create noble groups (distribute commoners among nobles)
  const nobleGroups = {};
  let commoners = game.players
    .map(p => p.id)
    .filter(id => roles[id] === 'commoner');
  
  // Shuffle commoners
  for (let i = commoners.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [commoners[i], commoners[j]] = [commoners[j], commoners[i]];
  }
  
  // Skip noble group creation if no nobles
  if (nobles.length > 0) {
    // Distribute commoners evenly among nobles
    nobles.forEach((noble, index) => {
      const group = {
        noble,
        commoners: [],
        color: getNobleGroupColor(index)
      };
      
      // Calculate number of commoners for this noble
      const commonersPerNoble = Math.floor(commoners.length / nobles.length);
      const extraCommoners = index < (commoners.length % nobles.length) ? 1 : 0;
      const groupSize = commonersPerNoble + extraCommoners;
      
      // Add commoners to the group
      for (let i = 0; i < groupSize && commoners.length > 0; i++) {
        group.commoners.push(commoners.pop());
      }
      
      nobleGroups[noble] = group;
    });
  }
  
  game.nobleGroups = nobleGroups;
  
  // Inform players of their roles
  game.players.forEach(player => {
    const role = roles[player.id];
    const socketId = player.id;
    
    let roleInfo = { role };
    
    // Add additional information for nobles
    if (role === 'noble') {
      roleInfo.group = nobleGroups[player.id];
    }
    
    // Add group information for commoners
    if (role === 'commoner') {
      const nobleGroup = Object.values(nobleGroups).find(
        group => group.commoners.includes(player.id)
      );
      if (nobleGroup) {
        roleInfo.nobleId = nobleGroup.noble;
        roleInfo.color = nobleGroup.color;
      }
    }
    
    io.to(socketId).emit('roleAssigned', roleInfo);
  });
}

function getNobleGroupColor(index) {
  const colors = ['red', 'blue', 'green', 'yellow', 'white'];
  return colors[index % colors.length];
}

function assignTasks(gameCode) {
  const game = games[gameCode];
  game.tasks = {};
  
  // Define task types
  const taskTypes = [
    { id: 'dance', room: 'blue', duration: 8 },
    { id: 'eat', room: 'red', duration: 7 },
    { id: 'cards', room: 'green', duration: 6 },
    { id: 'toilet', room: 'orange', duration: 6 },
    { id: 'smoke', room: 'white', duration: 5 },
    { id: 'drink', room: 'purple', duration: 5 }
  ];
  
  // Assign 3 random tasks to each player
  game.players.forEach(player => {
    // Skip assigning tasks if this player is no longer in the game
    if (!game.roles[player.id]) {
      game.tasks[player.id] = [];
      return;
    }
    
    // The prince and plague don't need to complete tasks
    if (game.roles[player.id] === 'prince' || game.roles[player.id] === 'plague') {
      game.tasks[player.id] = [];
      
      // For testing purposes: If we have only one player, make them automatically complete all tasks
      if (game.players.length === 1) {
        io.to(player.id).emit('tasksAssigned', { tasks: [] });
        return;
      }
      
      io.to(player.id).emit('tasksAssigned', { tasks: [] });
      return;
    }
    
    // Shuffle task types
    const shuffledTasks = [...taskTypes];
    for (let i = shuffledTasks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledTasks[i], shuffledTasks[j]] = [shuffledTasks[j], shuffledTasks[i]];
    }
    
    // For testing with 2-3 players: assign only 1 task
    const taskCount = game.players.length <= 3 ? 1 : 3;
    
    // Assign tasks to the player
    game.tasks[player.id] = shuffledTasks.slice(0, taskCount).map(task => task.id);
    
    // Send task information to the player
    io.to(player.id).emit('tasksAssigned', {
      tasks: shuffledTasks.slice(0, taskCount)
    });
  });
}

function startRound(gameCode) {
  const game = games[gameCode];
  
  // Increment round and update game hour
  game.round++;
  game.currentHour = GAME_HOURS[game.round - 1];
  
  // Set the game state to 'round'
  game.gameState = 'round';
  
  // Initialize round variables
  game.roundPlagueCooldown = false;
  game.princeCooldown = false;
  
  // Assign new tasks for the round
  assignTasks(gameCode);
  
  // Notify all players that the round has started
  io.to(gameCode).emit('roundStarted', {
    round: game.round,
    hour: game.currentHour,
    duration: ROUND_TIME
  });
  
  // After ROUND_TIME seconds, end the round
  setTimeout(() => {
    endRound(gameCode);
  }, ROUND_TIME * 1000);
  
  // Disable plague infection and prince actions in the last 20 seconds of the round
  setTimeout(() => {
    game.roundPlagueCooldown = true;
    game.princeCooldown = true;
    io.to(gameCode).emit('actionsCooldown');
  }, (ROUND_TIME - 20) * 1000);
}

function endRound(gameCode) {
  const game = games[gameCode];
  
  // Check if the game is already over
  if (!game || !game.started) return;
  
  // Check for midnight (end of game)
  if (game.round >= GAME_HOURS.length) {
    endGame(gameCode, 'nobility'); // The nobility wins if they reach midnight
    return;
  }
  
  // Check for task completion
  checkTaskCompletion(gameCode);
  
  // Start discussion phase
  startDiscussion(gameCode);
}

function checkTaskCompletion(gameCode) {
  const game = games[gameCode];
  
  // Check each player's task completion
  game.players.forEach(player => {
    const role = game.roles[player.id];
    
    // Skip prince and plague
    if (role === 'prince' || role === 'plague') return;
    
    // Check if player has completed all tasks
    if (game.tasks[player.id] && game.tasks[player.id].length > 0) {
      // Player has not completed tasks, kill them
      killPlayer(gameCode, player.id, 'tasks');
      io.to(player.id).emit('died', {
        cause: 'tasks',
        message: 'Unod a bált?! Menj és halj meg kint a Pestistben. (Elhagytad a kastélyt)'
      });
      io.to(gameCode).emit('playerDied', {
        id: player.id,
        cause: 'tasks'
      });
    }
  });
}

function startDiscussion(gameCode) {
  const game = games[gameCode];
  
  // Set game state to 'discussion'
  game.gameState = 'discussion';
  
  // Calculate discussion time (4 seconds per hour)
  const discussionTime = game.currentHour * DISCUSSION_TIME_BASE;
  
  // Determine discussion type based on the round
  const discussionType = game.round <= 3 ? 'noble' : 'prince';
  
  // Notify all players that discussion has started
  io.to(gameCode).emit('discussionStarted', {
    type: discussionType,
    duration: discussionTime,
    hour: game.currentHour
  });
  
  // After discussion time, return to the next round
  setTimeout(() => {
    startRound(gameCode);
  }, discussionTime * 1000);
}

function killPlayer(gameCode, playerId, cause) {
  const game = games[gameCode];
  
  // Record the death
  game.deaths.push({
    id: playerId,
    cause,
    time: Date.now()
  });
  
  // If the player was a noble, promote a commoner
  if (game.roles[playerId] === 'noble') {
    promoteCommoner(gameCode, playerId);
  }
  
  // Check if the game should end
  checkGameEnd(gameCode);
}

function promoteCommoner(gameCode, nobleId) {
  const game = games[gameCode];
  
  // Get the noble's group
  const group = game.nobleGroups[nobleId];
  if (!group || group.commoners.length === 0) return;
  
  // Randomly select a commoner to promote
  const randomIndex = Math.floor(Math.random() * group.commoners.length);
  const promotedCommoner = group.commoners[randomIndex];
  
  // Update the commoner's role
  game.roles[promotedCommoner] = 'noble';
  
  // Update the noble group
  group.noble = promotedCommoner;
  group.commoners = group.commoners.filter(c => c !== promotedCommoner);
  
  // Notify all players of the promotion
  io.to(gameCode).emit('commonerPromoted', {
    oldNoble: nobleId,
    newNoble: promotedCommoner,
    group: group.color
  });
}

function checkGameEnd(gameCode) {
  const game = games[gameCode];
  
  // Count living players by role
  const livingPlayers = game.players
    .map(p => p.id)
    .filter(id => !game.deaths.some(death => death.id === id));
  
  const livingByRole = livingPlayers.reduce((acc, id) => {
    const role = game.roles[id];
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});
  
  // For single player testing: if the player is dead, plague wins
  if (livingPlayers.length === 0) {
    endGame(gameCode, 'plague');
    return true;
  }
  
  // Check for plague victory condition: only prince and one other player remaining
  if (livingPlayers.length <= 2 && livingByRole.prince === 1) {
    endGame(gameCode, 'plague');
    return true;
  }
  
  return false;
}

function endGame(gameCode, winner) {
  const game = games[gameCode];
  
  // Set the game state to 'end'
  game.gameState = 'end';
  game.winner = winner;
  
  // Determine the end message
  const message = winner === 'nobility'
    ? 'A nép legyőzte a Pestist!'
    : 'A Pestis győzött a halandók felett.';
  
  // Reveal all roles
  const roles = {};
  game.players.forEach(player => {
    roles[player.id] = game.roles[player.id];
  });
  
  // Notify all players that the game has ended
  io.to(gameCode).emit('gameEnded', {
    winner,
    message,
    roles
  });
  
  // Reset the game state to lobby
  game.started = false;
  game.round = 0;
  game.gameState = 'lobby';
  game.roles = {};
  game.nobleGroups = {};
  game.tasks = {};
  game.deaths = [];
  
  // Reset all players to not ready
  game.players.forEach(p => p.ready = false);
  io.to(gameCode).emit('updatePlayerList', game.players);
}

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT} and accepting connections from all network interfaces`);
  console.log(`Local access: http://localhost:${PORT}`);
  console.log(`Network access: http://[YOUR_LOCAL_IP]:${PORT}`);
}); 