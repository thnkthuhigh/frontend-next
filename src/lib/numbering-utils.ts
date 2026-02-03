import { JSONContent } from "@tiptap/react";

/**
 * Heading numbering information
 */
export interface HeadingNumber {
  id: string;
  level: 1 | 2 | 3;
  number: string;
  text: string;
  zone: 'front' | 'middle' | 'back';
}

/**
 * Calculate heading numbers for the entire document
 * Returns a Map of heading ID -> number string (e.g., "1", "1.1", "1.2.1")
 * 
 * Rules:
 * - Only Main Content (middle zone) headings are numbered
 * - Front Matter and Back Matter headings are NOT numbered
 * - H1 resets H2 and H3 counters
 * - H2 resets H3 counters
 * - Edge case: H2 without H1 shows "0.1", H3 without H2 shows "0.0.1"
 */
export function calculateHeadingNumbers(
  content: JSONContent | null,
  documentStructure?: { front?: JSONContent[]; middle?: JSONContent[]; back?: JSONContent[] }
): Map<string, HeadingNumber> {
  const numbersMap = new Map<string, HeadingNumber>();
  
  if (!content) return numbersMap;

  // Counter state
  let h1 = 0;
  let h2 = 0;
  let h3 = 0;
  let headingIndex = 0;

  /**
   * Traverse nodes and assign numbers
   */
  const traverse = (nodes: JSONContent[], zone: 'front' | 'middle' | 'back') => {
    for (const node of nodes) {
      // Check if this is a heading
      if (node.type === 'heading' && node.attrs?.level) {
        const level = node.attrs.level as 1 | 2 | 3;
        const text = extractTextFromNode(node);
        const id = node.attrs?.id || `heading-${headingIndex++}`;

        // Only number Main Content headings
        if (zone === 'middle') {
          // Update counters based on level
          if (level === 1) {
            h1++;
            h2 = 0; // Reset h2
            h3 = 0; // Reset h3
          } else if (level === 2) {
            h2++;
            h3 = 0; // Reset h3
          } else if (level === 3) {
            h3++;
          }

          // Generate number string
          let numberStr = '';
          if (level === 1) {
            numberStr = `${h1}`;
          } else if (level === 2) {
            numberStr = `${h1}.${h2}`;
          } else if (level === 3) {
            numberStr = `${h1}.${h2}.${h3}`;
          }

          numbersMap.set(id, {
            id,
            level,
            number: numberStr,
            text: text.trim(),
            zone,
          });
        } else {
          // Front/Back Matter - no numbering
          numbersMap.set(id, {
            id,
            level,
            number: '', // Empty string means no number
            text: text.trim(),
            zone,
          });
        }
      }

      // Recurse into children
      if (node.content) {
        traverse(node.content, zone);
      }
    }
  };

  // If document structure is provided (3-zone), traverse each zone
  if (documentStructure) {
    if (documentStructure.front) {
      traverse(documentStructure.front, 'front');
    }
    if (documentStructure.middle) {
      // Reset counters for main content
      h1 = 0;
      h2 = 0;
      h3 = 0;
      traverse(documentStructure.middle, 'middle');
    }
    if (documentStructure.back) {
      traverse(documentStructure.back, 'back');
    }
  } else {
    // Legacy: Treat all content as middle zone
    if (content.content) {
      traverse(content.content, 'middle');
    }
  }

  return numbersMap;
}

/**
 * Extract plain text from a Tiptap node
 */
function extractTextFromNode(node: JSONContent): string {
  if (node.type === 'text' && node.text) {
    return node.text;
  }
  if (node.content) {
    return node.content.map(extractTextFromNode).join('');
  }
  return '';
}

/**
 * Get all numbered headings from the document (for TOC generation)
 * Only returns Main Content headings with numbers
 */
export function getNumberedHeadings(
  content: JSONContent | null,
  documentStructure?: { front?: JSONContent[]; middle?: JSONContent[]; back?: JSONContent[] }
): HeadingNumber[] {
  const numbersMap = calculateHeadingNumbers(content, documentStructure);
  
  // Filter to only include numbered headings (middle zone)
  return Array.from(numbersMap.values()).filter(h => h.zone === 'middle' && h.number !== '');
}

/**
 * Format a heading number for display
 * Examples: "1", "1.1", "1.2.3"
 */
export function formatHeadingNumber(number: string): string {
  return number ? `${number}. ` : '';
}

/**
 * Get heading number by ID
 */
export function getHeadingNumber(
  headingId: string,
  content: JSONContent | null,
  documentStructure?: { front?: JSONContent[]; middle?: JSONContent[]; back?: JSONContent[] }
): string {
  const numbersMap = calculateHeadingNumbers(content, documentStructure);
  const heading = numbersMap.get(headingId);
  return heading?.number || '';
}

/**
 * Check if a heading should be numbered based on its zone
 */
export function shouldNumberHeading(zone: 'front' | 'middle' | 'back'): boolean {
  return zone === 'middle';
}

/**
 * Extract heading info from document for TOC
 */
export interface TOCHeading {
  id: string;
  level: 1 | 2 | 3;
  number: string;
  text: string;
  page?: number; // Page number (calculated separately)
}

/**
 * Generate TOC headings with numbers
 */
export function generateTOCHeadings(
  content: JSONContent | null,
  documentStructure?: { front?: JSONContent[]; middle?: JSONContent[]; back?: JSONContent[] }
): TOCHeading[] {
  const numberedHeadings = getNumberedHeadings(content, documentStructure);
  
  return numberedHeadings.map(h => ({
    id: h.id,
    level: h.level,
    number: h.number,
    text: h.text,
    page: undefined, // Page numbers calculated separately by PagedJS
  }));
}

/**
 * Check if content is in a zone that should not be numbered
 */
export function isNonNumberedZone(nodeType: string, attrs?: any): boolean {
  // Check for cover page
  if (nodeType === 'coverPage' || attrs?.type === 'coverPage') {
    return true;
  }
  
  // Check for front matter
  if (nodeType === 'frontMatter' || attrs?.type === 'frontMatter') {
    return true;
  }
  
  // Check for zone attribute
  if (attrs?.zone === 'front' || attrs?.zone === 'back') {
    return true;
  }
  
  // Check for explicit no-number flag
  if (attrs?.noNumber === true) {
    return true;
  }
  
  return false;
}

/**
 * Add heading IDs to content if missing (for anchor linking)
 */
export function ensureHeadingIds(content: JSONContent): JSONContent {
  let headingIndex = 0;
  
  const traverse = (node: JSONContent): JSONContent => {
    if (node.type === 'heading') {
      const id = node.attrs?.id || `heading-${headingIndex++}`;
      return {
        ...node,
        attrs: {
          ...node.attrs,
          id,
        },
        content: node.content?.map(traverse),
      };
    }
    
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
