/**
 * Editor Image Handlers
 * Handles paste and drop events for images in the editor
 * Features:
 * - High-DPI (Retina) display optimization
 * - Optimistic UI with loading states
 * - Natural dimension detection for crisp rendering
 */

import { Editor } from '@tiptap/react';

/**
 * Convert file to base64 data URL
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Get natural dimensions from an image file
 * Critical for High-DPI rendering optimization
 */
async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Calculate optimal display width for High-DPI (Retina) screens
 * Rule: Display at half natural width for 2x displays to get 1:1 pixel mapping
 */
function calculateOptimalDisplayWidth(
  naturalWidth: number,
  editorWidth: number = 600,
  devicePixelRatio: number = typeof window !== 'undefined' ? window.devicePixelRatio : 1
): string {
  // For Retina (2x) displays, use half natural width for maximum sharpness
  if (devicePixelRatio >= 2) {
    const optimalWidth = Math.min(naturalWidth / 2, editorWidth - 40);
    return `${Math.round(optimalWidth)}px`;
  }
  
  // For standard displays, use natural width up to editor width
  const optimalWidth = Math.min(naturalWidth, editorWidth - 40);
  return `${Math.round(optimalWidth)}px`;
}

/**
 * Validate image file
 */
function validateImage(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB (increased for high-res images)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only JPEG, PNG, GIF, WebP, SVG allowed.' };
  }
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large. Max 10MB.' };
  }
  return { valid: true };
}

/**
 * Handle paste event for images
 * Includes High-DPI optimization and natural dimension detection
 */
export async function handleImagePaste(
  editor: Editor,
  event: ClipboardEvent,
  onUploadStart?: () => void,
  onUploadComplete?: (url: string) => void,
  onUploadError?: (error: string) => void
): Promise<boolean> {
  const items = event.clipboardData?.items;
  if (!items) return false;

  // Find image in clipboard
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    if (item.type.indexOf('image') !== -1) {
      event.preventDefault();
      
      const file = item.getAsFile();
      if (!file) continue;

      // Validate
      const validation = validateImage(file);
      if (!validation.valid) {
        onUploadError?.(validation.error || 'Invalid image');
        return false;
      }

      onUploadStart?.();

      try {
        // Get natural dimensions BEFORE inserting (critical for High-DPI)
        const dimensions = await getImageDimensions(file);
        
        // Calculate optimal display width for Retina screens
        const editorElement = editor.view.dom.closest('.editor-content-wrapper');
        const editorWidth = editorElement?.clientWidth || 600;
        const optimalWidth = calculateOptimalDisplayWidth(
          dimensions.width,
          editorWidth
        );

        // Convert to base64
        const base64Url = await fileToBase64(file);

        // Insert into editor with High-DPI optimized attributes
        editor
          .chain()
          .focus()
          .setImage({
            src: base64Url,
            alt: file.name,
            width: optimalWidth,
            naturalWidth: dimensions.width,
            naturalHeight: dimensions.height,
            align: 'center',
          } as any)
          .run();

        onUploadComplete?.(base64Url);
        return true;

      } catch (error: any) {
        console.error('Image paste error:', error);
        onUploadError?.(error.message || 'Failed to process image');
        return false;
      }
    }
  }

  return false;
}

/**
 * Handle drop event for images
 * Includes High-DPI optimization and natural dimension detection
 */
export async function handleImageDrop(
  editor: Editor,
  event: DragEvent,
  onUploadStart?: () => void,
  onUploadComplete?: (url: string) => void,
  onUploadError?: (error: string) => void
): Promise<boolean> {
  const files = event.dataTransfer?.files;
  if (!files || files.length === 0) return false;

  // Check if any file is an image
  const imageFiles = Array.from(files).filter(file => 
    file.type.startsWith('image/')
  );

  if (imageFiles.length === 0) return false;

  event.preventDefault();
  event.stopPropagation();

  // Validate first image
  const file = imageFiles[0];
  const validation = validateImage(file);
  if (!validation.valid) {
    onUploadError?.(validation.error || 'Invalid image');
    return false;
  }

  onUploadStart?.();

  try {
    // Get drop position
    const pos = editor.view.posAtCoords({
      left: event.clientX,
      top: event.clientY,
    });

    // Get natural dimensions BEFORE inserting (critical for High-DPI)
    const dimensions = await getImageDimensions(file);
    
    // Calculate optimal display width for Retina screens
    const editorElement = editor.view.dom.closest('.editor-content-wrapper');
    const editorWidth = editorElement?.clientWidth || 600;
    const optimalWidth = calculateOptimalDisplayWidth(
      dimensions.width,
      editorWidth
    );

    // Convert to base64
    const base64Url = await fileToBase64(file);

    // Image attributes with High-DPI optimization
    const imageAttrs = {
      src: base64Url,
      alt: file.name,
      width: optimalWidth,
      naturalWidth: dimensions.width,
      naturalHeight: dimensions.height,
      align: 'center',
    };

    // Insert at drop position
    if (pos) {
      editor
        .chain()
        .focus()
        .insertContentAt(pos.pos, {
          type: 'image',
          attrs: imageAttrs,
        })
        .run();
    } else {
      // Fallback to current position
      editor
        .chain()
        .focus()
        .setImage(imageAttrs as any)
        .run();
    }

    onUploadComplete?.(base64Url);
    return true;

  } catch (error: any) {
    console.error('Image drop error:', error);
    onUploadError?.(error.message || 'Failed to process image');
    return false;
  }
}

/**
 * Setup image handlers for editor
 */
export function setupImageHandlers(
  editor: Editor,
  options?: {
    onUploadStart?: () => void;
    onUploadComplete?: (url: string) => void;
    onUploadError?: (error: string) => void;
  }
) {
  // Get editor DOM element
  const editorElement = editor.view.dom;

  // Paste handler
  const pasteHandler = async (event: Event) => {
    const clipboardEvent = event as ClipboardEvent;
    await handleImagePaste(
      editor,
      clipboardEvent,
      options?.onUploadStart,
      options?.onUploadComplete,
      options?.onUploadError
    );
  };

  // Drop handler
  const dropHandler = async (event: Event) => {
    const dragEvent = event as DragEvent;
    await handleImageDrop(
      editor,
      dragEvent,
      options?.onUploadStart,
      options?.onUploadComplete,
      options?.onUploadError
    );
  };

  // Add event listeners
  editorElement.addEventListener('paste', pasteHandler);
  editorElement.addEventListener('drop', dropHandler);

  // Return cleanup function
  return () => {
    editorElement.removeEventListener('paste', pasteHandler);
    editorElement.removeEventListener('drop', dropHandler);
  };
}

/**
 * Extract images from HTML content
 */
export function extractImagesFromHTML(html: string): string[] {
  const imgRegex = /<img[^>]+src="([^">]+)"/g;
  const urls: string[] = [];
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    urls.push(match[1]);
  }

  return urls;
}

/**
 * Check if URL is a Supabase storage URL
 */
export function isSupabaseStorageUrl(url: string): boolean {
  return url.includes('supabase') && url.includes('storage');
}

/**
 * Get image metadata from URL
 */
export async function getImageMetadata(url: string): Promise<{
  width?: number;
  height?: number;
  size?: number;
  type?: string;
} | null> {
  try {
    const img = new Image();
    img.src = url;

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
    };
  } catch (error) {
    console.error('Failed to get image metadata:', error);
    return null;
  }
}
