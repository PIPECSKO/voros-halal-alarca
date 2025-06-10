// Main entry point for game
import Game from './game.js';
import UI from './ui.js';
import Map from './map.js';
import Player from './player.js';
import Animation from './animation.js';
import Audio from './audio.js';
import NPC from './npc.js';

// Wait for DOM to load
window.addEventListener('DOMContentLoaded', () => {
  // Fullscreen funkció
  function enterFullscreen() {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.mozRequestFullScreen) { // Firefox
      element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) { // Chrome, Safari
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) { // IE/Edge
      element.msRequestFullscreen();
    }
  }

  // Fullscreen kilépés
  function exitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }

  // Fullscreen toggle
  function toggleFullscreen() {
    if (!document.fullscreenElement && !document.mozFullScreenElement && 
        !document.webkitFullscreenElement && !document.msFullscreenElement) {
      enterFullscreen();
    } else {
      exitFullscreen();
    }
  }

  // F11 és ESC billentyű kezelése
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F11') {
      e.preventDefault();
      toggleFullscreen();
    } else if (e.key === 'Escape' && document.fullscreenElement) {
      // ESC már automatikusan kilép a fullscreen-ből a böngészőben
      console.log('ESC pressed - fullscreen will exit automatically');
    }
  });

  // Fullscreen változás kezelése
  document.addEventListener('fullscreenchange', () => {
    const isFullscreen = !!document.fullscreenElement;
    console.log('Fullscreen changed:', isFullscreen);
    
    // Fullscreen indikátor megjelenítése/elrejtése
    const indicator = document.getElementById('fullscreen-indicator');
    if (indicator) {
      indicator.style.display = isFullscreen ? 'block' : 'none';
    }
    
    // Canvas újraméretezése fullscreen változáskor
    setTimeout(resizeCanvas, 100);
  });

  // Canvas méret beállítása - alkalmazkodás a böngésző méretéhez 16:9 arányban
  const canvas = document.getElementById('game-canvas');
  function resizeCanvas() {
    // Elérhető viewport méret
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 16:9 arány megtartása (1920:1080 = 16:9)
    const targetAspectRatio = 16 / 9;
    
    let canvasWidth, canvasHeight;
    
    // Számoljuk ki, hogy mi fér be jobban - szélesség vagy magasság alapján
    if (viewportWidth / viewportHeight > targetAspectRatio) {
      // Magasság a korlátozó
      canvasHeight = viewportHeight;
      canvasWidth = canvasHeight * targetAspectRatio;
    } else {
      // Szélesség a korlátozó
      canvasWidth = viewportWidth;
      canvasHeight = canvasWidth / targetAspectRatio;
    }
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    console.log('Canvas resized to:', canvasWidth + 'x' + canvasHeight);
    console.log('Viewport size:', viewportWidth + 'x' + viewportHeight);
    
    // Frissítjük a Map scaling értékeit is
    if (window.Map) {
      window.Map.scaleX = canvas.width / 1920;
      window.Map.scaleY = canvas.height / 1080;
      window.Map.roomWidth = 1920 * window.Map.scaleX;
      window.Map.roomHeight = 1080 * window.Map.scaleY;
    }
    
    if (window.Map && window.Map.draw && window.Player) {
      window.Map.clear();
      window.Map.draw(window.Player.x, window.Player.y);
    } else if (window.Map && window.Map.draw) {
      window.Map.clear();
      window.Map.draw();
    }
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Inicializálás - fontos: Map először, hogy a scaling beállításra kerüljön
  async function initializeGame() {
    UI.init();
    Map.init(); // Először a Map, hogy beállítsa a scaling értékeket
    Audio.init(); // Audio rendszer inicializálása
    Player.init(); // Utána a Player, hogy használhassa a scaling értékeket
    NPC.init(); // Initialize NPCs early so they're available
    await Game.init(); // Game.init most async, várjuk meg
    
    // Make modules available globally
    window.Audio = Audio;
    window.NPC = NPC;
    window.Player = Player;
    window.Animation = Animation;
    window.Map = Map;
    window.Game = Game;
    
    // Setup main menu volume controls
    setupMainMenuVolumeControls();
  }
  
  // Setup main menu volume controls
  function setupMainMenuVolumeControls() {
    const musicSlider = document.getElementById('main-menu-music-volume-slider');
    const musicDisplay = document.getElementById('main-menu-music-volume-display');
    
    if (musicSlider && musicDisplay && window.Audio) {
      // Set initial value from Audio system
      const currentMusicVolume = Math.round(window.Audio.getMusicVolume() * 100);
      musicSlider.value = currentMusicVolume;
      musicDisplay.textContent = currentMusicVolume + '%';
      
      // Add event listener for music volume changes
      musicSlider.addEventListener('input', (e) => {
        const volume = parseInt(e.target.value) / 100;
        window.Audio.setMusicVolume(volume);
        musicDisplay.textContent = e.target.value + '%';
        console.log('Main menu music volume changed to:', volume);
      });
    }
  }
  
  // Start initialization
  initializeGame();
  
  // Fullscreen gomb event listener
  const fullscreenBtn = document.getElementById('fullscreen-button');
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      enterFullscreen();
    });
  }
  
  // Játék indításkor automatikus fullscreen kísérlet
  const hostBtn = document.getElementById('host-button');
  if (hostBtn) {
    const originalClickHandler = hostBtn.onclick;
    hostBtn.addEventListener('click', () => {
      // Fullscreen kísérlet a játék indításakor
      setTimeout(() => {
        enterFullscreen();
      }, 500); // Kis késleltetés, hogy a UI változások megtörténjenek
    });
  }
  
  // Add global error handler
  window.handleError = (message) => {
    console.error('Game error:', message);
    UI.showError(message);
  };
  
  // Add debug console commands
  window.debug = {
    game: Game,
    showPosition: () => console.log(Game.position),
    toggleGrid: () => {
      window.showDebugGrid = !window.showDebugGrid;
      console.log('Debug grid:', window.showDebugGrid ? 'enabled' : 'disabled');
    },
    enterFullscreen: enterFullscreen,
    exitFullscreen: exitFullscreen,
    toggleFullscreen: toggleFullscreen
  };
  
  console.log('Game ready!');
}); 