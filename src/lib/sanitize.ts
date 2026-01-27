/**
 * HTML Sanitization Utilities
 * Protects against XSS attacks when rendering user/AI-generated HTML content.
 */

import DOMPurify from 'dompurify';

// Configure DOMPurify with safe defaults
const SANITIZE_CONFIG = {
  // Allow common HTML elements
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'strong', 'b', 'em', 'i', 'u', 's', 'strike',
    'a', 'img',
    'div', 'span',
    'sub', 'sup',
  ],
  // Allow safe attributes
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title',
    'class', 'id',
    'data-block-id', // For scroll sync
    'style', // Allow inline styles (will be sanitized)
    'colspan', 'rowspan', // Table attributes
  ],
  // Allow data: URLs for images (base64)
  ALLOW_DATA_ATTR: true,
  // Allow safe URI schemes
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  // Keep safe styles
  ALLOW_UNKNOWN_PROTOCOLS: false,
  // Remove dangerous tags completely (don't just escape)
  KEEP_CONTENT: true,
};

/**
 * Sanitize HTML string to prevent XSS attacks.
 * Use this before setting dangerouslySetInnerHTML.
 * 
 * @param dirty - Untrusted HTML string
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof window === 'undefined') {
    // Server-side: return empty or use a server-safe sanitizer
    // DOMPurify requires DOM, so we strip all HTML on server
    return dirty.replace(/<[^>]*>/g, '');
  }
  
  return DOMPurify.sanitize(dirty, SANITIZE_CONFIG);
}

/**
 * Create a sanitized HTML object for React's dangerouslySetInnerHTML.
 * 
 * @param dirty - Untrusted HTML string
 * @returns Object with __html property containing sanitized HTML
 */
export function createSafeHtml(dirty: string): { __html: string } {
  return { __html: sanitizeHtml(dirty) };
}

/**
 * Sanitize content blocks before rendering.
 * Specifically handles block content that may contain user input.
 * 
 * @param content - Block content string
 * @returns Sanitized content string
 */
export function sanitizeBlockContent(content: string): string {
  // For plain text blocks, escape HTML entities
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Check if a string contains potentially dangerous content.
 * Useful for validation before processing.
 * 
 * @param content - Content to check
 * @returns true if content appears safe
 */
export function isContentSafe(content: string): boolean {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick, onerror, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<form/i,
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(content));
}
