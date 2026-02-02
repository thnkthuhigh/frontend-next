/**
 * PostHog Analytics Integration
 * Provides privacy-friendly usage analytics
 */

// PostHog SDK (optional dependency)
let posthog: any = null;
let isInitialized = false;

// Check if PostHog is available
try {
  const PostHogModule = require('posthog-js');
  posthog = PostHogModule.default || PostHogModule;
} catch (e) {
  console.warn('PostHog not installed. Analytics disabled.');
}

/**
 * Initialize PostHog analytics
 */
export function initAnalytics() {
  if (isInitialized || !posthog) return;

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

  if (!apiKey) {
    console.info('PostHog API key not set. Analytics disabled.');
    return;
  }

  try {
    posthog.init(apiKey, {
      api_host: apiHost,
      loaded: (posthog: any) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('PostHog analytics loaded');
        }
      },
      // Privacy-friendly defaults
      autocapture: false, // Don't auto-capture clicks
      capture_pageview: false, // Manual pageview tracking
      disable_session_recording: true, // Respect privacy
      respect_dnt: true, // Respect Do Not Track
      opt_out_capturing_by_default: false,
      // Store data in cookie
      persistence: 'localStorage+cookie',
      // GDPR compliance
      ip: false, // Don't capture IP
    });

    isInitialized = true;
    console.log('Analytics initialized');
  } catch (error) {
    console.error('Failed to initialize analytics:', error);
  }
}

/**
 * Track page view
 */
export function trackPageView(path?: string) {
  if (!posthog || !isInitialized) return;

  const pagePath = path || window.location.pathname;
  posthog.capture('$pageview', { path: pagePath });
}

/**
 * Track custom event
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, any>
) {
  if (!posthog || !isInitialized) return;

  posthog.capture(eventName, properties);
}

/**
 * Identify user (call after authentication)
 */
export function identifyUser(userId: string, properties?: Record<string, any>) {
  if (!posthog || !isInitialized) return;

  posthog.identify(userId, properties);
}

/**
 * Reset user identity (call on logout)
 */
export function resetUser() {
  if (!posthog || !isInitialized) return;

  posthog.reset();
}

// ==================== FEATURE-SPECIFIC TRACKING ====================

/**
 * Track document events
 */
export const DocumentEvents = {
  created: (documentType?: string) => {
    trackEvent('document_created', { type: documentType || 'blank' });
  },
  
  edited: (wordCount?: number) => {
    trackEvent('document_edited', { word_count: wordCount });
  },
  
  saved: (wordCount?: number, saveDuration?: number) => {
    trackEvent('document_saved', {
      word_count: wordCount,
      save_duration_ms: saveDuration,
    });
  },
  
  deleted: () => {
    trackEvent('document_deleted');
  },
};

/**
 * Track AI feature usage
 */
export const AIEvents = {
  analyzed: (contentLength: number, duration?: number) => {
    trackEvent('ai_analysis_completed', {
      content_length: contentLength,
      duration_ms: duration,
    });
  },
  
  customPrompt: (promptLength: number, textLength: number) => {
    trackEvent('ai_custom_prompt_used', {
      prompt_length: promptLength,
      text_length: textLength,
    });
  },
  
  rewrite: (textLength: number) => {
    trackEvent('ai_rewrite_used', { text_length: textLength });
  },
  
  translate: (textLength: number, targetLanguage?: string) => {
    trackEvent('ai_translate_used', {
      text_length: textLength,
      target_language: targetLanguage,
    });
  },
  
  summarize: (textLength: number) => {
    trackEvent('ai_summarize_used', { text_length: textLength });
  },
  
  streamingStopped: () => {
    trackEvent('ai_streaming_stopped');
  },
};

/**
 * Track export events
 */
export const ExportEvents = {
  started: (format: 'pdf' | 'docx', async: boolean = false) => {
    trackEvent('export_started', { format, async });
  },
  
  completed: (format: 'pdf' | 'docx', duration?: number, fileSize?: number) => {
    trackEvent('export_completed', {
      format,
      duration_ms: duration,
      file_size_kb: fileSize ? Math.round(fileSize / 1024) : undefined,
    });
  },
  
  failed: (format: 'pdf' | 'docx', error?: string) => {
    trackEvent('export_failed', { format, error });
  },
  
  styleSelected: (style: string) => {
    trackEvent('export_style_selected', { style });
  },
};

/**
 * Track editor features
 */
export const EditorEvents = {
  fontChanged: (fontName: string) => {
    trackEvent('editor_font_changed', { font: fontName });
  },
  
  imageUploaded: (method: 'paste' | 'drop' | 'button', size?: number) => {
    trackEvent('editor_image_uploaded', {
      method,
      size_kb: size ? Math.round(size / 1024) : undefined,
    });
  },
  
  imageInserted: () => {
    trackEvent('editor_image_inserted');
  },
  
  headingAdded: (level: number) => {
    trackEvent('editor_heading_added', { level });
  },
  
  listCreated: (type: 'bullet' | 'ordered') => {
    trackEvent('editor_list_created', { type });
  },
  
  tableInserted: (rows: number, cols: number) => {
    trackEvent('editor_table_inserted', { rows, cols });
  },
  
  codeBlockInserted: () => {
    trackEvent('editor_code_block_inserted');
  },
};

/**
 * Track errors
 */
export const ErrorEvents = {
  occurred: (errorType: string, message?: string, component?: string) => {
    trackEvent('error_occurred', {
      error_type: errorType,
      message,
      component,
    });
  },
  
  apiError: (endpoint: string, statusCode: number) => {
    trackEvent('api_error', {
      endpoint,
      status_code: statusCode,
    });
  },
};

/**
 * Track performance metrics
 */
export const PerformanceEvents = {
  slowOperation: (operation: string, duration: number) => {
    if (duration > 3000) { // Only track if > 3 seconds
      trackEvent('performance_slow_operation', {
        operation,
        duration_ms: duration,
      });
    }
  },
  
  pageLoadTime: (duration: number) => {
    trackEvent('performance_page_load', { duration_ms: duration });
  },
};

/**
 * Track user engagement
 */
export const EngagementEvents = {
  sessionStart: () => {
    trackEvent('session_started');
  },
  
  sessionEnd: (duration: number) => {
    trackEvent('session_ended', { duration_minutes: Math.round(duration / 60000) });
  },
  
  featureDiscovered: (feature: string) => {
    trackEvent('feature_discovered', { feature });
  },
};

// Auto-initialize on import (browser only)
if (typeof window !== 'undefined') {
  initAnalytics();
}
