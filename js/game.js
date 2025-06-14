// public/js/game.js
import P2PNetwork from '../p2p/network.js';

export default class Game {
  constructor() {
    this.p2p = new P2PNetwork();
    this.players = {};
    this.localPlayerId = null;
    this.gameState = {
      players: [],
      roles: {},
      nobleGroups: {},
      tasks: {},
      deaths: [],
      started: false,
      round: 0,
      gameState: 'lobby'
    };

    // Constants
    this.MAX_PLAYERS = 30;
    this.MIN_PLAYERS = 1;
    this.ROUND_TIME = 90;
    this.DISCUSSION_TIME_BASE = 4;
    this.GAME_HOURS = [18, 19, 20, 21, 22, 23, 24];

    this.setupNetworkListeners();
    this.setupEventHandlers();
  }

  setupNetworkListeners() {
    this.p2p.stateManager.on('state-update', (state) => {
      this.updateGameState(state);
    });

    this.p2p.on('player-joined', (player) => {
      this.addPlayer(player);
      this.updatePlayerList();
    });

    this.p2p.on('player-left', (playerId) => {
      this.removePlayer(playerId);
      this.updatePlayerList();
    });

    this.p2p.on('game-started', () => {
      this.handleGameStart();
    });

    this.p2p.on('round-started', (data) => {
      this.handleRoundStart(data);
    });

    this.p2p.on('discussion-started', (data) => {
      this.handleDiscussionStart(data);
    });

    this.p2p.on('game-ended', (data) => {
      this.handleGameEnd(data);
    });
  }

  setupEventHandlers() {
    // UI event bindings would go here
  }

  // Network Methods
  async hostGame(username) {
    this.localPlayerId = this.p2p.localPeerId;
    const gameCode = await this.p2p.hostGame(username);
    this.addPlayer({
      id: this.localPlayerId,
      name: username,
      ready: false,
      position: { x: Math.random() * 500, y: Math.random() * 300 },
      character: 0,
      isDead: false,
      isGhost: false
    });
    return gameCode;
  }

  async joinGame(gameCode, username) {
    this.localPlayerId = this.p2p.localPeerId;
    await this.p2p.joinGame(gameCode, username);
  }

  updateGameState(newState) {
    const oldState = this.gameState;
    this.gameState = newState;

    // Sync players
    this.syncPlayers(newState.players);

    // Handle state transitions
    if (newState.gameState !== oldState.gameState) {
      this.handleStateTransition(oldState.gameState, newState.gameState);
    }

    // Update UI
    this.updateUI();
  }

  syncPlayers(players) {
    players.forEach(player => {
      if (!this.players[player.id]) {
        this.addPlayer(player);
      } else {
        this.updatePlayer(player);
      }
    });

    // Remove disconnected players
    Object.keys(this.players).forEach(id => {
      if (!players.find(p => p.id === id)) {
        this.removePlayer(id);
      }
    });
  }

  // Player Management
  addPlayer(player) {
    if (!this.players[player.id]) {
      this.players[player.id] = player;
      // Create player sprite/representation
      this.createPlayerSprite(player);
    }
  }

  updatePlayer(player) {
    if (this.players[player.id]) {
      Object.assign(this.players[player.id], player);
      // Update player sprite/representation
      this.updatePlayerSprite(player);
    }
  }

  removePlayer(playerId) {
    if (this.players[playerId]) {
      // Remove player sprite/representation
      this.destroyPlayerSprite(playerId);
      delete this.players[playerId];
    }
  }

  // Game Logic Methods (adapted from server)
  toggleReady() {
    if (this.p2p.isHost) {
      const player = this.gameState.players.find(p => p.id === this.localPlayerId);
      if (player) {
        player.ready = !player.ready;
        this.p2p.stateManager.broadcastState();
      }
    } else {
      this.p2p.send({
        type: 'player-ready',
        playerId: this.localPlayerId
      });
    }
  }

  startGame() {
    if (!this.p2p.isHost) return;

    // Check if all players are ready
    const allReady = this.gameState.players.every(player => player.ready);
    if (!allReady) {
      this.showMessage('Not all players are ready!');
      return;
    }

    // Check minimum players
    if (this.gameState.players.length < this.MIN_PLAYERS) {
      this.showMessage(`At least ${this.MIN_PLAYERS} players needed!`);
      return;
    }

    // Initialize game
    this.gameState.started = true;
    this.gameState.gameState = 'round';
    this.assignRoles();
    this.assignTasks();
    this.startRound();

    this.p2p.broadcast({
      type: 'game-started',
      players: this.gameState.players,
      roles: this.gameState.roles
    });
  }

