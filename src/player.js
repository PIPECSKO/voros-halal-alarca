import Animation from './animation.js';

// Player Handler

const Player = {
  x: 960, // Alapértelmezett pozíció (az init() skálázza majd)
  y: 850, // Alapértelmezett pozíció lejjebb a padló magasságában
  isMoving: false,
  direction: 'right', // 'left' vagy 'right'
  animationFrame: 0,
  animationTimer: 0,
  speed: 5, // mozgás sebessége (kicsit gyorsabb az nagyobb szobákhoz)

  // Segédfüggvény a padló pozíció kiszámításához
  getFloorY() {
    const scaleY = window.Map ? window.Map.scaleY : 1;
    return 850 * scaleY; // Lejjebb a kék szoba gyémánt padlójának magasságához igazítva, skálázva
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
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        this.isMoving = true;
        this.direction = 'left';
      } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        this.isMoving = true;
        this.direction = 'right';
      }
    });
    window.addEventListener('keyup', (e) => {
      if ((e.code === 'KeyA' || e.code === 'ArrowLeft') && this.direction === 'left') {
        this.isMoving = false;
      } else if ((e.code === 'KeyD' || e.code === 'ArrowRight') && this.direction === 'right') {
        this.isMoving = false;
      }
    });
  },

  update() {
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
      if (this.animationTimer > 12) { // lassabb walk animáció
        this.animationFrame = (this.animationFrame + 1) % 9; // 9 frame-es walk animáció
        this.animationTimer = 0;
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
  }
}; 

export default Player; 