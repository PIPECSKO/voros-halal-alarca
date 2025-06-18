// NPC Manager - Non-Player Characters System with Animation

const NPC = {
  npcs: {},
  animationTimer: null,
  
  // NPC definitions
  npcTypes: {
    dealer: {
      name: 'Dealer',
      room: 'green', // Green room (index 4)
      position: { x: 4 * 1920 + 960, y: 713 }, // Dealer position at floor level
      character: 'dealer',
      frameCount: 2, // dealer1.png, dealer2.png
      animationSpeed: 800 // 800ms per frame (slow, calm dealing)
    },
    musician: {
      name: 'Musician',
      room: 'blue', // Blue room (index 6)
      position: { x: 6 * 1920 + 960, y: 713 }, // Musician position at floor level
      character: 'musician',
      frameCount: 7, // musician1.png through musician7.png
      animationSpeed: 200 // 200ms per frame (fast lute playing)
    },
    musician2: {
      name: 'Musician 2',
      room: 'blue',
      position: { x: 6 * 1920 + 1200, y: 713 }, // Second musician position at floor level
      character: 'musician2',
      frameCount: 6, // musician2_playing1.png through musician2_playing6.png
      animationSpeed: 200 // 200ms per frame (fast lute playing)
    }
  },
  
  // Animation frames storage
  frames: {},
  
  // Initialize NPCs
  init() {
    console.log("Initializing Animated NPC System...");
    
    // Create NPC instances
    for (const [id, npcType] of Object.entries(this.npcTypes)) {
      this.npcs[id] = {
        id: id,
        name: npcType.name,
        room: npcType.room,
        position: { ...npcType.position },
        character: npcType.character,
        frameCount: npcType.frameCount,
        currentFrame: 0,
        animationSpeed: npcType.animationSpeed,
        lastFrameTime: Date.now()
      };
      
      // Load animation frames for each NPC
      this.loadNPCFrames(id, npcType);
    }
    
    // Start animation loop
    this.startAnimationLoop();
    
    console.log("Animated NPCs initialized:", Object.keys(this.npcs));
  },
  
  // Load animation frames for NPC
  loadNPCFrames(npcId, npcType) {
    console.log(`Loading ${npcType.frameCount} frames for ${npcId}`);
    
    this.frames[npcId] = [];
    
    if (npcId === 'musician2') {
      for (let i = 1; i <= npcType.frameCount; i++) {
        const img = new Image();
        img.src = `assets/images/characters/musician2/musician2_playing${i}.png`;
        img.onload = () => {
          console.log(`✓ ${npcId} frame ${i} loaded`);
        };
        img.onerror = () => {
          console.error(`✗ Failed to load ${npcId} frame ${i}`);
        };
        this.frames[npcId].push(img);
      }
      return;
    }
    
    for (let i = 1; i <= npcType.frameCount; i++) {
      const img = new Image();
      img.src = `assets/images/characters/${npcType.character}/${npcType.character}${i}.png`;
      
      img.onload = () => {
        console.log(`✓ ${npcId} frame ${i} loaded`);
      };
      
      img.onerror = () => {
        console.error(`✗ Failed to load ${npcId} frame ${i}`);
      };
      
      this.frames[npcId].push(img);
    }
  },
  
  // Start animation loop
  startAnimationLoop() {
    if (this.animationTimer) {
      clearInterval(this.animationTimer);
    }
    
    console.log("Starting NPC animation loop with individual timing");
    
    this.animationTimer = setInterval(() => {
      this.updateAnimations();
    }, 50); // Check every 50ms for smooth timing
  },
  
  // Update NPC animations
  updateAnimations() {
    const now = Date.now();
    
    for (const npc of Object.values(this.npcs)) {
      // Check if enough time has passed for this NPC's animation speed
      if (now - npc.lastFrameTime >= npc.animationSpeed) {
        // Advance to next frame
        npc.currentFrame = (npc.currentFrame + 1) % npc.frameCount;
        npc.lastFrameTime = now;
      }
    }
  },
  
  // Draw all NPCs
  draw() {
    if (!window.GameMap || !window.GameMap.ctx) {
      return;
    }
    
    const ctx = window.GameMap.ctx;
    const usingCameraSystem = window.GameMap && window.GameMap.camera;
    
    if (usingCameraSystem) {
      ctx.save();
      ctx.translate(-window.GameMap.camera.x, -window.GameMap.camera.y);
    }
    
    for (const npc of Object.values(this.npcs)) {
      this.drawNPC(ctx, npc);
    }
    
    if (usingCameraSystem) {
      ctx.restore();
    }
  },
  
  // Draw individual NPC
  drawNPC(ctx, npc) {
    const frames = this.frames[npc.id];
    
    if (!frames || frames.length === 0) {
      return;
    }
    
    const currentImage = frames[npc.currentFrame];
    if (!currentImage || !currentImage.complete) {
      return;
    }
    
    // NPC dimensions
    const width = currentImage.width || 64;
    const height = currentImage.height || 96;
    
    // Draw NPC at world coordinates
    const drawX = npc.position.x - width / 2;
    const drawY = npc.position.y - height;
    
    ctx.drawImage(currentImage, drawX, drawY, width, height);
    
    // Draw name tag
    this.drawNameTag(ctx, npc.position.x, drawY - 10, npc.name);
  },
  
  // Draw name tag above NPC
  drawNameTag(ctx, centerX, tagY, npcName) {
    const padding = 6;
    const fontSize = 12;
    const tagHeight = fontSize + padding * 2;
    
    // Font setup
    ctx.font = `${fontSize}px 'MedievalSharp', serif`;
    const textWidth = ctx.measureText(npcName).width;
    const tagWidth = textWidth + padding * 2;
    
    // Tag position (centered)
    const tagX = centerX - tagWidth / 2;
    
    // NPC name tag styling (different from players)
    const backgroundColor = '#2C1810'; // Dark brown
    const frameColor = '#8B4513'; // Saddle brown
    const textColor = '#FFD700'; // Gold text
    
    // Draw frame
    ctx.fillStyle = frameColor;
    ctx.fillRect(tagX - 2, tagY - 2, tagWidth + 4, tagHeight + 4);
    
    // Draw background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(tagX, tagY, tagWidth, tagHeight);
    
    // Draw text
    ctx.fillStyle = textColor;
    ctx.font = `${fontSize}px 'MedievalSharp', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(npcName, centerX, tagY + tagHeight / 2);
    
    // Reset text alignment
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
  },
  
  // Get NPC by ID
  getNPC(id) {
    return this.npcs[id];
  },
  
  // Stop animations
  destroy() {
    if (this.animationTimer) {
      clearInterval(this.animationTimer);
      this.animationTimer = null;
    }
  }
};

// Export the NPC object
export default NPC; 