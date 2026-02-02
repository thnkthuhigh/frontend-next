/**
 * Supabase Storage Utilities
 * Handles image uploads to Supabase Storage
 * Falls back to base64 data URLs if storage is not configured
 */

import { createClient } from './client';

const BUCKET_NAME = 'images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

// Flag to track if storage is available
let storageAvailable: boolean | null = null;

export interface UploadResult {
  url: string;
  path: string;
  fileName: string;
  size: number;
  type: string;
  isBase64?: boolean; // Indicates if URL is base64 (local only)
}

export interface UploadError {
  message: string;
  code?: string;
}

/**
 * Convert file to base64 data URL (fallback when storage unavailable)
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
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  return { valid: true };
}

/**
 * Generate unique file path
 */
function generateFilePath(file: File, userId?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const ext = file.name.split('.').pop() || 'jpg';
  const sanitizedName = file.name.replace(/[^a-z0-9.-]/gi, '_').toLowerCase();
  
  if (userId) {
    return `${userId}/${timestamp}-${random}-${sanitizedName}`;
  }
  
  return `public/${timestamp}-${random}-${sanitizedName}`;
}

/**
 * Upload image to Supabase Storage
 * Falls back to base64 data URL if storage bucket is not available
 */
export async function uploadImage(
  file: File,
  options?: {
    userId?: string;
    onProgress?: (progress: number) => void;
  }
): Promise<UploadResult> {
  // Validate file
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // If we already know storage is unavailable, use base64 fallback
  if (storageAvailable === false) {
    return useBase64Fallback(file);
  }

  const supabase = createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  const userId = options?.userId || user?.id;

  // Generate file path
  const filePath = generateFilePath(file, userId);

  // Try to upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    // Check if it's a bucket not found error
    if (error.message.includes('Bucket not found') || error.message.includes('bucket') || error.message.includes('not found')) {
      console.warn('Supabase Storage bucket not configured. Using base64 fallback. Images will be embedded in document but not synced to cloud.');
      storageAvailable = false;
      return useBase64Fallback(file);
    }
    
    console.error('Upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Mark storage as available
  storageAvailable = true;

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    path: data.path,
    fileName: file.name,
    size: file.size,
    type: file.type,
  };
}

/**
 * Fallback: Convert image to base64 data URL
 * Used when Supabase Storage is not configured
 */
async function useBase64Fallback(file: File): Promise<UploadResult> {
  const base64Url = await fileToBase64(file);
  
  return {
    url: base64Url,
    path: `local/${file.name}`,
    fileName: file.name,
    size: file.size,
    type: file.type,
    isBase64: true,
  };
}

/**
 * Upload multiple images
 */
export async function uploadImages(
  files: File[],
  options?: {
    userId?: string;
    onProgress?: (fileIndex: number, progress: number) => void;
  }
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const result = await uploadImage(file, {
        userId: options?.userId,
        onProgress: (progress) => options?.onProgress?.(i, progress),
      });
      results.push(result);
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error);
      throw error;
    }
  }

  return results;
}

/**
 * Delete image from storage
 */
export async function deleteImage(path: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path]);

  if (error) {
    console.error('Delete error:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}

/**
 * Get image URL from path
 */
export function getImageUrl(path: string): string {
  const supabase = createClient();
  
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Check if bucket exists and is accessible
 */
export async function checkBucketAccess(): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.storage.getBucket(BUCKET_NAME);
    
    if (error) {
      console.error('Bucket access error:', error);
      return false;
    }
    
    return data !== null;
  } catch (error) {
    console.error('Bucket check error:', error);
    return false;
  }
}

/**
 * Constants export
 */
export const IMAGE_CONFIG = {
  BUCKET_NAME,
  MAX_FILE_SIZE,
  ALLOWED_TYPES,
  MAX_FILE_SIZE_MB: MAX_FILE_SIZE / 1024 / 1024,
};
