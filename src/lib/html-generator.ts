/**
 * HTML Generator Utilities
 * Shared functions for converting Tiptap JSON to HTML
 */

/**
 * Generate HTML string from Tiptap JSON content
 * Used by both PagedPreview and document-formatter for consistent HTML output
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
                    if (mark.type === 'textStyle' && mark.attrs?.color) {
                        result = `<span style="color: ${mark.attrs.color}">${result}</span>`;
                    }
                });
            }
            return result;
        }

        const children = content ? content.map(renderNode).join('') : '';
        const textAlign = attrs?.textAlign as string | undefined;

        switch (type) {
            case 'doc':
                return children;
            case 'paragraph':
                return `<p style="margin: 0.75em 0; line-height: 1.6; color: #000000;${textAlign ? ` text-align: ${textAlign};` : ''}">${children || '<br>'}</p>`;
            case 'heading': {
                const level = (attrs?.level as number) || 1;
                const headingStyle = `margin-top: ${level === 1 ? '1.5em' : '1.2em'}; margin-bottom: 0.5em; font-weight: bold; color: #000000;${textAlign ? ` text-align: ${textAlign};` : ''}`;
                return `<h${level} style="${headingStyle}">${children}</h${level}>`;
            }
            case 'bulletList':
                return `<ul style="margin: 0.5em 0; padding-left: 1.5em; color: #000000;">${children}</ul>`;
            case 'orderedList':
                return `<ol style="margin: 0.5em 0; padding-left: 1.5em; color: #000000;">${children}</ol>`;
            case 'listItem':
                return `<li style="margin: 0.25em 0; color: #000000;">${children}</li>`;
            case 'blockquote':
                return `<blockquote style="border-left: 3px solid #d1d5db; padding-left: 1em; margin: 1em 0; color: #4b5563; font-style: italic;">${children}</blockquote>`;
            case 'codeBlock': {
                const lang = (attrs?.language as string) || '';
                return `<pre style="background-color: #f3f4f6; padding: 1em; border-radius: 0.375rem; overflow-x: auto; margin: 1em 0;"><code class="language-${lang}" style="color: #1f2937; font-family: 'Consolas', 'Monaco', monospace;">${children}</code></pre>`;
            }
            case 'horizontalRule':
                return '<hr style="margin: 1em 0; border: none; border-top: 1px solid #e5e7eb;">';
            case 'pageBreak':
                return '<div class="page-break" data-page-break="true"></div>';
            case 'table':
                return `<table style="border-collapse: collapse; width: 100%; margin: 1em 0;">${children}</table>`;
            case 'tableRow':
                return `<tr>${children}</tr>`;
            case 'tableHeader':
                return `<th style="border: 1px solid #e5e7eb; padding: 8px; background-color: #f9fafb; font-weight: 600; text-align: left; color: #000000;">${children}</th>`;
            case 'tableCell':
                return `<td style="border: 1px solid #e5e7eb; padding: 8px; color: #000000;">${children}</td>`;
            default:
                return children;
        }
    };

    return renderNode(json as Record<string, unknown>);
}
