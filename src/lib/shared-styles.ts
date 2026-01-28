import { StyleConfig } from './document-styles';

/**
 * Shared function to generate the EXACT CSS used for both PDF Generation and Preview.
 * This ensures WYSIWYG accuracy.
 */
export function getPdfStyles(styleConfig: StyleConfig): string {
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
         * Cover Page - Playwright adds 25mm margins = content area is 160mm x 247mm
         * We center content in this area using flexbox
         */
        .cover-page {
            width: 100%;
            min-height: 247mm; /* A4 content height (297 - 25*2) */
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
        
        ul, ol {
            margin-bottom: 1.2em;
            padding-left: 2em;
        }
        
        li {
            margin-bottom: 0.5em;
            padding-left: 0.25em;
            line-height: 1.6;
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
