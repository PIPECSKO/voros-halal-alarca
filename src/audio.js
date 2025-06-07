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
    
    // Set volume for footsteps
    this.sounds.step1.volume = this.soundEffectsVolume * 0.3; // 30% of current SFX volume
    this.sounds.step2.volume = this.soundEffectsVolume * 0.3;
    
    // Preload sounds
    this.sounds.step1.preload = 'auto';
    this.sounds.step2.preload = 'auto';
    
    console.log("Audio sounds loaded");
  },
  
  // Load all music tracks
  loadMusic() {
    console.log("Loading music tracks...");
    
    // Load lobby music
    this.music.lobby = new window.Audio('assets/sounds/lobby/lobby1.mp3');
    this.music.lobby.volume = this.musicVolume;
    this.music.lobby.loop = true;
    this.music.lobby.preload = 'auto';
    
    console.log("Music tracks loaded");
  },
  
  // Set sound effects volume
  setSoundEffectsVolume(volume) {
    this.soundEffectsVolume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('soundEffectsVolume', this.soundEffectsVolume);
    
    // Update existing sound volumes
    if (this.sounds.step1) this.sounds.step1.volume = this.soundEffectsVolume * 0.3;
    if (this.sounds.step2) this.sounds.step2.volume = this.soundEffectsVolume * 0.3;
    
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
  }
};

export default Audio; 