// Game Manager
import UI from './ui.js';
import Map from './map.js';
import Player from './player.js';
import Animation from './animation.js';
import PeerConnector from './peer_connector.js';
import NPC from './npc.js';
import Audio from './audio.js';
import GameMap from './map.js';

const Game = {
  // Peer.js connection
  peer: null,
  
  // Game state
  gameCode: null,
  isHost: false,
  playerRole: null,
  playerState: 'alive', // 'alive' or 'ghost'
  currentRound: 0,
  currentRoom: null,
  tasks: [],
  roomsWithTasks: new Set(),
  
  // Player data
  playerId: null,
  username: null,
  character: null,
  position: { x: 0, y: 0 },
  nobleGroup: null,
  groupColor: null, // nemesi csoport színe
  
  // Game timers
  roundTimer: null,
  discussionTimer: null,
  roundTimerValue: 90,
  discussionTimerValue: 0,
  
  // Other players
  players: {},
  bodies: {},
  
  // Game flags
  plagueCooldown: false,
  princeCooldown: false,
  inTask: false,
  
  // Initialize the game
  async init() {
    console.log("Game.init started");
    
    // Initialize canvas first
    this.canvas = document.getElementById('game-canvas');
    if (!this.canvas) {
      console.error('Game canvas not found!');
      return;
    }
    
    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      console.error('Could not get canvas context!');
      return;
    }
    
    // Initialize audio system
    Audio.init();
    console.log('Audio system initialized and made globally accessible');
    
    // Initialize game state
    this.state = {
      currentRoom: 'lobby',
      players: {},
      gameStarted: false,
      roundNumber: 0,
      isDiscussion: false,
      isVoting: false,
      isGameOver: false,
      winner: null,
      hostId: null,
      roomId: null,
      playerRole: 'commoner',
      tasks: [],
      completedTasks: [],
      isDead: false,
      isGhost: false,
      position: { x: 0, y: 0 },
      isMoving: false,
      direction: 'right',
      animationFrame: 0,
      lastUpdate: Date.now(),
      debugMode: true,
      isConnected: false
    };
    
    // Initialize UI
    this.initUIHandlers();
    
    // Show connecting screen
    UI.showScreen('connecting-screen');
    
    // Initialize peer connection
    console.log('Connecting to peers...');
    this.peer = PeerConnector.init();
    
    // Initialize peer event listeners
    this.setupPeerListeners();
    
    // Start game loop
    this.lastFrameTime = performance.now();
    this.gameLoop();
    
    console.log('Game initialized with default settings:', {
      position: this.state.position,
      playerRole: this.state.playerRole,
      debugMode: this.state.debugMode
    });
  },
  
  // Setup UI event handlers
  initUIHandlers() {
    // Host game button
    const hostButton = document.getElementById('host-game-button');
    if (hostButton) {
      hostButton.addEventListener('click', () => {
        const username = document.getElementById('username-input')?.value?.trim() || 'Player';
        this.hostGame(username);
      });
    }
    
    // Join game button
    const joinButton = document.getElementById('join-game-button');
    if (joinButton) {
      joinButton.addEventListener('click', () => {
        const username = document.getElementById('username-input')?.value?.trim() || 'Player';
        const roomId = document.getElementById('room-code-input')?.value?.trim();
        if (roomId) {
          this.joinGame(roomId, username);
        } else {
          UI.showError('Please enter a room code');
        }
      });
    }
    
    // Start game button
    const startButton = document.getElementById('start-game-button');
    if (startButton) {
      startButton.addEventListener('click', () => {
        if (this.state.hostId === this.peer?.id) {
          this.startGame();
        } else {
          UI.showError('Only the host can start the game');
        }
      });
    }
    
    // Ready button
    const readyButton = document.getElementById('ready-button');
    if (readyButton) {
      readyButton.addEventListener('click', () => {
        this.toggleReady();
      });
    }
    
    // Volume controls
    const musicVolumeSlider = document.getElementById('music-volume-slider');
    const sfxVolumeSlider = document.getElementById('sfx-volume-slider');
    
    if (musicVolumeSlider) {
      musicVolumeSlider.addEventListener('input', (e) => {
        const volume = parseInt(e.target.value) / 100;
        if (window.Audio) {
          window.Audio.setMusicVolume(volume);
        }
      });
    }
    
    if (sfxVolumeSlider) {
      sfxVolumeSlider.addEventListener('input', (e) => {
        const volume = parseInt(e.target.value) / 100;
        if (window.Audio) {
          window.Audio.setSFXVolume(volume);
        }
      });
    }
    
    // Fullscreen toggle
    const fullscreenButton = document.getElementById('fullscreen-toggle-btn');
    if (fullscreenButton) {
      fullscreenButton.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      });
    }
    
    // Pause menu
    document.addEventListener('keydown', (e) => {
      if (e.key === 'p' || e.key === 'P') {
        this.togglePause();
      }
    });
  },
  
  // Toggle pause menu
  togglePause() {
    if (window.isPaused) {
      window.hidePauseMenu();
    } else {
      window.showPauseMenu();
    }
  },
  
  // Setup peer event listeners
  setupPeerListeners() {
    if (!this.peer) return;
    
    // Connection events
    PeerConnector.on('connect', () => {
      console.log('Connected to peers');
      this.state.isConnected = true;
      UI.showScreen('menu-screen');
    });

    PeerConnector.on('disconnect', () => {
      console.log('Disconnected from peers');
      this.state.isConnected = false;
      UI.showScreen('connecting-screen');
    });

    PeerConnector.on('error', (error) => {
      console.error('Peer connection error:', error);
      UI.showError('Kapcsolódási hiba történt. Kérlek, próbáld újra.');
    });
    
    // Game events
    PeerConnector.on('gameCreated', (gameCode) => {
      if (typeof gameCode === 'object' && gameCode.roomId) {
        this.handleGameCreated(gameCode.roomId);
      } else {
        this.handleGameCreated(gameCode);
      }
    });

    PeerConnector.on('gameJoined', (gameCode) => {
      if (typeof gameCode === 'object' && gameCode.roomId) {
        this.handleGameJoined(gameCode.roomId);
      } else {
        this.handleGameJoined(gameCode);
      }
    });

    PeerConnector.on('updatePlayerList', (players) => {
      this.handleUpdatePlayerList(players);
    });

    PeerConnector.on('newHost', (hostId) => {
      this.handleNewHost(hostId);
    });

    PeerConnector.on('gameStarted', () => {
      this.handleGameStarted();
    });
    
    // Player events
    PeerConnector.on('playerJoined', (data) => {
      console.log('Player joined:', data);
      this.state.players[data.player.id] = {
        id: data.player.id,
        name: data.player.name,
        x: data.player.position?.x || Math.random() * 500,
        y: data.player.position?.y || Math.random() * 300,
        role: data.player.role || 'commoner',
        isDead: data.player.isDead || false,
        isGhost: data.player.isGhost || false,
        isMoving: false,
        direction: 'right',
        animationFrame: 0
      };
    });
    
    // Player left
    PeerConnector.on('playerLeft', (data) => {
      console.log('Player left:', data);
      delete this.state.players[data.peerId];
    });
    
    // Player moved
    PeerConnector.on('playerMoved', (data) => {
      if (this.state.players[data.id]) {
        this.state.players[data.id].x = data.position.x;
        this.state.players[data.id].y = data.position.y;
        this.state.players[data.id].isMoving = data.isMoving || false;
        this.state.players[data.id].direction = data.direction || 'right';
        this.state.players[data.id].animationFrame = data.animationFrame || 0;
      }
    });
    
    PeerConnector.on('roleAssigned', (data) => {
      console.log('Role assigned:', data);
      this.handleRoleAssigned(data.playerId, data.role);
    });
    
    PeerConnector.on('tasksAssigned', (data) => {
      console.log('Tasks assigned:', data);
      this.handleTasksAssigned(data.playerId, data.tasks);
    });
    
    PeerConnector.on('roundStarted', (data) => {
      console.log('Round started:', data);
      this.handleRoundStarted(data.roundNumber);
    });
    
    PeerConnector.on('roundEnded', () => {
      console.log('Round ended');
      this.handleRoundEnded();
    });
    
    PeerConnector.on('discussionStarted', () => {
      console.log('Discussion started');
      this.handleDiscussionStarted();
    });
    
    PeerConnector.on('gameOver', (data) => {
      console.log('Game over:', data);
      this.handleGameEnded(data.winner);
    });
    
    PeerConnector.on('actionsCooldown', (data) => {
      console.log('Actions cooldown:', data);
      this.handleActionsCooldown(data.cooldown);
    });
    
    // Player events
    PeerConnector.on('playerDied', (data) => {
      console.log('Player died:', data);
      this.handlePlayerDied(data.playerId, data.cause);
    });
    
    PeerConnector.on('died', (data) => {
      console.log('Player died (self):', data);
      this.handleDied(data.cause);
    });
    
    PeerConnector.on('taskCompleted', (data) => {
      console.log('Task completed:', data);
      this.handleTaskCompleted(data.taskId);
    });
    
    PeerConnector.on('allTasksCompleted', () => {
      console.log('All tasks completed');
      this.handleAllTasksCompleted();
    });
    
    PeerConnector.on('bodyRemoved', (data) => {
      console.log('Body removed:', data);
      this.handleBodyRemoved(data.bodyId);
    });
    
    PeerConnector.on('commonerPromoted', (data) => {
      console.log('Commoner promoted:', data);
      this.handleCommonerPromoted(data.nobleId);
    });
  },
  
  // Handle host game
  hostGame(username) {
    if (!this.peer) {
      console.error('No peer connection available');
      return;
    }

    const roomId = `${this.peer.id}_${Date.now()}`;
    console.log('Hosting game with room ID:', roomId);

    // Do NOT call PeerConnector.joinRoom(roomId) here for the host!
    PeerConnector.emit('gameCreated', { roomId, host: this.peer.id });
    this.handleGameCreated(roomId);
  },
  
  // Handle join game
  joinGame(roomId, username) {
    if (!this.peer) {
      console.error('No peer connection available');
      return;
    }

    console.log('Joining game with room ID:', roomId);

    PeerConnector.joinRoom(roomId); // Only join as a non-host
    PeerConnector.emit('gameJoined', {
      roomId,
      player: {
        id: this.peer.id,
        name: username,
        position: { x: Math.random() * 500, y: Math.random() * 300 }
      }
    });
  },
  
  // Handle player movement
  movePlayer(position, isMoving, direction, animationFrame) {
    if (!this.peer) return;
    
    PeerConnector.emit('playerMoved', {
      id: this.peer.id,
      position,
      isMoving,
      direction,
      animationFrame
    });
  },
  
  // Handle ready toggle
  toggleReady() {
    if (!this.peer) return;
    
    PeerConnector.emit('toggleReady', { playerId: this.peer.id });
  },
  
  // Handle game start
  startGame() {
    if (!this.isHost) {
      console.error('Only the host can start the game');
      return;
    }

    // Show the game screen
    UI.showScreen('game-screen');

    // Set game state to started and move out of lobby
    this.state.gameStarted = true;
    this.state.currentRoom = 'main'; // or use your actual first room id, e.g., 'blue', 'red', etc.

    // Initialize game components
    this.character = window.selectedCharacter || 'male1';
    try {
      if (typeof Map !== 'undefined') Map.init();
      if (typeof Player !== 'undefined') Player.init();
      if (typeof Animation !== 'undefined') Animation.init(this.character);
      if (typeof NPC !== 'undefined') {
        NPC.init(); // Initialize NPCs
        window.NPC = NPC; // Make sure NPC is globally accessible
        console.log("NPC made globally accessible:", !!window.NPC);
      }
    } catch (e) {
      console.error("Error initializing game components:", e);
    }

    // Start the game loop
    this.gameLoop();
  },
  
  // Handle role assignment
  assignRole(playerId, role) {
    if (!this.peer) return;
    
    PeerConnector.emit('roleAssigned', { playerId, role });
  },
  
  // Handle task assignment
  assignTasks(playerId, tasks) {
    if (!this.peer) return;
    
    PeerConnector.emit('tasksAssigned', { playerId, tasks });
  },
  
  // Handle round start
  startRound(roundNumber) {
    if (!this.peer) return;
    
    PeerConnector.emit('roundStarted', { roundNumber });
  },
  
  // Handle round end
  endRound() {
    if (!this.peer) return;
    
    PeerConnector.emit('roundEnded');
  },
  
  // Handle discussion start
  startDiscussion() {
    if (!this.peer) return;
    
    PeerConnector.emit('discussionStarted');
  },
  
  // Handle game over
  endGame(winner) {
    if (!this.peer) return;
    
    PeerConnector.emit('gameOver', { winner });
  },
  
  // Socket event handlers
  handleConnect() {
    console.log('Connected to peers');
    this.playerId = this.peer.id;
    // Make Game object globally accessible for UI
    window.Game = this;
    console.log('Player ID set to:', this.peer.id);
  },
  
  handleDisconnect(reason) {
    console.log('Disconnected from peers:', reason);
    // Reset game state
    this.resetGameState();
  },
  
  handleError(errorMsg) {
    console.error('Peer connection error:', errorMsg);
    window.handleError(errorMsg);
  },
  
  handleGameCreated(gameCode) {
    console.log('[Game] handleGameCreated called with:', gameCode);
    this.gameCode = gameCode;
    this.isHost = true;
    this.username = this.username || document.getElementById('username-input')?.value.trim();
    
    // Make Game object globally accessible for UI
    window.Game = this;
    
    // Show the lobby screen
    UI.showScreen('lobby-screen');
    
    // Show the start button for the host
    const startButton = document.getElementById('start-button');
    if (startButton) {
      startButton.style.display = 'block';
    }
  },
  
  handleGameJoined(gameCode) {
    console.log('Joined game with code:', gameCode);
    this.gameCode = gameCode;
    this.isHost = false;
    this.username = this.username || document.getElementById('username-input')?.value?.trim();
    
    // Make Game object globally accessible for UI
    window.Game = this;
    
    // Show the lobby screen
    UI.showScreen('lobby-screen');
    
    // Hide the start button for non-hosts
    const startButton = document.getElementById('start-button');
    if (startButton) {
      startButton.style.display = 'none';
    }
  },
  
  handleUpdatePlayerList(players) {
    console.log('Player list updated:', players);
    // Update the player list in the UI using the new function
    if (window.updatePlayerList) {
      window.updatePlayerList(players);
    } else {
    UI.updatePlayerList(players);
    }
  },
  
  handleNewHost(hostId) {
    console.log('New host assigned:', hostId);
    // Check if we are the new host
    if (hostId === this.playerId) {
      this.isHost = true;
      document.getElementById('start-button').style.display = 'block';
    }
  },
  
  handleGameStarted() {
    console.log('Game started');
    // Stop lobby music when game starts
    if (window.Audio && window.Audio.stopLobbyMusic) {
      console.log("Stopping lobby music - game started");
      window.Audio.stopLobbyMusic();
    }
    // Clear lobby body classes
    document.body.className = '';
    // Show the game screen (do NOT overwrite document.body.innerHTML)
    UI.showScreen('game-screen');
    // Initialize the game canvas and renderer
    this.character = window.selectedCharacter || 'male1';
    try {
      if (typeof Map !== 'undefined') Map.init();
      if (typeof Player !== 'undefined') Player.init();
      if (typeof Animation !== 'undefined') Animation.init(this.character);
      if (typeof NPC !== 'undefined') {
        NPC.init(); // Initialize NPCs
        window.NPC = NPC; // Make sure NPC is globally accessible
        console.log("NPC made globally accessible:", !!window.NPC);
      }
    } catch (e) {
      console.error("Error initializing game components:", e);
    }
    // Start the game loop
    this.gameLoop();
    // Setup volume controls for online game
    setTimeout(() => {
      this.setupOnlineVolumeControls();
    }, 100);
    // Add pause menu functionality for online game
    window.isPaused = false;
    // Pause menu functions
    window.showPauseMenu = function() {
      console.log('Showing pause menu');
      window.isPaused = true;
      const pauseOverlay = document.getElementById('pause-menu-overlay');
      if (pauseOverlay) {
        pauseOverlay.style.display = 'flex';
        // Initialize pause menu volume controls with current values
        if (window.Audio) {
          // Music volume
          const pauseMusicSlider = document.getElementById('pause-music-volume-slider');
          const pauseMusicDisplay = document.getElementById('pause-music-volume-display');
          if (pauseMusicSlider && pauseMusicDisplay) {
            const currentMusicVolume = Math.round(window.Audio.getMusicVolume() * 100);
            pauseMusicSlider.value = currentMusicVolume;
            pauseMusicDisplay.textContent = currentMusicVolume + '%';
          }
          // SFX volume
          const pauseSfxSlider = document.getElementById('pause-sfx-volume-slider');
          const pauseSfxDisplay = document.getElementById('pause-sfx-volume-display');
          if (pauseSfxSlider && pauseSfxDisplay) {
            const currentSfxVolume = Math.round(window.Audio.getSoundEffectsVolume() * 100);
            pauseSfxSlider.value = currentSfxVolume;
            pauseSfxDisplay.textContent = currentSfxVolume + '%';
          }
        }
      }
    };
    window.hidePauseMenu = function() {
      console.log('Hiding pause menu');
      window.isPaused = false;
      const pauseOverlay = document.getElementById('pause-menu-overlay');
      if (pauseOverlay) {
        pauseOverlay.style.display = 'none';
      }
    };
    window.resumeGame = function() {
      window.hidePauseMenu();
    };
    window.leaveGame = function() {
      const confirmLeave = confirm('Biztosan ki akarsz lépni a játékból?');
      if (confirmLeave) {
        // Disconnect from peer if connected
        if (PeerConnector && PeerConnector.isPeerConnected()) {
          PeerConnector.disconnect();
        }
        // Reload the page to go back to main menu
        window.location.reload();
      }
    };
    window.toggleFullscreen = function() {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
          document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
          document.documentElement.msRequestFullscreen();
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
    };
    // Setup pause menu controls
    setTimeout(() => {
      const setupOnlinePauseVolumeControls = () => {
        // Music volume control
        const pauseMusicSlider = document.getElementById('pause-music-volume-slider');
        const pauseMusicDisplay = document.getElementById('pause-music-volume-display');
        if (pauseMusicSlider && pauseMusicDisplay && window.Audio) {
          pauseMusicSlider.addEventListener('input', (e) => {
            const volume = parseInt(e.target.value) / 100;
            window.Audio.setMusicVolume(volume);
            pauseMusicDisplay.textContent = e.target.value + '%';
            // Also update other volume displays
            const gameMusicDisplay = document.getElementById('online-music-volume-display');
            if (gameMusicDisplay) gameMusicDisplay.textContent = e.target.value + '%';
            const gameMusicSlider = document.getElementById('online-music-volume-slider');
            if (gameMusicSlider) gameMusicSlider.value = e.target.value;
          });
        }
        // SFX volume control
        const pauseSfxSlider = document.getElementById('pause-sfx-volume-slider');
        const pauseSfxDisplay = document.getElementById('pause-sfx-volume-display');
        if (pauseSfxSlider && pauseSfxDisplay && window.Audio) {
          pauseSfxSlider.addEventListener('input', (e) => {
            const volume = parseInt(e.target.value) / 100;
            window.Audio.setSoundEffectsVolume(volume);
            pauseSfxDisplay.textContent = e.target.value + '%';
            // Also update other volume displays
            const gameSfxDisplay = document.getElementById('online-sfx-volume-display');
            if (gameSfxDisplay) gameSfxDisplay.textContent = e.target.value + '%';
            const gameSfxSlider = document.getElementById('online-sfx-volume-slider');
            if (gameSfxSlider) gameSfxSlider.value = e.target.value;
          });
        }
      };
      setupOnlinePauseVolumeControls();
    }, 100);
    // Keyboard event handler for pause menu
    window.handleOnlineGameKeydown = function(event) {
      if (event.code === 'KeyP') {
        event.preventDefault();
        if (window.isPaused) {
          window.hidePauseMenu();
        } else {
          window.showPauseMenu();
        }
      } else if (event.code === 'Escape' && window.isPaused) {
        event.preventDefault();
        window.hidePauseMenu();
      }
    };
    document.addEventListener('keydown', window.handleOnlineGameKeydown);
  },
  
  // Setup volume controls for online game mode
  setupOnlineVolumeControls() {
    // Music volume control
    const musicSlider = document.getElementById('online-music-volume-slider');
    const musicDisplay = document.getElementById('online-music-volume-display');
    
    // Sound effects volume control
    const sfxSlider = document.getElementById('online-sfx-volume-slider');
    const sfxDisplay = document.getElementById('online-sfx-volume-display');
    
    if (window.Audio) {
      // Initialize music controls
      if (musicSlider && musicDisplay) {
        const currentMusicVolume = Math.round(window.Audio.getMusicVolume() * 100);
        musicSlider.value = currentMusicVolume;
        musicDisplay.textContent = currentMusicVolume + '%';
        
        musicSlider.addEventListener('input', (e) => {
          const volume = parseInt(e.target.value) / 100;
          window.Audio.setMusicVolume(volume);
          musicDisplay.textContent = e.target.value + '%';
        });
      }
      
      // Initialize sound effects controls
      if (sfxSlider && sfxDisplay) {
        const currentSfxVolume = Math.round(window.Audio.getSoundEffectsVolume() * 100);
        sfxSlider.value = currentSfxVolume;
        sfxDisplay.textContent = currentSfxVolume + '%';
        
        sfxSlider.addEventListener('input', (e) => {
          const volume = parseInt(e.target.value) / 100;
          window.Audio.setSoundEffectsVolume(volume);
          sfxDisplay.textContent = e.target.value + '%';
        });
      }
    }
  },
  
  handleRoleAssigned(roleInfo) {
    console.log('Role assigned:', roleInfo);
    this.playerRole = roleInfo.role;
    
    // Store additional role information
    if (roleInfo.role === 'noble' && roleInfo.group) {
      this.nobleGroup = roleInfo.group;
    } else if (roleInfo.role === 'commoner') {
      this.nobleId = roleInfo.nobleId;
      this.groupColor = roleInfo.color;
    }
    
    // Update the UI
    UI.updateRoleDisplay(roleInfo.role);
    
    // Show special action buttons based on role
    if (roleInfo.role === 'plague') {
      UI.toggleActionButton('infect-button', true);
    } else if (roleInfo.role === 'prince') {
      UI.toggleActionButton('stab-button', true);
      UI.toggleActionButton('slash-button', true);
    }
  },
  
  handleTasksAssigned(taskData) {
    console.log('Tasks assigned:', taskData);
    this.tasks = taskData.tasks;
    
    // Update the UI
    UI.updateTaskList(this.tasks);
    
    // Track which rooms have tasks
    this.roomsWithTasks = new Set(this.tasks.map(task => task.room));
  },
  
  handleRoundStarted(roundData) {
    console.log('Round started:', roundData);
    this.currentRound = roundData.round;
    this.roundTimerValue = roundData.duration;
    
    // Reset cooldowns
    this.plagueCooldown = false;
    this.princeCooldown = false;
    
    // Start the round timer
    this.startRoundTimer();
    
    // Update the UI
    UI.showScreen('game-screen');
  },
  
  handleDiscussionStarted(discussionData) {
    console.log('Discussion started:', discussionData);
    this.discussionTimerValue = discussionData.duration;
    
    // Build the table data
    let tableData = {
      type: discussionData.type,
      hour: discussionData.hour,
      groupColor: this.groupColor,
      groupNumber: this.getNobleGroupNumber(),
      players: this.buildDiscussionPlayerList(discussionData.type)
    };
    
    // Setup the discussion table
    UI.setupDiscussionTable(tableData);
    
    // Start the discussion timer
    this.startDiscussionTimer();
    
    // Show the discussion screen
    UI.showScreen('discussion-screen');
  },
  
  handleRoundEnded(roundData) {
    console.log('Round ended:', roundData);
    
    // Clear round timer
    if (this.roundTimer) {
      clearInterval(this.roundTimer);
      this.roundTimer = null;       
    }
    
    // Reset round-specific state
    this.currentRound = null;
    this.roundTimerValue = 0;
    
    // Update UI
    UI.hideScreen('game-screen');
  },
  
  handleActionsCooldown() {
    console.log('Actions cooldown activated');
    this.plagueCooldown = true;
    this.princeCooldown = true;
  },
  
  handleGameEnded(endData) {
    console.log('Game ended:', endData);
    
    // Clear all timers
    this.clearTimers();
    
    // Show the game over screen with the appropriate message
    UI.showGameOver(endData.message);
  },
  
  handlePlayerDied(deathData) {
    console.log('Player died:', deathData);
    
    // Update the player's state in our local state
    if (this.state.players[deathData.id]) {
      this.state.players[deathData.id].state = 'dead';
    }
    
    // Add the body to our list of bodies
    this.bodies[deathData.id] = {
      id: deathData.id,
      position: this.state.players[deathData.id].position,
      timeOfDeath: Date.now(),
      timeToCleanup: 13500 // 13.5 seconds
    };
    
    // If it's our player, update our state
    if (deathData.id === this.playerId) {
      this.handleDied(deathData);
    }
  },
  
  handleDied(deathData) {
    console.log('You died:', deathData);
    this.playerState = 'ghost';
    // Body hozzáadása a Game.bodies-hoz, ha még nincs
    if (this.bodies && !this.bodies['self']) {
      this.bodies['self'] = {
        x: window.Player ? window.Player.x : (deathData.x || 0),
        y: window.Player ? window.Player.y : (deathData.y || 0),
        character: window.Player ? window.Player.character : (deathData.character || 'female1')
      };
    }
    // Show death message
    const deathMessages = {
      'plague': 'Pestits áldozata lettél',
      'prince': 'Őfelsége nem talált megbízhatónak',
      'tasks': 'Unod a bált?! Menj és halj meg kint a Pestistben. (Elhagytad a kastélyt)'
    };
    const message = deathMessages[deathData.cause] || 'Meghaltál';
    alert(message);
    // Disable action buttons
    UI.toggleActionButton('task-button', false);
    UI.toggleActionButton('clean-body-button', false);
    UI.toggleActionButton('infect-button', false);
    UI.toggleActionButton('stab-button', false);
    UI.toggleActionButton('slash-button', false);
  },
  
  handleTaskCompleted(taskId) {
    console.log('Task completed:', taskId);
    // Remove the task from our list
    this.tasks = this.tasks.filter(task => task.id !== taskId);
    
    // Update the task list in the UI
    UI.updateTaskList(this.tasks);
    
    // End the current task state
    this.inTask = false;
  },
  
  handleAllTasksCompleted() {
    console.log('All tasks completed');
    alert('Minden feladatot teljesítettél!');
  },
  
  handleBodyRemoved(bodyId) {
    console.log('Body removed:', bodyId);
    // Remove the body from our list of bodies
    delete this.bodies[bodyId];
  },
  
  handleCommonerPromoted(promotionData) {
    console.log('Commoner promoted:', promotionData);
    // If it's our player, update our role
    if (promotionData.newNoble === this.playerId) {
      this.playerRole = 'noble';
      UI.updateRoleDisplay('noble');
      alert('Nemesi rangra emelkedtél!');
    }
  },
  
  // Game loop
  gameLoop() {
    // Update game state
    if (window.Player && window.Player.update) window.Player.update();
    // Render the game
    this.render();
    // Schedule the next frame
    requestAnimationFrame(this.gameLoop.bind(this));
  },
  
  // Render the game
  render() {
    if (!this.ctx) {
      console.error('Canvas context not available for rendering');
      return;
    }
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Only render game elements if we're in a game room
    if (this.state.gameStarted && this.state.currentRoom && this.state.currentRoom !== 'lobby') {
      // Draw current room
      GameMap.draw(this.state.position.x, this.state.position.y);
      
      // Draw all players
      Object.values(this.state.players).forEach(player => {
        if (player.id !== this.peer?.id) {
          Player.draw(player);
        }
      });
      
      // Draw local player
      if (this.peer) {
        Player.draw({
          id: this.peer.id,
          x: this.state.position.x,
          y: this.state.position.y,
          isMoving: this.state.isMoving,
          direction: this.state.direction,
          animationFrame: this.state.animationFrame,
          role: this.state.playerRole,
          isDead: this.state.isDead,
          isGhost: this.state.isGhost
        });
      }

      // Always draw task bar at the bottom
      TaskBar.drawTaskBar(this.canvas, this.ctx, this.state.position);
    }
  },
  
  // Timer functions
  startRoundTimer() {
    // Clear any existing timer
    if (this.roundTimer) {
      clearInterval(this.roundTimer);
    }
    
    // Update the UI with the initial value
    UI.updateRoundTimer(this.roundTimerValue);
    
    // Start the timer
    this.roundTimer = setInterval(() => {
      this.roundTimerValue--;
      UI.updateRoundTimer(this.roundTimerValue);
      
      if (this.roundTimerValue <= 0) {
        clearInterval(this.roundTimer);
      }
    }, 1000);
  },
  
  startDiscussionTimer() {
    // Clear any existing timer
    if (this.discussionTimer) {
      clearInterval(this.discussionTimer);
    }
    
    // Update the UI with the initial value
    UI.updateDiscussionTimer(this.discussionTimerValue);
    
    // Start the timer
    this.discussionTimer = setInterval(() => {
      this.discussionTimerValue--;
      UI.updateDiscussionTimer(this.discussionTimerValue);
      
      if (this.discussionTimerValue <= 0) {
        clearInterval(this.discussionTimer);
      }
    }, 1000);
  },
  
  clearTimers() {
    if (this.roundTimer) {
      clearInterval(this.roundTimer);
      this.roundTimer = null;
    }
    
    if (this.discussionTimer) {
      clearInterval(this.discussionTimer);
      this.discussionTimer = null;
    }
  },
  
  // Helper functions
  resetGameState() {
    this.gameCode = null;
    this.isHost = false;
    this.playerRole = null;
    this.playerState = 'alive';
    this.currentRound = 0;
    this.currentRoom = null;
    this.tasks = [];
    this.roomsWithTasks = new Set();
    this.nobleGroup = null;
    this.players = {};
    this.bodies = {};
    this.plagueCooldown = false;
    this.princeCooldown = false;
    this.inTask = false;
    
    // Clear any timers
    this.clearTimers();
  },
  
  checkBodiesForCleanup() {
    const now = Date.now();
    
    // Check each body
    for (let id in this.bodies) {
      const body = this.bodies[id];
      const timeElapsed = now - body.timeOfDeath;
      
      // If the body has been there too long, game over
      if (timeElapsed >= body.timeToCleanup) {
        // The plague wins
        this.peer.emit('bodyTimeExpired', id);
        return;
      }
      
      // Show cleanup button if player is near a body
      if (this.playerState === 'alive' && this.playerRole !== 'plague') {
        const distance = this.calculateDistance(this.position, body.position);
        
        if (distance < 50) { // Close enough to clean up
          UI.toggleActionButton('clean-body-button', true, id);
        } else {
          UI.toggleActionButton('clean-body-button', false);
        }
      }
    }
  },
  
  checkTaskZones() {
    // Check if the player is in a task zone
    if (this.playerState === 'alive') {
      const room = Map.getRoomFromPosition(this.position);
      
      if (room !== this.currentRoom) {
        this.currentRoom = room;
        console.log('Entered room:', room);
        
        // Check if the player has a task in this room
        if (this.roomsWithTasks.has(room)) {
          UI.toggleActionButton('task-button', true);
        } else {
          UI.toggleActionButton('task-button', false);
        }
      }
    }
  },
  
  checkPlayerInteractions() {
    // Only living players can interact
    if (this.playerState !== 'alive') return;
    
    // Special interactions based on role
    if (this.playerRole === 'plague' && !this.plagueCooldown) {
      let closestPlayer = null;
      let closestDistance = Infinity;
      
      // Find the closest player
      for (let id in this.state.players) {
        // Skip self and dead players
        if (id === this.playerId || this.state.players[id].state !== 'alive') continue;
        
        const distance = this.calculateDistance(this.position, this.state.players[id].position);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestPlayer = id;
        }
      }
      
      // If a player is close enough, enable infect button
      if (closestPlayer && closestDistance < 50) {
        UI.toggleActionButton('infect-button', true, closestPlayer);
      } else {
        UI.toggleActionButton('infect-button', false);
      }
    } else if (this.playerRole === 'prince' && !this.princeCooldown) {
      let closestPlayer = null;
      let closestDistance = Infinity;
      
      // Find the closest player
      for (let id in this.state.players) {
        // Skip self and dead players
        if (id === this.playerId || this.state.players[id].state !== 'alive') continue;
        
        const distance = this.calculateDistance(this.position, this.state.players[id].position);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestPlayer = id;
        }
      }
      
      // If a player is close enough, enable stab button
      if (closestPlayer && closestDistance < 50) {
        UI.toggleActionButton('stab-button', true, closestPlayer);
      } else {
        UI.toggleActionButton('stab-button', false);
      }
    }
  },
  
  calculateDistance(pos1, pos2) {
    return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
  },
  
  getNobleGroupNumber() {
    if (!this.nobleGroup && !this.groupColor) return 0;
    
    const colorToNumber = {
      'red': 1,
      'blue': 2,
      'green': 3,
      'yellow': 4,
      'white': 5
    };
    
    return colorToNumber[this.groupColor] || 0;
  },
  
  buildDiscussionPlayerList(discussionType) {
    const players = [];
    
    // For noble discussions in rounds 1-3, only include players from your noble group
    if (discussionType === 'noble') {
      // Add players based on noble group
      // This would require server-side information about which players are in which group
      // For now, we'll use placeholder logic
      for (let id in this.state.players) {
        if (this.state.players[id].nobleGroup === this.nobleGroup) {
          players.push({
            id,
            username: this.state.players[id].username || 'Player',
            character: this.state.players[id].character || 0,
            isGhost: this.state.players[id].state === 'dead'
          });
        }
      }
    } else {
      // For prince discussions in rounds 4-5, include all nobles and the prince
      for (let id in this.state.players) {
        if (this.state.players[id].role === 'prince' || this.state.players[id].role === 'noble') {
          players.push({
            id,
            username: this.state.players[id].username || 'Player',
            character: this.state.players[id].character || 0,
            isGhost: false // Dead nobles are replaced, so no ghosts in prince discussions
          });
        }
      }
    }
    
    return players;
  },
  
  drawPlayers() {
    // Draw all other players
    for (let id in this.state.players) {
      if (id === this.playerId) continue;
      
      const player = this.state.players[id];
      if (player.state === 'alive') {
        // Draw living player
        Player.drawOtherPlayer(player);
      }
    }
  },
  
  drawBodies() {
    // Draw all bodies
    for (let bodyId in this.bodies) {
      const body = this.bodies[bodyId];
      if (body) {
      Player.drawBody(body);
      }
    }
  },
  
  // Send position update to peers (optimalizált nagy késleltetéshez)
  sendPositionUpdate() {
    if (!this.peer || !PeerConnector.isPeerConnected()) return;
    
    const now = Date.now();
    
    // Throttle position updates for high-latency connections (200ms helyett 500ms)
    if (this.lastPositionUpdate && now - this.lastPositionUpdate < 500) {
      return;
    }
    
    // Only send if position changed significantly (10px helyett 15px threshold)
    if (this.lastSentPosition) {
      const deltaX = Math.abs(this.position.x - this.lastSentPosition.x);
      const deltaY = Math.abs(this.position.y - this.lastSentPosition.y);
      
      if (deltaX < 15 && deltaY < 15 && this.lastSentMoving === Player.isMoving) {
        return; // Not enough change to warrant an update
      }
    }
    
    // Send player position, direction and movement state to peers
    PeerConnector.emit('playerMove', {
      position: this.position,
      direction: Player.direction,
      isMoving: Player.isMoving
    });
    
    // Update tracking variables
    this.lastPositionUpdate = now;
    this.lastSentPosition = { x: this.position.x, y: this.position.y };
    this.lastSentMoving = Player.isMoving;
  },
  
  // Handle peer connection
  handlePeerConnection() {
    console.log('[Game] handlePeerConnection called');
    this.peer = window.PeerConnector.peer; // Ensure Game.peer is set
    this.state.isConnected = true;
    UI.showScreen('menu-screen');
  },
  
  // Handle peer disconnection
  handlePeerDisconnection() {
    console.log('Peer disconnected');
    this.state.isConnected = false;
    
    // Show error message
    UI.showError('Kapcsolat megszakadt. Kérlek, frissítsd az oldalt.');
  }
}; 

// Export the Game object
export default Game; 
