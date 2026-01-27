import { JSONContent } from "@tiptap/react";

export interface TOCItem {
    id: string;
    text: string;
    level: 1 | 2 | 3;
}

/**
 * Extract headings from Tiptap JSON to generate Table of Contents
 */
export function extractTOC(jsonContent: JSONContent | null): TOCItem[] {
    if (!jsonContent || !jsonContent.content) return [];

    const items: TOCItem[] = [];
    let headingIndex = 0;

    const traverse = (nodes: JSONContent[]) => {
        for (const node of nodes) {
            if (node.type === "heading" && node.attrs?.level) {
                const level = node.attrs.level as 1 | 2 | 3;
                const text = extractTextFromNode(node);
                if (text.trim()) {
                    items.push({
                        id: `heading-${headingIndex++}`,
                        text: text.trim(),
                        level,
                    });
                }
            }
            if (node.content) {
                traverse(node.content);
            }
        }
    };

    traverse(jsonContent.content);
    return items;
}

function extractTextFromNode(node: JSONContent): string {
    if (node.type === "text" && node.text) {
        return node.text;
    }
    if (node.content) {
        return node.content.map(extractTextFromNode).join("");
    }
    return "";
}

/**
 * Generate HTML Table of Contents with clickable links
 */
export function generateTOCHtml(items: TOCItem[]): string {
    if (items.length === 0) return "";

    const tocItems = items
        .map((item) => {
            const indent = (item.level - 1) * 20;
            return `<div style="padding-left: ${indent}px; margin: 4px 0;">
        <a href="#${item.id}" style="text-decoration: none; color: #2563eb;">
          ${item.text}
        </a>
      </div>`;
        })
        .join("");

    return `
    <div class="table-of-contents" style="margin: 20px 0; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
      <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #475569;">Mục lục</h3>
      ${tocItems}
    </div>
  `;
}

/**
 * Generate Tiptap-compatible JSON for Table of Contents
 */
export function generateTOCJson(items: TOCItem[]): JSONContent {
    const tocContent: JSONContent[] = [
        {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Mục lục" }],
        },
        {
            type: "bulletList",
            content: items.map((item) => ({
                type: "listItem",
                content: [
                    {
                        type: "paragraph",
                        content: [
                            {
                                type: "text",
                                text: item.level === 1 ? item.text : `${"  ".repeat(item.level - 1)}${item.text}`,
                            },
                        ],
                    },
                ],
            })),
        },
        {
            type: "horizontalRule",
        },
    ];

    return {
        type: "doc",
        content: tocContent,
    };
}
