/**
 * Loading Screen for "A vörös halál álarca"
 * 
 * Displays a loading screen while assets are being loaded
 * Provides visual progress indication
 */

import assetLoader from './asset_loader.js';

class LoadingScreen {
  constructor() {
    // Create loading screen elements
    this.loadingOverlay = document.createElement('div');
    this.loadingOverlay.className = 'loading-overlay';
    
    this.loadingContainer = document.createElement('div');
    this.loadingContainer.className = 'loading-container';
    
    this.loadingTitle = document.createElement('h1');
    this.loadingTitle.textContent = 'A vörös halál álarca';
    this.loadingTitle.className = 'loading-title';
    
    this.loadingSubtitle = document.createElement('p');
    this.loadingSubtitle.textContent = 'Loading game assets...';
    this.loadingSubtitle.className = 'loading-subtitle';
    
    this.loadingProgressContainer = document.createElement('div');
    this.loadingProgressContainer.className = 'loading-progress-container';
    
    this.loadingProgressBar = document.createElement('div');
    this.loadingProgressBar.className = 'loading-progress-bar';
    
    this.loadingProgressText = document.createElement('div');
    this.loadingProgressText.className = 'loading-progress-text';
    this.loadingProgressText.textContent = '0%';
    
    // Assemble the loading screen
    this.loadingProgressContainer.appendChild(this.loadingProgressBar);
    this.loadingContainer.appendChild(this.loadingTitle);
    this.loadingContainer.appendChild(this.loadingSubtitle);
    this.loadingContainer.appendChild(this.loadingProgressContainer);
    this.loadingContainer.appendChild(this.loadingProgressText);
    this.loadingOverlay.appendChild(this.loadingContainer);
    
    // Define styling for loading screen
    this.applyStyles();
    
    // Track current progress and whether loading is complete
    this.progress = 0;
    this.isComplete = false;
    
    // Remember callback for when loading is complete
    this.onComplete = null;
  }
  
  /**
   * Apply CSS styles to loading screen elements
   */
  applyStyles() {
    // Loading overlay styles (full-screen, dark background)
    Object.assign(this.loadingOverlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: '9999',
      transition: 'opacity 1s',
      fontFamily: '"Press Start 2P", "Courier New", monospace',
      color: '#8b0000'
    });
    
    // Loading container styles (centered content)
    Object.assign(this.loadingContainer.style, {
      textAlign: 'center',
      padding: '20px',
      borderRadius: '10px',
      backgroundColor: 'rgba(20, 20, 20, 0.8)',
      boxShadow: '0 0 20px #8b0000',
      maxWidth: '80%'
    });
    
    // Title styles
    Object.assign(this.loadingTitle.style, {
      color: '#8b0000',
      fontSize: '32px',
      marginBottom: '20px',
      textShadow: '0 0 10px rgba(139, 0, 0, 0.7)'
    });
    
    // Subtitle styles
    Object.assign(this.loadingSubtitle.style, {
      color: '#cccccc',
      fontSize: '16px',
      marginBottom: '30px'
    });
    
    // Progress container styles
    Object.assign(this.loadingProgressContainer.style, {
      width: '100%',
      height: '30px',
      backgroundColor: '#333333',
      borderRadius: '15px',
      overflow: 'hidden',
      marginBottom: '10px',
      border: '2px solid #555555'
    });
    
    // Progress bar styles
    Object.assign(this.loadingProgressBar.style, {
      height: '100%',
      width: '0%',
      backgroundColor: '#8b0000',
      transition: 'width 0.3s ease',
      boxShadow: '0 0 10px #8b0000 inset'
    });
    
    // Progress text styles
    Object.assign(this.loadingProgressText.style, {
      color: '#ffffff',
      fontSize: '14px',
      marginTop: '10px'
    });
  }
  
  /**
   * Show the loading screen and start loading assets
   * @param {Function} onComplete - Callback function when loading is finished
   */
  show(onComplete) {
    // Add to document
    document.body.appendChild(this.loadingOverlay);
    
    // Store callback
    this.onComplete = onComplete;
    
    // Start loading assets
    assetLoader.loadAll(
      (progress) => this.updateProgress(progress),
      () => this.complete()
    );
  }
  
  /**
   * Update the progress display
   * @param {number} progress - Loading progress from 0.0 to 1.0
   */
  updateProgress(progress) {
    this.progress = progress;
    
    // Update progress bar width
    const percent = Math.round(progress * 100);
    this.loadingProgressBar.style.width = `${percent}%`;
    this.loadingProgressText.textContent = `${percent}%`;
    
    // Update subtitle for certain milestones
    if (percent < 25) {
      this.loadingSubtitle.textContent = 'Loading character assets...';
    } else if (percent < 50) {
      this.loadingSubtitle.textContent = 'Loading room assets...';
    } else if (percent < 75) {
      this.loadingSubtitle.textContent = 'Loading sound effects...';
    } else {
      this.loadingSubtitle.textContent = 'Preparing the castle...';
    }
  }
  
  /**
   * Called when loading is complete
   */
  complete() {
    this.isComplete = true;
    
    // Update to 100% just in case
    this.updateProgress(1.0);
    this.loadingSubtitle.textContent = 'Welcome to the masquerade...';
    
    // Fade out the loading screen
    setTimeout(() => {
      this.loadingOverlay.style.opacity = '0';
      
      // Remove from DOM after fade out
      setTimeout(() => {
        if (this.loadingOverlay.parentNode) {
          this.loadingOverlay.parentNode.removeChild(this.loadingOverlay);
        }
        
        // Call the completion callback
        if (this.onComplete) {
          this.onComplete();
        }
      }, 1000);
    }, 500);
  }
  
  /**
   * Manually hide the loading screen (e.g., for errors)
   */
  hide() {
    if (this.loadingOverlay.parentNode) {
      this.loadingOverlay.parentNode.removeChild(this.loadingOverlay);
    }
  }
}

// Create and export a singleton instance
const loadingScreen = new LoadingScreen();
export default loadingScreen; 