// Game Manager
import UI from './ui.js';
import Map from './map.js';
import Player from './player.js';
import Animation from './animation.js';
import SocketConnector from './socket_connector.js';
import NPC from './npc.js';
import Audio from './audio.js';

const Game = {
  // Socket.io connection
  socket: null,
  
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
    
    try {
      // Initialize audio system first
      if (Audio && Audio.init) {
        Audio.init();
        window.Audio = Audio; // Make globally accessible
        console.log("Audio system initialized and made globally accessible");
      }
      
      // Initialize default position
      this.position = {
        x: window.innerWidth / 2,
        y: window.innerHeight * 0.7 - 60 // Default height
      };
      
      // Add debug parameters
      this.debugMode = window.debugMode || false;
      this.playerRole = 'commoner'; // Default role for testing
      
      // Connect to Socket.io server
      await this.connectToServer();
      
      // Initialize UI handlers
      this.initUIHandlers();
      
      console.log("Game initialized with default settings:", {
        position: this.position,
        playerRole: this.playerRole,
        debugMode: this.debugMode
      });
    } catch (error) {
      console.error("Error during Game initialization:", error);
      alert("Error initializing game. See console for details.");
    }
  },
  
  // Connect to the Socket.io server using SocketConnector
  async connectToServer() {
    try {
      console.log("Connecting to Socket.io server...");
      
      // Initialize SocketConnector with callbacks (now async)
      await SocketConnector.init({
        onConnect: (socket) => {
          this.socket = socket;
          this.handleConnect();
          UI.showScreen('menu-screen');
          
          // Start lobby music on main menu
          setTimeout(() => {
            if (window.Audio && window.Audio.resumeLobbyMusic) {
              console.log("Resuming lobby music on main menu");
              window.Audio.resumeLobbyMusic();
            }
          }, 500);
          
          this.setupSocketListeners();
        },
        onDisconnect: (reason) => {
          this.handleDisconnect(reason);
        },
        onError: (error) => {
          this.handleError(`Connection error: ${error}`);
        },
        onReconnecting: (attempt) => {
          console.log(`Attempting to reconnect (${attempt})...`);
          UI.showError(`Kapcsolódás probléma, újrakapcsolódás... (${attempt})`);
        },
        onReconnectFailed: () => {
          console.error("Failed to reconnect to server");
          UI.showError("Nem sikerült újrakapcsolódni a szerverhez. Offline módban folytathatod a játékot.");
          this.socket = SocketConnector.socket;
          
          // Start lobby music in offline mode too
          setTimeout(() => {
            if (window.Audio && window.Audio.resumeLobbyMusic) {
              console.log("Resuming lobby music in offline mode");
              window.Audio.resumeLobbyMusic();
            }
          }, 500);
        }
      });
    } catch (error) {
      console.error("Socket connection error:", error);
      UI.showError("Kapcsolódási hiba. Offline módban folytathatod a játékot.");
      
      // Fall back to offline mode
      this.socket = {
        connected: false,
        on: () => {},
        emit: () => console.log("Emitting event (offline mode)")
      };
      
      // Start lobby music in offline mode too
      setTimeout(() => {
        if (window.Audio && window.Audio.resumeLobbyMusic) {
          console.log("Resuming lobby music in offline mode");
          window.Audio.resumeLobbyMusic();
        }
      }, 500);
    }
  },
  
  // Setup UI event handlers
  initUIHandlers() {
    console.log("Setting up UI handlers");
    
    // Host button - TELJES RESET
    const hostBtn = document.getElementById('host-button');
    if (hostBtn) {
      hostBtn.addEventListener('click', () => {
      const username = document.getElementById('username-input').value.trim();
      if (username) {
        this.username = username;
          
        if (SocketConnector.isSocketConnected()) {
            // Use socket to create game and wait for server response
            SocketConnector.emit('hostGame', username);
        } else {
            // Offline mode - use random code
            const randomCode = Math.floor(Math.random() * 90000 + 10000).toString();
            this.isHost = true; // Set host status for offline mode
            this.createLobbyInterface(username, randomCode);
        }
      } else {
          alert("Kérlek, add meg a neved!");
      }
    });
    }
    
    // Create lobby interface function
    this.createLobbyInterface = function(username, gameCode) {
      // TIMER CLEANUP - minden futó timer leállítása
      const highestTimeoutId = setTimeout(";");
      for (let i = 0; i < highestTimeoutId; i++) {
        clearTimeout(i);
        clearInterval(i);
      }
      console.log('All timers cleared before lobby creation');
      
      // Start lobby music
      if (window.Audio && window.Audio.resumeLobbyMusic) {
        console.log("Resuming lobby music from createLobbyInterface");
        window.Audio.resumeLobbyMusic();
      }
      
      // TELJES OLDAL RESET - CSAK VÁRÓTEREM
      document.body.innerHTML = `
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            background: #000; 
            color: #8b0000; 
            font-family: 'MedievalSharp', serif;
            min-height: 100vh;
            overflow-y: auto;
            overflow-x: hidden;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding-top: 20px;
          }
          .lobby-container {
            background: #1a0000;
            border: 3px solid #8b0000;
            border-radius: 10px;
            padding: 2rem;
            width: 1600px;
            max-width: 1600px;
            min-height: 900px;
            box-sizing: border-box;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: #8b0000 #1a0000;
            box-shadow: 0 0 30px rgba(139, 0, 0, 0.5);
          }
          .lobby-container::-webkit-scrollbar {
            width: 12px;
          }
          .lobby-container::-webkit-scrollbar-track {
            background: #1a0000;
            border: 1px solid #8b0000;
          }
          .lobby-container::-webkit-scrollbar-thumb {
            background: #8b0000;
            border-radius: 0;
          }
          .lobby-container::-webkit-scrollbar-thumb:hover {
            background: #a00000;
          }
          .lobby-container h2 {
            color: #8b0000;
            margin-bottom: 2rem;
            text-align: center;
            font-size: 2.2rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            margin-top: 0;
          }
          .lobby-flex {
            display: flex;
            gap: 30px;
            margin-bottom: 2rem;
            align-items: flex-start;
            justify-content: space-between;
            width: 100%;
          }
          .player-list-panel {
            background: #1a0000;
            border: 2px solid #8b0000;
            padding: 1.5rem;
            width: 320px;
            min-height: 400px;
            border-radius: 8px;
            box-shadow: 0 0 15px rgba(139, 0, 0, 0.3);
          }
          .test-roles-panel {
            background: #1a0000;
            border: 2px solid #8b0000;
            padding: 1.5rem;
            width: 800px;
            min-height: 400px;
            border-radius: 8px;
            box-shadow: 0 0 15px rgba(139, 0, 0, 0.3);
          }
          .character-select-panel {
            background: #1a0000;
            border: 2px solid #8b0000;
            padding: 1.5rem;
            width: 320px;
            min-height: 400px;
            border-radius: 8px;
            box-shadow: 0 0 15px rgba(139, 0, 0, 0.3);
          }
          .player-list {
            margin-bottom: 0;
          }
          .test-roles-panel h3 {
            margin-top: 0;
            color: #8b0000;
            margin-bottom: 15px;
            text-align: center;
          }
          .role-group {
            margin-bottom: 15px;
          }
          .role-group strong {
            display: block;
            margin-bottom: 8px;
            color: #8b0000;
            font-size: 14px;
          }
          .role-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            justify-content: flex-start;
          }
          .role-buttons .menu-button {
            flex: 0 0 auto;
            margin: 0;
            padding: 10px 14px;
            font-size: 12px;
            min-width: 140px;
          }
          #player-list {
            list-style-type: none;
            padding: 0;
            margin: 10px 0;
          }
          #player-list li {
            background: #2a0000;
            border: 1px solid #8b0000;
            padding: 8px 12px;
            margin: 5px 0;
            color: #8b0000;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-radius: 3px;
          }
          #player-list li.ready {
            background: #0d2818;
            border-color: #00ff00;
          }
          .ready-status {
            font-size: 16px;
            font-weight: bold;
          }
          .ready-status.ready {
            color: #00ff00;
          }
          .ready-status.not-ready {
            color: #8b0000;
          }
          #room-code-display {
            color: #ff6b6b;
            font-weight: bold;
            text-shadow: 0 0 5px rgba(255, 107, 107, 0.5);
          }
          #ready-button {
            background: #1a0000;
            color: #8b0000;
            border: 2px solid #8b0000;
            padding: 10px 20px;
            font-family: 'MedievalSharp', serif;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          #ready-button:hover {
            background: #8b0000;
            color: #1a0000;
          }
          #ready-button.ready {
            background: #006400;
            border-color: #00ff00;
            color: #ffffff;
          }
          #start-game-button:disabled {
            background: #333;
            color: #666;
            border-color: #555;
            cursor: not-allowed;
          }
          .menu-button {
            background: #1a0000;
            color: #8b0000;
            border: 2px solid #8b0000;
            padding: 12px 20px;
            margin: 5px;
            cursor: pointer;
            font-family: 'MedievalSharp', serif;
            font-size: 14px;
            border-radius: 3px;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(139, 0, 0, 0.2);
          }
          .menu-button:hover {
            background: #8b0000;
            color: #1a0000;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(139, 0, 0, 0.4);
          }
          .character-gallery {
            display: flex;
            gap: 15px;
            margin: 15px 0;
            flex-wrap: wrap;
            justify-content: center;
          }
          .character-gallery img {
            width: 80px;
            height: 120px;
            cursor: pointer;
            border: 2px solid transparent;
            object-fit: contain;
            background: #1a0000;
            border-radius: 3px;
            transition: all 0.3s ease;
          }
          .character-gallery img:hover {
            border: 2px solid #8b0000;
            transform: scale(1.05);
            box-shadow: 0 4px 15px rgba(139, 0, 0, 0.4);
          }
          .start-game-section {
            text-align: center;
            width: 100%;
            margin: 0 auto;
            padding-top: 1.5rem;
            border-top: 3px solid #8b0000;
          }
          #start-game-button {
            font-size: 18px;
            padding: 15px 40px;
            background: #2a0000;
            border: 3px solid #8b0000;
            color: #8b0000;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          #start-game-button:hover:not(:disabled) {
            background: #8b0000;
            color: #1a0000;
            border-color: #ff0000;
            box-shadow: 0 0 20px rgba(139, 0, 0, 0.6);
          }
          /* Pause Menu Styles */
          .pause-menu-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.8);
            z-index: 2000;
            display: none;
            justify-content: center;
            align-items: center;
          }
          .pause-menu {
            background: #1a0000;
            border: 3px solid #8b0000;
            border-radius: 10px;
            padding: 30px;
            min-width: 400px;
            max-width: 500px;
            text-align: center;
            box-shadow: 0 0 30px rgba(139, 0, 0, 0.7);
          }
          .pause-menu h2 {
            color: #8b0000;
            font-family: 'MedievalSharp', serif;
            font-size: 24px;
            margin-bottom: 25px;
            margin-top: 0;
          }
          .pause-menu-section {
            margin-bottom: 20px;
            padding: 15px;
            border: 1px solid #8b0000;
            border-radius: 5px;
            background: rgba(26, 0, 0, 0.5);
          }
          .pause-menu-section h3 {
            color: #8b0000;
            font-family: 'MedievalSharp', serif;
            font-size: 16px;
            margin-bottom: 15px;
            margin-top: 0;
          }
          .pause-volume-control {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          }
          .pause-volume-control label {
            color: #8b0000;
            font-family: 'MedievalSharp', serif;
            font-size: 14px;
            flex: 1;
            text-align: left;
          }
          .pause-volume-control input[type="range"] {
            flex: 2;
            margin: 0 10px;
            accent-color: #8b0000;
          }
          .pause-volume-control span {
            color: #8b0000;
            font-family: 'MedievalSharp', serif;
            font-size: 12px;
            width: 40px;
            text-align: right;
          }
          .pause-menu-buttons {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-top: 25px;
          }
          .pause-menu-button {
            background: #1a0000;
            color: #8b0000;
            border: 2px solid #8b0000;
            padding: 12px 20px;
            font-family: 'MedievalSharp', serif;
            font-size: 14px;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          .pause-menu-button:hover {
            background: #8b0000;
            color: #1a0000;
          }
          .fullscreen-toggle {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .fullscreen-toggle label {
            color: #8b0000;
            font-family: 'MedievalSharp', serif;
            font-size: 14px;
          }
          .fullscreen-toggle button {
            background: #1a0000;
            color: #8b0000;
            border: 2px solid #8b0000;
            padding: 8px 16px;
            font-family: 'MedievalSharp', serif;
            font-size: 12px;
            border-radius: 3px;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          .fullscreen-toggle button:hover {
            background: #8b0000;
            color: #1a0000;
          }
        </style>
        
        <div class="lobby-container">
          <h2>Váróterem - Szobakód: <span id="room-code-display">Betöltés...</span></h2>
          <div class="lobby-flex">
            <div class="player-list-panel">
              <div class="player-list">
                <h3>Játékosok</h3>
                <ul id="player-list"><li>${username}</li></ul>
                <div style="text-align: center; margin-top: 15px;">
                  <button id="ready-button" class="menu-button">Kész vagyok</button>
                </div>
              </div>
            </div>
            
            <div class="test-roles-panel">
              <h3>Teszt szerepek (5 nemesi csoport)</h3>
              <div class="role-group">
                <strong>Polgárok (színes háttér + fekete frame):</strong>
                <div class="role-buttons">
                  <button class="menu-button" onclick="window.setTestRole('commoner', 'red')">Polgár (Piros)</button>
                  <button class="menu-button" onclick="window.setTestRole('commoner', 'blue')">Polgár (Kék)</button>
                  <button class="menu-button" onclick="window.setTestRole('commoner', 'green')">Polgár (Zöld)</button>
                  <button class="menu-button" onclick="window.setTestRole('commoner', 'white')">Polgár (Fehér)</button>
                  <button class="menu-button" onclick="window.setTestRole('commoner', 'black')">Polgár (Fekete)</button>
                </div>
              </div>
              <div class="role-group">
                <strong>Nemesek (színes háttér + arany frame):</strong>
                <div class="role-buttons">
                  <button class="menu-button" onclick="window.setTestRole('noble', 'red')">Nemes (Piros)</button>
                  <button class="menu-button" onclick="window.setTestRole('noble', 'blue')">Nemes (Kék)</button>
                  <button class="menu-button" onclick="window.setTestRole('noble', 'green')">Nemes (Zöld)</button>
                  <button class="menu-button" onclick="window.setTestRole('noble', 'white')">Nemes (Fehér)</button>
                  <button class="menu-button" onclick="window.setTestRole('noble', 'black')">Nemes (Fekete)</button>
                </div>
              </div>
              <div class="role-group">
                <strong>Herceg (teljes arany):</strong>
                <div class="role-buttons">
                  <button class="menu-button" onclick="window.setTestRole('prince', null)">Herceg</button>
                </div>
              </div>
              <div class="role-group">
                <strong>Pestis-Polgárok (minden színű csoport):</strong>
                <div class="role-buttons">
                  <button class="menu-button" onclick="window.setTestRole('plague-commoner', 'red')">Pestis-Polgár (Piros)</button>
                  <button class="menu-button" onclick="window.setTestRole('plague-commoner', 'blue')">Pestis-Polgár (Kék)</button>
                  <button class="menu-button" onclick="window.setTestRole('plague-commoner', 'green')">Pestis-Polgár (Zöld)</button>
                  <button class="menu-button" onclick="window.setTestRole('plague-commoner', 'white')">Pestis-Polgár (Fehér)</button>
                  <button class="menu-button" onclick="window.setTestRole('plague-commoner', 'black')">Pestis-Polgár (Fekete)</button>
                </div>
              </div>
              <div class="role-group">
                <strong>Pestis-Nemesek (minden színű csoport):</strong>
                <div class="role-buttons">
                  <button class="menu-button" onclick="window.setTestRole('plague-noble', 'red')">Pestis-Nemes (Piros)</button>
                  <button class="menu-button" onclick="window.setTestRole('plague-noble', 'blue')">Pestis-Nemes (Kék)</button>
                  <button class="menu-button" onclick="window.setTestRole('plague-noble', 'green')">Pestis-Nemes (Zöld)</button>
                  <button class="menu-button" onclick="window.setTestRole('plague-noble', 'white')">Pestis-Nemes (Fehér)</button>
                  <button class="menu-button" onclick="window.setTestRole('plague-noble', 'black')">Pestis-Nemes (Fekete)</button>
                </div>
              </div>
              <div class="role-group">
                <strong>Ghost (halott játékos teszt):</strong>
                <div class="role-buttons">
                  <button class="menu-button" onclick="window.setTestRole('ghost', null)">Ghost</button>
                </div>
              </div>
            </div>
            
            <div class="character-select-panel">
              <h3>Karakterválasztás</h3>
              <div>
                <button class="menu-button" onclick="window.showCharacters('male')">Férfi</button>
                <button class="menu-button" onclick="window.showCharacters('female')">Nő</button>
                <button class="menu-button" onclick="window.showCharacters('ghost')">Ghost</button>
              </div>
              <div id="character-gallery" class="character-gallery"></div>
            </div>
          </div>
          <div class="start-game-section">
            <button id="start-game-button" class="menu-button" onclick="window.startGame()" disabled>Játék indítása (várj hogy mindenki kész legyen)</button>
          </div>
          
          <!-- Volume Controls -->
          <div class="volume-controls-section" style="
            text-align: center;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 2px solid #8b0000;
          ">
            <h3 style="color: #8b0000; margin-bottom: 15px;">Hangerő beállítások</h3>
            <div style="display: flex; gap: 40px; justify-content: center; align-items: center;">
              <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                <label style="color: #8b0000; font-size: 14px;">Zene hangerő</label>
                <input type="range" id="music-volume-slider" min="0" max="100" value="40" style="
                  width: 150px;
                  accent-color: #8b0000;
                ">
                <span id="music-volume-display" style="color: #8b0000; font-size: 12px;">40%</span>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // GLOBÁLIS FÜGGVÉNYEK DEFINIÁLÁSA
      window.selectedCharacter = 'male1';
      window.testRole = 'commoner';
      window.testGroupColor = null;
      window.isReady = false;
      window.allPlayersReady = false;
      window.currentGameCode = gameCode;
      
      // Set up global Game object reference for UI
      if (this && typeof this === 'object') {
        window.Game = this;
        window.Game.isHost = true; // Default to host in offline/lobby creation
      }
      
      // Make UI globally accessible if available
      if (typeof UI !== 'undefined') {
        window.UI = UI;
      }
      
      // Update room code display
      window.updateRoomCode = function(gameCode) {
        window.currentGameCode = gameCode;
        const roomCodeDisplay = document.getElementById('room-code-display');
        if (roomCodeDisplay) {
          roomCodeDisplay.textContent = gameCode;
          console.log('Room code updated in UI to:', gameCode); // Debug log
        }
      };
      
      // Update player list with ready status
      window.updatePlayerList = function(players) {
        console.log('DEBUG: Local updatePlayerList called with:', players);
        const playerListElement = document.getElementById('player-list');
        if (!playerListElement) return;
        
        playerListElement.innerHTML = '';
        
        // Get our player ID to check if we're ready
        let myId = null;
        if (window.Game && window.Game.playerId) {
          myId = window.Game.playerId;
        }
        console.log('DEBUG: My player ID:', myId);
        
        let myReady = false;
        let playerCount = 0;
        let readyCount = 0;
        
        players.forEach(player => {
          playerCount++;
          const li = document.createElement('li');
          li.style.display = 'flex';
          li.style.justifyContent = 'space-between';
          li.style.alignItems = 'center';
          
          const nameSpan = document.createElement('span');
          nameSpan.textContent = player.name || player.username || 'Játékos';
          
          const statusSpan = document.createElement('span');
          if (player.ready) {
            readyCount++;
            statusSpan.textContent = '✓';
            statusSpan.style.color = '#00ff00';
            statusSpan.style.fontWeight = 'bold';
            statusSpan.style.fontSize = '16px';
            li.classList.add('ready');
      } else {
            statusSpan.textContent = '○';
            statusSpan.style.color = '#8b0000';
            statusSpan.style.fontSize = '14px';
          }
          
          // Check if this is our player
          if (myId && player.id === myId) {
            myReady = !!player.ready;
            li.style.backgroundColor = '#2a0000'; // Highlight our own entry
          }
          
          li.appendChild(nameSpan);
          li.appendChild(statusSpan);
          playerListElement.appendChild(li);
        });
        
        console.log('DEBUG: Player counts - ready:', readyCount, 'total:', playerCount);
        console.log('DEBUG: My ready status:', myReady);
        
        // Update ready button text based on our status
        const readyBtn = document.getElementById('ready-button');
        if (readyBtn) {
          if (myReady) {
            readyBtn.textContent = 'Nem vagyok kész';
            readyBtn.classList.add('ready');
          } else {
            readyBtn.textContent = 'Kész vagyok';
            readyBtn.classList.remove('ready');
          }
        }
        
        // Update start button status if we're the host
        const startBtn = document.getElementById('start-game-button');
        if (startBtn && window.Game && window.Game.isHost) {
          const allReady = readyCount === playerCount && playerCount > 0;
          console.log('DEBUG: All ready check:', allReady, '(', readyCount, '/', playerCount, ')');
          
          startBtn.disabled = !allReady;
          startBtn.textContent = allReady ? 'Játék indítása' : 'Játék indítása (várj hogy mindenki kész legyen)';
          
          // Also update global flag for startGame function
          window.allPlayersReady = allReady;
          console.log('DEBUG: Start button updated - disabled:', !allReady, 'allPlayersReady:', allReady);
        }
      };
      
      // Set initial room code
      window.updateRoomCode(gameCode);
      
      // Initialize player list with current player
      const initialPlayers = [
        { name: username, ready: false }
      ];
      window.updatePlayerList(initialPlayers);
      
      // Ready button functionality
      window.toggleReady = function() {
        console.log('DEBUG: toggleReady called, SocketConnector.isSocketConnected():', SocketConnector.isSocketConnected());
        
        // If we're connected to server, use socket event
        if (SocketConnector.isSocketConnected()) {
          console.log('DEBUG: Using server mode, emitting toggleReady');
          SocketConnector.emit('toggleReady');
          return;
        }
        
        console.log('DEBUG: Using offline mode');
        // Offline mode - toggle our ready status
        window.isReady = !window.isReady;
        console.log('DEBUG: window.isReady toggled to:', window.isReady);
        
        const readyBtn = document.getElementById('ready-button');
        console.log('DEBUG: readyBtn found:', !!readyBtn);
        
        if (window.isReady) {
          readyBtn.textContent = 'Nem vagyok kész';
          readyBtn.classList.add('ready');
      } else {
          readyBtn.textContent = 'Kész vagyok';
          readyBtn.classList.remove('ready');
        }
        
        // Update the player list to trigger start button logic
        const currentPlayers = [
          { name: username, ready: window.isReady, id: 'offline-player-1' }
        ];
        console.log('DEBUG: currentPlayers:', currentPlayers);
        
        // Call the UI.js updatePlayerList function if available
        if (window.UI && window.UI.updatePlayerList) {
          console.log('DEBUG: Using window.UI.updatePlayerList');
          window.UI.updatePlayerList(currentPlayers);
        } else {
          console.log('DEBUG: Using fallback local updatePlayerList');
          // Fallback to local updatePlayerList
        window.updatePlayerList(currentPlayers);
        
          // Manually update start button for offline mode
          const startBtn = document.getElementById('start-game-button');
          console.log('DEBUG: startBtn found:', !!startBtn);
          console.log('DEBUG: startBtn disabled before:', startBtn ? startBtn.disabled : 'N/A');
          
          if (startBtn) {
        if (window.isReady) {
          startBtn.disabled = false;
          startBtn.textContent = 'Játék indítása';
              console.log('DEBUG: Start button ENABLED');
        } else {
          startBtn.disabled = true;
          startBtn.textContent = 'Játék indítása (várj hogy mindenki kész legyen)';
              console.log('DEBUG: Start button DISABLED');
            }
            console.log('DEBUG: startBtn disabled after:', startBtn.disabled);
          }
        }
        
        window.allPlayersReady = window.isReady;
        console.log('DEBUG: window.allPlayersReady set to:', window.allPlayersReady);
      };
      
      // Add ready button event listener
      document.getElementById('ready-button').addEventListener('click', window.toggleReady);
      
      // Setup volume controls
      window.setupVolumeControls = function() {
        // Music volume control
        const musicSlider = document.getElementById('music-volume-slider');
        const musicDisplay = document.getElementById('music-volume-display');
        
        if (musicSlider && musicDisplay && window.Audio) {
          // Set initial value from Audio system
          const currentMusicVolume = Math.round(window.Audio.getMusicVolume() * 100);
          musicSlider.value = currentMusicVolume;
          musicDisplay.textContent = currentMusicVolume + '%';
          
          // Add event listener for music volume changes
          musicSlider.addEventListener('input', (e) => {
            const volume = parseInt(e.target.value) / 100;
            window.Audio.setMusicVolume(volume);
            musicDisplay.textContent = e.target.value + '%';
            console.log('Music volume changed to:', volume);
          });
        }
      };
      
      // Initialize volume controls after a short delay
      setTimeout(() => {
        window.setupVolumeControls();
      }, 100);
      
      // Role setting function for testing
      window.setTestRole = function(role, groupColor) {
        window.testRole = role;
        window.testGroupColor = groupColor;
        console.log('Test role set to:', role, 'with group color:', groupColor);
        
        // Automatically set prince character when prince role is selected
        if (role === 'prince') {
          window.selectedCharacter = 'prince';
          console.log('Character automatically set to prince');
        }
        
        // Hide all action buttons first
        const buttons = ['infect-button', 'slash-button', 'task-button', 'clean-body-button'];
        buttons.forEach(id => {
          const btn = document.getElementById(id);
          if (btn) btn.style.display = 'none';
        });
        
        // Show relevant action buttons based on role
        if (role === 'prince') {
          const slashBtn = document.getElementById('slash-button');
          if (slashBtn) slashBtn.style.display = 'block';
        } else if (role === 'plague-commoner' || role === 'plague-noble' || role === 'plague') {
          const infectBtn = document.getElementById('infect-button');
          if (infectBtn) infectBtn.style.display = 'block';
        }
      };
      
      window.showCharacters = function(gender) {
        const gallery = document.getElementById('character-gallery');
        if (!gallery) return;
        
        gallery.innerHTML = '';
        
        const characters = {
          male: ['male1', 'male2', 'male3', 'male4', 'male5', 'male6', 'male7', 'male8'],
          female: ['female1', 'female2', 'female3', 'female4', 'female5', 'female6', 'female7', 'female8', 'female9'],
          ghost: ['ghost'],
          special: ['prince']
        };
        
        if (!characters[gender]) return;
        
        characters[gender].forEach(char => {
          const img = document.createElement('img');
          
          // Special handling for different character types
          let genderFolder, imagePath;
          if (gender === 'ghost') {
            genderFolder = 'ghost';
            imagePath = `assets/images/characters/${genderFolder}/idle/${char}_idle1.png`;
          } else if (gender === 'special' && char === 'prince') {
            genderFolder = 'prince';
            imagePath = `assets/images/characters/${genderFolder}/idle/${char}_idle_facing_right1.png`;
          } else {
            genderFolder = gender === 'male' ? 'males' : 'females';
            imagePath = `assets/images/characters/${genderFolder}/${char}/idle/${char}_idle_facing_right1.png`;
          }
          
          img.src = imagePath;
          img.onerror = () => {
            console.log('Character image not found:', img.src);
            img.style.display = 'none';
          };
          img.onclick = () => {
            window.selectedCharacter = char;
            const galleryImages = document.querySelectorAll('#character-gallery img');
            if (galleryImages) {
              galleryImages.forEach(i => {
                if (i && i.style) i.style.border = '2px solid transparent';
              });
            }
            if (img && img.style) img.style.border = '2px solid #8b0000';
          };
          gallery.appendChild(img);
        });
      };
      
      window.startGame = function() {
        console.log('DEBUG: startGame called - FORCING OFFLINE MODE');
        
        // Stop lobby music when game starts
        if (window.Audio && window.Audio.stopLobbyMusic) {
          console.log("Stopping lobby music from startGame");
          window.Audio.stopLobbyMusic();
        }
        
        if (!window.allPlayersReady) {
          console.log('DEBUG: Not all players ready, showing alert');
          alert('Várj, amíg minden játékos készen áll!');
          return;
        }
        
        console.log('DEBUG: STARTING OFFLINE GAME DIRECTLY');
        // ALWAYS start offline mode - bypass all socket checks
        startGameLocally();
      };
      
      // Move the existing game start logic to a separate function
      function startGameLocally() {
        try {
          console.log('Starting game with character:', window.selectedCharacter || 'male1');
          console.log('Starting game with test role:', window.testRole);
          
          // Ensure prince character is set if prince role
          if (window.testRole === 'prince' && window.selectedCharacter !== 'prince') {
            window.selectedCharacter = 'prince';
            console.log('Forcing prince character for prince role');
          }
          
          const character = window.selectedCharacter || 'male1';
          console.log('Final character:', character);
          
          // Set Game character
          window.Game.character = character;
          console.log('Game character set to:', window.Game.character);
          
          // Játék képernyő létrehozása
          // Játék képernyő létrehozása
          document.body.innerHTML = `
            <style>
              body { 
                margin: 0; 
                padding: 0; 
                background: #000; 
                overflow: hidden;
              }
              #game-canvas {
                display: block;
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: #000;
              }
              #role-indicator {
                position: fixed;
                top: 20px;
                left: 20px;
                background: rgba(26, 0, 0, 0.9);
                border: 2px solid #8b0000;
                color: #8b0000;
                padding: 10px 15px;
                font-family: 'MedievalSharp', serif;
                font-size: 16px;
                font-weight: bold;
                z-index: 1000;
                border-radius: 0;
                box-shadow: 0 0 10px rgba(139, 0, 0, 0.5);
              }
              .action-buttons {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 15px;
                z-index: 1000;
              }
              .action-button {
                background: rgba(26, 0, 0, 0.95);
                border: 2px solid #8b0000;
                color: #8b0000;
                padding: 12px 16px;
                border-radius: 0;
                cursor: pointer;
                font-family: 'MedievalSharp', serif;
                font-size: 14px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 5px;
                min-width: 80px;
                transition: all 0.3s ease;
                box-shadow: 0 0 10px rgba(139, 0, 0, 0.5);
              }
              .action-button:hover {
                background: #8b0000;
                color: #1a0000;
                transform: translateY(-2px);
                box-shadow: 0 2px 15px rgba(139, 0, 0, 0.8);
              }
              .action-icon {
                font-size: 24px;
                filter: grayscale(100%) sepia(100%) hue-rotate(320deg) saturate(200%);
              }
              .action-button:hover .action-icon {
                filter: grayscale(100%) sepia(100%) hue-rotate(30deg) saturate(200%);
              }
              .action-text {
                font-size: 12px;
                text-align: center;
                white-space: nowrap;
              }
              #fullscreen-hint {
                position: fixed;
                bottom: 15px;
                right: 20px;
                color: rgba(139, 0, 0, 0.4);
                font-family: 'MedievalSharp', serif;
                font-size: 12px;
                z-index: 999;
                pointer-events: none;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
              }
              
              /* Pause Menu Styles */
              .pause-menu-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.8);
                z-index: 2000;
                display: none;
                justify-content: center;
                align-items: center;
              }
              .pause-menu {
                background: #1a0000;
                border: 3px solid #8b0000;
                border-radius: 10px;
                padding: 30px;
                min-width: 400px;
                max-width: 500px;
                text-align: center;
                box-shadow: 0 0 30px rgba(139, 0, 0, 0.7);
              }
              .pause-menu h2 {
                color: #8b0000;
                font-family: 'MedievalSharp', serif;
                font-size: 24px;
                margin-bottom: 25px;
                margin-top: 0;
              }
              .pause-menu-section {
                margin-bottom: 20px;
                padding: 15px;
                border: 1px solid #8b0000;
                border-radius: 5px;
                background: rgba(26, 0, 0, 0.5);
              }
              .pause-menu-section h3 {
                color: #8b0000;
                font-family: 'MedievalSharp', serif;
                font-size: 16px;
                margin-bottom: 15px;
                margin-top: 0;
              }
              .pause-volume-control {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
              }
              .pause-volume-control label {
                color: #8b0000;
                font-family: 'MedievalSharp', serif;
                font-size: 14px;
                flex: 1;
                text-align: left;
              }
              .pause-volume-control input[type="range"] {
                flex: 2;
                margin: 0 10px;
                accent-color: #8b0000;
              }
              .pause-volume-control span {
                color: #8b0000;
                font-family: 'MedievalSharp', serif;
                font-size: 12px;
                width: 40px;
                text-align: right;
              }
              .pause-menu-buttons {
                display: flex;
                gap: 15px;
                justify-content: center;
                margin-top: 25px;
              }
              .pause-menu-button {
                background: #1a0000;
                color: #8b0000;
                border: 2px solid #8b0000;
                padding: 12px 20px;
                font-family: 'MedievalSharp', serif;
                font-size: 14px;
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.3s ease;
              }
              .pause-menu-button:hover {
                background: #8b0000;
                color: #1a0000;
              }
              .fullscreen-toggle {
                display: flex;
                justify-content: space-between;
                align-items: center;
              }
              .fullscreen-toggle label {
                color: #8b0000;
                font-family: 'MedievalSharp', serif;
                font-size: 14px;
              }
              .fullscreen-toggle button {
                background: #1a0000;
                color: #8b0000;
                border: 2px solid #8b0000;
                padding: 8px 16px;
                font-family: 'MedievalSharp', serif;
                font-size: 12px;
                border-radius: 3px;
                cursor: pointer;
                transition: all 0.3s ease;
              }
              .fullscreen-toggle button:hover {
                background: #8b0000;
                color: #1a0000;
              }
            </style>
            <canvas id="game-canvas"></canvas>
            <div id="role-indicator">Betöltés...</div>
            <div id="fullscreen-hint">F11 - Full screen [on/off] | P - Szünet</div>
            
            <!-- Pause Menu -->
            <div id="pause-menu-overlay" class="pause-menu-overlay">
              <div class="pause-menu">
                <h2>Szünet</h2>
                
                <!-- Volume Controls Section -->
                <div class="pause-menu-section">
                  <h3>Hangerő beállítások</h3>
                  <div class="pause-volume-control">
                    <label>Zene hangerő:</label>
                    <input type="range" id="pause-music-volume-slider" min="0" max="100" value="40">
                    <span id="pause-music-volume-display">40%</span>
                  </div>
                  <div class="pause-volume-control">
                    <label>Hangeffektek:</label>
                    <input type="range" id="pause-sfx-volume-slider" min="0" max="100" value="70">
                    <span id="pause-sfx-volume-display">70%</span>
                  </div>
                </div>
                
                <!-- Fullscreen Section -->
                <div class="pause-menu-section">
                  <h3>Képernyő beállítások</h3>
                  <div class="fullscreen-toggle">
                    <label>Teljes képernyő:</label>
                    <button id="fullscreen-toggle-btn" onclick="window.toggleFullscreen()">Váltás</button>
                  </div>
                </div>
                
                <!-- Menu Buttons -->
                <div class="pause-menu-buttons">
                  <button class="pause-menu-button" onclick="window.resumeGame()">Folytatás</button>
                  <button class="pause-menu-button" onclick="window.leaveGame()">Kilépés</button>
                </div>
              </div>
            </div>
            
            <div class="action-buttons">
              <button id="infect-button" class="action-button" style="display: none;">
                <span class="action-icon">🦠</span>
                <span class="action-text">Fertőz</span>
              </button>
              <button id="stab-button" class="action-button" style="display: none;">
                <span class="action-icon">⚔️</span>
                <span class="action-text">Suhint</span>
              </button>
              <button id="slash-button" class="action-button" style="display: none;">
                <span class="action-icon">🗡️</span>
                <span class="action-text">Slash</span>
              </button>
              <button id="task-button" class="action-button" style="display: none;">
                <span class="action-icon">📜</span>
                <span class="action-text">Feladat</span>
              </button>
              <button id="clean-body-button" class="action-button" style="display: none;">
                <span class="action-icon">🧹</span>
                <span class="action-text">Takarítás</span>
              </button>
            </div>
          `;
          
          // Canvas beállítása
          const canvas = document.getElementById('game-canvas');
          if (!canvas) {
            console.error('Canvas not found');
            return;
          }
          
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
          
          // Játék modulok dinamikus betöltése és inicializálása
          Promise.all([
            import('./map.js').catch(e => { console.error('Map module error:', e); return null; }),
            import('./player.js').catch(e => { console.error('Player module error:', e); return null; }),
            import('./animation.js').catch(e => { console.error('Animation module error:', e); return null; })
          ]).then(([mapModule, playerModule, animationModule]) => {
            if (mapModule && mapModule.default) window.Map = mapModule.default;
            if (playerModule && playerModule.default) window.Player = playerModule.default;
            if (animationModule && animationModule.default) window.Animation = animationModule.default;
            
            // Játék változók beállítása
            window.Game = window.Game || {};
            window.Game.username = username;
            window.Game.character = window.selectedCharacter || 'male1';
            window.Game.playerRole = window.testRole || 'commoner';
            window.Game.groupColor = window.testGroupColor; // kiválasztott csoport szín
            
            // Szerepjelző frissítése
            const updateRoleDisplay = () => {
              const roleIndicator = document.getElementById('role-indicator');
              if (roleIndicator) {
                let roleText = '';
                const role = window.Game.playerRole;
                
                if (role === 'prince') {
                  roleText = 'Herceg';
                } else if (role === 'noble') {
                  roleText = 'Nemes';
                } else if (role === 'commoner') {
                  roleText = 'Polgár';
                } else if (role === 'plague') {
                  // Pestis lehet nemes vagy polgár alapon
                  roleText = 'Pestis-Polgár'; // alapértelmezett
                } else if (role === 'plague-noble') {
                  roleText = 'Pestis-Nemes';
                } else if (role === 'plague-commoner') {
                  roleText = 'Pestis-Polgár';
      } else {
                  roleText = role || 'Ismeretlen';
                }
                
                roleIndicator.textContent = roleText;
              }
            };
            
            // Modulok inicializálása
            try {
              console.log('Initializing game modules...');
              if (window.Map && window.Map.init) {
                window.Map.init();
                console.log('Map initialized');
              }
              if (window.Player && window.Player.init) {
                window.Player.init();
                console.log('Player initialized');
              }
              if (window.Animation && window.Animation.init) {
                window.Animation.init(window.Game.character);
                console.log('Animation initialized with character:', window.Game.character);
              }
              if (typeof NPC !== 'undefined') {
                NPC.init(); // Initialize NPCs
                window.NPC = NPC; // Make sure NPC is globally accessible
                console.log("NPC made globally accessible:", !!window.NPC);
              }
              
              // Initialize TaskBar icons
              if (window.TaskBar && window.TaskBar.initTaskIcons) {
                window.TaskBar.initTaskIcons();
                console.log('TaskBar icons initialized');
              }
              
              // Add canvas click and hover events for task icons
              const gameCanvas = document.getElementById('game-canvas');
              if (gameCanvas) {
                // Click event
                gameCanvas.addEventListener('click', (event) => {
                  const rect = gameCanvas.getBoundingClientRect();
                  const mouseX = event.clientX - rect.left;
                  const mouseY = event.clientY - rect.top;
                  
                  // Handle task icon clicks
                  if (window.TaskBar && window.TaskBar.handleIconClick) {
                    const handled = window.TaskBar.handleIconClick(mouseX, mouseY);
                    if (handled) {
                      console.log('🖱️ Task icon click handled');
                    }
                  }
                });
                
                // Mouse move event for hover effect
                gameCanvas.addEventListener('mousemove', (event) => {
                  const rect = gameCanvas.getBoundingClientRect();
                  const mouseX = event.clientX - rect.left;
                  const mouseY = event.clientY - rect.top;
                  
                  // Handle task icon hover
                  if (window.TaskBar && window.TaskBar.handleIconHover) {
                    window.TaskBar.handleIconHover(mouseX, mouseY);
                  }
                });
                
                console.log('Canvas click and hover handlers added for task icons');
              }
              
              console.log('Current game state:', {
                character: window.Game.character,
                role: window.Game.playerRole,
                groupColor: window.Game.groupColor
              });
              
              // Szerepjelző frissítése
              updateRoleDisplay();
              
              // Show action buttons based on role
              const role = window.Game.playerRole;
              console.log('Setting up action buttons for role:', role);
              if (role === 'prince') {
                const slashBtn = document.getElementById('slash-button');
                if (slashBtn) slashBtn.style.display = 'block';
                console.log('Slash button shown for prince');
                
                // Bind event handler for prince slash button
                if (slashBtn) {
                  slashBtn.addEventListener('click', function() {
                    console.log('Slash button clicked!');
                    if (window.Animation && window.Player) {
                      // Play sword swing sound
                      if (window.Audio && window.Audio.playSwordSwing) {
                        console.log('🔊 Playing sword swing sound from game.js');
                        window.Audio.playSwordSwing();
                      } else {
                        console.warn('❌ Audio system not available for sword swing');
                      }
                      
                      // Get current direction from Player
                      const direction = window.Player.direction || 'right';
                      console.log('Playing slash animation in direction:', direction);
                      
                      // Play slash animation
                      window.Animation.playSlashAnimation(direction, () => {
                        console.log('Slash animation completed');
                      });
                    }
                  });
                  console.log('Slash button event handler attached');
                }
              } else if (role === 'plague-commoner' || role === 'plague-noble' || role === 'plague') {
                const infectBtn = document.getElementById('infect-button');
                if (infectBtn) infectBtn.style.display = 'block';
                console.log('Infect button shown for plague role');
              }
              
              // Játék ciklus indítása
              function gameLoop() {
                try {
                  if (window.Player && window.Player.update) window.Player.update();
                  if (window.Map && window.Map.clear) window.Map.clear();
                  if (window.Map && window.Map.draw && window.Player) {
                    window.Map.draw(window.Player.x, window.Player.y);
                  } else if (window.Map && window.Map.draw) {
                    window.Map.draw();
                  }
                  
                  // Draw NPCs (after map, before player)
                  if (window.NPC && window.NPC.draw) {
                    console.log("Drawing NPCs in gameLoop");
                    window.NPC.draw();
                  }
                  
                  if (window.Player && window.Player.draw) window.Player.draw();
                  
                  // Draw TaskBar (after everything else, on top)
                  if (window.TaskBar && window.Player && window.Map) {
                    const canvas = document.getElementById('game-canvas');
                    const ctx = canvas ? canvas.getContext('2d') : null;
                    if (canvas && ctx) {
                      window.TaskBar.drawTaskBar(canvas, ctx, { x: window.Player.x, y: window.Player.y });
                      
                      // Draw task progress bar under player if tasking
                      if (window.TaskBar.currentTask && window.Map) {
                        // Convert world position to screen position
                        const screenPos = window.Map.worldToScreen(window.Player.x, window.Player.y);
                        window.TaskBar.drawTaskProgressBar(canvas, ctx, screenPos.x, screenPos.y);
                      }
                    }
                  }
                  
                  requestAnimationFrame(gameLoop);
                } catch (error) {
                  console.error('Game loop error:', error);
                }
              }
              
              gameLoop();
              console.log('Játék sikeresen elindult!');
              
              // Add pause menu functionality
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
              
              // Setup pause menu volume controls
              const setupPauseVolumeControls = () => {
                // Music volume control
                const pauseMusicSlider = document.getElementById('pause-music-volume-slider');
                const pauseMusicDisplay = document.getElementById('pause-music-volume-display');
                
                if (pauseMusicSlider && pauseMusicDisplay && window.Audio) {
                  pauseMusicSlider.addEventListener('input', (e) => {
                    const volume = parseInt(e.target.value) / 100;
                    window.Audio.setMusicVolume(volume);
                    pauseMusicDisplay.textContent = e.target.value + '%';
                    console.log('Music volume changed to:', volume);
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
                    console.log('SFX volume changed to:', volume);
                  });
                }
              };
              
              // Setup pause menu controls
              setTimeout(() => {
                setupPauseVolumeControls();
              }, 100);
              
              // Keyboard event handler for pause menu
              window.handleGameKeydown = function(event) {
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
                } else if (event.code === 'KeyT') {
                  // Handle task start with T key
                  event.preventDefault();
                  if (window.TaskBar && window.Player) {
                    const playerPosition = { x: window.Player.x, y: window.Player.y };
                    
                    if (window.TaskBar.canStartTask(playerPosition)) {
                      // Get current room and task zone
                      const currentRoom = window.Map ? window.Map.getCurrentRoom() : null;
                      if (currentRoom) {
                        const taskZone = window.TaskBar.taskZones[currentRoom.id];
                        if (taskZone) {
                          console.log('🔧 Starting task with T key:', taskZone.name);
                          window.TaskBar.startTask(taskZone);
                        }
                      }
                    } else {
                      console.log('❌ Cannot start task - not in task zone');
                    }
                  }
                } else if (event.code === 'KeyR') {
                  // Handle task reset with R key (for testing)
                  event.preventDefault();
                  if (window.TaskBar) {
                    console.log('🔄 Resetting tasks with R key (test function)');
                    window.TaskBar.resetTasks();
                  }
                }
              };
              
              // Add keyboard event listener
              document.addEventListener('keydown', window.handleGameKeydown);
            } catch (initError) {
              console.error('Hiba a modulok inicializálásakor:', initError);
              alert('Hiba a játék inicializálásakor: ' + initError.message);
            }
            
          }).catch(error => {
            console.error('Hiba a játék modulok betöltésekor:', error);
            alert('Hiba a játék indításakor: ' + error.message);
          });
          
        } catch (error) {
          console.error('Kritikus hiba a játék indításakor:', error);
          alert('Kritikus hiba történt: ' + error.message);
        }
      };
      
      // Alapértelmezett karakterek betöltése
      setTimeout(() => {
        window.showCharacters('male');
      }, 100);
    }
  },
  
  // Setup socket event listeners
  setupSocketListeners() {
    if (!this.socket) return;
    
    // Player joined
    SocketConnector.on('playerJoined', (player) => {
      // Add to other players
      this.players[player.id] = {
        id: player.id,
        name: player.name,
        x: player.position.x,
        y: player.position.y,
        role: player.role,
        isDead: player.isDead || false,
        isGhost: player.isGhost || false,
        isMoving: false,
        direction: 'right',
        animationFrame: 0
      };
    });
    
    // Player left
    SocketConnector.on('playerLeft', (playerId) => {
      delete this.players[playerId];
    });
    
    // Player moved
    SocketConnector.on('playerMoved', (player) => {
      if (this.players[player.id]) {
        this.players[player.id].x = player.position.x;
        this.players[player.id].y = player.position.y;
        this.players[player.id].isMoving = player.isMoving || false;
        this.players[player.id].direction = player.direction || 'right';
        this.players[player.id].animationFrame = player.animationFrame || 0;
      }
    });
    
    // Game setup events
    SocketConnector.on('gameCreated', this.handleGameCreated.bind(this));
    SocketConnector.on('gameJoined', this.handleGameJoined.bind(this));
    SocketConnector.on('updatePlayerList', this.handleUpdatePlayerList.bind(this));
    SocketConnector.on('newHost', this.handleNewHost.bind(this));
    
    // Game state events
    SocketConnector.on('gameStarted', this.handleGameStarted.bind(this));
    SocketConnector.on('roleAssigned', this.handleRoleAssigned.bind(this));
    SocketConnector.on('tasksAssigned', this.handleTasksAssigned.bind(this));
    SocketConnector.on('roundStarted', this.handleRoundStarted.bind(this));
    SocketConnector.on('roundEnded', this.handleRoundEnded.bind(this));
    SocketConnector.on('discussionStarted', this.handleDiscussionStarted.bind(this));
    SocketConnector.on('gameEnded', this.handleGameEnded.bind(this));
    SocketConnector.on('actionsCooldown', this.handleActionsCooldown.bind(this));
    
    // Player events
    SocketConnector.on('playerDied', this.handlePlayerDied.bind(this));
    SocketConnector.on('died', this.handleDied.bind(this));
    SocketConnector.on('taskCompleted', this.handleTaskCompleted.bind(this));
    SocketConnector.on('allTasksCompleted', this.handleAllTasksCompleted.bind(this));
    SocketConnector.on('bodyRemoved', this.handleBodyRemoved.bind(this));
    SocketConnector.on('commonerPromoted', this.handleCommonerPromoted.bind(this));
  },
  
  // Socket event handlers
  handleConnect() {
    console.log('Connected to server');
    this.playerId = this.socket.id;
    // Make Game object globally accessible for UI
    window.Game = this;
    console.log('Player ID set to:', this.socket.id);
  },
  
  handleDisconnect(reason) {
    console.log('Disconnected from server:', reason);
    // Reset game state
    this.resetGameState();
  },
  
  handleError(errorMsg) {
    console.error('Server error:', errorMsg);
    window.handleError(errorMsg);
  },
  
  handleGameCreated(gameCode) {
    console.log('Game created with code:', gameCode);
    this.gameCode = gameCode;
    this.isHost = true;
    this.username = this.username || document.getElementById('username-input')?.value.trim();
    
    // Make Game object globally accessible for UI
    window.Game = this;
    
    // Create the lobby interface with the real game code
    this.createLobbyInterface(this.username, gameCode);
    
    // Update the UI
    if (UI && UI.updateGameCode) {
    UI.updateGameCode(gameCode);
    }
  },
  
  handleGameJoined(gameCode) {
    console.log('Joined game with code:', gameCode);
    this.gameCode = gameCode;
    this.isHost = false;
    this.username = this.username || document.getElementById('username-input')?.value?.trim();
    
    // Make Game object globally accessible for UI
    window.Game = this;
    
    // Create the SAME lobby interface as the host
    this.createLobbyInterface(this.username, gameCode);
    
    // Hide the start button for non-hosts
    setTimeout(() => {
      const startButton = document.getElementById('start-game-button');
      if (startButton) {
        startButton.style.display = 'none';
    }
    }, 100);
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
    
    // TELJES OLDAL RESET JÁTÉKRA
    document.body.innerHTML = `
      <style>
        body { 
          margin: 0; 
          padding: 0; 
          background: #000; 
          overflow: hidden;
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
        }
        #game-screen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 0;
          display: flex;
        }
        #game-canvas {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 1;
          display: block;
        }
        .game-ui {
          position: relative;
          z-index: 10;
        }
        .action-buttons {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 15px;
          z-index: 1000;
        }
        .action-button {
          background: rgba(26, 0, 0, 0.95);
          border: 2px solid #8b0000;
          color: #8b0000;
          padding: 12px 16px;
          border-radius: 0;
          cursor: pointer;
          font-family: 'MedievalSharp', serif;
          font-size: 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          min-width: 80px;
          transition: all 0.3s ease;
          box-shadow: 0 0 10px rgba(139, 0, 0, 0.5);
        }
        .action-button:hover {
          background: #8b0000;
          color: #1a0000;
          transform: translateY(-2px);
          box-shadow: 0 2px 15px rgba(139, 0, 0, 0.8);
        }
        .action-icon {
          font-size: 24px;
          filter: grayscale(100%) sepia(100%) hue-rotate(320deg) saturate(200%);
        }
        .action-button:hover .action-icon {
          filter: grayscale(100%) sepia(100%) hue-rotate(30deg) saturate(200%);
        }
        .action-text {
          font-size: 12px;
          text-align: center;
          white-space: nowrap;
        }
        
        
        
        
        
        /* Pause Menu Styles */
        .pause-menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.8);
          z-index: 2000;
          display: none;
          justify-content: center;
          align-items: center;
        }
        .pause-menu {
          background: #1a0000;
          border: 3px solid #8b0000;
          border-radius: 10px;
          padding: 30px;
          min-width: 400px;
          max-width: 500px;
          text-align: center;
          box-shadow: 0 0 30px rgba(139, 0, 0, 0.7);
        }
        .pause-menu h2 {
          color: #8b0000;
          font-family: 'MedievalSharp', serif;
          font-size: 24px;
          margin-bottom: 25px;
          margin-top: 0;
        }
        .pause-menu-section {
          margin-bottom: 20px;
          padding: 15px;
          border: 1px solid #8b0000;
          border-radius: 5px;
          background: rgba(26, 0, 0, 0.5);
        }
        .pause-menu-section h3 {
          color: #8b0000;
          font-family: 'MedievalSharp', serif;
          font-size: 16px;
          margin-bottom: 15px;
          margin-top: 0;
        }
        .pause-volume-control {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .pause-volume-control label {
          color: #8b0000;
          font-family: 'MedievalSharp', serif;
          font-size: 14px;
          flex: 1;
          text-align: left;
        }
        .pause-volume-control input[type="range"] {
          flex: 2;
          margin: 0 10px;
          accent-color: #8b0000;
        }
        .pause-volume-control span {
          color: #8b0000;
          font-family: 'MedievalSharp', serif;
          font-size: 12px;
          width: 40px;
          text-align: right;
        }
        .pause-menu-buttons {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-top: 25px;
        }
        .pause-menu-button {
          background: #1a0000;
          color: #8b0000;
          border: 2px solid #8b0000;
          padding: 12px 20px;
          font-family: 'MedievalSharp', serif;
          font-size: 14px;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .pause-menu-button:hover {
          background: #8b0000;
          color: #1a0000;
        }
        .fullscreen-toggle {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .fullscreen-toggle label {
          color: #8b0000;
          font-family: 'MedievalSharp', serif;
          font-size: 14px;
        }
        .fullscreen-toggle button {
          background: #1a0000;
          color: #8b0000;
          border: 2px solid #8b0000;
          padding: 8px 16px;
          font-family: 'MedievalSharp', serif;
          font-size: 12px;
          border-radius: 3px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .fullscreen-toggle button:hover {
          background: #8b0000;
          color: #1a0000;
        }
      </style>
      
      <div id="game-screen" style="display: flex;">
        <canvas id="game-canvas"></canvas>
        <div class="game-ui">
          <div class="role-display"></div>
          <div class="timer-display"></div>
          <div class="mini-map"></div>
          
          <!-- Pause Menu -->
          <div id="pause-menu-overlay" class="pause-menu-overlay">
            <div class="pause-menu">
              <h2>Szünet</h2>
              
              <!-- Volume Controls Section -->
              <div class="pause-menu-section">
                <h3>Hangerő beállítások</h3>
                <div class="pause-volume-control">
                  <label>Zene hangerő:</label>
                  <input type="range" id="pause-music-volume-slider" min="0" max="100" value="40">
                  <span id="pause-music-volume-display">40%</span>
                </div>
                <div class="pause-volume-control">
                  <label>Hangeffektek:</label>
                  <input type="range" id="pause-sfx-volume-slider" min="0" max="100" value="70">
                  <span id="pause-sfx-volume-display">70%</span>
                </div>
              </div>
              
              <!-- Fullscreen Section -->
              <div class="pause-menu-section">
                <h3>Képernyő beállítások</h3>
                <div class="fullscreen-toggle">
                  <label>Teljes képernyő:</label>
                  <button id="fullscreen-toggle-btn" onclick="window.toggleFullscreen()">Váltás</button>
                </div>
              </div>
              
              <!-- Menu Buttons -->
              <div class="pause-menu-buttons">
                <button class="pause-menu-button" onclick="window.resumeGame()">Folytatás</button>
                <button class="pause-menu-button" onclick="window.leaveGame()">Kilépés</button>
              </div>
            </div>
          </div>
            <div class="volume-control-item">
              <label>Hangeffektek</label>
              <input type="range" id="online-sfx-volume-slider" min="0" max="100" value="70">
              <span id="online-sfx-volume-display">70%</span>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div class="action-buttons">
            <button id="infect-button" class="action-button" style="display: none;">
              <span class="action-icon">🦠</span>
              <span class="action-text">Fertőz</span>
            </button>
            <button id="stab-button" class="action-button" style="display: none;">
              <span class="action-icon">⚔️</span>
              <span class="action-text">Suhint</span>
            </button>
            <button id="slash-button" class="action-button" style="display: none;">
              <span class="action-icon">🗡️</span>
              <span class="action-text">Slash</span>
            </button>
            <button id="task-button" class="action-button" style="display: none;">
              <span class="action-icon">📜</span>
              <span class="action-text">Feladat</span>
            </button>
            <button id="clean-body-button" class="action-button" style="display: none;">
              <span class="action-icon">🧹</span>
              <span class="action-text">Takarítás</span>
            </button>
          </div>
        </div>
      </div>
    `;
    
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
        // Disconnect from socket if connected
        if (SocketConnector && SocketConnector.isSocketConnected()) {
          SocketConnector.disconnect();
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
    
    // Setup pause menu volume controls for online game
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
    
    // Setup pause menu controls
    setTimeout(() => {
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
    
    // Add keyboard event listener
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
    if (this.players[deathData.id]) {
      this.players[deathData.id].state = 'dead';
    }
    
    // Add the body to our list of bodies
    this.bodies[deathData.id] = {
      id: deathData.id,
      position: this.players[deathData.id].position,
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
    console.log("render() called");
    
    // Clear the canvas and draw the map (Map kezeli a kamerát is)
    if (window.Map && window.Map.draw && window.Player) {
      window.Map.draw(window.Player.x, window.Player.y);
    } else if (window.Map && window.Map.draw) {
      window.Map.draw();
    }
    
    // Draw NPCs (after map, before players)
    if (window.NPC && window.NPC.draw) {
      console.log("Drawing NPCs in render");
      window.NPC.draw();
    } else {
      console.log("NPC or NPC.draw not available:", {
        npcExists: !!window.NPC,
        drawExists: !!(window.NPC && window.NPC.draw)
      });
    }
    
    // Draw other players first (so they appear behind our player)
    this.drawPlayers();
    
    // Draw bodies
    this.drawBodies();
    
    // Draw our player last (so it's on top)
    if (window.Player && window.Player.draw) window.Player.draw();
    
    // Draw TaskBar (after everything else, on top)
    if (window.TaskBar && window.Player && window.Map) {
      const canvas = document.getElementById('game-canvas');
      const ctx = canvas ? canvas.getContext('2d') : null;
      if (canvas && ctx) {
        window.TaskBar.drawTaskBar(canvas, ctx, { x: window.Player.x, y: window.Player.y });
        
        // Draw task progress bar under player if tasking
        if (window.TaskBar.currentTask && window.Map) {
          // Convert world position to screen position
          const screenPos = window.Map.worldToScreen(window.Player.x, window.Player.y);
          window.TaskBar.drawTaskProgressBar(canvas, ctx, screenPos.x, screenPos.y);
        }
      }
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
        this.socket.emit('bodyTimeExpired', id);
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
      for (let id in this.players) {
        // Skip self and dead players
        if (id === this.playerId || this.players[id].state !== 'alive') continue;
        
        const distance = this.calculateDistance(this.position, this.players[id].position);
        
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
      for (let id in this.players) {
        // Skip self and dead players
        if (id === this.playerId || this.players[id].state !== 'alive') continue;
        
        const distance = this.calculateDistance(this.position, this.players[id].position);
        
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
      for (let id in this.players) {
        if (this.players[id].nobleGroup === this.nobleGroup) {
          players.push({
            id,
            username: this.players[id].username || 'Player',
            character: this.players[id].character || 0,
            isGhost: this.players[id].state === 'dead'
          });
        }
      }
    } else {
      // For prince discussions in rounds 4-5, include all nobles and the prince
      for (let id in this.players) {
        if (this.players[id].role === 'prince' || this.players[id].role === 'noble') {
          players.push({
            id,
            username: this.players[id].username || 'Player',
            character: this.players[id].character || 0,
            isGhost: false // Dead nobles are replaced, so no ghosts in prince discussions
          });
        }
      }
    }
    
    return players;
  },
  
  drawPlayers() {
    // Draw all other players
    for (let id in this.players) {
      if (id === this.playerId) continue;
      
      const player = this.players[id];
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
      Player.drawBody(body);
    }
  },
  
  // Send position update to server (optimalizált nagy késleltetéshez)
  sendPositionUpdate() {
    if (!this.socket || !SocketConnector.isSocketConnected()) return;
    
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
    
    // Send player position, direction and movement state to server
    SocketConnector.emit('playerMove', {
      position: this.position,
      direction: Player.direction,
      isMoving: Player.isMoving
    });
    
    // Update tracking variables
    this.lastPositionUpdate = now;
    this.lastSentPosition = { x: this.position.x, y: this.position.y };
    this.lastSentMoving = Player.isMoving;
  }
}; 

// Export the Game object
export default Game; 
