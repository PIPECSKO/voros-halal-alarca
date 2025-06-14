// public/js/ui-adapter.js
export default class UIAdapter {
  constructor(game) {
    this.game = game;
    this.currentScreen = 'menu';
    this.setupEventHandlers();
    this.setupGameEventListeners();
  }

  setupEventHandlers() {
    // Main Menu
    this.bind('#host-button', 'click', () => {
      const username = this.getValue('#player-name');
      if (!username) return this.showError('Please enter a name');
      this.game.hostGame(username)
        .then(code => {
          this.updateGameCodeDisplay(code);
          this.showScreen('lobby');
        });
    });

    this.bind('#join-button', 'click', () => {
      const username = this.getValue('#player-name');
      const code = this.getValue('#room-code');
      if (!username || !code) return this.showError('Please enter name and code');
      this.game.joinGame(code, username)
        .then(() => this.showScreen('lobby'))
        .catch(err => this.showError(err.message));
    });

    // Lobby
    this.bind('#ready-button', 'click', () => {
      this.game.toggleReady();
      this.toggleReadyButton();
    });

    // Game Actions
    this.bind('#complete-task-btn', 'click', () => {
      const taskId = this.getSelectedTask();
      if (taskId) this.game.completeTask(taskId);
    });

    this.bind('#use-ability-btn', 'click', () => {
      const target = this.getSelectedPlayer();
      if (!target) return;
      
      if (this.game.gameState.roles[this.game.localPlayerId] === 'plague') {
        this.game.infect(target);
      } else if (this.game.gameState.roles[this.game.localPlayerId] === 'prince') {
        this.game.stab(target);
      }
    });
  }

  setupGameEventListeners() {
    this.game.on('player-list-updated', players => {
      this.updatePlayerList(players);
      this.updatePlayerSelect(players);
    });

    this.game.on('role-assigned', roleInfo => {
      this.updateRoleDisplay(roleInfo);
      this.updateActionButtons(roleInfo.role);
    });

    this.game.on('game-started', () => {
      this.showScreen('game');
      this.initializeTaskList();
    });

    this.game.on('round-started', data => {
      this.updateRoundDisplay(data.round, data.hour);
      this.startRoundTimer(data.duration);
    });

    this.game.on('player-died', data => {
      this.showDeathNotification(data.playerId, data.cause);
    });

    this.game.on('game-ended', data => {
      this.showEndScreen(data.winner, data.message);
    });
  }

  // DOM Helper Methods
  bind(selector, event, handler) {
    const element = document.querySelector(selector);
    if (element) element.addEventListener(event, handler);
  }

  getValue(selector) {
    const element = document.querySelector(selector);
    return element ? element.value.trim() : null;
  }

  showScreen(screenName) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(el => {
      el.style.display = 'none';
    });
    
    // Show requested screen
    const screen = document.querySelector(`#${screenName}-screen`);
    if (screen) screen.style.display = 'block';
    this.currentScreen = screenName;
  }

  updatePlayerList(players) {
    const list = document.querySelector('#player-list');
    if (!list) return;
    
    list.innerHTML = players.map(player => `
      <div class="player ${player.isDead ? 'dead' : ''}" data-id="${player.id}">
        <span class="player-name">${player.name}</span>
        <span class="player-status">${player.ready ? '✓' : '✗'}</span>
        ${player.id === this.game.localPlayerId ? '<span class="you-badge">YOU</span>' : ''}
      </div>
    `).join('');
  }

  updateRoleDisplay(roleInfo) {
    const roleElement = document.querySelector('#role-display');
    if (roleElement) {
      roleElement.textContent = `Role: ${roleInfo.role.toUpperCase()}`;
      roleElement.className = `role-${roleInfo.role}`;
    }
  }

  // More helper methods for your specific UI...
}