import Animation from './animation.js';
import Audio from './audio.js';

// Player Handler

const Player = {
  x: 960, // Alapértelmezett pozíció (az init() skálázza majd)
  y: 898, // Karakter pozíció 12 pixellel feljebb
  isMoving: false,
  isTasking: false, // New flag to block movement during tasks
  direction: 'right', // 'left' vagy 'right'
  animationFrame: 0,
  animationTimer: 0,
  speed: 5, // mozgás sebessége (kicsit gyorsabb az nagyobb szobákhoz)
  previousAnimationFrame: 0, // For footstep sound timing
  character: 'male1', // Default character
  isDead: false, // ÚJ: halott állapot
  deathStartTime: null, // ÚJ: halál animáció kezdete
  isGhost: false, // ÚJ: szellem állapot
  ghost: {
    x: null,
    y: null,
    isMoving: false,
    direction: 'right',
    animationFrame: 0,
    animationTimer: 0,
    speed: 5,
  },
  // ÚJ: body tárolása halál után
  body: null, // { x, y, character }

  // Segédfüggvény a padló pozíció kiszámításához
  getFloorY() {
    // Get the floor level based on room height
    const roomHeight = window.GameMap ? window.GameMap.roomHeight : 1080;
    // Floor is at 85% from the top of the room (15% from bottom)
    return roomHeight * 0.85;
  },

  init() {
    // Initialize player properties
    this.x = 960;
    this.y = 540;
    this.speed = 5;
    this.isMoving = false;
    this.direction = 'right';
    this.animationFrame = 0;
    this.lastUpdate = Date.now();
    this.isTasking = false;
    this.isDead = false;
    this.character = window.selectedCharacter || 'male1';
    
    // Initialize key states
    window.keys = window.keys || {};
    
    // Setup key event listeners
    document.addEventListener('keydown', (e) => {
      window.keys[e.code] = true;
    });
    
    document.addEventListener('keyup', (e) => {
      window.keys[e.code] = false;
    });
    
    console.log('Player initialized with character:', this.character);
  },

  update() {
    // Stop if player is tasking or dead
    if (this.isTasking || this.isDead) return;
    
    // Get movement input
    const moveLeft = window.keys['ArrowLeft'] || window.keys['KeyA'];
    const moveRight = window.keys['ArrowRight'] || window.keys['KeyD'];
    
    // Calculate new position
    let newX = this.x;
    if (moveLeft) {
      newX -= this.speed;
      this.direction = 'left';
      this.isMoving = true;
    } else if (moveRight) {
      newX += this.speed;
      this.direction = 'right';
      this.isMoving = true;
    } else {
      this.isMoving = false;
    }
    
    // Update Y position to floor level
    this.y = this.getFloorY();
    
    // Check for room transitions before updating position
    if (window.GameMap) {
      const currentRoom = Math.floor(this.x / window.GameMap.roomWidth);
      const newRoom = Math.floor(newX / window.GameMap.roomWidth);
      
      // Clamp position to map boundaries
      const totalMapWidth = window.GameMap.roomWidth * window.GameMap.rooms.length;
      newX = Math.max(0, Math.min(totalMapWidth - 1, newX));
      
      const clampedRoom = Math.max(0, Math.min(window.GameMap.rooms.length - 1, newRoom));
      if (clampedRoom !== currentRoom) {
        // We're transitioning to a new room
        window.GameMap.currentRoom = clampedRoom;
        window.GameMap.setCameraTarget(clampedRoom * window.GameMap.roomWidth, 0);
        
        // Position player in the new room
        if (clampedRoom > currentRoom) {
          // Moving right - place on left side of new room
          newX = (clampedRoom * window.GameMap.roomWidth) + 50;
        } else {
          // Moving left - place on right side of new room
          newX = ((clampedRoom + 1) * window.GameMap.roomWidth) - 50;
        }
      }
    }
    
    // Update position
    this.x = newX;
    
    // Update animation frame
    if (this.isMoving) {
      const now = Date.now();
      if (now - this.lastUpdate > 100) { // Update animation every 100ms
        this.animationFrame = (this.animationFrame + 1) % 4;
        this.lastUpdate = now;
      }
    } else {
      this.animationFrame = 0;
    }
  },

  updateAnimation() {
    if (this.isMoving) {
      this.animationTimer++;
      if (this.animationTimer > 10) { // gyorsabb walk animáció a hangokhoz
        const previousFrame = this.animationFrame;
        this.animationFrame = (this.animationFrame + 1) % 9; // 9 frame-es walk animáció
        this.animationTimer = 0;
        
        // Play footstep sound on specific frames (when foot touches ground)
        // Play on frames 1 and 4 for faster rhythm (3 frames apart)
        if (this.animationFrame === 1 || this.animationFrame === 4) {
          if (window.Audio && window.Audio.playFootstep) {
            window.Audio.playFootstep();
          }
        }
      }
    } else {
      this.animationTimer++;
      if (this.animationTimer > 60) { // gyorsabb idle animáció
        this.animationFrame = (this.animationFrame + 1) % 2; // 2 frame-es idle animáció
        this.animationTimer = 0;
      }
    }
  },

  draw() {
    if (!window.Animation) return;
    
    // Draw the player character
    window.Animation.drawCharacter({
      x: this.x,
      y: this.y,
      isMoving: this.isMoving,
      direction: this.direction,
      animationFrame: this.animationFrame
    });
  },
  
  // Draw other player (for multiplayer mode)
  drawOtherPlayer(player) {
    // Draw other player at logical coordinates
    const originalCharacter = Animation.character;
    Animation.character = player.character || 'male1';
    Animation.drawCharacter({
      x: player.x,
      y: player.y,
      isMoving: player.isMoving || false,
      direction: player.direction || 'right',
      animationFrame: player.animationFrame || 0
    });
    Animation.character = originalCharacter;
  },
  
  // Draw dead body
  drawBody(body) {
    // Mindig a fő canvas contextjét használd!
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    // Convert world position to screen position for drawing
    const screenPos = window.GameMap && window.GameMap.worldToScreen ? 
      window.GameMap.worldToScreen(body.x, body.y) : 
      { x: body.x, y: body.y };
    // Karakter death sprite kirajzolása (halott test)
    let img = null;
    let yOffset = 20;
    if (body.character && (body.character.startsWith('female') || body.character.startsWith('male'))) {
      const folder = body.character.startsWith('female') ? 'females' : 'males';
      img = new Image();
      img.src = `assets/images/characters/${folder}/${body.character}/death/${body.character}_death6.png`;
    }
    if (img) {
      img.onload = () => {
        ctx.drawImage(img, screenPos.x - (img.width || 64)/2, screenPos.y - (img.height || 96) + yOffset, img.width || 64, img.height || 96);
      };
      img.onerror = () => {
        ctx.fillStyle = '#8b0000';
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, 20, 0, 2 * Math.PI);
        ctx.fill();
      };
      if (img.complete) {
        ctx.drawImage(img, screenPos.x - (img.width || 64)/2, screenPos.y - (img.height || 96) + yOffset, img.width || 64, img.height || 96);
      }
    } else {
      // Ha nincs karakter vagy nem female/male, piros kör
      ctx.fillStyle = '#8b0000';
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, 20, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}; 

export default Player; 