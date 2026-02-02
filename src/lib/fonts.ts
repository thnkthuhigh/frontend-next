/**
 * Font Definitions for Document Editor
 * Supports both Google Fonts and System Fonts
 */

export interface FontOption {
  name: string;
  value: string;
  category: 'serif' | 'sans-serif' | 'monospace';
  weights?: number[];
  googleFont?: boolean;
  fallback?: string;
}

export const AVAILABLE_FONTS: FontOption[] = [
  // Sans-serif (Modern, Clean)
  {
    name: 'Inter',
    value: 'Inter, sans-serif',
    category: 'sans-serif',
    weights: [400, 500, 600, 700],
    googleFont: true,
    fallback: 'system-ui, -apple-system, sans-serif',
  },
  {
    name: 'Roboto',
    value: 'Roboto, sans-serif',
    category: 'sans-serif',
    weights: [300, 400, 500, 700],
    googleFont: true,
    fallback: 'Arial, sans-serif',
  },
  {
    name: 'Open Sans',
    value: '"Open Sans", sans-serif',
    category: 'sans-serif',
    weights: [400, 600, 700],
    googleFont: true,
    fallback: 'Arial, sans-serif',
  },
  {
    name: 'Lato',
    value: 'Lato, sans-serif',
    category: 'sans-serif',
    weights: [400, 700],
    googleFont: true,
    fallback: 'Arial, sans-serif',
  },
  {
    name: 'Montserrat',
    value: 'Montserrat, sans-serif',
    category: 'sans-serif',
    weights: [400, 600, 700],
    googleFont: true,
    fallback: 'Arial, sans-serif',
  },
  
  // Serif (Elegant, Traditional)
  {
    name: 'Merriweather',
    value: 'Merriweather, serif',
    category: 'serif',
    weights: [400, 700],
    googleFont: true,
    fallback: 'Georgia, serif',
  },
  {
    name: 'Playfair Display',
    value: '"Playfair Display", serif',
    category: 'serif',
    weights: [400, 600, 700],
    googleFont: true,
    fallback: 'Georgia, serif',
  },
  {
    name: 'Lora',
    value: 'Lora, serif',
    category: 'serif',
    weights: [400, 600, 700],
    googleFont: true,
    fallback: 'Georgia, serif',
  },
  {
    name: 'Crimson Text',
    value: '"Crimson Text", serif',
    category: 'serif',
    weights: [400, 600, 700],
    googleFont: true,
    fallback: 'Georgia, serif',
  },
  
  // System Fonts (No loading needed)
  {
    name: 'Times New Roman',
    value: '"Times New Roman", Times, serif',
    category: 'serif',
    googleFont: false,
  },
  {
    name: 'Georgia',
    value: 'Georgia, serif',
    category: 'serif',
    googleFont: false,
  },
  {
    name: 'Arial',
    value: 'Arial, sans-serif',
    category: 'sans-serif',
    googleFont: false,
  },
  {
    name: 'Helvetica',
    value: 'Helvetica, Arial, sans-serif',
    category: 'sans-serif',
    googleFont: false,
  },
  {
    name: 'Courier New',
    value: '"Courier New", Courier, monospace',
    category: 'monospace',
    googleFont: false,
  },
  {
    name: 'Consolas',
    value: 'Consolas, Monaco, monospace',
    category: 'monospace',
    googleFont: false,
  },
];

/**
 * Get fonts by category
 */
export function getFontsByCategory(category: FontOption['category']): FontOption[] {
  return AVAILABLE_FONTS.filter(font => font.category === category);
}

/**
 * Get font by name
 */
export function getFontByName(name: string): FontOption | undefined {
  return AVAILABLE_FONTS.find(font => font.name === name);
}

/**
 * Get font by value (font-family CSS value)
 */
export function getFontByValue(value: string): FontOption | undefined {
  return AVAILABLE_FONTS.find(font => font.value === value);
}

/**
 * Get Google Fonts that need to be loaded
 */
export function getGoogleFonts(): FontOption[] {
  return AVAILABLE_FONTS.filter(font => font.googleFont);
}

/**
 * Build Google Fonts URL for multiple fonts
 */
export function buildGoogleFontsURL(fonts: FontOption[]): string {
  const googleFonts = fonts.filter(f => f.googleFont);
  if (googleFonts.length === 0) return '';
  
  const families = googleFonts.map(font => {
    const name = font.name.replace(/ /g, '+');
    const weights = font.weights ? `:wght@${font.weights.join(';')}` : '';
    return `family=${name}${weights}`;
  });
  
  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`;
}

/**
 * Category labels for UI
 */
export const FONT_CATEGORY_LABELS = {
  'sans-serif': 'Sans-serif',
  'serif': 'Serif',
  'monospace': 'Monospace',
} as const;
