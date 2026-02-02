/**
 * Tiptap Extensions Configuration
 * Centralizes all editor extensions for easy management
 */

import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';

// Font Family extension configuration
export const fontFamilyExtension = {
  name: 'fontFamily',
  types: ['textStyle'],
  parseHTML: (element: HTMLElement) => element.style.fontFamily?.replace(/['"]+/g, ''),
  renderHTML: (attributes: any) => {
    if (!attributes.fontFamily) return {};
    return {
      style: `font-family: ${attributes.fontFamily}`,
    };
  },
};

/**
 * Get all Tiptap extensions with font support
 */
export function getTiptapExtensions() {
  return [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
      bulletList: {
        keepMarks: true,
        keepAttributes: false,
      },
      orderedList: {
        keepMarks: true,
        keepAttributes: false,
      },
    }),
    Underline,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Highlight.configure({
      multicolor: true,
    }),
    TextStyle,
    Color,
    // FontFamily will be added when extension is installed
    // Import it like: import FontFamily from '@tiptap/extension-font-family'
    // Then add: FontFamily.configure({ types: ['textStyle'] })
  ];
}

/**
 * Extension installation check
 */
export function checkFontFamilyExtension(): boolean {
  try {
    // Try to import the extension
    require('@tiptap/extension-font-family');
    return true;
  } catch {
    return false;
  }
}
