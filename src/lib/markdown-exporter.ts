import { JSONContent } from "@tiptap/react";

/**
 * Convert Tiptap JSON to Markdown format
 */
export function jsonToMarkdown(jsonContent: JSONContent | null): string {
    if (!jsonContent || !jsonContent.content) return "";

    return jsonContent.content.map(nodeToMarkdown).join("\n\n");
}

function nodeToMarkdown(node: JSONContent): string {
    switch (node.type) {
        case "heading":
            const level = node.attrs?.level || 1;
            const prefix = "#".repeat(level);
            return `${prefix} ${getTextContent(node)}`;

        case "paragraph":
            return getTextContent(node);

        case "bulletList":
            return (node.content || [])
                .map((item) => `- ${getListItemContent(item)}`)
                .join("\n");

        case "orderedList":
            return (node.content || [])
                .map((item, i) => `${i + 1}. ${getListItemContent(item)}`)
                .join("\n");

        case "blockquote":
            return (node.content || [])
                .map((p) => `> ${getTextContent(p)}`)
                .join("\n");

        case "codeBlock":
            const lang = node.attrs?.language || "";
            return `\`\`\`${lang}\n${getTextContent(node)}\n\`\`\``;

        case "horizontalRule":
            return "---";

        case "table":
            return tableToMarkdown(node);

        default:
            return getTextContent(node);
    }
}

function getTextContent(node: JSONContent): string {
    if (node.type === "text") {
        let text = node.text || "";
        if (node.marks) {
            for (const mark of node.marks) {
                switch (mark.type) {
                    case "bold":
                        text = `**${text}**`;
                        break;
                    case "italic":
                        text = `*${text}*`;
                        break;
                    case "strike":
                        text = `~~${text}~~`;
                        break;
                    case "code":
                        text = `\`${text}\``;
                        break;
                    case "link":
                        text = `[${text}](${mark.attrs?.href || ""})`;
                        break;
                }
            }
        }
        return text;
    }
    if (node.content) {
        return node.content.map(getTextContent).join("");
    }
    return "";
}

function getListItemContent(item: JSONContent): string {
    if (item.content) {
        return item.content.map(getTextContent).join("");
    }
    return "";
}

function tableToMarkdown(node: JSONContent): string {
    const rows = node.content || [];
    if (rows.length === 0) return "";

    const lines: string[] = [];

    rows.forEach((row, rowIndex) => {
        const cells = row.content || [];
        const cellContents = cells.map((cell) => getTextContent(cell));
        lines.push(`| ${cellContents.join(" | ")} |`);

        // Add separator after header row
        if (rowIndex === 0) {
            const separator = cells.map(() => "---").join(" | ");
            lines.push(`| ${separator} |`);
        }
    });

    return lines.join("\n");
}

/**
 * Download content as Markdown file
 */
export function downloadMarkdown(content: string, filename: string = "document.md") {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
}
