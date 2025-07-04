// Audio Handler
const Audio = {
  // Audio elements
  sounds: {},
  music: {},
  
  // Footstep alternation
  currentFootstepIndex: 0,
  
  // Current music state
  currentMusic: null,
  lobbyMusicStarted: false, // Flag to track if lobby music has been started before
  
  // Volume controls
  soundEffectsVolume: 0.7, // Default volume for sound effects
  musicVolume: 0.4, // Default volume for music
  soundEffectsEnabled: true, // Enable sound effects by default
  
  // Initialize audio system
  init() {
    console.log("Audio.init started");
    this.loadSounds();
    this.loadMusic();
    
    // Load volume settings from localStorage if available
    const savedSoundVolume = localStorage.getItem('soundEffectsVolume');
    const savedMusicVolume = localStorage.getItem('musicVolume');
    
    if (savedSoundVolume !== null) {
      this.soundEffectsVolume = parseFloat(savedSoundVolume);
    }
    if (savedMusicVolume !== null) {
      this.musicVolume = parseFloat(savedMusicVolume);
    }
    
    console.log("Audio initialized with volumes - SFX:", this.soundEffectsVolume, "Music:", this.musicVolume);
  },
  
  // Load all game sounds
  loadSounds() {
    // Load footstep sounds
    this.sounds.step1 = new window.Audio('assets/sounds/step1.mp3');
    this.sounds.step2 = new window.Audio('assets/sounds/step2.mp3');
    
    // Load sword swing sounds
    console.log("Loading sword sounds...");
    this.sounds.sword1 = new window.Audio('assets/sounds/sword/sword1.mp3');
    this.sounds.sword2 = new window.Audio('assets/sounds/sword/sword2.mp3');
    
    // Load task sounds
    console.log("Loading task sounds...");
    this.sounds.eating = new window.Audio('assets/sounds/task/eating.mp3');
    this.sounds.poker = new window.Audio('assets/sounds/task/poker.mp3');
    this.sounds.drinking = new window.Audio('assets/sounds/task/drinking.mp3');
    this.sounds.smoking = new window.Audio('assets/sounds/task/smoking.mp3');
    
    // Set volume for footsteps
    this.sounds.step1.volume = this.soundEffectsVolume * 0.3; // 30% of current SFX volume
    this.sounds.step2.volume = this.soundEffectsVolume * 0.3;
    
    // Set volume for sword sounds
    this.sounds.sword1.volume = this.soundEffectsVolume * 0.6; // 60% of current SFX volume for impact
    this.sounds.sword2.volume = this.soundEffectsVolume * 0.6;
    
    // Set volume for task sounds
    this.sounds.eating.volume = this.soundEffectsVolume * 0.4; // 40% of current SFX volume
    this.sounds.poker.volume = this.soundEffectsVolume * 0.4;
    this.sounds.drinking.volume = this.soundEffectsVolume * 0.4;
    this.sounds.smoking.volume = this.soundEffectsVolume * 0.4;
    
    // Preload sounds
    this.sounds.step1.preload = 'auto';
    this.sounds.step2.preload = 'auto';
    this.sounds.sword1.preload = 'auto';
    this.sounds.sword2.preload = 'auto';
    this.sounds.eating.preload = 'auto';
    this.sounds.poker.preload = 'auto';
    this.sounds.drinking.preload = 'auto';
    this.sounds.smoking.preload = 'auto';
    
    // Add load event listeners for debugging
    this.sounds.sword1.addEventListener('canplaythrough', () => {
      console.log("✓ sword1.mp3 loaded successfully");
    });
    this.sounds.sword2.addEventListener('canplaythrough', () => {
      console.log("✓ sword2.mp3 loaded successfully");
    });
    this.sounds.eating.addEventListener('canplaythrough', () => {
      console.log("✓ eating.mp3 loaded successfully");
    });
    this.sounds.poker.addEventListener('canplaythrough', () => {
      console.log("✓ poker.mp3 loaded successfully");
    });
    this.sounds.drinking.addEventListener('canplaythrough', () => {
      console.log("✓ drinking.mp3 loaded successfully");
    });
    this.sounds.smoking.addEventListener('canplaythrough', () => {
      console.log("✓ smoking.mp3 loaded successfully");
    });
    
    // Add error event listeners
    this.sounds.sword1.addEventListener('error', (e) => {
      console.error("✗ Error loading sword1.mp3:", e);
    });
    this.sounds.sword2.addEventListener('error', (e) => {
      console.error("✗ Error loading sword2.mp3:", e);
    });
    this.sounds.eating.addEventListener('error', (e) => {
      console.error("✗ Error loading eating.mp3:", e);
    });
    this.sounds.poker.addEventListener('error', (e) => {
      console.error("✗ Error loading poker.mp3:", e);
    });
    this.sounds.drinking.addEventListener('error', (e) => {
      console.error("✗ Error loading drinking.mp3:", e);
    });
    this.sounds.smoking.addEventListener('error', (e) => {
      console.error("✗ Error loading smoking.mp3:", e);
    });
    
    console.log("Audio sounds loaded (including sword and task sounds)");
  },
  
  // Load all music tracks
  loadMusic() {
    console.log("Loading music tracks...");
    
    // Load lobby music with error handling
    try {
      this.music.lobby = new window.Audio('assets/sounds/lobby/lobby1.mp3');
      this.music.lobby.volume = this.musicVolume;
      this.music.lobby.loop = true;
      this.music.lobby.preload = 'auto';
      
      // Add error handling for the audio element
      this.music.lobby.addEventListener('error', (e) => {
        console.warn("Lobby music loading error:", e);
      });
      
      this.music.lobby.addEventListener('loadstart', () => {
        console.log("Lobby music loading started");
      });
      
      this.music.lobby.addEventListener('canplaythrough', () => {
        console.log("Lobby music loaded successfully");
      });
      
    } catch (error) {
      console.warn("Error loading lobby music:", error);
    }
    
    console.log("Music tracks loaded");
  },
  
  // Set sound effects volume
  setSoundEffectsVolume(volume) {
    this.soundEffectsVolume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('soundEffectsVolume', this.soundEffectsVolume);
    
    // Update existing sound volumes
    if (this.sounds.step1) this.sounds.step1.volume = this.soundEffectsVolume * 0.3;
    if (this.sounds.step2) this.sounds.step2.volume = this.soundEffectsVolume * 0.3;
    if (this.sounds.sword1) this.sounds.sword1.volume = this.soundEffectsVolume * 0.6;
    if (this.sounds.sword2) this.sounds.sword2.volume = this.soundEffectsVolume * 0.6;
    
    console.log("Sound effects volume set to:", this.soundEffectsVolume);
  },
  
  // Set music volume
  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('musicVolume', this.musicVolume);
    
    // Update existing music volumes
    if (this.music.lobby) this.music.lobby.volume = this.musicVolume;
    
    console.log("Music volume set to:", this.musicVolume);
  },
  
  // Get current sound effects volume
  getSoundEffectsVolume() {
    return this.soundEffectsVolume;
  },
  
  // Get current music volume
  getMusicVolume() {
    return this.musicVolume;
  },
  
  // Play footstep sound (alternating between step1 and step2)
  playFootstep() {
    try {
      const stepSound = this.currentFootstepIndex === 0 ? this.sounds.step1 : this.sounds.step2;
      
      // Reset and play the sound
      stepSound.currentTime = 0;
      stepSound.play().catch(err => {
        console.log("Audio play failed (user interaction required):", err.message);
      });
      
      // Alternate between step1 and step2
      this.currentFootstepIndex = (this.currentFootstepIndex + 1) % 2;
    } catch (error) {
      console.warn("Footstep sound play error:", error);
    }
  },
  
  // Play random sword swing sound
  playSwordSwing() {
    console.log("🎵 PlaySwordSwing called"); // Debug log
    if (!this.soundEffectsEnabled) {
      console.log("Sound effects disabled, skipping sword swing sound");
      return;
    }
    
    // Choose random sword sound (1 or 2)
    const randomSound = Math.random() < 0.5 ? 'sword1' : 'sword2';
    console.log(`Playing ${randomSound}.mp3`);
    
    if (this.sounds[randomSound]) {
      this.sounds[randomSound].currentTime = 0; // Reset to beginning
      this.sounds[randomSound].play().catch(e => {
        console.error(`Error playing ${randomSound}:`, e);
      });
    } else {
      console.error(`${randomSound} sound not loaded!`);
    }
  },
  
  // Play eating task sound
  playEatingTask() {
    console.log("🎵 PlayEatingTask called"); // Debug log
    if (!this.soundEffectsEnabled) {
      console.log("Sound effects disabled, skipping eating task sound");
      return;
    }
    
    if (this.sounds.eating) {
      this.sounds.eating.currentTime = 0; // Reset to beginning
      this.sounds.eating.play().catch(e => {
        console.error("Error playing eating task sound:", e);
      });
    } else {
      console.error("Eating task sound not loaded!");
    }
  },
  
  // Play poker task sound
  playPokerTask() {
    console.log("🎵 PlayPokerTask called"); // Debug log
    if (!this.soundEffectsEnabled) {
      console.log("Sound effects disabled, skipping poker task sound");
      return;
    }
    
    if (this.sounds.poker) {
      this.sounds.poker.currentTime = 0; // Reset to beginning
      this.sounds.poker.play().catch(e => {
        console.error("Error playing poker task sound:", e);
      });
    } else {
      console.error("Poker task sound not loaded!");
    }
  },
  
  // Play drinking task sound
  playDrinkingTask() {
    console.log("🎵 PlayDrinkingTask called");
    if (!this.soundEffectsEnabled) {
      console.log("Sound effects disabled, skipping drinking task sound");
      return;
    }
    if (this.sounds.drinking) {
      this.sounds.drinking.currentTime = 0;
      this.sounds.drinking.play().catch(e => {
        console.error("Error playing drinking task sound:", e);
      });
    } else {
      console.error("Drinking task sound not loaded!");
    }
  },
  
  // Play smoking task sound
  playSmokingTask() {
    console.log("🎵 PlaySmokingTask called");
    if (!this.soundEffectsEnabled) {
      console.log("Sound effects disabled, skipping smoking task sound");
      return;
    }
    if (this.sounds.smoking) {
      this.sounds.smoking.currentTime = 0;
      this.sounds.smoking.play().catch(e => {
        console.error("Error playing smoking task sound:", e);
      });
    } else {
      console.error("Smoking task sound not loaded!");
    }
  },
  
  // Play a specific sound
  playSound(soundName) {
    try {
      if (this.sounds[soundName]) {
        this.sounds[soundName].volume = this.soundEffectsVolume;
        this.sounds[soundName].currentTime = 0;
        this.sounds[soundName].play().catch(err => {
          console.log(`${soundName} play failed:`, err.message);
        });
      }
    } catch (error) {
      console.warn(`Sound play error for ${soundName}:`, error);
    }
  },
  
  // Play lobby music
  playLobbyMusic() {
    try {
      console.log("Starting lobby music...");
      this.stopAllMusic();
      
      if (this.music.lobby) {
        this.music.lobby.currentTime = 0;
        this.music.lobby.play().catch(err => {
          console.log("Lobby music play failed (user interaction required):", err.message);
        });
        this.currentMusic = 'lobby';
        console.log("Lobby music started");
      } else {
        console.warn("Lobby music not loaded");
      }
    } catch (error) {
      console.warn("Lobby music play error:", error);
    }
  },
  
  // Resume lobby music from current position
  resumeLobbyMusic() {
    try {
      console.log("Resuming lobby music...");
      
      if (this.music.lobby) {
        // Ha még sosem indult, indítsuk az elejéről
        if (!this.lobbyMusicStarted) {
          console.log("First time starting lobby music");
          this.music.lobby.currentTime = 0;
          this.lobbyMusicStarted = true;
        }
        
        // Ne állítsuk vissza a currentTime-ot, folytassuk onnan ahol volt
        this.music.lobby.play().catch(err => {
          console.log("Lobby music resume failed (user interaction required):", err.message);
        });
        this.currentMusic = 'lobby';
        console.log("Lobby music resumed from position:", this.music.lobby.currentTime);
      } else {
        console.warn("Lobby music not loaded");
      }
    } catch (error) {
      console.warn("Lobby music resume error:", error);
    }
  },
  
  // Stop all music
  stopAllMusic() {
    try {
      for (let key in this.music) {
        if (this.music[key] && key !== 'lobby') {
          this.music[key].pause();
          this.music[key].currentTime = 0;
        }
      }
      if (this.currentMusic !== 'lobby') {
        this.currentMusic = null;
      }
      console.log("All music stopped (except lobby)");
    } catch (error) {
      console.warn("Stop music error:", error);
    }
  },
  
  // Pause lobby music (without resetting position)
  pauseLobbyMusic() {
    try {
      if (this.music.lobby) {
        this.music.lobby.pause();
        console.log("Lobby music paused at position:", this.music.lobby.currentTime);
      }
      if (this.currentMusic === 'lobby') {
        this.currentMusic = null;
      }
    } catch (error) {
      console.warn("Pause lobby music error:", error);
    }
  },
  
  // Stop lobby music specifically
  stopLobbyMusic() {
    try {
      if (this.music.lobby) {
        this.music.lobby.pause();
        console.log("Lobby music stopped at position:", this.music.lobby.currentTime);
      }
      if (this.currentMusic === 'lobby') {
        this.currentMusic = null;
      }
    } catch (error) {
      console.warn("Stop lobby music error:", error);
    }
  },
  
  // Update sound effects volume
  updateSoundEffectsVolume(volume) {
    this.soundEffectsVolume = volume;
    // Update footstep volume
    if (this.sounds.step1) this.sounds.step1.volume = volume * 0.3;
    if (this.sounds.step2) this.sounds.step2.volume = volume * 0.3;
    // Update sword sounds volume
    if (this.sounds.sword1) this.sounds.sword1.volume = volume * 0.6;
    if (this.sounds.sword2) this.sounds.sword2.volume = volume * 0.6;
    // Update task sounds volume
    if (this.sounds.eating) this.sounds.eating.volume = volume * 0.4;
    if (this.sounds.poker) this.sounds.poker.volume = volume * 0.4;
    if (this.sounds.drinking) this.sounds.drinking.volume = volume * 0.4;
    if (this.sounds.smoking) this.sounds.smoking.volume = volume * 0.4;
  },
  
  // Play dancing task sound (currently no sound, just a stub)
  playDancingTask() {
    // Ide később lehet táncolás hangot tenni
    console.log("🎵 PlayDancingTask called (no sound)");
  }
};

export default Audio; 