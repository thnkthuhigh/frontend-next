import { JSONContent } from "@tiptap/react";

/**
 * Caption information for figures and tables (SPRINT 3)
 */
export interface CaptionInfo {
  id: string;
  type: 'figure' | 'table';
  number: number;
  caption: string;
  position: number; // Position in document
}

/**
 * Calculate figure numbers in the document
 * Figures are numbered sequentially: Figure 1, Figure 2, ...
 */
export function calculateFigureNumbers(content: JSONContent | null): Map<string, number> {
  const numbers = new Map<string, number>();
  
  if (!content) return numbers;

  let figureCount = 0;

  const traverse = (nodes: JSONContent[]) => {
    for (const node of nodes) {
      // Check if this is an image node with caption
      if (node.type === 'image' && node.attrs?.id) {
        figureCount++;
        numbers.set(node.attrs.id, figureCount);
      }

      // Recurse into children
      if (node.content) {
        traverse(node.content);
      }
    }
  };

  if (content.content) {
    traverse(content.content);
  }

  return numbers;
}

/**
 * Calculate table numbers in the document
 * Tables are numbered sequentially: Table 1, Table 2, ...
 */
export function calculateTableNumbers(content: JSONContent | null): Map<string, number> {
  const numbers = new Map<string, number>();
  
  if (!content) return numbers;

  let tableCount = 0;

  const traverse = (nodes: JSONContent[]) => {
    for (const node of nodes) {
      // Check if this is a table node with caption
      if (node.type === 'table' && node.attrs?.id && node.attrs?.caption) {
        tableCount++;
        numbers.set(node.attrs.id, tableCount);
      }

      // Recurse into children
      if (node.content) {
        traverse(node.content);
      }
    }
  };

  if (content.content) {
    traverse(content.content);
  }

  return numbers;
}

/**
 * Get all captioned figures from document
 */
export function getAllFigures(content: JSONContent | null): CaptionInfo[] {
  const figures: CaptionInfo[] = [];
  
  if (!content) return figures;

  let position = 0;
  let figureCount = 0;

  const traverse = (nodes: JSONContent[]) => {
    for (const node of nodes) {
      position++;
      
      if (node.type === 'image') {
        const id = node.attrs?.id || `figure-${position}`;
        const caption = node.attrs?.caption || node.attrs?.alt || '';
        
        if (caption) {
          figureCount++;
          figures.push({
            id,
            type: 'figure',
            number: figureCount,
            caption,
            position,
          });
        }
      }

      if (node.content) {
        traverse(node.content);
      }
    }
  };

  if (content.content) {
    traverse(content.content);
  }

  return figures;
}

/**
 * Get all captioned tables from document
 */
export function getAllTables(content: JSONContent | null): CaptionInfo[] {
  const tables: CaptionInfo[] = [];
  
  if (!content) return tables;

  let position = 0;
  let tableCount = 0;

  const traverse = (nodes: JSONContent[]) => {
    for (const node of nodes) {
      position++;
      
      if (node.type === 'table' && node.attrs?.caption) {
        const id = node.attrs?.id || `table-${position}`;
        const caption = node.attrs.caption;
        
        tableCount++;
        tables.push({
          id,
          type: 'table',
          number: tableCount,
          caption,
          position,
        });
      }

      if (node.content) {
        traverse(node.content);
      }
    }
  };

  if (content.content) {
    traverse(content.content);
  }

  return tables;
}

/**
 * Format figure caption for display
 * @example "Figure 1: Architecture Diagram"
 */
export function formatFigureCaption(number: number, caption: string): string {
  return `Figure ${number}: ${caption}`;
}

/**
 * Format table caption for display
 * @example "Table 1: Performance Results"
 */
export function formatTableCaption(number: number, caption: string): string {
  return `Table ${number}: ${caption}`;
}

/**
 * Ensure nodes have unique IDs for caption tracking
 */
export function ensureCaptionIds(content: JSONContent): JSONContent {
  let imageIndex = 0;
  let tableIndex = 0;

  const traverse = (node: JSONContent): JSONContent => {
    // Add ID to images
    if (node.type === 'image') {
      const id = node.attrs?.id || `figure-${++imageIndex}`;
      return {
        ...node,
        attrs: {
          ...node.attrs,
          id,
        },
        content: node.content?.map(traverse),
      };
    }

    // Add ID to tables
    if (node.type === 'table') {
      const id = node.attrs?.id || `table-${++tableIndex}`;
      return {
        ...node,
        attrs: {
          ...node.attrs,
          id,
        },
        content: node.content?.map(traverse),
      };
    }

    // Recurse for other nodes
    if (node.content) {
      return {
        ...node,
        content: node.content.map(traverse),
      };
    }

    return node;
  };

  return traverse(content);
}

/**
 * Get figure number by ID
 */
export function getFigureNumber(
  figureId: string,
  content: JSONContent | null
): number | null {
  const numbers = calculateFigureNumbers(content);
  return numbers.get(figureId) || null;
}

/**
 * Get table number by ID
 */
export function getTableNumber(
  tableId: string,
  content: JSONContent | null
): number | null {
  const numbers = calculateTableNumbers(content);
  return numbers.get(tableId) || null;
}

/**
 * Check if node should have caption
 */
export function shouldHaveCaption(nodeType: string): boolean {
  return nodeType === 'image' || nodeType === 'table';
}