  assignRoles() {
    const playerCount = this.gameState.players.length;
    const roles = {};
    const playerIds = this.gameState.players.map(p => p.id);
    
    // Shuffle players
    for (let i = playerIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [playerIds[i], playerIds[j]] = [playerIds[j], playerIds[i]];
    }
    
    // Assign prince
    let prince = null;
    if (playerCount > 0) {
      prince = playerIds.pop();
      roles[prince] = 'prince';
    }
    
    // Assign nobles
    const nobles = [];
    const nobleCount = this.calculateNobleCount(playerCount);
    for (let i = 0; i < nobleCount && playerIds.length > 0; i++) {
      const noble = playerIds.pop();
      roles[noble] = 'noble';
      nobles.push(noble);
    }
    
    // Assign plague
    if (playerIds.length > 0 || nobles.length > 0) {
      const plagueIsNoble = Math.random() < 0.5 && nobles.length > 0;
      let plague;
      if (plagueIsNoble) {
        plague = nobles[Math.floor(Math.random() * nobles.length)];
      } else if (playerIds.length > 0) {
        plague = playerIds[Math.floor(Math.random() * playerIds.length)];
      } else if (prince) {
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
    
    this.gameState.roles = roles;
    this.createNobleGroups(nobles);
    
    // Notify players of their roles
    this.gameState.players.forEach(player => {
      const roleInfo = this.getRoleInfo(player.id);
      this.p2p.sendToPlayer(player.id, {
        type: 'role-assigned',
        roleInfo
      });
    });
  }

  calculateNobleCount(playerCount) {
    if (playerCount >= 26) return 5;
    if (playerCount >= 21) return 4;
    if (playerCount >= 16) return 3;
    if (playerCount >= 4) return 2;
    if (playerCount >= 2) return 1;
    return 0;
  }

  createNobleGroups(nobles) {
    const nobleGroups = {};
    let commoners = this.gameState.players
      .map(p => p.id)
      .filter(id => this.gameState.roles[id] === 'commoner');
    
    // Shuffle commoners
    for (let i = commoners.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [commoners[i], commoners[j]] = [commoners[j], commoners[i]];
    }
    
    nobles.forEach((noble, index) => {
      const group = {
        noble,
        commoners: [],
        color: this.getNobleGroupColor(index)
      };
      
      const commonersPerNoble = Math.floor(commoners.length / nobles.length);
      const extraCommoners = index < (commoners.length % nobles.length) ? 1 : 0;
      const groupSize = commonersPerNoble + extraCommoners;
      
      for (let i = 0; i < groupSize && commoners.length > 0; i++) {
        group.commoners.push(commoners.pop());
      }
      
      nobleGroups[noble] = group;
    });
    
    this.gameState.nobleGroups = nobleGroups;
  }

  getNobleGroupColor(index) {
    const colors = ['red', 'blue', 'green', 'yellow', 'white'];
    return colors[index % colors.length];
  }

  getRoleInfo(playerId) {
    const role = this.gameState.roles[playerId];
    const roleInfo = { role };
    
    if (role === 'noble') {
      roleInfo.group = this.gameState.nobleGroups[playerId];
    }
    
    if (role === 'commoner') {
      const nobleGroup = Object.values(this.gameState.nobleGroups).find(
        group => group.commoners.includes(playerId)
      );
      if (nobleGroup) {
        roleInfo.nobleId = nobleGroup.noble;
        roleInfo.color = nobleGroup.color;
      }
    }
    
    return roleInfo;
  }

  assignTasks() {
    const taskTypes = [
      { id: 'dance', room: 'blue', duration: 8 },
      { id: 'eat', room: 'red', duration: 7 },
      { id: 'cards', room: 'green', duration: 6 },
      { id: 'toilet', room: 'orange', duration: 6 },
      { id: 'smoke', room: 'white', duration: 5 },
      { id: 'drink', room: 'purple', duration: 5 }
    ];
    
    this.gameState.tasks = {};
    
    this.gameState.players.forEach(player => {
      const role = this.gameState.roles[player.id];
      
      if (role === 'prince' || role === 'plague') {
        this.gameState.tasks[player.id] = [];
        this.p2p.sendToPlayer(player.id, {
          type: 'tasks-assigned',
          tasks: []
        });
        return;
      }
      
      // Shuffle tasks
      const shuffledTasks = [...taskTypes];
      for (let i = shuffledTasks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledTasks[i], shuffledTasks[j]] = [shuffledTasks[j], shuffledTasks[i]];
      }
      
      // Assign tasks (fewer for small games)
      const taskCount = this.gameState.players.length <= 3 ? 1 : 3;
      this.gameState.tasks[player.id] = shuffledTasks.slice(0, taskCount).map(t => t.id);
      
      this.p2p.sendToPlayer(player.id, {
        type: 'tasks-assigned',
        tasks: shuffledTasks.slice(0, taskCount)
      });
    });
  }

  // Round Management
  startRound() {
    this.gameState.round++;
    this.gameState.currentHour = this.GAME_HOURS[this.gameState.round - 1];
    this.gameState.gameState = 'round';
    this.gameState.roundPlagueCooldown = false;
    this.gameState.princeCooldown = false;
    
    // Assign new tasks
    this.assignTasks();
    
    this.p2p.broadcast({
      type: 'round-started',
      round: this.gameState.round,
      hour: this.gameState.currentHour,
      duration: this.ROUND_TIME
    });
    
    // Start round timer
    this.roundTimer = setTimeout(() => {
      this.endRound();
    }, this.ROUND_TIME * 1000);
    
    // Enable cooldown in last 20 seconds
    this.cooldownTimer = setTimeout(() => {
      this.gameState.roundPlagueCooldown = true;
      this.gameState.princeCooldown = true;
      this.p2p.broadcast({ type: 'actions-cooldown' });
    }, (this.ROUND_TIME - 20) * 1000);
  }

  endRound() {
    if (this.gameState.round >= this.GAME_HOURS.length) {
      this.endGame('nobility');
      return;
    }
    
    this.checkTaskCompletion();
    this.startDiscussion();
  }

  checkTaskCompletion() {
    this.gameState.players.forEach(player => {
      const role = this.gameState.roles[player.id];
      if (role === 'prince' || role === 'plague') return;
      
      if (this.gameState.tasks[player.id] && this.gameState.tasks[player.id].length > 0) {
        this.killPlayer(player.id, 'tasks');
        this.p2p.sendToPlayer(player.id, {
          type: 'died',
          cause: 'tasks',
          message: 'You failed to complete your tasks!'
        });
        this.p2p.broadcast({
          type: 'player-died',
          playerId: player.id,
          cause: 'tasks'
        });
      }
    });
  }

  startDiscussion() {
    this.gameState.gameState = 'discussion';
    const discussionTime = this.gameState.currentHour * this.DISCUSSION_TIME_BASE;
    const discussionType = this.gameState.round <= 3 ? 'noble' : 'prince';
    
    this.p2p.broadcast({
      type: 'discussion-started',
      discussionType,
      duration: discussionTime,
      hour: this.gameState.currentHour
    });
    
    this.discussionTimer = setTimeout(() => {
      this.startRound();
    }, discussionTime * 1000);
  }

  // Player Actions
  completeTask(taskId) {
    if (this.p2p.isHost) {
      const playerTasks = this.gameState.tasks[this.localPlayerId];
      if (playerTasks && playerTasks.includes(taskId)) {
        this.gameState.tasks[this.localPlayerId] = playerTasks.filter(t => t !== taskId);
        this.p2p.sendToPlayer(this.localPlayerId, {
          type: 'task-completed',
          taskId
        });
        
        if (this.gameState.tasks[this.localPlayerId].length === 0) {
          this.p2p.sendToPlayer(this.localPlayerId, {
            type: 'all-tasks-completed'
          });
        }
      }
    } else {
      this.p2p.send({
        type: 'complete-task',
        playerId: this.localPlayerId,
        taskId
      });
    }
  }

  infect(targetId) {
    if (this.gameState.roles[this.localPlayerId] !== 'plague') return;
    if (this.gameState.roundPlagueCooldown) return;
    
    if (this.p2p.isHost) {
      setTimeout(() => {
        this.killPlayer(targetId, 'plague');
        this.p2p.broadcast({
          type: 'player-died',
          playerId: targetId,
          cause: 'plague'
        });
      }, 5000);
    } else {
      this.p2p.send({
        type: 'infect',
        targetId
      });
    }
  }

  stab(targetId) {
    if (this.gameState.roles[this.localPlayerId] !== 'prince') return;
    if (this.gameState.princeCooldown) return;
    
    if (this.p2p.isHost) {
      this.killPlayer(targetId, 'prince');
      this.p2p.broadcast({
        type: 'player-died',
        playerId: targetId,
        cause: 'prince'
      });
      
      if (this.gameState.roles[targetId] === 'plague') {
        this.endGame('nobility');
      }
    } else {
      this.p2p.send({
        type: 'stab',
        targetId
      });
    }
  }

  cleanBody(bodyId) {
    this.p2p.broadcast({
      type: 'body-removed',
      bodyId
    });
  }

  // Player Lifecycle
  killPlayer(playerId, cause) {
    this.gameState.deaths.push({
      playerId,
      cause,
      time: Date.now()
    });
    
    // Mark player as dead
    const player = this.gameState.players.find(p => p.id === playerId);
    if (player) {
      player.isDead = true;
    }
    
    // If noble died, promote commoner
    if (this.gameState.roles[playerId] === 'noble') {
      this.promoteCommoner(playerId);
    }
    
    // Check game end conditions
    this.checkGameEnd();
  }

  promoteCommoner(nobleId) {
    const group = this.gameState.nobleGroups[nobleId];
    if (!group || group.commoners.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * group.commoners.length);
    const promotedCommoner = group.commoners[randomIndex];
    
    this.gameState.roles[promotedCommoner] = 'noble';
    group.noble = promotedCommoner;
    group.commoners = group.commoners.filter(c => c !== promotedCommoner);
    
    this.p2p.broadcast({
      type: 'commoner-promoted',
      oldNoble: nobleId,
      newNoble: promotedCommoner,
      group: group.color
    });
  }

  checkGameEnd() {
    const livingPlayers = this.gameState.players
      .filter(p => !this.gameState.deaths.some(d => d.playerId === p.id));
    
    const livingByRole = livingPlayers.reduce((acc, player) => {
      const role = this.gameState.roles[player.id];
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});
    
    // Plague wins if only prince and one other remain
    if (livingPlayers.length <= 2 && livingByRole.prince === 1) {
      this.endGame('plague');
      return true;
    }
    
    return false;
  }

  endGame(winner) {
    this.gameState.gameState = 'end';
    this.gameState.winner = winner;
    
    const message = winner === 'nobility'
      ? 'The nobility has defeated the plague!'
      : 'The plague has conquered the nobility!';
    
    // Reveal all roles
    const roles = {};
    this.gameState.players.forEach(player => {
      roles[player.id] = this.gameState.roles[player.id];
    });
    
    this.p2p.broadcast({
      type: 'game-ended',
      winner,
      message,
      roles
    });
    
    // Reset game state
    this.resetGame();
  }

  resetGame() {
    this.gameState.started = false;
    this.gameState.round = 0;
    this.gameState.gameState = 'lobby';
    this.gameState.roles = {};
    this.gameState.nobleGroups = {};
    this.gameState.tasks = {};
    this.gameState.deaths = [];
    
    // Reset player ready states
    this.gameState.players.forEach(p => p.ready = false);
    
    this.p2p.broadcast({
      type: 'game-reset',
      players: this.gameState.players
    });
  }

  // UI Methods (to be implemented based on your frontend)
  createPlayerSprite(player) {
    // Implement based on your rendering system
  }

  updatePlayerSprite(player) {
    // Implement based on your rendering system
  }

  destroyPlayerSprite(playerId) {
    // Implement based on your rendering system
  }

  updatePlayerList() {
    // Implement UI update
  }

  updateUI() {
    // Implement general UI updates
  }

  showMessage(message) {
    // Implement message display
  }

  handleStateTransition(oldState, newState) {
    // Handle any special transitions
  }

  handleGameStart() {
    // Implement game start UI
  }

  handleRoundStart(data) {
    // Implement round start UI
  }

  handleDiscussionStart(data) {
    // Implement discussion start UI
  }

  handleGameEnd(data) {
    // Implement game end UI
  }
}