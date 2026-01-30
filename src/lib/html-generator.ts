/**
 * HTML Generator Utilities
 * Shared functions for converting Tiptap JSON to HTML
 *
 * IMPORTANT: This generates semantic HTML WITHOUT hardcoded colors.
 * Colors and styling are applied by CSS from shared-styles.ts via buildPdfHtml.
 * This ensures consistent styling between Edit Tab export and Preview Tab export.
 */

/**
 * Generate HTML string from Tiptap JSON content
 * Used by both PagedPreview and document-formatter for consistent HTML output
 *
 * NOTE: Do NOT add inline color styles here - let CSS handle colors!
 * This ensures the styleConfig colors (headingColor, accentColor) are applied correctly.
 */
export function generateHtmlFromJson(json: Record<string, unknown> | null): string {
    if (!json || !json.content) return '';

    const renderNode = (node: Record<string, unknown>): string => {
        const type = node.type as string;
        const content = node.content as Record<string, unknown>[] | undefined;
        const text = node.text as string | undefined;
        const attrs = node.attrs as Record<string, unknown> | undefined;
        const marks = node.marks as Array<{ type: string; attrs?: Record<string, unknown> }> | undefined;

        // Text node
        if (type === 'text' && text) {
            let result = text;
            if (marks) {
                marks.forEach(mark => {
                    if (mark.type === 'bold') result = `<strong>${result}</strong>`;
                    if (mark.type === 'italic') result = `<em>${result}</em>`;
                    if (mark.type === 'underline') result = `<u>${result}</u>`;
                    if (mark.type === 'strike') result = `<s>${result}</s>`;
                    if (mark.type === 'code') result = `<code>${result}</code>`;
                    if (mark.type === 'highlight') result = `<mark>${result}</mark>`;
                    // Only textStyle with explicit user color should be inline
                    if (mark.type === 'textStyle' && mark.attrs?.color) {
                        result = `<span style="color: ${mark.attrs.color}">${result}</span>`;
                    }
                });
            }
            return result;
        }

        const children = content ? content.map(renderNode).join('') : '';
        const textAlign = attrs?.textAlign as string | undefined;
        const alignStyle = textAlign ? ` style="text-align: ${textAlign};"` : '';

        switch (type) {
            case 'doc':
                return children;
            // Paragraphs and headings - NO inline color, let CSS handle it
            case 'paragraph':
                return `<p${alignStyle}>${children || '<br>'}</p>`;
            case 'heading': {
                const level = (attrs?.level as number) || 1;
                return `<h${level}${alignStyle}>${children}</h${level}>`;
            }
            // Lists - NO inline color, let CSS handle it
            // Support bulletStyle attribute for custom markers
            case 'bulletList': {
                const bulletStyle = attrs?.bulletStyle as string | undefined;
                const styleAttr = bulletStyle ? ` data-bullet-style="${bulletStyle}"` : '';
                return `<ul${styleAttr}>${children}</ul>`;
            }
            case 'orderedList':
                return `<ol>${children}</ol>`;
            case 'listItem':
                return `<li>${children}</li>`;
            // Blockquote - Let CSS handle styling
            case 'blockquote':
                return `<blockquote>${children}</blockquote>`;
            // Code blocks - semantic only
            case 'codeBlock': {
                const lang = (attrs?.language as string) || '';
                return `<pre><code class="language-${lang}">${children}</code></pre>`;
            }
            case 'horizontalRule':
                return '<hr>';
            case 'pageBreak':
                return '<div class="page-break" data-page-break="true"></div>';
            // Tables - minimal styling for structure
            case 'table':
                return `<table>${children}</table>`;
            case 'tableRow':
                return `<tr>${children}</tr>`;
            case 'tableHeader':
                return `<th>${children}</th>`;
            case 'tableCell':
                return `<td>${children}</td>`;
            // Callouts - keep class-based styling
            case 'callout': {
                const calloutType = (attrs?.type as string) || 'info';
                const icons: Record<string, string> = {
                    info: '💡',
                    warning: '⚠️',
                    success: '✅',
                    note: '📝',
                };
                const icon = icons[calloutType] || icons.info;
                return `<div class="callout callout-${calloutType}"><span>${icon}</span>${children}</div>`;
            }
            default:
                return children;
        }
    };

    return renderNode(json as Record<string, unknown>);
}
