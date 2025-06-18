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
        console.log('[UI] Host button clicked, username:', username, 'peer connected:', window.PeerConnector && window.PeerConnector.isConnected);
        if (username) {
          Game.username = username;
          if (window.PeerConnector && window.PeerConnector.isConnected) {
            console.log('[UI] Calling Game.hostGame');
            Game.hostGame(username);
          } else {
            // OFFLINE: automatikus játékindítás karakterrel
            console.log('[UI] OFFLINE fallback, going straight to game-screen');
            Game.gameCode = Math.floor(Math.random() * 90000 + 10000).toString(); // Generate random 5-digit code
            Game.isHost = true;
            this.updateGameCode(Game.gameCode);
            this.showScreen('game-screen');
            Game.character = window.selectedCharacter || 'male1';
            try {
              if (typeof GameMap !== 'undefined') GameMap.init();
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
        if (Game.peer && Game.peer.isConnected) {
          Game.joinGame(gameCode, username);
        } else {
          console.log("Peer not connected, attempting to join offline with code:", gameCode);
          this.showError("Nincs kapcsolat a szerverrel. Próbáld újra később, vagy ellenőrizd az internetkapcsolatot.");
        }
      });
      
      // Start game button
      this.addClickHandler('start-button', () => {
        if (Game && Game.isHost) {
          Game.startGame();
        }
      });
      
      // Ready button
      this.addClickHandler('ready-button', () => {
        if (Game.peer && Game.peer.isConnected) {
          Game.toggleReady();
        } else {
          // Offline mode - just toggle the button text
          const readyBtn = document.getElementById('ready-button');
          if (readyBtn) {
            const isReady = readyBtn.textContent.includes('Nem vagyok kész');
            readyBtn.textContent = isReady ? 'Kész vagyok' : 'Nem vagyok kész';
          }
        }
      });
      
      // DEBUG: Manual character setup button
      this.addClickHandler('debug-character-setup', () => {
        console.log('🔧 DEBUG: Manual character setup triggered');
        this.setupLobbyCharacterSelection();
      });

      // Game action buttons
      this.addClickHandler('task-button', this.handleTaskAction);
      this.addClickHandler('clean-body-button', this.handleCleanBodyAction);
      this.addClickHandler('infect-button', this.handleInfectAction);
      this.addClickHandler('stab-button', this.handleStabAction);
      this.addClickHandler('slash-button', this.handleSlashAction);
      
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
      console.log('[UI] showScreen called with:', screenId); // Debug log
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
            // --- Ensure game code is set after render ---
            if (window.Game && window.Game.gameCode) {
              // Display the full game code (including timestamp) for joining
              UI.updateGameCode(window.Game.gameCode);
            }
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
      if (!message) {
        // Hide error overlay if message is empty
        const errorOverlay = document.getElementById('error-message');
        if (errorOverlay) errorOverlay.style.display = 'none';
        return;
      }
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
      console.log('[UI] updateGameCode called with:', gameCode); // DEBUG LOG
      const codeElement = document.getElementById('lobby-game-code-value');
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
      console.log('updatePlayerList called with:', players); // DEBUG LOG
      const playerListElement = document.getElementById('player-list');
      if (!playerListElement) {
        console.warn('player-list element not found');
        return;
      }
      
      // Clear the list
      playerListElement.innerHTML = '';
      
      // Get our player ID - try multiple sources
      let myId = null;
      if (window.Game && window.Game.playerId) {
        myId = window.Game.playerId;
      } else if (window.Game && window.Game.peer && window.Game.peer.id) {
        myId = window.Game.peer.id;
      }
      console.log('My ID for player list:', myId); // DEBUG LOG
      
      let myReady = false;
      let playerCount = 0;
      let readyCount = 0;
      
      // Add each player with improved ready status display
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
      const startBtn = document.getElementById('start-button');
      if (startBtn && window.Game && window.Game.isHost) {
        if (readyCount === playerCount && playerCount > 1) {
          startBtn.disabled = false;
          startBtn.textContent = 'Játék indítása';
        } else if (playerCount <= 1) {
          startBtn.disabled = true;
          startBtn.textContent = 'Legalább 2 játékos kell!';
        } else {
          startBtn.disabled = true;
          startBtn.textContent = 'Mindenki legyen kész!';
        }
        startBtn.style.display = '';
        startBtn.style.visibility = 'visible';
      }
      
      console.log(`Player list updated: ${readyCount}/${playerCount} ready, my ready status:`, myReady); // DEBUG LOG
    } catch (error) {
      console.error("Error updating player list:", error);
    }
  },
  
  // Update role display
  updateRoleDisplay(role) {
    try {
      const roleDisplay = document.querySelector('.role-display');
      if (roleDisplay) {
        // Translate role to Hungarian
        const roleNames = {
          'prince': 'Herceg',
          'noble': 'Nemes',
          'commoner': 'Polgár',
          'plague': 'Pestis'
        };
        
        roleDisplay.textContent = roleNames[role] || role;
        
        // Add role-specific styling
        roleDisplay.className = 'role-display ' + role;
      }
    } catch (error) {
      console.error("Error updating role display:", error);
    }
  },
  
  // Update task list
  updateTaskList(tasks) {
    try {
      const tasksList = document.getElementById('task-list');
      if (!tasksList) return;
      tasksList.innerHTML = '';
      // Csak a három fő taskot jelenítjük meg
      const allTasks = [
        { id: 'cards', name: 'Kártyázás', icon: 'assets/images/task/poker_icon.png' },
        { id: 'eating', name: 'Evés', icon: 'assets/images/task/eating_icon.png' },
        { id: 'dancing', name: 'Táncolás', icon: 'assets/images/task/dancing_icon.png' }
      ];
      allTasks.forEach(task => {
          const li = document.createElement('li');
        const img = document.createElement('img');
        img.src = task.icon;
        img.alt = task.name;
        li.appendChild(img);
        li.appendChild(document.createTextNode(task.name));
          tasksList.appendChild(li);
        });
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
    if (taskId && Game.peer && Game.peer.isConnected) {
      Game.completeTask(taskId);
    }
  },
  
  // Handler for clean body action button
  handleCleanBodyAction() {
    const bodyId = this.dataset.targetId;
    if (bodyId && Game.peer && Game.peer.isConnected) {
      Game.cleanBody(bodyId);
    }
  },
  
  // Handler for infect action button
  handleInfectAction() {
    const targetId = this.dataset.targetId;
    if (targetId && Game.peer && Game.peer.isConnected) {
      Game.infect(targetId);
    }
  },
  
  // Handler for stab action button
  handleStabAction() {
    const targetId = this.dataset.targetId;
    if (targetId && Game.peer && Game.peer.isConnected) {
      Game.stab(targetId);
    }
  },
  
  // Handler for slash animation button
  handleSlashAction() {
    console.log('🗡️ Slash animation triggered for prince');
    console.log('Current character:', window.selectedCharacter);
    console.log('Current role:', window.Game ? window.Game.playerRole : 'No Game object');
    console.log('Animation object:', !!window.Animation);
    console.log('Audio object:', !!window.Audio);
    
    // Check if character is prince (either by role or selected character)
    const isPrince = (window.selectedCharacter === 'prince') || 
                     (window.Game && window.Game.playerRole === 'prince') ||
                     (window.testRole === 'prince');
    
    console.log('Is Prince?', isPrince);
    
    if (window.Animation && isPrince) {
      // Play sword swing sound
      if (window.Audio) {
        console.log('🔊 Attempting to play sword swing sound...');
        window.Audio.playSwordSwing();
      } else {
        console.warn('❌ Audio object not available');
      }
      
      // Determine direction based on player's current direction
      const direction = (window.Player && window.Player.direction) || 'right';
      console.log('Playing slash animation in direction:', direction);
      window.Animation.playSlashAnimation(direction, () => {
        console.log('Slash animation completed');
      });
    } else {
      console.log('Slash animation not available. Character:', window.selectedCharacter, 'Role:', window.Game ? window.Game.playerRole : 'none');
    }
  },
  
  // Lobby gender és karakterválasztó logika - TELJES ÚJRAÍRÁS
  setupLobbyCharacterSelection() {
    console.log('🔍 setupLobbyCharacterSelection called! - NEW VERSION');
    const gallery = document.getElementById('character-gallery');
    if (!gallery) {
      console.warn('character-gallery not found!');
      return;
    }
    console.log('✅ character-gallery found:', gallery, gallery.style.display);
    
    // FORCE CLEAR EVERYTHING
    gallery.innerHTML = '';
    gallery.style.display = 'grid';
    gallery.style.gridTemplateColumns = 'repeat(4, 1fr)';
    gallery.style.gap = '10px';
    gallery.style.padding = '10px';
    
    // HARD-CODED karakterek (NO CACHE ISSUES!)
    console.log('🎭 Setting up character arrays...');
    const allFemaleCharacters = [
      'female1', 'female2', 'female3', 'female4', 'female5', 'female6', 
      'female7', 'female8', 'female9', 'female10', 'female11', 'female12',
      'female13', 'female14', 'female15'
    ];
    console.log('👩 Female characters configured:', allFemaleCharacters);
    
    const allMaleCharacters = [
      'male1', 'male2', 'male3', 'male4', 'male5', 'male6',
      'male7', 'male8', 'male9', 'male10', 'male11', 'male12',
      'male13', 'male14', 'male15'
    ];
    
    // Alapértelmezett: egyik sem kiválasztva
    if (!window.selectedCharacter) window.selectedCharacter = null;
    
    // Gender gombok eseménykezelői - ÚJ IMPLEMENTÁCIÓ
    const maleBtn = document.getElementById('gender-male');
    const femaleBtn = document.getElementById('gender-female');
    const specialBtn = document.getElementById('gender-special');
    
    if (maleBtn) {
      maleBtn.onclick = () => {
        console.log('👨 Male gender button clicked!');
        gallery.innerHTML = '';
        console.log('📋 Male characters to display:', allMaleCharacters.length);
        
        allMaleCharacters.forEach(charKey => {
          console.log('➕ Adding male character:', charKey);
          const img = document.createElement('img');
          img.src = `assets/images/characters/males/${charKey}/idle/${charKey}_idle_facing_right1.png?v=${Date.now()}`;
          img.alt = charKey;
          img.style.cursor = 'pointer';
          img.style.border = '3px solid transparent';
          img.style.borderRadius = '5px';
          img.style.width = '80px';
          img.style.height = '120px';
          img.style.objectFit = 'contain';
          img.onclick = () => {
            window.selectedCharacter = charKey;
            Array.from(gallery.children).forEach(child => child.style.border = '3px solid transparent');
            img.style.border = '3px solid #FFD700';
            // Update preview
            const preview = document.getElementById('character-preview');
            if (preview) {
              preview.innerHTML = '';
              const previewImg = document.createElement('img');
              previewImg.src = img.src;
              previewImg.alt = charKey;
              previewImg.style.width = '80px';
              previewImg.style.height = '120px';
              previewImg.style.objectFit = 'contain';
              preview.appendChild(previewImg);
            }
            // Remove error message if any
            if (UI && UI.showError) UI.showError('');
            console.log('Selected character:', charKey);
          };
          gallery.appendChild(img);
        });
      };
    }
    
    if (femaleBtn) {
      femaleBtn.onclick = () => {
        console.log('🚺 Female gender button clicked! - NEW VERSION');
        gallery.innerHTML = '';
        console.log('📋 Female characters to display:', allFemaleCharacters.length);
        
        // Preload images first
        const preloadPromises = allFemaleCharacters.map((charKey, index) => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            const imgPath = `assets/images/characters/females/${charKey}/idle/${charKey}_idle_facing_right1.png?v=${Date.now()}`;
            console.log(`🔄 Preloading female character ${index + 1}/${allFemaleCharacters.length}: ${charKey}`);
            
            img.onload = () => {
              console.log(`✅ Successfully preloaded: ${charKey}`);
              resolve({ charKey, img, success: true });
            };
            
            img.onerror = () => {
              console.error(`❌ Failed to preload: ${charKey}`);
              resolve({ charKey, success: false });
            };
            
            img.src = imgPath;
          });
        });
        
        // Wait for all images to preload then add them to gallery
        Promise.all(preloadPromises).then(results => {
          results.forEach(result => {
            if (result.success) {
              const img = document.createElement('img');
              img.src = result.img.src;
              img.alt = result.charKey;
              img.style.cursor = 'pointer';
              img.style.border = '3px solid transparent';
              img.style.borderRadius = '5px';
              img.style.width = '80px';
              img.style.height = '120px';
              img.style.objectFit = 'contain';
              img.onclick = () => {
                window.selectedCharacter = result.charKey;
                Array.from(gallery.children).forEach(child => child.style.border = '3px solid transparent');
                img.style.border = '3px solid #FFD700';
                // Update preview
                const preview = document.getElementById('character-preview');
                if (preview) {
                  preview.innerHTML = '';
                  const previewImg = document.createElement('img');
                  previewImg.src = img.src;
                  previewImg.alt = result.charKey;
                  previewImg.style.width = '80px';
                  previewImg.style.height = '120px';
                  previewImg.style.objectFit = 'contain';
                  preview.appendChild(previewImg);
                }
                // Remove error message if any
                if (UI && UI.showError) UI.showError('');
                console.log('Selected character:', result.charKey);
              };
              gallery.appendChild(img);
            }
          });
          
          console.log('✨ Gallery population complete!');
        });
      };
    }
    
    if (specialBtn) {
      specialBtn.onclick = () => {
        console.log('👑 Special gender button clicked!');
        gallery.innerHTML = '';
        
        const img = document.createElement('img');
        img.src = 'assets/images/characters/prince/idle/prince_idle_facing_right1.png';
        img.alt = 'prince';
        img.style.cursor = 'pointer';
        img.style.border = '3px solid transparent';
        img.style.borderRadius = '5px';
        img.style.width = '80px';
        img.style.height = '120px';
        img.style.objectFit = 'contain';
        img.onclick = () => {
          window.selectedCharacter = 'prince';
          Array.from(gallery.children).forEach(child => child.style.border = '3px solid transparent');
          img.style.border = '3px solid #FFD700';
          // Update preview
          const preview = document.getElementById('character-preview');
          if (preview) {
            preview.innerHTML = '';
            const previewImg = document.createElement('img');
            previewImg.src = img.src;
            previewImg.alt = 'prince';
            previewImg.style.width = '80px';
            previewImg.style.height = '120px';
            previewImg.style.objectFit = 'contain';
            preview.appendChild(previewImg);
          }
          // Remove error message if any
          if (UI && UI.showError) UI.showError('');
          console.log('Selected character: prince');
        };
        gallery.appendChild(img);
      };
    }
    
    // Automatically show male characters by default
    this.selectedGender = 'male';
    this.renderCharacterGallery(allMaleCharacters);

    // Show dev role select if present
    const devRoleSelectContainer = document.getElementById('dev-role-select-container');
    if (devRoleSelectContainer) {
      devRoleSelectContainer.style.display = 'block';
      const devRoleSelect = document.getElementById('dev-role-select');
      if (devRoleSelect) {
        devRoleSelect.onchange = (e) => {
          const role = e.target.value;
          if (window.Game) {
            window.Game.devSelectedRole = role;
            console.log('[DEV] Selected role:', role);
          }
        };
      }
    }

    // Color select
    const colorSelect = document.getElementById('color-select');
    if (colorSelect) {
      colorSelect.onchange = (e) => {
        const color = e.target.value;
        if (window.Game) {
          window.Game.selectedColor = color;
          console.log('[LOBBY] Selected color:', color);
        }
      };
      // Set default color if not already set
      if (window.Game && !window.Game.selectedColor) {
        window.Game.selectedColor = colorSelect.value;
      }
    }

    console.log('✅ Character selection setup completed!');
  },
  
  // Render character gallery
  renderCharacterGallery(characters) {
    const gallery = document.getElementById('character-gallery');
    if (!gallery) return;
    gallery.innerHTML = '';
    characters.forEach(charKey => {
      const img = document.createElement('img');
      img.src = `assets/images/characters/males/${charKey}/idle/${charKey}_idle_facing_right1.png?v=${Date.now()}`;
      img.alt = charKey;
      img.style.cursor = 'pointer';
      img.style.border = '3px solid transparent';
      img.style.borderRadius = '5px';
      img.style.width = '80px';
      img.style.height = '120px';
      img.style.objectFit = 'contain';
      img.onclick = () => {
        window.selectedCharacter = charKey;
        Array.from(gallery.children).forEach(child => child.style.border = '3px solid transparent');
        img.style.border = '3px solid #FFD700';
        // Update preview
        const preview = document.getElementById('character-preview');
        if (preview) {
          preview.innerHTML = '';
          const previewImg = document.createElement('img');
          previewImg.src = img.src;
          previewImg.alt = charKey;
          previewImg.style.width = '80px';
          previewImg.style.height = '120px';
          previewImg.style.objectFit = 'contain';
          preview.appendChild(previewImg);
        }
        // Remove error message if any
        if (UI && UI.showError) UI.showError('');
        console.log('Selected character:', charKey);
      };
      gallery.appendChild(img);
    });
  }
};

