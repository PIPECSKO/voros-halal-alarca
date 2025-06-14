// public/js/ui-controller.js
export default class UIController {
  constructor(game) {
    this.game = game;
    this.bindings = new Map();
    this.setupCoreBindings();
  }

  setupCoreBindings() {
    // Host Game
    this.addBinding('#host-btn', 'click', () => {
      const username = this.getValue('#username-input');
      if (!username) return this.showError('Please enter a username');
      
      this.disableInput('#host-btn');
      this.game.hostGame(username)
        .then(gameCode => {
          this.showScreen('#lobby-screen');
          this.setValue('#game-code-display', gameCode);
          this.setValue('#player-role', 'Host');
        })
        .catch(err => this.showError(err));
    });

    // Join Game
    this.addBinding('#join-btn', 'click', () => {
      const username = this.getValue('#username-input');
      const gameCode = this.getValue('#game-code-input');
      if (!username) return this.showError('Please enter a username');
      if (!gameCode) return this.showError('Please enter a game code');
      
      this.disableInput('#join-btn');
      this.game.joinGame(gameCode, username)
        .then(() => {
          this.showScreen('#lobby-screen');
          this.setValue('#player-role', 'Player');
        })
        .catch(err => this.showError(err));
    });

    // Ready Toggle
    this.addBinding('#ready-btn', 'click', () => {
      this.game.toggleReady();
      this.toggleButtonState('#ready-btn', 'Ready', 'Not Ready');
    });

    // Start Game (host only)
    this.addBinding('#start-btn', 'click', () => {
      this.game.startGame();
    });

    // Task Interactions
    this.addBinding('.task-button', 'click', (e) => {
      const taskId = e.target.dataset.taskId;
      this.game.completeTask(taskId);
      e.target.classList.add('completed');
    });

    // Player Actions
    this.addBinding('#infect-btn', 'click', () => {
      const targetId = this.getSelectedPlayer();
      if (targetId) this.game.infect(targetId);
    });

    this.addBinding('#stab-btn', 'click', () => {
      const targetId = this.getSelectedPlayer();
      if (targetId) this.game.stab(targetId);
    });
  }

  // Utility Methods
  addBinding(selector, event, handler) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      const wrappedHandler = (e) => {
        try {
          handler(e);
        } catch (error) {
          console.error('Error in event handler:', error);
          this.showError('An error occurred');
        }
      };
      el.addEventListener(event, wrappedHandler);
      this.bindings.set({ selector, event, handler }, wrappedHandler);
    });
  }

  getValue(selector) {
    const el = document.querySelector(selector);
    return el ? el.value.trim() : null;
  }

  setValue(selector, value) {
    const el = document.querySelector(selector);
    if (el) el.textContent = value;
  }

  disableInput(selector) {
    const el = document.querySelector(selector);
    if (el) el.disabled = true;
  }

  enableInput(selector) {
    const el = document.querySelector(selector);
    if (el) el.disabled = false;
  }

  toggleButtonState(selector, text1, text2) {
    const el = document.querySelector(selector);
    if (el) {
      el.textContent = el.textContent === text1 ? text2 : text1;
      el.classList.toggle('active');
    }
  }

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });
    const screen = document.querySelector(screenId);
    if (screen) screen.classList.add('active');
  }

  showError(message) {
    const errorEl = document.querySelector('#error-message');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('visible');
      setTimeout(() => errorEl.classList.remove('visible'), 3000);
    }
  }

  getSelectedPlayer() {
    const select = document.querySelector('#player-select');
    return select ? select.value : null;
  }

  // Game State Update Methods
  updatePlayerList(players) {
    const listEl = document.querySelector('#player-list');
    if (!listEl) return;

    listEl.innerHTML = players.map(player => `
      <li class="player ${player.isDead ? 'dead' : ''}" data-id="${player.id}">
        <span class="player-name">${player.name}</span>
        <span class="player-status">${player.ready ? 'Ready' : 'Not Ready'}</span>
        ${player.id === this.game.localPlayerId ? '<span class="you-indicator">(You)</span>' : ''}
      </li>
    `).join('');

    // Update player select for actions
    const selectEl = document.querySelector('#player-select');
    if (selectEl) {
      selectEl.innerHTML = players
        .filter(p => p.id !== this.game.localPlayerId && !p.isDead)
        .map(p => `<option value="${p.id}">${p.name}</option>`)
        .join('');
    }
  }

  updateRoleInfo(roleInfo) {
    const roleEl = document.querySelector('#role-info');
    if (!roleEl) return;

    let roleHtml = `Your role: <strong>${roleInfo.role}</strong>`;
    if (roleInfo.role === 'commoner' && roleInfo.nobleId) {
      const noble = this.game.gameState.players.find(p => p.id === roleInfo.nobleId);
      roleHtml += `<br>Your noble: <strong>${noble?.name || 'Unknown'}</strong>`;
    }

    roleEl.innerHTML = roleHtml;
    document.body.classList.add(`role-${roleInfo.role}`);
  }

  updateTaskList(tasks) {
    const tasksEl = document.querySelector('#tasks-list');
    if (!tasksEl) return;

    tasksEl.innerHTML = tasks.map(task => `
      <button class="task-button" data-task-id="${task.id}">
        ${this.getTaskName(task.id)} in ${task.room} room
        <small>(${task.duration}s)</small>
      </button>
    `).join('');
  }

  getTaskName(taskId) {
    const taskNames = {
      dance: 'Perform a dance',
      eat: 'Eat some food',
      cards: 'Play cards',
      toilet: 'Use the toilet',
      smoke: 'Smoke a pipe',
      drink: 'Drink wine'
    };
    return taskNames[taskId] || taskId;
  }

  showGameMessage(message, duration = 3000) {
    const messageEl = document.querySelector('#game-message');
    if (!messageEl) return;

    messageEl.textContent = message;
    messageEl.classList.add('visible');
    if (duration) {
      setTimeout(() => messageEl.classList.remove('visible'), duration);
    }
  }

  updateGameTimer(time) {
    const timerEl = document.querySelector('#game-timer');
    if (timerEl) timerEl.textContent = time;
  }

  showGameEnd(winner, message, roles) {
    this.showScreen('#end-screen');
    
    const endMessageEl = document.querySelector('#end-message');
    if (endMessageEl) endMessageEl.textContent = message;
    
    const rolesListEl = document.querySelector('#roles-list');
    if (rolesListEl) {
      rolesListEl.innerHTML = this.game.gameState.players.map(player => `
        <li>
          ${player.name}: <strong>${roles[player.id]}</strong>
          ${player.isDead ? ' (Dead)' : ''}
        </li>
      `).join('');
    }
  }
}