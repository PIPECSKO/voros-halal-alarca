// Map Handler - 7 Room System

const Map = {
  ctx: null,
  canvas: null,
  
  // Room background images
  roomImages: {
    blue: null,    // A kék szoba képe
    red: null,     // A piros szoba képe
    orange: null,  // A narancssárga szoba képe
    green: null,   // A zöld szoba képe
    white: null,   // A fehér szoba képe
    purple: null   // A lila szoba képe
  },
  
  // Camera system
  camera: {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    smoothness: 0.08
  },
  
  // Room definitions
  rooms: [
    { id: 'black', name: 'Fekete', color: '#000000', x: 0 },
    { id: 'purple', name: 'Lila', color: '#800080', x: 1 },
    { id: 'white', name: 'Fehér', color: '#F5F5F5', x: 2 },
    { id: 'orange', name: 'Narancssárga', color: '#FF8C00', x: 3 },
    { id: 'green', name: 'Zöld', color: '#228B22', x: 4 },
    { id: 'red', name: 'Piros', color: '#DC143C', x: 5 },
    { id: 'blue', name: 'Kék', color: '#4169E1', x: 6 }
  ],
  
  // Room settings - alapértelmezett 1920x1080, de skálázható
  roomWidth: 1920,
  roomHeight: 1080,
  currentRoom: 0,
  
  // Scaling system
  scaleX: 1,
  scaleY: 1,
  
  // Inicializálás
  init() {
    console.log("Initializing 7-Room Map System...");
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Calculate scaling based on canvas size
    this.scaleX = this.canvas.width / 1920;
    this.scaleY = this.canvas.height / 1080;
    
    // Update room dimensions based on scaling
    this.roomWidth = 1920 * this.scaleX;
    this.roomHeight = 1080 * this.scaleY;
    
    // Load room images
    this.roomImages.blue = new Image();
    this.roomImages.blue.src = 'assets/images/map/blue_room.png';
    this.roomImages.blue.onload = () => {
      console.log('Blue room image loaded');
      console.log('Blue room image size:', this.roomImages.blue.width + 'x' + this.roomImages.blue.height);
      console.log('Room size should be:', this.roomWidth + 'x' + this.roomHeight);
    };
    this.roomImages.blue.onerror = () => {
      console.error('Failed to load blue room image');
    };
    
    this.roomImages.red = new Image();
    this.roomImages.red.src = 'assets/images/map/red_room.png';
    this.roomImages.red.onload = () => {
      console.log('Red room image loaded');
      console.log('Red room image size:', this.roomImages.red.width + 'x' + this.roomImages.red.height);
      console.log('Room size should be:', this.roomWidth + 'x' + this.roomHeight);
    };
    this.roomImages.red.onerror = () => {
      console.error('Failed to load red room image');
    };
    
    this.roomImages.orange = new Image();
    this.roomImages.orange.src = 'assets/images/map/orange_room.png';
    this.roomImages.orange.onload = () => {
      console.log('Orange room image loaded');
      console.log('Orange room image size:', this.roomImages.orange.width + 'x' + this.roomImages.orange.height);
      console.log('Room size should be:', this.roomWidth + 'x' + this.roomHeight);
    };
    this.roomImages.orange.onerror = () => {
      console.error('Failed to load orange room image');
    };
    
    this.roomImages.green = new Image();
    this.roomImages.green.src = 'assets/images/map/green_room.png';
    this.roomImages.green.onload = () => {
      console.log('Green room image loaded');
      console.log('Green room image size:', this.roomImages.green.width + 'x' + this.roomImages.green.height);
      console.log('Room size should be:', this.roomWidth + 'x' + this.roomHeight);
    };
    this.roomImages.green.onerror = () => {
      console.error('Failed to load green room image');
    };
    
    this.roomImages.white = new Image();
    this.roomImages.white.src = 'assets/images/map/white_room.png';
    this.roomImages.white.onload = () => {
      console.log('White room image loaded');
      console.log('White room image size:', this.roomImages.white.width + 'x' + this.roomImages.white.height);
      console.log('Room size should be:', this.roomWidth + 'x' + this.roomHeight);
    };
    this.roomImages.white.onerror = () => {
      console.error('Failed to load white room image');
    };
    
    this.roomImages.purple = new Image();
    this.roomImages.purple.src = 'assets/images/map/purple_room.png';
    this.roomImages.purple.onload = () => {
      console.log('Purple room image loaded');
      console.log('Purple room image size:', this.roomImages.purple.width + 'x' + this.roomImages.purple.height);
      console.log('Room size should be:', this.roomWidth + 'x' + this.roomHeight);
    };
    this.roomImages.purple.onerror = () => {
      console.error('Failed to load purple room image');
    };
    
    // Start in black room (index 0)
    this.currentRoom = 0;
    this.camera.x = 0;
    this.camera.y = 0;
    this.camera.targetX = 0;
    this.camera.targetY = 0;
    
    console.log("Map initialized with", this.rooms.length, "rooms, size:", this.roomWidth + "x" + this.roomHeight);
    console.log("Canvas size:", this.canvas.width + "x" + this.canvas.height);
    console.log("Scale factors:", this.scaleX + "x" + this.scaleY);
  },

  // Check room transitions based on player position
  checkRoomTransition(playerX, playerY) {
    // Játékos világkoordináta pozíciója
    const worldX = playerX;
    
    // Melyik szobában van a játékos a pozíciója alapján
    const roomIndex = Math.floor(worldX / this.roomWidth);
    
    // Clamp room index to valid range
    const newRoom = Math.max(0, Math.min(this.rooms.length - 1, roomIndex));
    
    // Csak akkor váltunk szobát, ha ténylegesen átlépett a határon
    if (newRoom !== this.currentRoom) {
      console.log(`Room transition: ${this.rooms[this.currentRoom].name} → ${this.rooms[newRoom].name}`);
      console.log(`Player world position: ${worldX}, Room boundary: ${newRoom * this.roomWidth}`);
      
      this.currentRoom = newRoom;
      this.setCameraTarget(newRoom * this.roomWidth, 0);
    }
  },
  
  // Set camera target for smooth transition
  setCameraTarget(targetX, targetY) {
    this.camera.targetX = targetX;
    this.camera.targetY = targetY;
  },
  
  // Update camera position (smooth movement)
  updateCamera() {
    // Smooth camera movement
    const deltaX = this.camera.targetX - this.camera.x;
    const deltaY = this.camera.targetY - this.camera.y;
    
    this.camera.x += deltaX * this.camera.smoothness;
    this.camera.y += deltaY * this.camera.smoothness;
    
    // Snap to target if very close
    if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
      this.camera.x = this.camera.targetX;
      this.camera.y = this.camera.targetY;
    }
  },

  // Get current room info
  getCurrentRoom() {
    return this.rooms[this.currentRoom];
  },
  
  // Get room boundaries for player movement
  getRoomBoundaries() {
    return {
      left: 0,
      right: this.rooms.length * this.roomWidth,
      top: 0,
      bottom: this.roomHeight
    };
  },
  
  // Törlés
  clear() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  },

  // Draw the 7-room map
  draw(playerX = 960, playerY = 540) {
    if (!this.ctx) return;
    
    // Update camera position
    this.updateCamera();
    
    // Clear canvas
    this.clear();
    
    // Save context for camera transform
    this.ctx.save();
    
    // Apply camera transform
    this.ctx.translate(-this.camera.x, -this.camera.y);
    
    // Draw all rooms
    this.rooms.forEach((room, index) => {
      const roomX = index * this.roomWidth;
      const roomY = 0;
      
      // Special handling for rooms with PNG backgrounds
      if (room.id === 'blue' && this.roomImages.blue && this.roomImages.blue.complete) {
        // Draw the PNG background for blue room
        this.ctx.drawImage(this.roomImages.blue, roomX, roomY, this.roomWidth, this.roomHeight);
      } else if (room.id === 'red' && this.roomImages.red && this.roomImages.red.complete) {
        // Draw the PNG background for red room
        this.ctx.drawImage(this.roomImages.red, roomX, roomY, this.roomWidth, this.roomHeight);
      } else if (room.id === 'orange' && this.roomImages.orange && this.roomImages.orange.complete) {
        // Draw the PNG background for orange room
        this.ctx.drawImage(this.roomImages.orange, roomX, roomY, this.roomWidth, this.roomHeight);
      } else if (room.id === 'green' && this.roomImages.green && this.roomImages.green.complete) {
        // Draw the PNG background for green room
        this.ctx.drawImage(this.roomImages.green, roomX, roomY, this.roomWidth, this.roomHeight);
      } else if (room.id === 'purple' && this.roomImages.purple && this.roomImages.purple.complete) {
        // Draw the PNG background for purple room
        this.ctx.drawImage(this.roomImages.purple, roomX, roomY, this.roomWidth, this.roomHeight);
      } else if (room.id === 'white' && this.roomImages.white && this.roomImages.white.complete) {
        // Draw the PNG background for white room
        this.ctx.drawImage(this.roomImages.white, roomX, roomY, this.roomWidth, this.roomHeight);
      } else {
        // Regular room background for other rooms
        this.ctx.fillStyle = room.color;
        this.ctx.fillRect(roomX, roomY, this.roomWidth, this.roomHeight);
        
        // Floor (padló) - barna színű, alsó 37.5% magasságban (csak nem kék szobákban)
        const floorHeight = this.roomHeight * 0.375;
        const floorY = this.roomHeight - floorHeight;
        this.ctx.fillStyle = '#8B4513'; // Saddle brown szín
        this.ctx.fillRect(roomX, floorY, this.roomWidth, floorHeight);
        
        // Floor border/edge
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(roomX, floorY);
        this.ctx.lineTo(roomX + this.roomWidth, floorY);
        this.ctx.stroke();
      }
      
      // Room border
      this.ctx.strokeStyle = '#8b0000';
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(roomX, roomY, this.roomWidth, this.roomHeight);
      
      // Room name
      this.ctx.fillStyle = room.color === '#F5F5F5' ? '#000000' : '#FFFFFF';
      this.ctx.font = '48px MedievalSharp';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(room.name, roomX + this.roomWidth / 2, roomY + 100);
    });
    
    // Draw room transitions (vertical lines between rooms)
    this.ctx.strokeStyle = '#8b0000';
    this.ctx.lineWidth = 2;
    for (let i = 1; i < this.rooms.length; i++) {
      const lineX = i * this.roomWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(lineX, 0);
      this.ctx.lineTo(lineX, this.roomHeight);
      this.ctx.stroke();
    }
    
    // Restore context
    this.ctx.restore();
  },
  
  // Draw minimap in top-right corner
  drawMinimap(playerX = 960, playerY = 540) {
    if (!this.ctx) return;
    
    const minimapWidth = 200;
    const minimapHeight = 100;
    const minimapX = this.canvas.width - minimapWidth - 20;
    const minimapY = 20;
    const roomWidth = minimapWidth / this.rooms.length;
    
    // Draw minimap background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(minimapX, minimapY, minimapWidth, minimapHeight);
    
    // Draw rooms in minimap
    this.rooms.forEach((room, index) => {
      const roomX = minimapX + (index * roomWidth);
      this.ctx.fillStyle = room.color;
      this.ctx.fillRect(roomX, minimapY, roomWidth, minimapHeight);
      
      // Room border
      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(roomX, minimapY, roomWidth, minimapHeight);
    });
    
    // Draw player position in minimap
    const playerMinimapX = minimapX + ((playerX / (this.roomWidth * this.rooms.length)) * minimapWidth);
    const playerMinimapY = minimapY + (minimapHeight / 2);
    
    this.ctx.fillStyle = '#FF0000';
    this.ctx.beginPath();
    this.ctx.arc(playerMinimapX, playerMinimapY, 4, 0, Math.PI * 2);
    this.ctx.fill();
  },
  
  // Draw task list
  drawTaskList(x, y, width) {
    if (!this.ctx) return;
    
    const tasks = [
      { text: "Találd meg a gyilkost!", completed: false },
      { text: "Gyűjts információt!", completed: false },
      { text: "Beszélj a nemesekkel!", completed: false },
      { text: "Fedezd fel a szobákat!", completed: false }
    ];
    
    const lineHeight = 30;
    const padding = 10;
    const height = (tasks.length * lineHeight) + (padding * 2);
    
    // Draw background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(x, y, width, height);
    
    // Draw border
    this.ctx.strokeStyle = '#8b0000';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, width, height);
    
    // Draw title
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '24px MedievalSharp';
    this.ctx.textAlign = 'left';
    this.ctx.fillText("Feladatok:", x + padding, y + padding + 20);
    
    // Draw tasks
    this.ctx.font = '18px MedievalSharp';
    tasks.forEach((task, index) => {
      const taskY = y + padding + 50 + (index * lineHeight);
      
      // Checkbox
      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x + padding, taskY - 12, 16, 16);
      
      if (task.completed) {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(x + padding + 3, taskY - 9, 10, 10);
      }
      
      // Task text
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillText(task.text, x + padding + 25, taskY);
    });
  },
  
  // Get room from position
  getRoomFromPosition(position) {
    const roomIndex = Math.floor(position.x / this.roomWidth);
    return this.rooms[Math.max(0, Math.min(this.rooms.length - 1, roomIndex))];
  },
  
  // Convert screen coordinates to world coordinates
  screenToWorld(screenX, screenY) {
    return {
      x: screenX + this.camera.x,
      y: screenY + this.camera.y
    };
  },
  
  // Convert world coordinates to screen coordinates
  worldToScreen(worldX, worldY) {
    return {
      x: worldX - this.camera.x,
      y: worldY - this.camera.y
    };
  }
};

export default Map; 