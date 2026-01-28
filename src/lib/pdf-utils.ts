/**
 * PDF Export Utilities
 * Shared functions for generating PDF-ready HTML documents
 */

import { StyleConfig } from './document-styles';

/**
 * Build a complete HTML document ready for Playwright PDF rendering
 * 
 * IMPORTANT: Playwright will apply 25mm margins on all sides.
 * CSS should NOT define @page margin to avoid conflicts.
 * Cover page uses full A4 height (297mm) because Playwright handles margins externally.
 */
import { getPdfStyles } from './shared-styles';

/**
 * Build a complete HTML document ready for Playwright PDF rendering
 * 
 * IMPORTANT: Playwright will apply 25mm margins on all sides.
 * CSS should NOT define @page margin to avoid conflicts.
 * Cover page uses full A4 height (297mm) because Playwright handles margins externally.
 */
export function buildPdfHtml(
    content: string,
    styleConfig: StyleConfig,
    title?: string,
    subtitle?: string,
    author?: string,
    date?: string
): string {
    const styles = getPdfStyles(styleConfig);

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
${styles}
    </style>
</head>
<body>
    <!-- Cover Page -->
    <div class="cover-page">
        <div class="cover-inner">
            <h1 class="cover-title">${escapeHtml(title || 'Untitled Document')}</h1>
            ${subtitle ? `<p class="cover-subtitle">${escapeHtml(subtitle)}</p>` : ''}
            <div class="cover-divider"></div>
            <div class="cover-meta">
                ${author ? `<p>${escapeHtml(author)}</p>` : ''}
                ${date ? `<p>${escapeHtml(date)}</p>` : ''}
            </div>
        </div>
    </div>
    
    <!-- Content Section -->
    <div class="content-section">
        ${content || '<p>No content</p>'}
    </div>
</body>
</html>`;
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
