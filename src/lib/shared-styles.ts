import { StyleConfig } from './document-styles';
import type { PageMargins } from '@/store/document-store';

// A4 dimensions in mm
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

// Default margins (1 inch = 25.4mm)
export const DEFAULT_MARGINS: PageMargins = {
    top: 25.4,
    right: 25.4,
    bottom: 25.4,
    left: 25.4,
};

// Calculate content dimensions based on margins
export function getContentDimensions(margins: PageMargins = DEFAULT_MARGINS) {
    return {
        width: A4_WIDTH_MM - margins.left - margins.right,
        height: A4_HEIGHT_MM - margins.top - margins.bottom,
    };
}

/**
 * Shared function to generate the EXACT CSS used for both PDF Generation and Preview.
 * This ensures WYSIWYG accuracy.
 * 
 * @param styleConfig - The document style configuration
 * @param margins - Optional page margins (defaults to 25.4mm / 1 inch)
 */
export function getPdfStyles(styleConfig: StyleConfig, margins: PageMargins = DEFAULT_MARGINS): string {
    const contentDimensions = getContentDimensions(margins);
    
    return `
        /* Reset and base */
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        html, body {
            font-family: ${styleConfig.fontFamily};
            color: #000000;
            line-height: ${styleConfig.lineHeight || 1.75}; /* Relaxed */
            font-size: 11pt;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .measure-container {
            width: 100%;
            font-family: ${styleConfig.fontFamily};
            color: #000000;
            line-height: ${styleConfig.lineHeight || 1.75};
            font-size: 11pt;
        }
        
        /* 
         * Cover Page - Uses dynamic content height based on margins
         * We center content in this area using flexbox
         */
        .cover-page {
            width: 100%;
            min-height: ${contentDimensions.height}mm; /* A4 content height based on margins */
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            page-break-after: always;
            break-after: page;
        }
        
        .cover-inner {
            border-bottom: 2px solid ${styleConfig.accentColor};
            padding-bottom: 40px;
            width: 100%;
        }
        
        .cover-title {
            font-size: 28pt;
            font-weight: bold;
            color: ${styleConfig.headingColor};
            margin-bottom: 16px;
        }
        
        .cover-subtitle {
            font-size: 14pt;
            color: ${styleConfig.accentColor};
            font-style: italic;
            margin-bottom: 24px;
        }
        
        .cover-divider {
            width: 60px;
            height: 2px;
            background-color: ${styleConfig.accentColor};
            margin: 24px auto;
        }
        
        .cover-meta {
            font-size: 11pt;
            color: #666666;
            margin-top: 40px;
        }
        
        .cover-meta p {
            margin: 4px 0;
        }
        
        /* Content Section */
        .content-section {
            /* Content flows naturally */
        }
        
        /* Typography - Relaxed & Professional */
        /* Headings use theme color by default, but inline styles (from textStyle marks) take precedence */
        h1 {
            font-size: 20pt;
            font-weight: bold;
            color: ${styleConfig.headingColor};
            line-height: 1.3;
            margin-top: 0;
            margin-bottom: 1em;
            page-break-after: avoid;
        }
        
        h2 {
            font-size: 16pt;
            font-weight: bold;
            color: ${styleConfig.headingColor};
            line-height: 1.3;
            margin-top: 2em;
            margin-bottom: 1em;
            page-break-after: avoid;
        }
        
        h3 {
            font-size: 13pt;
            font-weight: bold;
            color: ${styleConfig.headingColor};
            line-height: 1.3;
            margin-top: 1.5em;
            margin-bottom: 0.75em;
            page-break-after: avoid;
        }
        
        /* Preserve inline text colors from Tiptap textStyle marks */
        /* These inline styles should always take precedence over theme colors */
        h1 span[style*="color"],
        h2 span[style*="color"],
        h3 span[style*="color"],
        h4 span[style*="color"],
        h5 span[style*="color"],
        h6 span[style*="color"] {
            /* Inline styles already have highest specificity (1-0-0-0) */
            /* This selector (0-0-2-1) ensures the span's inline color is not affected by parent */
            /* The inline style will naturally override the parent h1/h2/h3 color */
        }
        
        h4, h5, h6 {
            font-weight: bold;
            line-height: 1.3;
            margin-top: 1.25em;
            margin-bottom: 0.5em;
            page-break-after: avoid;
        }
        
        p {
            margin-bottom: 1.2em;
            text-align: justify;
            line-height: 1.75;
            hyphens: auto;
        }
        
        /* Lists - Premium Styling with Custom Markers */
        ul, ol {
            margin-bottom: 1.2em;
            padding-left: 2em;
        }
        
        ul {
            list-style: none;
        }
        
        ul > li {
            position: relative;
            padding-left: 1.25em;
        }
        
        ul > li::before {
            content: "•";
            position: absolute;
            left: 0;
            color: ${styleConfig.accentColor};
            font-weight: bold;
            font-size: 1.2em;
            line-height: 1.4;
        }
        
        ol {
            list-style: none;
            counter-reset: list-counter;
        }
        
        ol > li {
            position: relative;
            padding-left: 1.75em;
            counter-increment: list-counter;
        }
        
        ol > li::before {
            content: counter(list-counter) ".";
            position: absolute;
            left: 0;
            color: ${styleConfig.accentColor};
            font-weight: 600;
        }
        
        li {
            margin-bottom: 0.6em;
            line-height: 1.6;
        }
        
        /* Nested lists */
        li > ul, li > ol {
            margin-top: 0.5em;
            margin-bottom: 0.5em;
        }
        
        li > ul > li::before {
            content: "◦";
            font-size: 1em;
        }
        
        li > ul > li > ul > li::before {
            content: "▪";
            font-size: 0.8em;
        }
        
        /* Custom bullet styles via data-bullet-style attribute */
        ul[data-bullet-style="disc"] > li::before {
            content: "•";
        }
        
        ul[data-bullet-style="circle"] > li::before {
            content: "○";
        }
        
        ul[data-bullet-style="square"] > li::before {
            content: "■";
            font-size: 0.8em;
        }
        
        ul[data-bullet-style="dash"] > li::before {
            content: "—";
        }
        
        ul[data-bullet-style="check"] > li::before {
            content: "✓";
            color: #10b981;
        }
        
        ul[data-bullet-style="arrow"] > li::before {
            content: "→";
        }
        
        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 1.5em 0;
            page-break-inside: avoid;
        }
        
        th, td {
            border: 1px solid #d1d5db;
            padding: 10px 12px;
            text-align: left;
        }
        
        th {
            background-color: #f3f4f6;
            font-weight: 600;
        }
        
        /* Blockquotes - Premium look */
        blockquote {
            border-left: 4px solid ${styleConfig.accentColor};
            background: #f8fafc;
            padding: 1em 1.5em;
            margin: 1.5em 0;
            font-style: italic;
            color: #4b5563;
            border-radius: 0 8px 8px 0;
        }
        
        /* Code blocks */
        pre {
            background-color: #f3f4f6;
            padding: 1em 1.25em;
            border-radius: 6px;
            overflow-x: auto;
            margin: 1.5em 0;
            font-size: 10pt;
            page-break-inside: avoid;
        }
        
        code {
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 10pt;
        }
        
        /* Inline code */
        p code, li code {
            background-color: #f3f4f6;
            padding: 0.15em 0.4em;
            border-radius: 4px;
        }
        
        /* Text formatting */
        strong { font-weight: bold; }
        em { font-style: italic; }
        u { text-decoration: underline; }
        s { text-decoration: line-through; }
        mark { background-color: #fef08a; }
        
        /* Callouts - Info, Warning, Success, Note */
        .callout {
            padding: 1em 1.25em;
            margin: 1.5em 0;
            border-radius: 0.5em;
            border-left: 4px solid;
            page-break-inside: avoid;
        }
        
        .callout-info {
            background-color: #eff6ff;
            border-left-color: #3b82f6;
        }
        
        .callout-warning {
            background-color: #fef3c7;
            border-left-color: #f59e0b;
        }
        
        .callout-success {
            background-color: #ecfdf5;
            border-left-color: #10b981;
        }
        
        .callout-note {
            background-color: #f3f4f6;
            border-left-color: #6b7280;
        }
        
        .callout p {
            margin: 0;
        }
        
        /* Horizontal rule */
        hr {
            border: none;
            border-top: 1px solid #e5e7eb;
            margin: 2em 0;
        }
        
        /* Links */
        a {
            color: ${styleConfig.accentColor};
            text-decoration: underline;
        }
        
        /* Prevent orphan headings */
        h1, h2, h3, h4, h5, h6 {
            page-break-after: avoid;
            break-after: avoid;
        }
        
        /* Keep lists together when possible */
        li {
            page-break-inside: avoid;
        }
        
        /* Manual page break marker */
        .page-break {
            page-break-before: always;
            break-before: page;
            height: 0;
            width: 100%;
            visibility: hidden;
            margin: 0;
            padding: 0;
            border: none;
        }
    `;
}
