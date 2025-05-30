// Audio Handler
const Audio = {
  // Audio elements
  sounds: {},
  
  // Footstep alternation
  currentFootstepIndex: 0,
  
  // Initialize audio system
  init() {
    console.log("Audio.init started");
    this.loadSounds();
  },
  
  // Load all game sounds
  loadSounds() {
    // Load footstep sounds
    this.sounds.step1 = new window.Audio('assets/sounds/step1.mp3');
    this.sounds.step2 = new window.Audio('assets/sounds/step2.mp3');
    
    // Set volume for footsteps
    this.sounds.step1.volume = 0.3;
    this.sounds.step2.volume = 0.3;
    
    // Preload sounds
    this.sounds.step1.preload = 'auto';
    this.sounds.step2.preload = 'auto';
    
    console.log("Audio sounds loaded");
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
        this.sounds[soundName].currentTime = 0;
        this.sounds[soundName].play().catch(err => {
          console.log(`${soundName} play failed:`, err.message);
        });
      }
    } catch (error) {
      console.warn(`Sound play error for ${soundName}:`, error);
    }
  }
};

export default Audio; 