// Export the UI object
export default UI; 

// Task Bar System - Shows task zones at bottom of screen
const TaskBar = {
  // Task icons
  taskIcons: {},
  
  // Initialize task icons
  initTaskIcons() {
    console.log("Loading task icons...");
    
    // Load eating icon
    this.taskIcons.eating = new Image();
    this.taskIcons.eating.src = 'assets/images/task/eating_icon.png';
    this.taskIcons.eating.onload = () => {
      console.log("✓ eating_icon.png loaded successfully");
    };
    this.taskIcons.eating.onerror = (e) => {
      console.error("✗ Error loading eating_icon.png:", e);
    };
    
    // Load poker icon
    this.taskIcons.poker = new Image();
    this.taskIcons.poker.src = 'assets/images/task/poker_icon.png';
    this.taskIcons.poker.onload = () => {
      console.log("✓ poker_icon.png loaded successfully");
    };
    this.taskIcons.poker.onerror = (e) => {
      console.error("✗ Error loading poker_icon.png:", e);
    };
    
    // Load drinking icon
    this.taskIcons.drinking = new Image();
    this.taskIcons.drinking.src = 'assets/images/task/drinking_icon.png';
    this.taskIcons.drinking.onload = () => {
      console.log("✓ drinking_icon.png loaded successfully");
    };
    this.taskIcons.drinking.onerror = (e) => {
      console.error("✗ Error loading drinking_icon.png:", e);
    };
    
    // Load smoking icon
    this.taskIcons.smoking = new Image();
    this.taskIcons.smoking.src = 'assets/images/task/smoking_icon.png';
    this.taskIcons.smoking.onload = () => {
      console.log("✓ smoking_icon.png loaded successfully");
    };
    this.taskIcons.smoking.onerror = (e) => {
      console.error("✗ Error loading smoking_icon.png:", e);
    };
    
    // Load dancing icon
    this.taskIcons.dancing = new Image();
    this.taskIcons.dancing.src = 'assets/images/task/dancing_icon.png';
    this.taskIcons.dancing.onload = () => {
      console.log("✓ dancing_icon.png loaded successfully");
    };
    this.taskIcons.dancing.onerror = (e) => {
      console.error("✗ Error loading dancing_icon.png:", e);
    };
  },

  // Task zone definitions for each room (x coordinates relative to room start)
  taskZones: {
    'green': { 
      name: 'Kártyaasztal', 
      startX: 600,  // Card table start position in room
      endX: 1320,   // Card table end position in room
      roomIndex: 4, // Green room is at index 4
      id: 'cards',  // Unique task ID
      y: 713       // Fixed Y position for task
    },
    'red': { 
      name: 'Étkezőasztal', 
      startX: 500,  // Dining table start position in room
      endX: 1420,   // Dining table end position in room
      roomIndex: 5, // Red room is at index 5
      id: 'dining', // Unique task ID
      y: 713       // Fixed Y position for task
    },
    'blue': { 
      name: 'Táncszőnyeg', 
      startX: 600,  // Dance floor start position in room
      endX: 1320,   // Dance floor end position in room
      roomIndex: 6, // Blue room is at index 6
      id: 'dancing', // Unique task ID
      y: 713       // Fixed Y position for task
    },
    'purple': {
      name: 'Bárpult',
      startX: 488,  // Bar start position in room
      endX: 1432,   // Bar end position in room
      roomIndex: 1, // Purple room is at index 1
      id: 'drinking', // Unique task ID
      y: 713       // Fixed Y position for task
    },
    'white': {
      name: 'Kanapé',
      startX: 672,  // Sofa start position in room
      endX: 1248,   // Sofa end position in room
      roomIndex: 2, // White room is at index 2
      id: 'smoking', // Unique task ID
      y: 713       // Fixed Y position for task
    }
  },

  // Task completion tracking
  completedTasks: new Set(), // Tasks completed in current round
  currentRound: 1,

    // Task state tracking
  currentTask: null,
  taskProgress: 0,
  taskStartTime: 0,
  taskDuration: 5000, // 5 seconds
  
  // Icon click detection
  currentIconBounds: null,
  currentIconHovered: false,
  
  // Handle icon hover
  handleIconHover(mouseX, mouseY) {
    if (!this.currentIconBounds) {
      this.currentIconHovered = false;
      return false;
    }
    
    const bounds = this.currentIconBounds;
    const hovered = mouseX >= bounds.x && 
                   mouseX <= bounds.x + bounds.width &&
                   mouseY >= bounds.y && 
                   mouseY <= bounds.y + bounds.height;
    
    this.currentIconHovered = hovered;
    return hovered;
  },
  
  // Handle icon click
  handleIconClick(mouseX, mouseY) {
    if (!this.currentIconBounds) return false;
    
    const bounds = this.currentIconBounds;
    const clicked = mouseX >= bounds.x && 
                   mouseX <= bounds.x + bounds.width &&
                   mouseY >= bounds.y && 
                   mouseY <= bounds.y + bounds.height;
    
    if (clicked && bounds.taskZone) {
      console.log('🖱️ Task icon clicked for:', bounds.taskZone.name);
      this.startTask(bounds.taskZone);
      return true;
    }
    
    return false;
  },

  // Reset tasks for new round
  resetTasks() {
    this.completedTasks.clear();
    this.currentRound++;
    console.log(`🔄 Tasks reset for round ${this.currentRound}`);
  },

  // Check if task is completed
  isTaskCompleted(taskId) {
    return this.completedTasks.has(taskId);
  },

  // Get task list for display
  getTaskList() {
    return [
      { id: 'cards', name: '🃏 Kártyaasztal', room: 'Zöld szoba', completed: this.isTaskCompleted('cards') },
      { id: 'dining', name: '🍽️ Étkezőasztal', room: 'Piros szoba', completed: this.isTaskCompleted('dining') },
      { id: 'dancing', name: '💃 Táncszőnyeg', room: 'Kék szoba', completed: this.isTaskCompleted('dancing') }
    ];
  },

  // Start a task
  startTask(taskZone) {
    if (this.currentTask) return; // Already tasking
    
    // Check if task is already completed this round
    if (this.isTaskCompleted(taskZone.id)) {
      console.log(`❌ Task already completed this round: ${taskZone.name}`);
      return;
    }
    
    this.currentTask = taskZone;
    this.taskProgress = 0;
    this.taskStartTime = Date.now();
    
    // Block player movement during task
    if (window.Player) {
      window.Player.isTasking = true;
      console.log(`🔒 Player movement blocked for task: ${taskZone.name}`);
    }
    
    // Play task-specific sound
    if (window.Audio) {
      switch(taskZone.id) {
        case 'dining':
          window.Audio.playEatingTask();
          break;
        case 'cards':
          window.Audio.playPokerTask();
          break;
        case 'drinking':
          window.Audio.playDrinkingTask();
          break;
        case 'smoking':
          window.Audio.playSmokingTask();
          break;
        case 'dancing':
          window.Audio.playDancingTask();
          break;
      }
    }
    
    console.log(`🔧 Started task: ${taskZone.name}`);
  },

  // Update task progress
  updateTask() {
    if (!this.currentTask) return;
    
    // Check if player is still in task zone (with tolerance)
    if (window.Player && window.GameMap) {
      const playerPosition = { x: window.Player.x, y: window.Player.y };
      if (!this.isPlayerInTaskZone(playerPosition)) {
        console.log('❌ Task cancelled - player left task zone');
        this.cancelTask();
        return;
      }
    }
    
    const elapsed = Date.now() - this.taskStartTime;
    this.taskProgress = Math.min(elapsed / this.taskDuration, 1);
    
    // Task completed
    if (this.taskProgress >= 1) {
      console.log(`✅ Task completed: ${this.currentTask.name}`);
      this.completeTask();
    }
  },

  // Complete current task
  completeTask() {
    if (this.currentTask) {
      // Mark task as completed
      this.completedTasks.add(this.currentTask.id);
      console.log(`🎉 Task "${this.currentTask.name}" finished and marked complete!`);
      console.log(`✅ Completed tasks this round: ${Array.from(this.completedTasks).join(', ')}`);
      
      // TODO: Send task completion to server
    }
    
    // Restore player movement
    if (window.Player) {
      window.Player.isTasking = false;
      console.log(`🔓 Player movement restored`);
    }
    
    this.currentTask = null;
    this.taskProgress = 0;
    this.taskStartTime = 0;
  },

  // Cancel current task
  cancelTask() {
    if (this.currentTask) {
      console.log(`❌ Task cancelled: ${this.currentTask.name}`);
      
      // Restore player movement
      if (window.Player) {
        window.Player.isTasking = false;
        console.log(`🔓 Player movement restored after cancel`);
      }
      
      this.currentTask = null;
      this.taskProgress = 0;
      this.taskStartTime = 0;
    }
  },

  // Check if player can start a task
  canStartTask(playerPosition) {
    if (this.currentTask) return false; // Already tasking
    
    const currentRoom = window.GameMap ? window.GameMap.getCurrentRoom() : null;
    if (!currentRoom) return false;
    
    const taskZone = this.taskZones[currentRoom.id];
    if (!taskZone) return false;
    
    // Check if task is already completed
    if (this.isTaskCompleted(taskZone.id)) return false;
    
    const roomStartX = taskZone.roomIndex * (window.GameMap ? window.GameMap.roomWidth : 1920);
    const zoneStartX = roomStartX + taskZone.startX;
    const zoneEndX = roomStartX + taskZone.endX;
    
    console.log(`Task zone check: player=${playerPosition.x}, zone=${zoneStartX}-${zoneEndX}, room=${currentRoom.id}, completed=${this.isTaskCompleted(taskZone.id)}`);
    
    return playerPosition.x >= zoneStartX && playerPosition.x <= zoneEndX;
  },

  // Check if player is in task zone (more lenient for active tasks)
  isPlayerInTaskZone(playerPosition) {
    if (!this.currentTask) return false;
    
    const currentRoom = window.GameMap ? window.GameMap.getCurrentRoom() : null;
    if (!currentRoom) return false;
    
    const taskZone = this.taskZones[currentRoom.id];
    if (!taskZone) return false;
    
    const roomStartX = taskZone.roomIndex * (window.GameMap ? window.GameMap.roomWidth : 1920);
    const zoneStartX = roomStartX + taskZone.startX;
    const zoneEndX = roomStartX + taskZone.endX;
    
    // Add some tolerance for active tasks (10px buffer)
    return playerPosition.x >= (zoneStartX - 10) && playerPosition.x <= (zoneEndX + 10);
  },

  // Draw task bar at bottom of screen
  drawTaskBar(canvas, ctx, playerPosition) {
    if (!canvas || !ctx || !window.GameMap) return;
    
    // Update task progress
    this.updateTask();
    
    // Get current room
    const currentRoom = window.GameMap.getCurrentRoom();
    if (!currentRoom) return;
    
    // Check if current room has a task zone
    const taskZone = this.taskZones[currentRoom.id];
    if (!taskZone) return;
    
    // Task bar dimensions
    const barHeight = 20;
    const barY = canvas.height - barHeight - 10; // 10px from bottom
    const barPadding = 50;
    const barWidth = canvas.width - (barPadding * 2);
    
    // Calculate room boundaries in world coordinates
    const roomStartX = taskZone.roomIndex * window.GameMap.roomWidth;
    const zoneStartX = roomStartX + taskZone.startX;
    const zoneEndX = roomStartX + taskZone.endX;
    const zoneWidth = zoneEndX - zoneStartX;
    
    // Calculate player position relative to task zone
    const playerInZone = playerPosition.x >= zoneStartX && playerPosition.x <= zoneEndX;
    
    // Draw task bar background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(barPadding, barY, barWidth, barHeight);
    
    // Draw task bar border
    ctx.strokeStyle = '#8b0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(barPadding, barY, barWidth, barHeight);
    
    // Calculate task zone representation on the bar (proportional to room)
    const roomWidth = window.GameMap.roomWidth;
    const zoneStartPercent = taskZone.startX / roomWidth;
    const zoneWidthPercent = (taskZone.endX - taskZone.startX) / roomWidth;
    
    const zoneBarStartX = barPadding + (zoneStartPercent * barWidth);
    const zoneBarWidth = zoneWidthPercent * barWidth;
    
    // Draw task zone area on bar
    ctx.fillStyle = playerInZone ? '#00ff00' : '#ffff00'; // Green if in zone, yellow if not
    ctx.fillRect(zoneBarStartX, barY + 2, zoneBarWidth, barHeight - 4);
    
    // Draw task zone border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(zoneBarStartX, barY + 2, zoneBarWidth, barHeight - 4);
    
    // Draw player position indicator
    const playerPercent = (playerPosition.x - roomStartX) / roomWidth;
    const playerBarX = barPadding + (playerPercent * barWidth);
    
    // Clamp player indicator to bar bounds
    const clampedPlayerX = Math.max(barPadding, Math.min(barPadding + barWidth, playerBarX));
    
    // Draw player indicator line
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(clampedPlayerX, barY);
    ctx.lineTo(clampedPlayerX, barY + barHeight);
    ctx.stroke();
    
    // Draw task zone label
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px MedievalSharp';
    ctx.textAlign = 'center';
    const labelX = zoneBarStartX + (zoneBarWidth / 2);
    ctx.fillText(taskZone.name, labelX, barY - 5);
    
    // Draw task icon when player is in zone and can start task
    if (playerInZone && !this.currentTask && !this.isTaskCompleted(taskZone.id)) {
      const iconSize = 48;
      const iconX = canvas.width / 2 - iconSize / 2;
      const iconY = canvas.height / 2 - iconSize / 2;
      
      // Get appropriate icon based on task type
      let taskIcon = null;
      switch(taskZone.id) {
        case 'dining':
          taskIcon = this.taskIcons.eating;
          break;
        case 'cards':
          taskIcon = this.taskIcons.poker;
          break;
        case 'drinking':
          taskIcon = this.taskIcons.drinking;
          break;
        case 'smoking':
          taskIcon = this.taskIcons.smoking;
          break;
        case 'dancing':
          taskIcon = this.taskIcons.dancing;
          break;
      }
      
      // Draw icon if loaded
      if (taskIcon && taskIcon.complete) {
        // Draw semi-transparent background circle
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.arc(iconX + iconSize/2, iconY + iconSize/2, iconSize/2 + 10, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw border (green if hovered, yellow if not)
        ctx.strokeStyle = this.currentIconHovered ? '#00ff00' : '#ffff00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(iconX + iconSize/2, iconY + iconSize/2, iconSize/2 + 10, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Draw the icon
        ctx.drawImage(taskIcon, iconX, iconY, iconSize, iconSize);
        
        // Store icon bounds for click detection
        this.currentIconBounds = {
          x: iconX,
          y: iconY,
          width: iconSize,
          height: iconSize,
          taskZone: taskZone
        };
      } else {
        // Clear icon bounds if no icon is shown
        this.currentIconBounds = null;
      }
    } else {
      // Clear icon bounds if not in zone
      this.currentIconBounds = null;
    }
    
    // Draw status text based on current state
    ctx.textAlign = 'left';
    ctx.font = '12px MedievalSharp';
    
    if (this.currentTask) {
      // Currently tasking
      ctx.fillStyle = '#00ff00';
      const statusText = `Taskolás: ${Math.round(this.taskProgress * 100)}%`;
      ctx.fillText(statusText, barPadding + 5, barY - 25);
    } else if (this.isTaskCompleted(taskZone.id)) {
      // Task already completed
      ctx.fillStyle = '#888888';
      const statusText = `✅ Task elvégezve ebben a körben`;
      ctx.fillText(statusText, barPadding + 5, barY - 25);
    } else if (playerInZone) {
      // Can start task
      ctx.fillStyle = '#ffff00';
      const statusText = 'Nyomd meg a T gombot a taskolás elkezdéséhez!';
      ctx.fillText(statusText, barPadding + 5, barY - 25);
    } else {
      // Not in zone
      ctx.fillStyle = '#ffff00';
      const statusText = 'Menj a taskolási zónába';
      ctx.fillText(statusText, barPadding + 5, barY - 25);
    }
    
    // Reset text align
    ctx.textAlign = 'left';
  },

  // Draw progress bar under player character
  drawTaskProgressBar(canvas, ctx, playerScreenX, playerScreenY) {
    if (!this.currentTask || this.taskProgress <= 0) return;
    
    // Progress bar dimensions
    const barWidth = 60;
    const barHeight = 8;
    const barX = playerScreenX - barWidth / 2;
    const barY = playerScreenY + 70; // Below character
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    // Progress
    const progressWidth = barWidth * this.taskProgress;
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(barX, barY, progressWidth, barHeight);
    
    // Task name above progress bar
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px MedievalSharp';
    ctx.textAlign = 'center';
    ctx.fillText(this.currentTask.name, playerScreenX, barY - 5);
    ctx.textAlign = 'left';
  }
};

// Make TaskBar globally available
window.TaskBar = TaskBar; 