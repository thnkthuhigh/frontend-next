
import { DocumentBlock } from "@/store/document-store";

// A4 Dimensions (Points at 72 DPI)
export const PAGE_HEIGHT = 842; // A4 height in points
export const PAGE_MARGIN_Y = 50; // Reduced margins for better space usage
// Content height calculation: subtract top/bottom margins and header/footer space
export const CONTENT_HEIGHT = PAGE_HEIGHT - (PAGE_MARGIN_Y * 2) - 20; // Maximized space available

const ESTIMATED_HEIGHTS = {
  heading1: 50, // Reduced from 70
  heading2: 40, // Reduced from 55
  heading3: 35, // Reduced from 48
  paragraph_line: 18, // Reduced from 22
  list_item: 24, // Reduced from 28
  image: 300,
  table_row: 32,
  divider: 20,
  quote: 70,
  code_block_line: 18,
  callout: 60,
  block_spacing: 12, // Reduced spacing
};

// More accurate text height estimation based on actual A4 content width
function estimateTextHeight(text: string, fontSize: number = 12, width: number = 451): number {
  if (!text) return 20;
  // A4 content width is ~451pt (595 - 144 margins)
  // Average character width is ~0.55 * fontSize for most fonts
  const avgCharWidth = fontSize * 0.5; // Slightly tighter char width
  const charsPerLine = Math.floor(width / avgCharWidth);
  const lines = Math.ceil(text.length / charsPerLine);
  const lineHeight = fontSize * 1.4; // Reduced line height multiplier
  return Math.max(lines, 1) * lineHeight + 5; // Reduced padding
}

export interface Page {
  id: number;
  blocks: DocumentBlock[];
}

// Helper to split text into two chunks based on ratio
function splitText(text: string, ratio: number): [string, string] {
  if (!text) return ["", ""];
  const splitIndex = Math.floor(text.length * ratio);
  // Find nearest space to avoid cutting words
  const spaceIndex = text.lastIndexOf(" ", splitIndex);
  const cutAt = spaceIndex > 0 ? spaceIndex : splitIndex;
  
  return [text.substring(0, cutAt), text.substring(cutAt + 1)];
}

export function paginateBlocks(
  blocks: DocumentBlock[], 
  measuredHeights: Record<string, number> = {}
): Page[] {
  const pages: Page[] = [];
  let currentPageBlocks: DocumentBlock[] = [];
  let currentHeight = 0;
  let pageId = 1;

  // Clone blocks to avoid mutating original store
  const queue = [...blocks];

  while (queue.length > 0) {
    const block = queue.shift()!;
    let blockHeight = 0;

    // 1. Get Height
    if (measuredHeights[block.id]) {
      blockHeight = measuredHeights[block.id];
    } else {
      // Fallback estimation logic...
      switch (block.type) {
        case "heading1": blockHeight = ESTIMATED_HEIGHTS.heading1; break;
        case "heading2": blockHeight = ESTIMATED_HEIGHTS.heading2; break;
        case "heading3": blockHeight = ESTIMATED_HEIGHTS.heading3; break;
        case "paragraph": 
          blockHeight = estimateTextHeight(block.content || "", 12) + 15; 
          break;
        case "list":
          blockHeight = (block.meta?.items?.length || 1) * ESTIMATED_HEIGHTS.list_item;
          break;
        case "quote": blockHeight = ESTIMATED_HEIGHTS.quote; break;
        case "code_block": 
          const codeLines = (block.content || "").split("\n").length;
          blockHeight = codeLines * ESTIMATED_HEIGHTS.code_block_line + 20;
          break;
        case "table":
          const rowCount = (block.meta?.rows?.length || 0) + 1; // +1 for header
          blockHeight = rowCount * ESTIMATED_HEIGHTS.table_row;
          break;
        case "divider": blockHeight = ESTIMATED_HEIGHTS.divider; break;
        case "callout": blockHeight = ESTIMATED_HEIGHTS.callout; break;
        default: blockHeight = 60;
      }
    }
    blockHeight += ESTIMATED_HEIGHTS.block_spacing;

    // Check Fit
    if (currentHeight + blockHeight <= CONTENT_HEIGHT) {
      currentPageBlocks.push(block);
      currentHeight += blockHeight;
    } else {
      // DOES NOT FIT
      const remainingSpace = CONTENT_HEIGHT - currentHeight;

      // Can we split it? (Only paragraphs for now)
      if (block.type === "paragraph" && remainingSpace > 50 && block.content.length > 100) {
        // Calculate how much fits
        const ratio = Math.min(0.9, remainingSpace / blockHeight);
        const [part1Text, part2Text] = splitText(block.content, ratio);

        if (part1Text.length > 20 && part2Text.length > 20) {
          // Create two new blocks
          const part1Block = { ...block, id: `${block.id}-part1`, content: part1Text };
          const part2Block = { ...block, id: `${block.id}-part2`, content: part2Text };

          // Add part 1 to current page
          currentPageBlocks.push(part1Block);
          
          // Push current page
          pages.push({ id: pageId++, blocks: currentPageBlocks });
          
          // Start new page with part 2
          currentPageBlocks = [];
          currentHeight = 0;
          
          // Put part 2 back to queue (it might need splitting again!)
          queue.unshift(part2Block);
          continue;
        }
      }

      // If cannot split or splitting failed:
      // Push current page
      if (currentPageBlocks.length > 0) {
        pages.push({ id: pageId++, blocks: currentPageBlocks });
        currentPageBlocks = [];
        currentHeight = 0;
        
        // Retry this block on new page
        queue.unshift(block);
      } else {
        // Block is bigger than empty page! Force add it
        currentPageBlocks.push(block);
        pages.push({ id: pageId++, blocks: currentPageBlocks });
        currentPageBlocks = [];
        currentHeight = 0;
      }
    }
  }

  // Push last page
  if (currentPageBlocks.length > 0) {
    pages.push({ id: pageId, blocks: currentPageBlocks });
  }

  return pages;
}
