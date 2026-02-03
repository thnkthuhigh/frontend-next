import { DocumentState } from '../store/document-store';
import { DocumentStructure } from '../types/document-structure';
import { JSONContent } from '@tiptap/core';

/**
 * Migrate old flat documents to new structure
 */
export function migrateToStructuredDocument(
  oldDoc: DocumentState
): DocumentState {
  // If already has structure, no migration needed
  if (oldDoc.structure) return oldDoc;
  
  // Handle null jsonContent
  if (!oldDoc.jsonContent) {
    return oldDoc;
  }
  
  // Extract cover page data from title/author
  const coverPage = {
    title: oldDoc.title || 'Untitled Document',
    author: oldDoc.author || 'Anonymous',
    date: new Date().toISOString().split('T')[0],
    style: 'simple' as const,
  };
  
  // Split content into sections
  const { frontMatter, mainContent, backMatter } = splitContentBySections(
    oldDoc.jsonContent
  );
  
  return {
    ...oldDoc,
    structure: {
      frontMatter: {
        coverPage,
        ...frontMatter,
      },
      mainContent,
      backMatter,
      sectionMarkers: {},
    },
  };
}

/**
 * Auto-detect Front/Main/Back Matter from headings
 */
function splitContentBySections(content: JSONContent) {
  const blocks = content.content || [];
  
  let frontMatterEnd = 0;
  let backMatterStart = blocks.length;
  
  // Heuristic: Detect "References", "Bibliography", "Appendix" headings
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.type === 'heading') {
      const text = extractText(block).toLowerCase();
      
      // Common Front Matter sections
      if (['abstract', 'acknowledgment', 'preface'].includes(text)) {
        frontMatterEnd = Math.max(frontMatterEnd, i + 1);
      }
      
      // Common Back Matter sections
      if (['references', 'bibliography', 'appendix', 'glossary'].includes(text)) {
        backMatterStart = Math.min(backMatterStart, i);
        break;
      }
    }
  }
  
  return {
    frontMatter: {
      abstract: frontMatterEnd > 0 
        ? { type: 'doc', content: blocks.slice(0, frontMatterEnd) }
        : undefined,
    },
    mainContent: {
      type: 'doc',
      content: blocks.slice(frontMatterEnd, backMatterStart),
    },
    backMatter: backMatterStart < blocks.length
      ? { appendices: [{ type: 'doc', content: blocks.slice(backMatterStart) }] }
      : {},
  };
}

function extractText(node: JSONContent): string {
  if (node.text) return node.text;
  if (node.content) {
    return node.content.map(extractText).join('');
  }
  return '';
}