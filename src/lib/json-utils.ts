/**
 * JSON Utilities for Tiptap Content
 * Extract and manipulate Tiptap JSON tree for sidebar/navigation.
 */

import type { JSONContent } from "@tiptap/react";

export type OutlineItemType = 'heading' | 'table' | 'image' | 'codeBlock' | 'pageBreak';

export interface OutlineItem {
  id: string;
  text: string;
  level: number; // 1-3 for headings, 0 for page break, -1 for media markers
  index: number; // Position in document for scrolling
  type: OutlineItemType;
  parentHeadingIndex?: number; // Index of parent heading for indentation
}

/**
 * Extract headings, tables, images, and code blocks from Tiptap JSON for outline
 * - H1, H2, H3 headings (main structure)
 * - Tables: 📊 marker
 * - Images: 🖼 marker  
 * - Code blocks: 💻 marker
 */
export function extractHeadings(content: JSONContent | null): OutlineItem[] {
  if (!content || !content.content) return [];

  const items: OutlineItem[] = [];
  let itemIndex = 0;
  let lastHeadingIndex = -1;
  let pageBreakCount = 0;
  let tableCount = 0;
  let imageCount = 0;
  let codeBlockCount = 0;

  // Traverse the document content
  function traverse(nodes: JSONContent[], depth: number = 0) {
    for (const node of nodes) {
      // Extract headings (H1, H2, H3 only - no H4+)
      if (node.type === "heading" && node.attrs?.level && node.attrs.level <= 3) {
        const text = extractTextFromNode(node);

        items.push({
          id: node.attrs.id || `heading-${itemIndex}`,
          text: text || "Untitled",
          level: node.attrs.level,
          index: itemIndex,
          type: 'heading',
        });
        lastHeadingIndex = itemIndex;
        itemIndex++;
      }

      // Extract tables
      if (node.type === "table") {
        tableCount++;
        // Try to get caption from first cell or nearby text
        const caption = getTableCaption(node) || `Bảng ${tableCount}`;
        items.push({
          id: `table-${tableCount}`,
          text: caption,
          level: -1, // Media marker level
          index: itemIndex,
          type: 'table',
          parentHeadingIndex: lastHeadingIndex,
        });
        itemIndex++;
      }

      // Extract images
      if (node.type === "image") {
        imageCount++;
        const alt = node.attrs?.alt || `Hình ${imageCount}`;
        items.push({
          id: `image-${imageCount}`,
          text: alt,
          level: -1,
          index: itemIndex,
          type: 'image',
          parentHeadingIndex: lastHeadingIndex,
        });
        itemIndex++;
      }

      // Extract code blocks (only significant ones)
      if (node.type === "codeBlock") {
        const codeText = extractTextFromNode(node);
        // Only include code blocks with more than 3 lines or 50+ chars
        if (codeText.length > 50 || codeText.split('\n').length > 3) {
          codeBlockCount++;
          const language = node.attrs?.language || 'code';
          items.push({
            id: `code-${codeBlockCount}`,
            text: `Code: ${language}`,
            level: -1,
            index: itemIndex,
            type: 'codeBlock',
            parentHeadingIndex: lastHeadingIndex,
          });
          itemIndex++;
        }
      }

      // Extract page breaks
      if (node.type === "pageBreak" || node.type === "horizontalRule") {
        pageBreakCount++;
        items.push({
          id: `pagebreak-${pageBreakCount}`,
          text: `Page Break`,
          level: 0,
          index: itemIndex,
          type: 'pageBreak',
        });
        itemIndex++;
      }

      // Recurse into nested content
      if (node.content) {
        traverse(node.content, depth + 1);
      }
    }
  }

  traverse(content.content);
  return items;
}

/**
 * Try to extract a meaningful caption from a table
 */
function getTableCaption(tableNode: JSONContent): string | null {
  if (!tableNode.content) return null;

  // Get first row, first cell text
  const firstRow = tableNode.content[0];
  if (firstRow?.content?.[0]) {
    const text = extractTextFromNode(firstRow.content[0]);
    if (text && text.length < 50) {
      return text;
    }
  }
  return null;
}


/**
 * Extract plain text from a Tiptap node (handles marks and nested text)
 */
export function extractTextFromNode(node: JSONContent): string {
  if (node.type === "text") {
    return node.text || "";
  }

  if (!node.content) return "";

  return node.content.map(extractTextFromNode).join("");
}

/**
 * Count words in Tiptap JSON content
 */
export function countWords(content: JSONContent | null): number {
  if (!content) return 0;

  const text = extractTextFromNode(content);
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Count characters in Tiptap JSON content
 */
export function countCharacters(content: JSONContent | null): number {
  if (!content) return 0;
  return extractTextFromNode(content).length;
}

/**
 * Get document statistics
 */
export function getDocumentStats(content: JSONContent | null): {
  words: number;
  characters: number;
  headings: number;
  paragraphs: number;
} {
  if (!content || !content.content) {
    return { words: 0, characters: 0, headings: 0, paragraphs: 0 };
  }

  let headings = 0;
  let paragraphs = 0;

  function count(nodes: JSONContent[]) {
    for (const node of nodes) {
      if (node.type === "heading") headings++;
      if (node.type === "paragraph") paragraphs++;
      if (node.content) count(node.content);
    }
  }

  count(content.content);

  return {
    words: countWords(content),
    characters: countCharacters(content),
    headings,
    paragraphs,
  };
}
