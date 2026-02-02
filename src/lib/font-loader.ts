/**
 * Dynamic Font Loader
 * Loads Google Fonts on demand to improve performance
 */

import { FontOption } from './fonts';

class FontLoader {
  private loadedFonts: Set<string> = new Set();
  private loadingFonts: Map<string, Promise<void>> = new Map();
  
  /**
   * Load a single font from Google Fonts
   */
  async loadFont(font: FontOption): Promise<void> {
    // Skip if not a Google Font
    if (!font.googleFont) {
      return;
    }
    
    // Skip if already loaded
    if (this.loadedFonts.has(font.name)) {
      return;
    }
    
    // If currently loading, return existing promise
    const existingPromise = this.loadingFonts.get(font.name);
    if (existingPromise) {
      return existingPromise;
    }
    
    // Create new loading promise
    const loadPromise = this._loadFontFromGoogle(font);
    this.loadingFonts.set(font.name, loadPromise);
    
    try {
      await loadPromise;
      this.loadedFonts.add(font.name);
    } finally {
      this.loadingFonts.delete(font.name);
    }
  }
  
  /**
   * Load multiple fonts at once
   */
  async loadFonts(fonts: FontOption[]): Promise<void> {
    const googleFonts = fonts.filter(f => f.googleFont);
    await Promise.all(googleFonts.map(font => this.loadFont(font)));
  }
  
  /**
   * Check if a font is loaded
   */
  isLoaded(fontName: string): boolean {
    return this.loadedFonts.has(fontName);
  }
  
  /**
   * Preload a font (for hover optimization)
   */
  preload(font: FontOption): void {
    if (!font.googleFont || this.loadedFonts.has(font.name)) {
      return;
    }
    
    // Start loading but don't await
    this.loadFont(font).catch(err => {
      console.warn(`Failed to preload font ${font.name}:`, err);
    });
  }
  
  /**
   * Internal method to load font from Google
   */
  private _loadFontFromGoogle(font: FontOption): Promise<void> {
    return new Promise((resolve, reject) => {
      // Build Google Fonts URL
      const fontName = font.name.replace(/ /g, '+');
      const weights = font.weights ? `:wght@${font.weights.join(';')}` : '';
      const fontUrl = `https://fonts.googleapis.com/css2?family=${fontName}${weights}&display=swap`;
      
      // Check if link already exists
      const existingLink = document.querySelector(`link[href="${fontUrl}"]`);
      if (existingLink) {
        this.loadedFonts.add(font.name);
        resolve();
        return;
      }
      
      // Create link element
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = fontUrl;
      
      link.onload = () => {
        resolve();
      };
      
      link.onerror = () => {
        reject(new Error(`Failed to load font: ${font.name}`));
      };
      
      // Add to document
      document.head.appendChild(link);
      
      // Fallback timeout (5 seconds)
      setTimeout(() => {
        if (!this.loadedFonts.has(font.name)) {
          console.warn(`Font loading timeout for ${font.name}, continuing anyway`);
          resolve();
        }
      }, 5000);
    });
  }
  
  /**
   * Get all loaded fonts
   */
  getLoadedFonts(): string[] {
    return Array.from(this.loadedFonts);
  }
  
  /**
   * Clear loaded fonts cache (for testing)
   */
  clearCache(): void {
    this.loadedFonts.clear();
    this.loadingFonts.clear();
  }
}

// Export singleton instance
export const fontLoader = new FontLoader();

// Export class for testing
export { FontLoader };
