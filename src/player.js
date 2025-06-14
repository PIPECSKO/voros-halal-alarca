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
    // Set character from selected character or default
    this.character = window.selectedCharacter || 'male1';
    this.setupControls();
  },

  setupControls() {
    window.addEventListener('keydown', (e) => {
      // Ha ghost, akkor a ghost mozgását kezeljük
      if (this.isGhost) {
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
          this.ghost.isMoving = true;
          this.ghost.direction = 'left';
        } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
          this.ghost.isMoving = true;
          this.ghost.direction = 'right';
        }
        // Ghost nem tud taskolni, semmit nem csinál más gombokra
        return;
      }
      // Block movement if tasking vagy halott
      if (this.isTasking || this.isDead) return;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        this.isMoving = true;
        this.direction = 'left';
      } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        this.isMoving = true;
        this.direction = 'right';
      }
      // X gomb: halál animáció triggerelése
      if (e.code === 'KeyX' && !this.isDead && !this.isGhost) {
        this.isDead = true;
        this.isMoving = false;
        this.deathStartTime = Date.now();
        // Ghost pozíció a test helyén
        this.ghost.x = this.x;
        this.ghost.y = this.y;
        this.ghost.direction = this.direction;
        this.ghost.isMoving = false;
        this.ghost.animationFrame = 0;
        this.ghost.animationTimer = 0;
        // Ghost csak a halál animáció után aktiválódik (lásd update)
      }
    });
    window.addEventListener('keyup', (e) => {
      if (this.isGhost) {
        if ((e.code === 'KeyA' || e.code === 'ArrowLeft') && this.ghost.direction === 'left') {
          this.ghost.isMoving = false;
        } else if ((e.code === 'KeyD' || e.code === 'ArrowRight') && this.ghost.direction === 'right') {
          this.ghost.isMoving = false;
        }
        return;
      }
      // Block movement if tasking vagy halott
      if (this.isTasking || this.isDead) return;
      if ((e.code === 'KeyA' || e.code === 'ArrowLeft') && this.direction === 'left') {
        this.isMoving = false;
      } else if ((e.code === 'KeyD' || e.code === 'ArrowRight') && this.direction === 'right') {
        this.isMoving = false;
      }
    });
  },

  update() {
    // Ha halott, de még nem ghost: várjuk a halál animáció végét
    if (this.isDead && !this.isGhost) {
      // 6 frame * 166ms = kb. 1 másodperc
      const elapsed = Date.now() - (this.deathStartTime || Date.now());
      if (elapsed > 6 * 166) {
        // Body pozíció mentése a Game.bodies-hoz CSAK most!
        if (window.Game && window.Game.bodies && !window.Game.bodies['self']) {
          window.Game.bodies['self'] = {
            x: this.x,
            y: this.y,
            character: this.character
          };
        }
        // Ghost csak ezután jelenik meg
        this.isGhost = true;
        if (window.Animation) window.Animation.init('ghost');
      }
      return;
    }
    // Ha ghost, akkor csak a ghostot frissítjük
    if (this.isGhost) {
      if (this.ghost.isMoving) {
        let deltaX = 0;
        if (this.ghost.direction === 'left') deltaX = -this.ghost.speed;
        if (this.ghost.direction === 'right') deltaX = this.ghost.speed;
        // Ghost szabadon mozoghat a pályán, de csak X tengelyen
        const boundaries = window.Map ? window.Map.getRoomBoundaries() : {
          left: 0,
          right: window.innerWidth,
        };
        this.ghost.x += deltaX;
        this.ghost.x = Math.max(50, Math.min(boundaries.right - 50, this.ghost.x));
        // Y pozíció rögzítése a padló szintjén
        this.ghost.y = this.getFloorY();
        // Szobaváltás engedélyezett
        if (window.Map && window.Map.checkRoomTransition) {
          window.Map.checkRoomTransition(this.ghost.x, this.ghost.y);
        }
      }
      // Ghost animáció frissítése
      this.ghost.animationTimer++;
      if (this.ghost.isMoving) {
        if (this.ghost.animationTimer > 10) {
          this.ghost.animationFrame = (this.ghost.animationFrame + 1) % 5; // 5 frame-es walk animáció
          this.ghost.animationTimer = 0;
        }
      } else {
        if (this.ghost.animationTimer > 60) {
          this.ghost.animationFrame = (this.ghost.animationFrame + 1) % 2; // 2 frame-es idle animáció
          this.ghost.animationTimer = 0;
        }
      }
      return;
    }
    // Stop movement if tasking vagy halott
    if (this.isTasking || this.isDead) {
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
    if (this.body) {
      this.drawBody(this.body);
    }
    // Ha ghost, akkor a ghost karaktert rajzoljuk
    if (this.isGhost) {
      const screenPos = window.Map && window.Map.worldToScreen ? 
        window.Map.worldToScreen(this.ghost.x, this.ghost.y) : 
        { x: this.ghost.x, y: this.ghost.y };
      // Ghost karakter animáció
      Animation.character = 'ghost';
      Animation.drawCharacter({
        x: screenPos.x,
        y: screenPos.y,
        isMoving: this.ghost.isMoving,
        direction: this.ghost.direction,
        animationFrame: this.ghost.isMoving ? this.ghost.animationFrame : 0
      });
      return;
    }
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
    // Mindig a fő canvas contextjét használd!
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    // Convert world position to screen position for drawing
    const screenPos = window.Map && window.Map.worldToScreen ? 
      window.Map.worldToScreen(body.x, body.y) : 
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