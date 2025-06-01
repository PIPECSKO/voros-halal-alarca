// Animation Handler
import Map from './map.js';

const Animation = {
  // Active animations
  activeAnimations: {},
  
  // Animation frames
  frames: {
    idle: { left: [], right: [] },
    walk: { left: [], right: [] }
  },
  
  character: 'male1',
  
  idleFrameCount: 2,
  walkFrameCount: 9,
  
  // Initialize animations
  init(character = 'male1') {
    this.character = character;
    console.log("Animation.init started");
    
    this.loadFrames();
  },
  
  // Load animation frames
  loadFrames() {
    // Determine folder and frame counts based on character name
    let genderFolder, idleFrameCount, walkFrameCount;
    
    if (this.character === 'ghost') {
      genderFolder = 'ghost';
      idleFrameCount = 2; // ghost has 2 idle frames
      walkFrameCount = 5; // ghost has 5 walk frames
    } else {
      genderFolder = this.character.startsWith('female') ? 'females' : 'males';
      idleFrameCount = this.idleFrameCount;
      walkFrameCount = this.walkFrameCount;
    }
    
    // Idle frames
    this.frames.idle.left = [];
    this.frames.idle.right = [];
    for (let i = 1; i <= idleFrameCount; i++) {
      const imgL = new Image();
      const imgR = new Image();
      
      if (this.character === 'ghost') {
        // Ghost uses different naming convention
        imgL.src = `assets/images/characters/${genderFolder}/idle/${this.character}_idle${i}.png`;
        imgR.src = `assets/images/characters/${genderFolder}/idle/${this.character}_idle${i}.png`; // Same image for both directions
      } else {
        imgL.src = `assets/images/characters/${genderFolder}/${this.character}/idle/${this.character}_idle_facing_left${i}.png`;
        imgR.src = `assets/images/characters/${genderFolder}/${this.character}/idle/${this.character}_idle_facing_right${i}.png`;
      }
      
      this.frames.idle.left.push(imgL);
      this.frames.idle.right.push(imgR);
    }
    
    // Walk frames
    this.frames.walk.left = [];
    this.frames.walk.right = [];
    for (let i = 1; i <= walkFrameCount; i++) {
      const imgL = new Image();
      const imgR = new Image();
      
      if (this.character === 'ghost') {
        // Ghost uses different naming convention
        imgL.src = `assets/images/characters/${genderFolder}/walk/${this.character}_walk_facing_left${i}.png`;
        imgR.src = `assets/images/characters/${genderFolder}/walk/${this.character}_walk_facing_right${i}.png`;
      } else {
        imgL.src = `assets/images/characters/${genderFolder}/${this.character}/walk/${this.character}_walk_facing_left${i}.png`;
        imgR.src = `assets/images/characters/${genderFolder}/${this.character}/walk/${this.character}_walk_facing_right${i}.png`;
      }
      
      this.frames.walk.left.push(imgL);
      this.frames.walk.right.push(imgR);
    }
  },
  
  // Draw character
  drawCharacter({ x, y, isMoving, direction, animationFrame }) {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    
    // Ne töröljük a canvas-t, a Map kezeli azt
    // Karakter kirajzolása
    let char = (window.Player && window.Player.character) ? window.Player.character : (window.selectedCharacter || this.character || 'male1');
    const animType = isMoving ? 'walk' : 'idle';
    if (!this.frames[animType] || !this.frames[animType][direction] || this.frames[animType][direction].length === 0 || (this.character !== char)) {
      this.character = char;
      this.loadFrames();
    }
    const frames = this.frames[animType][direction];
    if (!frames || frames.length === 0) return;
    const frame = frames[animationFrame % frames.length];
    
    // Ha a Map kamera rendszert használ, alkalmazni kell a transform-ot
    const usingCameraSystem = window.Map && window.Map.camera;
    
    if (usingCameraSystem) {
      ctx.save();
      ctx.translate(-window.Map.camera.x, -window.Map.camera.y);
    }
    
    // Karakter rajzolása
    const width = frame.width || 64;
    const height = frame.height || 96;
    
    // Világkoordinátákban rajzoljuk ha kamera rendszer van
    const worldPos = usingCameraSystem ? 
      { x: window.Player.x - width/2, y: window.Player.y - height } :
      { x: x, y: y };
    
    ctx.drawImage(frame, worldPos.x, worldPos.y, width, height);
      
    // Name tag rajzolása (világkoordinátákban)
    const playerName = (window.Game && window.Game.username) || 'Player';
    const playerRole = (window.Game && window.Game.playerRole) || 'commoner';
    const groupColor = (window.Game && window.Game.groupColor) || null;
    this.drawNameTag(ctx, worldPos.x + width/2, worldPos.y - 10, playerName, playerRole, groupColor);
    
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
  }
};

// Export the Animation object
export default Animation; 