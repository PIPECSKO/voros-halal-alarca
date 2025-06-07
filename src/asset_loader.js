/**
 * Asset Loader for "A vörös halál álarca"
 * 
 * This module handles loading and caching all game assets (images and sounds)
 */

const assetLoader = {
  // Asset cache
  cache: {},
  
  // Load status
  loaded: false,
  totalAssets: 0,
  loadedAssets: 0,
  
  // Track loading progress
  onProgress: null,
  onComplete: null,
  
  // Define asset paths
  imagePaths: {
    // Characters
    'prince': 'assets/images/characters/prince.png',
    'noble': 'assets/images/characters/noble.png',
    'commoner': 'assets/images/characters/commoner.png',
    'plague': 'assets/images/characters/plague.png',
    'ghost': 'assets/images/characters/ghost.png',
    'dead': 'assets/images/characters/dead.png',
    
    // Character Heads (will be populated dynamically)
    
    // Animations
    'death': 'assets/images/animations/death.png',
    'task_dance_anim': 'assets/images/animations/task_dance.png',
    'task_eat_anim': 'assets/images/animations/task_eat.png',
    'task_cards_anim': 'assets/images/animations/task_cards.png',
    'task_toilet_anim': 'assets/images/animations/task_toilet.png',
    'task_smoke_anim': 'assets/images/animations/task_smoke.png',
    'task_drink_anim': 'assets/images/animations/task_drink.png',
    'effect_infect': 'assets/images/animations/effect_infect.png',
    'effect_stab': 'assets/images/animations/effect_stab.png',
    'effect_cleanup': 'assets/images/animations/effect_cleanup.png',
    
    // Windows
    'windows_blue': 'assets/images/windows/windows_blue.png',
    'windows_red': 'assets/images/windows/windows_red.png',
    'windows_green': 'assets/images/windows/windows_green.png',
    'windows_orange': 'assets/images/windows/windows_orange.png',
    'windows_white': 'assets/images/windows/windows_white.png',
    'windows_purple': 'assets/images/windows/windows_purple.png',
    'windows_black': 'assets/images/windows/windows_black.png',
    
    // Decorations
    'decorations_blue': 'assets/images/decorations/decorations_blue.png',
    'decorations_red': 'assets/images/decorations/decorations_red.png',
    'decorations_green': 'assets/images/decorations/decorations_green.png',
    'decorations_orange': 'assets/images/decorations/decorations_orange.png',
    'decorations_white': 'assets/images/decorations/decorations_white.png',
    'decorations_purple': 'assets/images/decorations/decorations_purple.png',
    'decorations_black': 'assets/images/decorations/decorations_black.png',
    
    // Task Icons
    'task_dance': 'assets/images/tasks/task_dance.png',
    'task_eat': 'assets/images/tasks/task_eat.png',
    'task_cards': 'assets/images/tasks/task_cards.png',
    'task_toilet': 'assets/images/tasks/task_toilet.png',
    'task_smoke': 'assets/images/tasks/task_smoke.png',
    'task_drink': 'assets/images/tasks/task_drink.png',
    
    // Other Images
    'clock': 'assets/images/clock.png',
    'logo': 'assets/images/logo.png',
    'background': 'assets/images/background.png',
    'map': 'assets/images/map.png'
  },
  
  soundPaths: {
    // Interface Sounds
    'click': 'assets/sounds/click.mp3',
    'error': 'assets/sounds/error.mp3',
    'start_game': 'assets/sounds/start_game.mp3',
    'join': 'assets/sounds/join.mp3',
    
    // Game Mechanics Sounds
    'round_start': 'assets/sounds/round_start.mp3',
    'round_end': 'assets/sounds/round_end.mp3',
    'death_bell': 'assets/sounds/death_bell.mp3',
    'clock_tick': 'assets/sounds/clock_tick.mp3',
    
    // Task Sounds
    'task_dance': 'assets/sounds/task_dance.mp3',
    'task_eat': 'assets/sounds/task_eat.mp3',
    'task_cards': 'assets/sounds/task_cards.mp3',
    'task_toilet': 'assets/sounds/task_toilet.mp3',
    'task_smoke': 'assets/sounds/task_smoke.mp3',
    'task_drink': 'assets/sounds/task_drink.mp3',
    
    // Ability Sounds
    'infect': 'assets/sounds/infect.mp3',
    'stab': 'assets/sounds/stab.mp3',
    'cleanup': 'assets/sounds/cleanup.mp3',
    'promotion': 'assets/sounds/promotion.mp3',
    
    // Ambient Sounds
    'ambience': 'assets/sounds/ambience.mp3',
    'crowd': 'assets/sounds/crowd.mp3',
    'midnight': 'assets/sounds/midnight.mp3'
  },
  
  musicPaths: {
    'menu_music': 'assets/sounds/menu_music.mp3',
    'lobby_music': 'assets/sounds/lobby/lobby1.mp3',
    'game_music': 'assets/sounds/game_music.mp3',
    'discussion_music': 'assets/sounds/discussion_music.mp3',
    'plague_win': 'assets/sounds/plague_win.mp3',
    'player_win': 'assets/sounds/player_win.mp3'
  },
  
  // Add character heads dynamically
  constructor() {
    for (let i = 1; i <= 10; i++) {
      this.imagePaths[`head_${i}`] = `assets/images/characters/head_${i}.png`;
    }
  },
  
  /**
   * Load all game assets
   * @param {Function} onProgress - Callback for loading progress (0.0 to 1.0)
   * @param {Function} onComplete - Callback when all assets are loaded
   */
  loadAll(onProgress = null, onComplete = null) {
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    
    // Count total assets
    this.totalAssets = Object.keys(this.imagePaths).length + 
                      Object.keys(this.soundPaths).length + 
                      Object.keys(this.musicPaths).length;
    this.loadedAssets = 0;
    
    // Load all images
    for (let key in this.imagePaths) {
      this.loadImage(key, this.imagePaths[key]);
    }
    
    // Load all sounds - make these optional
    for (let key in this.soundPaths) {
      this.loadSoundWithFallback(key, this.soundPaths[key]);
    }
    
    // Load all music - make these optional
    for (let key in this.musicPaths) {
      this.loadMusicWithFallback(key, this.musicPaths[key]);
    }

    // Ensure we eventually complete loading even if there are issues
    setTimeout(() => {
      if (this.loadedAssets < this.totalAssets) {
        console.warn(`Loading timed out with ${this.loadedAssets}/${this.totalAssets} assets loaded. Forcing completion.`);
        if (this.onComplete) {
          this.onComplete();
        }
      }
    }, 5000); // 5 second timeout
  },
  
  /**
   * Load a single image
   * @param {string} key - Reference key for the image
   * @param {string} path - File path to the image
   */
  loadImage(key, path) {
    return new Promise((resolve, reject) => {
      console.log(`Loading image: ${path}`);
      
      // Create new image
      const img = new Image();
      
      // Set up event handlers
      img.onload = () => {
        this.cache[key] = img;
        this.loadedAssets++;
        console.log(`Loaded image: ${path}`);
        resolve(img);
      };
      
      img.onerror = (e) => {
        console.error(`Failed to load image: ${path}`, e);
        // Create a colored rectangle as fallback
        const fallbackCanvas = document.createElement('canvas');
        fallbackCanvas.width = 40;
        fallbackCanvas.height = 60;
        const ctx = fallbackCanvas.getContext('2d');
        ctx.fillStyle = this.getFallbackColor(key);
        ctx.fillRect(0, 0, 40, 60);
        ctx.strokeStyle = 'white';
        ctx.strokeRect(0, 0, 40, 60);
        
        // Store the fallback canvas as the image
        this.cache[key] = fallbackCanvas;
        this.loadedAssets++;
        resolve(fallbackCanvas);
      };
      
      // Start loading
      img.src = path;
    });
  },
  
  /**
   * Load a sound with fallback for missing files
   */
  loadSoundWithFallback(key, path) {
    // Create a dummy audio element if the file doesn't exist
    const sound = new Audio();
    
    // Set a timeout to ensure loading completes
    const timeoutId = setTimeout(() => {
      console.warn(`Loading timed out for sound: ${path}`);
      this.assetLoaded();
    }, 1000);
    
    sound.oncanplaythrough = () => {
      clearTimeout(timeoutId);
      sound.oncanplaythrough = null; // Prevent it from firing multiple times
      this.assetLoaded();
    };
    
    sound.onerror = (err) => {
      clearTimeout(timeoutId);
      console.warn(`Failed to load sound: ${path} - Using silent fallback`);
      this.assetLoaded();
    };
    
    sound.src = path;
    sound.load();
    this.cache[key] = sound;
  },
  
  /**
   * Load music with fallback for missing files
   */
  loadMusicWithFallback(key, path) {
    // Create a dummy audio element if the file doesn't exist
    const music = new Audio();
    
    // Set a timeout to ensure loading completes
    const timeoutId = setTimeout(() => {
      console.warn(`Loading timed out for music: ${path}`);
      this.assetLoaded();
    }, 1000);
    
    music.oncanplaythrough = () => {
      clearTimeout(timeoutId);
      music.oncanplaythrough = null; // Prevent it from firing multiple times
      this.assetLoaded();
    };
    
    music.onerror = (err) => {
      clearTimeout(timeoutId);
      console.warn(`Failed to load music: ${path} - Using silent fallback`);
      this.assetLoaded();
    };
    
    music.src = path;
    music.load();
    this.cache[key] = music;
  },
  
  /**
   * Load a single sound effect
   * @param {string} key - Reference key for the sound
   * @param {string} path - File path to the sound
   * @deprecated Use loadSoundWithFallback instead
   */
  loadSound(key, path) {
    this.loadSoundWithFallback(key, path);
  },
  
  /**
   * Load a music track
   * @param {string} key - Reference key for the music
   * @param {string} path - File path to the music
   * @deprecated Use loadMusicWithFallback instead
   */
  loadMusic(key, path) {
    this.loadMusicWithFallback(key, path);
  },
  
  /**
   * Called each time an asset loads, tracks progress
   * and calls callbacks as needed
   */
  assetLoaded() {
    this.loadedAssets++;
    
    const progress = this.loadedAssets / this.totalAssets;
    
    if (this.onProgress) {
      this.onProgress(progress);
    }
    
    if (this.loadedAssets === this.totalAssets && this.onComplete) {
      this.onComplete();
    }
  },
  
  /**
   * Get a loaded image
   * @param {string} key - Image key
   * @returns {HTMLImageElement} - The loaded image
   */
  getImage(key) {
    if (!this.cache[key]) {
      console.warn(`Image '${key}' not loaded, using fallback`);
      return this.cache['prince'] || new Image(); // Use prince as fallback if available
    }
    return this.cache[key];
  },
  
  /**
   * Play a sound effect
   * @param {string} key - Sound key
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  playSound(key, volume = 1.0) {
    if (!this.cache[key]) {
      console.warn(`Sound '${key}' not loaded, skipping playback`);
      return;
    }
    
    try {
      // Clone the sound to allow multiple plays
      const soundClone = this.cache[key].cloneNode();
      soundClone.volume = volume;
      soundClone.play().catch(err => {
        console.warn(`Error playing sound '${key}':`, err);
      });
    } catch (err) {
      console.warn(`Error cloning sound '${key}':`, err);
    }
  },
  
  /**
   * Play music track
   * @param {string} key - Music key
   * @param {number} volume - Volume level (0.0 to 1.0)
   * @param {boolean} loop - Whether to loop the music
   */
  playMusic(key, volume = 0.7, loop = true) {
    if (!this.cache[key]) {
      console.warn(`Music '${key}' not loaded, skipping playback`);
      return;
    }
    
    try {
      const music = this.cache[key];
      music.volume = volume;
      music.loop = loop;
      music.currentTime = 0;
      music.play().catch(err => {
        console.warn(`Error playing music '${key}':`, err);
      });
    } catch (err) {
      console.warn(`Error playing music '${key}':`, err);
    }
  },
  
  /**
   * Stop music playback
   * @param {string} key - Music key
   */
  stopMusic(key) {
    if (!this.cache[key]) {
      console.error(`Music '${key}' not loaded`);
      return;
    }
    
    this.cache[key].pause();
    this.cache[key].currentTime = 0;
  },
  
  /**
   * Stop all currently playing music
   */
  stopAllMusic() {
    for (let key in this.cache) {
      if (this.cache[key] instanceof Audio) {
        this.cache[key].pause();
        this.cache[key].currentTime = 0;
      }
    }
  },
  
  // Get fallback color based on asset key
  getFallbackColor(key) {
    if (key.includes('prince')) return '#8B0000'; // Dark red
    if (key.includes('noble')) return '#FFD700';  // Gold
    if (key.includes('commoner')) return '#4682B4'; // Steel blue
    if (key.includes('plague')) return '#8B008B'; // Dark purple
    if (key.includes('ghost')) return 'rgba(200, 200, 200, 0.5)'; // Transparent white
    if (key.includes('dead')) return '#444444'; // Dark gray
    return '#888888'; // Default gray
  },
  
  // Get an asset from cache
  getAsset(key) {
    return this.cache[key];
  },
  
  // Get loading progress (0-100)
  getProgress() {
    if (this.totalAssets === 0) return 100;
    return Math.min(100, Math.round((this.loadedAssets / this.totalAssets) * 100));
  },
  
  // Check if all assets are loaded
  isLoaded() {
    return this.loaded;
  },
  
  // Clear the cache
  clearCache() {
    this.cache = {};
    this.loaded = false;
    this.totalAssets = 0;
    this.loadedAssets = 0;
  }
};

export default assetLoader; 