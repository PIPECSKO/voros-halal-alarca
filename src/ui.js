// UI Manager for the game
import Game from './game.js';
import assetLoader from './asset_loader.js';

const UI = {
  // Current active screen
  activeScreen: null,
  
  // Initialize UI
  init() {
    console.log("Initializing UI...");
    
    try {
      // Add error handling for all UI operations
      this.setupErrorHandling();
      
      // Set up screen transitions and event listeners
      this.setupEventListeners();
      
      console.log("UI initialization complete");
    } catch (error) {
      console.error("UI initialization error:", error);
      this.showError("UI initialization failed. Please refresh the page.");
    }
  },
  
  // Set up error handling
  setupErrorHandling() {
    // Handle errors in event listeners
    window.addEventListener('error', (event) => {
      console.error("Global error:", event.error);
      this.showError("An unexpected error occurred. See console for details.");
    });
    
    // Set up the error dialog button
    const errorOkButton = document.getElementById('error-ok-button');
    if (errorOkButton) {
      errorOkButton.addEventListener('click', () => {
        document.getElementById('error-message').style.display = 'none';
      });
    }
  },
  
  // Set up event listeners for UI elements
  setupEventListeners() {
    try {
      // Main menu buttons
      this.addClickHandler('host-button', () => {
        const username = document.getElementById('username-input')?.value?.trim() || 'Player';
        if (username) {
          Game.username = username;
          if (Game.socket && Game.socket.connected) {
            Game.socket.emit('hostGame', username);
          } else {
            // OFFLINE: automatikus játékindítás karakterrel
            Game.gameCode = Math.floor(Math.random() * 90000 + 10000).toString(); // Generate random 5-digit code
            Game.isHost = true;
            this.updateGameCode(Game.gameCode);
            this.showScreen('game-screen');
            Game.character = window.selectedCharacter || 'male1';
            try {
              if (typeof Map !== 'undefined') Map.init();
              if (typeof Player !== 'undefined') Player.init();
              if (typeof Animation !== 'undefined') Animation.init(Game.character);
            } catch (e) {
              console.error("Error initializing game components:", e);
            }
            Game.gameLoop();
          }
        } else {
          this.showError("Kérlek, add meg a neved!");
        }
      });
      
      this.addClickHandler('join-button', () => {
        const username = document.getElementById('username-input')?.value?.trim() || '';
        const joinCodeGroup = document.getElementById('join-code-group');
        
        if (!username) {
          this.showError("Kérlek, add meg a neved!");
          return;
        }
        
        Game.username = username;
        
        // Show the room code input field
        if (joinCodeGroup) {
          joinCodeGroup.style.display = 'block';
          const gameCodeInput = document.getElementById('game-code-input');
          if (gameCodeInput) {
            gameCodeInput.focus();
          }
        }
      });
      
      // New join-now button handler
      this.addClickHandler('join-now-button', () => {
        const username = document.getElementById('username-input')?.value?.trim() || '';
        const gameCode = document.getElementById('game-code-input')?.value?.trim() || '';
        
        if (!username) {
          this.showError("Kérlek, add meg a neved!");
          return;
        }
        
        if (!gameCode) {
          this.showError("Kérlek, add meg a szobakódot!");
          return;
        }
        
        Game.username = username;
        Game.gameCode = gameCode;
        
        // Attempt to join the game
        if (Game.socket && Game.socket.connected) {
          Game.socket.emit('joinGame', { gameCode, username });
        } else {
          console.log("Socket not connected, attempting to join offline with code:", gameCode);
          this.showError("Nincs kapcsolat a szerverrel. Próbáld újra később, vagy ellenőrizd az internetkapcsolatot.");
        }
      });
      
      // Start button
      this.addClickHandler('start-button', () => {
        if (Game.socket && Game.socket.connected) {
          Game.socket.emit('startGame');
        } else {
          this.showScreen('game-screen');
          Game.character = window.selectedCharacter || 'male1';
          try {
            if (typeof Map !== 'undefined') Map.init();
            if (typeof Player !== 'undefined') Player.init();
            if (typeof Animation !== 'undefined') Animation.init(Game.character);
          } catch (e) {
            console.error("Error initializing game components:", e);
          }
          Game.gameLoop();
        }
      });
      
      // Ready button
      this.addClickHandler('ready-button', () => {
        if (Game.socket && Game.socket.connected) {
          Game.socket.emit('toggleReady');
        } else {
          // Offline mode - just toggle the button text
          const readyBtn = document.getElementById('ready-button');
          if (readyBtn) {
            const isReady = readyBtn.textContent.includes('Nem vagyok kész');
            readyBtn.textContent = isReady ? 'Kész vagyok' : 'Nem vagyok kész';
          }
        }
      });
      
      // Game action buttons
      this.addClickHandler('task-button', this.handleTaskAction);
      this.addClickHandler('clean-body-button', this.handleCleanBodyAction);
      this.addClickHandler('infect-button', this.handleInfectAction);
      this.addClickHandler('stab-button', this.handleStabAction);
      
      // Add Enter key handler for game code input
      const gameCodeInput = document.getElementById('game-code-input');
      if (gameCodeInput) {
        gameCodeInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            // Trigger the join-now button click instead of join button
            const joinNowButton = document.getElementById('join-now-button');
            if (joinNowButton) {
              joinNowButton.click();
            }
          }
        });
      }
      
      // Button hover effects
      document.querySelectorAll('button').forEach(button => {
        button.addEventListener('mouseenter', () => {
          button.style.transform = 'scale(1.05)';
        });
        button.addEventListener('mouseleave', () => {
          button.style.transform = 'scale(1)';
        });
      });
    } catch (error) {
      console.error("Error setting up event listeners:", error);
    }
  },
  
  // Helper to add click handlers with error handling
  addClickHandler(elementId, handler) {
    const element = document.getElementById(elementId);
    if (element) {
      element.addEventListener('click', handler);
    } else {
      console.warn(`Element #${elementId} not found, skipping click handler`);
    }
  },
  
  // Show a screen (hide all others)
  showScreen(screenId) {
    try {
      // Hide all screens
      const screens = document.querySelectorAll('.screen');
      screens.forEach(screen => {
        screen.style.display = 'none';
      });
      
      // Show the requested screen
      const screen = document.getElementById(screenId);
      if (screen) {
        screen.style.display = 'flex';
        this.activeScreen = screenId;
        // Ha lobby, karakterválasztó setup - MINDEN esetben
        if (screenId === 'lobby-screen') {
          // Kis delay után setupoljuk, hogy az elemek már létezzenek
          setTimeout(() => {
            this.setupLobbyCharacterSelection();
          }, 100);
        }
      } else {
        console.error(`Screen not found: ${screenId}`);
      }
    } catch (error) {
      console.error(`Error showing screen ${screenId}:`, error);
    }
  },
  
  // Show error message
  showError(message) {
    try {
      console.error("UI Error:", message);
      
      const errorText = document.getElementById('error-text');
      if (errorText) {
        errorText.textContent = message;
      }
      
      const errorOverlay = document.getElementById('error-message');
      if (errorOverlay) {
        errorOverlay.style.display = 'flex';
      } else {
        alert(message); // Fallback to alert if error overlay fails
      }
    } catch (error) {
      console.error("Error showing error message:", error);
      alert(message); // Ultimate fallback
    }
  },
  
  // Update game code display
  updateGameCode(gameCode) {
    try {
      const codeElement = document.getElementById('game-code');
      if (codeElement) {
        codeElement.textContent = gameCode;
      }
    } catch (error) {
      console.error("Error updating game code:", error);
    }
  },
  
  // Update player list
  updatePlayerList(players) {
    try {
      console.log('updatePlayerList', players); // DEBUG LOG
      const playerList = document.getElementById('player-list');
      if (!playerList) return;
      
      // Clear the list
      playerList.innerHTML = '';
      
      // Saját játékos azonosító lekérése
      let myId = null;
      if (window.Game && window.Game.playerId) {
        myId = window.Game.playerId;
      }
      let myReady = false;
      
      // Add each player
      players.forEach(player => {
        const li = document.createElement('li');
        li.textContent = player.name || player.username || "Unknown Player";
        
        if (player.ready) {
          li.classList.add('ready');
          li.textContent += ' ✓';
        }
        if (myId && player.id === myId) {
          myReady = !!player.ready;
        }
        playerList.appendChild(li);
      });
      // Ready gomb szövegének frissítése
      const readyBtn = document.getElementById('ready-button');
      if (readyBtn) {
        readyBtn.textContent = myReady ? 'Nem vagyok kész' : 'Kész vagyok';
      }
    } catch (error) {
      console.error("Error updating player list:", error);
    }
  },
  
  // Update role display
  updateRoleDisplay(role) {
    try {
      const roleValue = document.getElementById('role-value');
      if (roleValue) {
        // Translate role to Hungarian
        const roleNames = {
          'prince': 'Herceg',
          'noble': 'Nemes',
          'commoner': 'Polgár',
          'plague': 'Pestis'
        };
        
        roleValue.textContent = roleNames[role] || role;
        
        // Add role-specific styling
        roleValue.className = '';
        roleValue.classList.add(role);
      }
    } catch (error) {
      console.error("Error updating role display:", error);
    }
  },
  
  // Update task list
  updateTaskList(tasks) {
    try {
      const tasksList = document.getElementById('tasks');
      if (!tasksList) return;
      
      // Clear the list
      tasksList.innerHTML = '';
      
      // Add each task
      if (tasks && tasks.length > 0) {
        tasks.forEach(task => {
          const li = document.createElement('li');
          
          // Translate task types to Hungarian
          const taskNames = {
            'dance': 'Tánc',
            'eat': 'Evés',
            'cards': 'Kártyázás',
            'toilet': 'WC',
            'smoke': 'Dohányzás',
            'drink': 'Ivás'
          };
          
          const roomNames = {
            'red': 'Vörös',
            'blue': 'Kék',
            'green': 'Zöld',
            'orange': 'Narancssárga',
            'white': 'Fehér',
            'purple': 'Lila',
            'black': 'Fekete'
          };
          
          li.textContent = `${taskNames[task.id] || task.id} (${roomNames[task.room] || task.room})`;
          tasksList.appendChild(li);
        });
      } else {
        // Show a message if no tasks
        const li = document.createElement('li');
        li.textContent = 'Nincsenek feladatok';
        tasksList.appendChild(li);
      }
    } catch (error) {
      console.error("Error updating task list:", error);
    }
  },
  
  // Update round timer
  updateRoundTimer(timeValue) {
    try {
      const timerElement = document.getElementById('timer-value');
      if (timerElement) {
        const minutes = Math.floor(timeValue / 60);
        const seconds = timeValue % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
    } catch (error) {
      console.error("Error updating round timer:", error);
    }
  },
  
  // Update discussion timer
  updateDiscussionTimer(timeValue) {
    try {
      const timerElement = document.getElementById('discussion-timer');
      if (timerElement) {
        const minutes = Math.floor(timeValue / 60);
        const seconds = timeValue % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
    } catch (error) {
      console.error("Error updating discussion timer:", error);
    }
  },
  
  // Set up discussion table
  setupDiscussionTable(tableData) {
    try {
      const table = document.getElementById('discussion-table');
      if (!table) return;
      
      // Clear the table
      table.innerHTML = '';
      
      // Create header
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      
      const header = document.createElement('th');
      header.colSpan = 2;
      header.textContent = tableData.type === 'noble' 
        ? `${tableData.groupColor} csoport megbeszélés` 
        : 'Hercegi megbeszélés';
      
      headerRow.appendChild(header);
      thead.appendChild(headerRow);
      table.appendChild(thead);
      
      // Create body
      const tbody = document.createElement('tbody');
      
      // Add players to table
      if (tableData.players && tableData.players.length > 0) {
        tableData.players.forEach(player => {
          const row = document.createElement('tr');
          
          // Player name cell
          const nameCell = document.createElement('td');
          nameCell.textContent = player.name || "Játékos";
          if (player.isGhost) {
            nameCell.classList.add('ghost');
          }
          row.appendChild(nameCell);
          
          // Player role cell
          const roleCell = document.createElement('td');
          roleCell.textContent = player.role || "?";
          row.appendChild(roleCell);
          
          tbody.appendChild(row);
        });
      } else {
        // Show a message if no players
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 2;
        cell.textContent = 'Nincsenek résztvevők';
        row.appendChild(cell);
        tbody.appendChild(row);
      }
      
      table.appendChild(tbody);
    } catch (error) {
      console.error("Error setting up discussion table:", error);
    }
  },
  
  // Show game over message
  showGameOver(message) {
    try {
      const winnerMessage = document.getElementById('winner-message');
      if (winnerMessage) {
        winnerMessage.textContent = message;
      }
      
      this.showScreen('game-over-screen');
    } catch (error) {
      console.error("Error showing game over screen:", error);
      alert(`Game Over: ${message}`);
    }
  },
  
  // Toggle visibility of action buttons
  toggleActionButton(buttonId, show, targetId) {
    try {
      const button = document.getElementById(buttonId);
      if (button) {
        button.style.display = show ? 'block' : 'none';
        
        if (targetId) {
          button.dataset.targetId = targetId;
        } else {
          delete button.dataset.targetId;
        }
      }
    } catch (error) {
      console.error(`Error toggling action button ${buttonId}:`, error);
    }
  },
  
  // Handler for task action button
  handleTaskAction() {
    const taskId = this.dataset.targetId;
    if (taskId && Game.socket) {
      Game.socket.emit('completeTask', taskId);
    }
  },
  
  // Handler for clean body action button
  handleCleanBodyAction() {
    const bodyId = this.dataset.targetId;
    if (bodyId && Game.socket) {
      Game.socket.emit('cleanBody', bodyId);
    }
  },
  
  // Handler for infect action button
  handleInfectAction() {
    const targetId = this.dataset.targetId;
    if (targetId && Game.socket) {
      Game.socket.emit('infect', targetId);
    }
  },
  
  // Handler for stab action button
  handleStabAction() {
    const targetId = this.dataset.targetId;
    if (targetId && Game.socket) {
      Game.socket.emit('stab', targetId);
    }
  },
  
  // Lobby gender és karakterválasztó logika
  setupLobbyCharacterSelection() {
    const gallery = document.getElementById('character-gallery');
    if (!gallery) return;
    // Elérhető karakterek
    const characters = {
      male: [
        { key: 'male1', img: 'assets/images/characters/males/male1/idle/male1_idle_facing_right1.png' },
        { key: 'male2', img: 'assets/images/characters/males/male2/idle/male2_idle_facing_right1.png' },
        { key: 'male3', img: 'assets/images/characters/males/male3/idle/male3_idle_facing_right1.png' },
        { key: 'male4', img: 'assets/images/characters/males/male4/idle/male4_idle_facing_right1.png' }
      ],
      female: [
        { key: 'female1', img: 'assets/images/characters/females/female1/idle/female1_idle_facing_right1.png' },
        { key: 'female2', img: 'assets/images/characters/females/female2/idle/female2_idle_facing_right1.png' },
        { key: 'female3', img: 'assets/images/characters/females/female3/idle/female3_idle_facing_right1.png' },
        { key: 'female4', img: 'assets/images/characters/females/female4/idle/female4_idle_facing_right1.png' }
      ]
    };
    // Alapértelmezett: egyik sem kiválasztva
    if (!window.selectedCharacter) window.selectedCharacter = null;
    gallery.innerHTML = '';
    // Gender gombok eseménykezelői
    document.getElementById('gender-male').onclick = () => {
      gallery.innerHTML = '';
      characters.male.forEach(char => {
        const img = document.createElement('img');
        img.src = char.img;
        img.alt = char.key;
        img.style.width = '64px';
        img.style.height = '96px';
        img.style.cursor = 'pointer';
        img.style.border = '2px solid transparent';
        img.onclick = () => {
          window.selectedCharacter = char.key;
          Array.from(gallery.children).forEach(child => child.style.border = '2px solid transparent');
          img.style.border = '2px solid #FFD700';
        };
        gallery.appendChild(img);
      });
    };
    document.getElementById('gender-female').onclick = () => {
      gallery.innerHTML = '';
      characters.female.forEach(char => {
        const img = document.createElement('img');
        img.src = char.img;
        img.alt = char.key;
        img.style.width = '64px';
        img.style.height = '96px';
        img.style.cursor = 'pointer';
        img.style.border = '2px solid transparent';
        img.onclick = () => {
          window.selectedCharacter = char.key;
          Array.from(gallery.children).forEach(child => child.style.border = '2px solid transparent');
          img.style.border = '2px solid #FFD700';
        };
        gallery.appendChild(img);
      });
    };
  }
};

// Export the UI object
export default UI; 