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

  // Segédfüggvény a padló pozíció kiszámításához
  getFloorY() {
    const scaleY = window.Map ? window.Map.scaleY : 1;
    return 898 * scaleY; // Karakter pozíció 12 pixellel feljebb
  },

  init() {
    const scaleX = window.Map ? window.Map.scaleX : 1;
    const scaleY = window.Map ? window.Map.scaleY : 1;
    this.x = 960 * scaleX; // Középen kezdés, skálázva
    this.y = this.getFloorY();
    this.speed = 5 * Math.min(scaleX, scaleY); // Sebesség skálázása
    this.isMoving = false;
    this.direction = 'right';
    this.animationFrame = 0;
    this.animationTimer = 0;
    this.setupControls();
  },

  setupControls() {
    window.addEventListener('keydown', (e) => {
      // Block movement if tasking
      if (this.isTasking) return;
      
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        this.isMoving = true;
        this.direction = 'left';
      } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        this.isMoving = true;
        this.direction = 'right';
      }
    });
    window.addEventListener('keyup', (e) => {
      // Block movement if tasking
      if (this.isTasking) return;
      
      if ((e.code === 'KeyA' || e.code === 'ArrowLeft') && this.direction === 'left') {
        this.isMoving = false;
      } else if ((e.code === 'KeyD' || e.code === 'ArrowRight') && this.direction === 'right') {
        this.isMoving = false;
      }
    });
  },

  update() {
      // Stop movement if tasking
      if (this.isTasking) {
        this.isMoving = false;
      }
      
      if (this.isMoving) {
      // Get movement input
      const keys = {
        left: window.keys?.KeyA || window.keys?.ArrowLeft,
        right: window.keys?.KeyD || window.keys?.ArrowRight,
        up: window.keys?.KeyW || window.keys?.ArrowUp,
        down: window.keys?.KeyS || window.keys?.ArrowDown
      };
      
      // Calculate movement
      let deltaX = 0;
      let deltaY = 0;
      
      if (this.direction === 'left') deltaX = -this.speed;
      if (this.direction === 'right') deltaX = this.speed;
      
      // Apply movement with boundaries
      const boundaries = window.Map ? window.Map.getRoomBoundaries() : {
        left: 0,
        right: window.innerWidth,
        top: 0,
        bottom: window.innerHeight
      };
      
      // Update position
      this.x += deltaX;
      this.y += deltaY;
      
      // Clamp to world boundaries
      this.x = Math.max(50, Math.min(boundaries.right - 50, this.x));
      // Y pozíció rögzítése a padló szintjén
      this.y = this.getFloorY();
      
      // Check for room transitions
      if (window.Map && window.Map.checkRoomTransition) {
        window.Map.checkRoomTransition(this.x, this.y);
      }
    }
    
    this.updateAnimation();
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
    // Convert world position to screen position for drawing
    const screenPos = window.Map && window.Map.worldToScreen ? 
      window.Map.worldToScreen(this.x, this.y) : 
      { x: this.x, y: this.y };
    
    // Az Animation modul drawCharacter metódusát hívjuk
    Animation.drawCharacter({
      x: screenPos.x,
      y: screenPos.y,
      isMoving: this.isMoving,
      direction: this.direction,
      animationFrame: this.animationFrame
    });
  },
  
  // Draw other player (for multiplayer mode)
  drawOtherPlayer(player) {
    // Convert world position to screen position for drawing
    const screenPos = window.Map && window.Map.worldToScreen ? 
      window.Map.worldToScreen(player.x, player.y) : 
      { x: player.x, y: player.y };
    
    // Store current character to restore later
    const originalCharacter = Animation.character;
    
    // Set character for this player
    Animation.character = player.character || 'male1';
    
    // Draw the other player using Animation module
    Animation.drawCharacter({
      x: screenPos.x,
      y: screenPos.y,
      isMoving: player.isMoving || false,
      direction: player.direction || 'right',
      animationFrame: player.animationFrame || 0
    });
    
    // Restore original character
    Animation.character = originalCharacter;
  },
  
  // Draw dead body
  drawBody(body) {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    
    // Convert world position to screen position for drawing
    const screenPos = window.Map && window.Map.worldToScreen ? 
      window.Map.worldToScreen(body.position.x, body.position.y) : 
      { x: body.position.x, y: body.position.y };
    
    // Apply camera transform if using camera system
    const usingCameraSystem = window.Map && window.Map.camera;
    if (usingCameraSystem) {
      ctx.save();
      ctx.translate(-window.Map.camera.x, -window.Map.camera.y);
    }
    
    // Draw a simple body representation (red circle)
    ctx.fillStyle = '#8b0000';
    ctx.beginPath();
    ctx.arc(screenPos.x, screenPos.y, 20, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw timer indicator
    const timeRemaining = Math.max(0, body.timeToCleanup - (Date.now() - body.timeOfDeath));
    const progress = timeRemaining / body.timeToCleanup;
    
    ctx.strokeStyle = progress > 0.3 ? '#ffff00' : '#ff0000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(screenPos.x, screenPos.y, 25, 0, 2 * Math.PI * progress);
    ctx.stroke();
    
    if (usingCameraSystem) {
      ctx.restore();
    }
  }
}; 

export default Player; 