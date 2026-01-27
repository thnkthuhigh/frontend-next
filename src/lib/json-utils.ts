/**
 * JSON Utilities for Tiptap Content
 * Extract and manipulate Tiptap JSON tree for sidebar/navigation.
 */

import type { JSONContent } from "@tiptap/react";

export interface OutlineItem {
  id: string;
  text: string;
  level: number;
  index: number; // Position in document for scrolling
}

/**
 * Extract headings from Tiptap JSON content for outline/navigation
 */
export function extractHeadings(content: JSONContent | null): OutlineItem[] {
  if (!content || !content.content) return [];

  const headings: OutlineItem[] = [];
  let headingIndex = 0;

  // Traverse the document content
  function traverse(nodes: JSONContent[], depth: number = 0) {
    for (const node of nodes) {
      if (node.type === "heading" && node.attrs?.level) {
        // Extract text from heading content
        const text = extractTextFromNode(node);
        
        headings.push({
          id: node.attrs.id || `heading-${headingIndex}`,
          text: text || "Untitled",
          level: node.attrs.level,
          index: headingIndex,
        });
        headingIndex++;
      }

      // Recurse into nested content (for complex structures)
      if (node.content) {
        traverse(node.content, depth + 1);
      }
    }
  }

  traverse(content.content);
  return headings;
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
