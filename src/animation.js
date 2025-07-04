// Animation Handler
import Map from './map.js';

const Animation = {
  // Active animations
  activeAnimations: {},
  
  // Animation frames
  frames: {
    idle: { left: [], right: [] },
    walk: { left: [], right: [] },
    slash: { left: [], right: [] },
    task: [],
    death: []
  },
  
  character: 'male1',
  
  idleFrameCount: 2,
  walkFrameCount: 9,
  slashFrameCount: 5, // Prince has 5 slash frames
  
  // Slash animation state
  isPlayingSlash: false,
  slashDirection: 'right',
  slashFrame: 0,
  slashAnimationId: null,
  
  // Initialize animations
  init(character = 'male1') {
    this.character = character;
    console.log("Animation.init started");
    
    this.loadFrames();
  },
  
  // Load animation frames
  loadFrames() {
    // Determine folder and frame counts based on character name
    let genderFolder, idleFrameCount, walkFrameCount, slashFrameCount;
    
    if (this.character === 'ghost') {
      genderFolder = 'ghost';
      idleFrameCount = 2; // ghost has 2 idle frames
      walkFrameCount = 5; // ghost has 5 walk frames
      slashFrameCount = 0; // ghost has no slash animation
    } else if (this.character === 'prince') {
      genderFolder = 'prince';
      idleFrameCount = 2; // prince has 2 idle frames
      walkFrameCount = 8; // prince has 8 walk frames
      slashFrameCount = 5; // prince has 5 slash frames
    } else {
      genderFolder = this.character.startsWith('female') ? 'females' : 'males';
      idleFrameCount = this.idleFrameCount;
      walkFrameCount = this.walkFrameCount;
      slashFrameCount = 0; // other characters don't have slash animation
    }
    
    // Idle frames
    this.frames.idle.left = [];
    this.frames.idle.right = [];
    for (let i = 1; i <= idleFrameCount; i++) {
      if (this.character === 'ghost') {
        // Ghost: fix útvonal, nem genderFolder!
        const img = new Image();
        img.src = `assets/images/characters/ghost/idle/ghost_idle${i}.png`;
        img.onerror = () => console.error(`Failed to load ghost idle frame ${i}`);
        this.frames.idle.left.push(img);
        this.frames.idle.right.push(img);
      } else if (this.character === 'prince') {
        const imgL = new Image();
        const imgR = new Image();
        imgL.src = `assets/images/characters/prince/idle/prince_idle_facing_left${i}.png`;
        imgR.src = `assets/images/characters/prince/idle/prince_idle_facing_right${i}.png`;
        imgL.onerror = () => console.error(`Failed to load left idle frame ${i} for ${this.character}`);
        imgR.onerror = () => console.error(`Failed to load right idle frame ${i} for ${this.character}`);
        this.frames.idle.left.push(imgL);
        this.frames.idle.right.push(imgR);
      } else {
        const genderFolder = this.character.startsWith('female') ? 'females' : 'males';
        const imgL = new Image();
        const imgR = new Image();
        imgL.src = `assets/images/characters/${genderFolder}/${this.character}/idle/${this.character}_idle_facing_left${i}.png?v=${Date.now()}`;
        imgR.src = `assets/images/characters/${genderFolder}/${this.character}/idle/${this.character}_idle_facing_right${i}.png?v=${Date.now()}`;
        imgL.onerror = () => console.error(`Failed to load left idle frame ${i} for ${this.character}`);
        imgR.onerror = () => console.error(`Failed to load right idle frame ${i} for ${this.character}`);
        this.frames.idle.left.push(imgL);
        this.frames.idle.right.push(imgR);
      }
    }
    
    // Walk frames
    this.frames.walk.left = [];
    this.frames.walk.right = [];
    for (let i = 1; i <= walkFrameCount; i++) {
      if (this.character === 'ghost') {
        // Ghost: fix útvonal, nem genderFolder!
        const imgL = new Image();
        const imgR = new Image();
        imgL.src = `assets/images/characters/ghost/walk/ghost_walk_facing_left${i}.png`;
        imgR.src = `assets/images/characters/ghost/walk/ghost_walk_facing_right${i}.png`;
        imgL.onerror = () => console.error(`Failed to load ghost walk left frame ${i}`);
        imgR.onerror = () => console.error(`Failed to load ghost walk right frame ${i}`);
        this.frames.walk.left.push(imgL);
        this.frames.walk.right.push(imgR);
      } else if (this.character === 'prince') {
        const imgL = new Image();
        const imgR = new Image();
        imgL.src = `assets/images/characters/prince/walk/prince_walk_facing_left${i}.png`;
        imgR.src = `assets/images/characters/prince/walk/prince_walk_facing_right${i}.png`;
        imgL.onerror = () => console.error(`Failed to load left walk frame ${i} for ${this.character}`);
        imgR.onerror = () => console.error(`Failed to load right walk frame ${i} for ${this.character}`);
        this.frames.walk.left.push(imgL);
        this.frames.walk.right.push(imgR);
      } else {
        const genderFolder = this.character.startsWith('female') ? 'females' : 'males';
        const imgL = new Image();
        const imgR = new Image();
        imgL.src = `assets/images/characters/${genderFolder}/${this.character}/walk/${this.character}_walk_facing_left${i}.png?v=${Date.now()}`;
        imgR.src = `assets/images/characters/${genderFolder}/${this.character}/walk/${this.character}_walk_facing_right${i}.png?v=${Date.now()}`;
        imgL.onerror = () => console.error(`Failed to load left walk frame ${i} for ${this.character}`);
        imgR.onerror = () => console.error(`Failed to load right walk frame ${i} for ${this.character}`);
        this.frames.walk.left.push(imgL);
        this.frames.walk.right.push(imgR);
      }
    }
    
    // Slash frames (only for prince)
    this.frames.slash.left = [];
    this.frames.slash.right = [];
    if (slashFrameCount > 0 && this.character === 'prince') {
      for (let i = 1; i <= slashFrameCount; i++) {
        const imgL = new Image();
        const imgR = new Image();
        
        imgL.src = `assets/images/characters/${genderFolder}/slash/${this.character}_slash_facing_left${i}.png`;
        imgR.src = `assets/images/characters/${genderFolder}/slash/${this.character}_slash_facing_right${i}.png`;
        
        this.frames.slash.left.push(imgL);
        this.frames.slash.right.push(imgR);
      }
    }
    
    // Task animáció minden female és male karakterhez
    this.frames.task = [];
    if (this.character.startsWith('female') || this.character.startsWith('male')) {
      const folder = this.character.startsWith('female') ? 'females' : 'males';
      for (let i = 1; i <= 5; i++) {
        const img = new Image();
        img.src = `assets/images/characters/${folder}/${this.character}/animation/${this.character}_animation${i}.png`;
        img.onerror = () => console.error(`Failed to load ${this.character} task animation frame ${i}`);
        this.frames.task.push(img);
      }
    }
    
    // Death animáció minden female és male karakterhez
    this.frames.death = [];
    if (this.character.startsWith('female') || this.character.startsWith('male')) {
      const folder = this.character.startsWith('female') ? 'females' : 'males';
      for (let i = 1; i <= 6; i++) {
        const img = new Image();
        img.src = `assets/images/characters/${folder}/${this.character}/death/${this.character}_death${i}.png`;
        img.onerror = () => console.error(`Failed to load ${this.character} death animation frame ${i}`);
        this.frames.death.push(img);
      }
    }
  },
  
  // Draw character
  drawCharacter({ x, y, isMoving, direction, animationFrame }) {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    
    // Ha a játékos ghost módban van, mindig a ghost karaktert rajzoljuk
    if (window.Player && window.Player.isGhost) {
      const animType = isMoving ? 'walk' : 'idle';
      const currentDirection = direction;
      const currentFrame = animationFrame;
      if (!this.frames[animType][currentDirection] || this.frames[animType][currentDirection].length === 0 || this.character !== 'ghost') {
        this.character = 'ghost';
        this.loadFrames();
      }
      const frames = this.frames[animType][currentDirection];
      if (!frames || frames.length === 0) return;
      const frame = frames[currentFrame % frames.length];
      // Kisebb ghost: 0.7x méret
      const scale = 0.7;
      const width = (frame.width || 64) * scale;
      const height = (frame.height || 96) * scale;
      const usingCameraSystem = window.GameMap && window.GameMap.camera;
      // Magasabban az Y tengelyen: -300 pixel
      const yOffset = -300;
      const worldPos = usingCameraSystem ? 
        { x: window.Player.ghost.x - width/2, y: window.Player.ghost.y - height + yOffset } :
        { x: x, y: y + yOffset };
      if (usingCameraSystem) {
        ctx.save();
        ctx.translate(-window.GameMap.camera.x, -window.GameMap.camera.y);
      }
      ctx.globalAlpha = 0.7; // Szellem áttetszőség
      ctx.drawImage(frame, worldPos.x, worldPos.y, width, height);
      ctx.globalAlpha = 1.0;
      // Name tag
      const playerName = (window.Game && window.Game.username) || 'Player';
      this.drawNameTag(ctx, worldPos.x + width/2, worldPos.y - 10, playerName, 'ghost', null);
      if (usingCameraSystem) ctx.restore();
      return;
    }
    
    // Karakter kirajzolása
    let char = (window.Player && window.Player.character) ? window.Player.character : (window.selectedCharacter || this.character || 'male1');
    
    // Update Player character if selectedCharacter has changed
    if (window.Player && window.selectedCharacter && window.Player.character !== window.selectedCharacter) {
      window.Player.character = window.selectedCharacter;
      char = window.selectedCharacter;
    }
    
    // Check if we're playing slash animation
    let animType, currentDirection, currentFrame;
    
    if (this.isPlayingSlash && this.character === 'prince') {
      // Use slash animation
      animType = 'slash';
      currentDirection = this.slashDirection;
      currentFrame = this.slashFrame;
    } else {
      // Use normal idle/walk animation
      animType = isMoving ? 'walk' : 'idle';
      currentDirection = direction;
      currentFrame = animationFrame;
    }
    
    if (!this.frames[animType] || !this.frames[animType][currentDirection] || this.frames[animType][currentDirection].length === 0 || (this.character !== char)) {
      this.character = char;
      this.loadFrames();
    }
    
    const frames = this.frames[animType][currentDirection];
    if (!frames || frames.length === 0) return;
    const frame = frames[currentFrame % frames.length];
    
    // Ha a Map kamera rendszert használ, alkalmazni kell a transform-ot
    const usingCameraSystem = window.GameMap && window.GameMap.camera;
    
    if (usingCameraSystem) {
      ctx.save();
      ctx.translate(-window.GameMap.camera.x, -window.GameMap.camera.y);
    }
    
    // Karakter rajzolása
    const width = 256;
    const height = 256;
    
    // Világkoordinátákban rajzoljuk ha kamera rendszer van
    const worldPos = usingCameraSystem ? 
      { x: x - width/2, y: y - height } :
      { x: x - width/2, y: y - height };
    
    ctx.drawImage(frame, worldPos.x, worldPos.y, width, height);
      
    // Name tag rajzolása (világkoordinátákban)
    const playerName = (window.Game && window.Game.username) || 'Player';
    const playerRole = (window.Game && window.Game.playerRole) || 'commoner';
    const groupColor = (window.Game && window.Game.groupColor) || null;
    this.drawNameTag(ctx, worldPos.x + width/2, worldPos.y - 20, playerName, playerRole, groupColor);
    
    if (usingCameraSystem) {
      ctx.restore();
    }
  },
  
  // Draw name tag above character
  drawNameTag(ctx, centerX, tagY, playerName, playerRole, groupColor) {
    // Name tag méretek
    const padding = 8;
    const fontSize = 14;
    const tagHeight = fontSize + padding * 2;
    
    // Font beállítása méréshez
    ctx.font = `${fontSize}px 'MedievalSharp', serif`;
    const textWidth = ctx.measureText(playerName).width;
    const tagWidth = textWidth + padding * 2;
    
    // Name tag pozíció (középre igazított)
    const tagX = centerX - tagWidth / 2;
    
    // 5 nemesi csoport szín
    const groupColors = {
      'red': '#8B0000',      // Piros
      'blue': '#000080',     // Kék
      'green': '#006400',    // Zöld
      'white': '#F5F5F5',    // Fehér
      'black': '#2C2C2C'     // Fekete (kissé világosabb hogy látható legyen)
    };
    
    // Background szín meghatározása
    let backgroundColor, frameColor;
    
    // Pestis karakterek álcázása: úgy nézzenek ki mint a normális szerepük
    let displayRole = playerRole;
    if (playerRole === 'plague-noble') {
      displayRole = 'noble'; // Pestis-nemes úgy néz ki mint normális nemes
    } else if (playerRole === 'plague-commoner' || playerRole === 'plague') {
      displayRole = 'commoner'; // Pestis-polgár úgy néz ki mint normális polgár
    }
    
    if (displayRole === 'prince') {
      // Herceg: teljes arany (háttér + frame)
      backgroundColor = '#FFD700'; // arany
      frameColor = '#FFD700'; // arany frame
    } else if (displayRole === 'noble') {
      // Nemes (beleértve a pestis-nemest is): csoport szín háttér + ARANY frame
      backgroundColor = groupColors[groupColor] || '#444444';
      frameColor = '#FFD700'; // arany frame
    } else if (displayRole === 'ghost') {
      // Ghost: szürke áttetsző háttér + fehér frame
      backgroundColor = '#808080'; // szürke
      frameColor = '#FFFFFF'; // fehér frame
    } else {
      // Polgár (beleértve a pestis-polgárt is): csoport szín háttér + FEKETE frame
      backgroundColor = groupColors[groupColor] || '#444444';
      frameColor = '#333333'; // fekete frame
    }
    
    // Frame rajzolása (külső)
    ctx.fillStyle = frameColor;
    ctx.fillRect(tagX - 2, tagY - 2, tagWidth + 4, tagHeight + 4);
      
    // Background rajzolása (belső)
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(tagX, tagY, tagWidth, tagHeight);
    
    // Szöveg szín meghatározása (kontraszt alapján)
    let textColor;
    if (displayRole === 'prince') {
      textColor = '#000000'; // fekete szöveg arany háttéren
    } else if (displayRole === 'ghost') {
      textColor = '#000000'; // fekete szöveg szürke háttéren
    } else if (backgroundColor === '#F5F5F5') {
      // Fehér háttér esetén fekete szöveg
      textColor = '#000000';
    } else {
      // Minden más színes háttér esetén fehér szöveg
      textColor = '#FFFFFF';
    }
    
    // Név kiírása
    ctx.fillStyle = textColor;
    ctx.font = `${fontSize}px 'MedievalSharp', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(playerName, centerX, tagY + tagHeight / 2);
      
    // Reset text alignment
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
  },
  
  // Stop an animation by ID
  stopAnimation(id) {
    if (this.activeAnimations[id]) {
      clearInterval(this.activeAnimations[id].frameTimer);
      delete this.activeAnimations[id];
    }
  },
  
  // Stop all animations
  stopAllAnimations() {
    for (const id in this.activeAnimations) {
      clearInterval(this.activeAnimations[id].frameTimer);
    }
    
    this.activeAnimations = {};
  },
  
  // Play slash animation
  playSlashAnimation(direction = 'right', callback) {
    console.log('=== SLASH ANIMATION START ===');
    console.log('Current character:', this.character);
    console.log('Direction:', direction);
    
    // Check if prince character and has slash frames
    if (this.character !== 'prince' || !this.frames.slash[direction] || this.frames.slash[direction].length === 0) {
      console.warn('Slash animation not available for character:', this.character);
      if (callback) callback();
      return;
    }
    
    // If already playing slash animation, ignore
    if (this.isPlayingSlash) {
      console.log('Slash animation already playing, ignoring');
      return;
    }
    
    console.log('Starting slash animation with', this.frames.slash[direction].length, 'frames');
    
    // Stop movement immediately - don't store previous state
    if (window.Player) {
      window.Player.isMoving = false;
      console.log('Player movement stopped for slash animation');
    }
    
    // Set slash animation state
    this.isPlayingSlash = true;
    this.slashDirection = direction;
    this.slashFrame = 0;
    
    const frameDuration = 100; // 100ms per frame
    const totalFrames = this.frames.slash[direction].length;
    
    this.slashAnimationId = setInterval(() => {
      this.slashFrame++;
      
      if (this.slashFrame >= totalFrames) {
        // Animation completed
        clearInterval(this.slashAnimationId);
        this.slashAnimationId = null;
        this.isPlayingSlash = false;
        this.slashFrame = 0;
        
        console.log('Slash animation completed');
        
        // Force player to idle state - don't restore previous movement
        if (window.Player) {
          window.Player.isMoving = false; // Always stop after slash
          console.log('Player forced to idle state after slash');
        }
        
        if (callback) callback();
      } else {
        console.log('Slash frame:', this.slashFrame + 1, '/', totalFrames);
      }
    }, frameDuration);
  }
};

// Export the Animation object
export default Animation; 