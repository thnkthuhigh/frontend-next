/**
 * Citation Management Utilities (SPRINT 4)
 * 
 * Provides functions for:
 * - Extracting citations from document
 * - Managing bibliography entries
 * - Validating citations and references
 * - Sorting and organizing bibliography
 * - Cross-reference tracking
 */

import { JSONContent } from '@tiptap/react';
import { 
  BibliographyEntry, 
  CitationMark, 
  CitationValidation,
  CitationStyle 
} from '@/types/document-structure';

/**
 * Citation information extracted from document
 */
export interface CitationInfo {
  id: string; // Citation mark ID (references BibliographyEntry.id)
  position: number; // Position in document
  pageNumbers?: string;
  prefix?: string;
  suffix?: string;
  suppressAuthor?: boolean;
}

/**
 * Extract all citations from document content
 * Scans for citation marks and returns their details
 */
export function getAllCitations(content: JSONContent | null): CitationInfo[] {
  const citations: CitationInfo[] = [];
  
  if (!content) return citations;

  let position = 0;

  const traverse = (nodes: JSONContent[]) => {
    for (const node of nodes) {
      position++;

      // Check if this node has citation marks
      if (node.marks) {
        for (const mark of node.marks) {
          if (mark.type === 'citation') {
            const attrs = mark.attrs as CitationMark;
            citations.push({
              id: attrs.id,
              position,
              pageNumbers: attrs.pageNumbers,
              prefix: attrs.prefix,
              suffix: attrs.suffix,
              suppressAuthor: attrs.suppressAuthor,
            });
          }
        }
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

  return citations;
}

/**
 * Get all citations for a specific reference
 * Useful for finding where a reference is cited
 */
export function getCitationsByReference(
  referenceId: string,
  content: JSONContent | null
): CitationInfo[] {
  const allCitations = getAllCitations(content);
  return allCitations.filter(cite => cite.id === referenceId);
}

/**
 * Get unique cited references (deduplicated)
 * Returns list of reference IDs that are actually cited in document
 */
export function getCitedReferences(content: JSONContent | null): string[] {
  const citations = getAllCitations(content);
  const uniqueIds = new Set(citations.map(cite => cite.id));
  return Array.from(uniqueIds);
}

/**
 * Get unused references (in bibliography but not cited)
 * Useful for cleanup warnings
 */
export function getUnusedReferences(
  bibliography: BibliographyEntry[],
  content: JSONContent | null
): BibliographyEntry[] {
  const citedIds = new Set(getCitedReferences(content));
  return bibliography.filter(entry => !citedIds.has(entry.id));
}

/**
 * Validate all citations in document
 * Checks if each citation has a corresponding bibliography entry
 */
export function validateCitations(
  content: JSONContent | null,
  bibliography: BibliographyEntry[]
): CitationValidation[] {
  const citations = getAllCitations(content);
  const bibIds = new Set(bibliography.map(entry => entry.id));
  
  return citations.map(cite => {
    const valid = bibIds.has(cite.id);
    const errors: string[] = [];
    
    if (!valid) {
      errors.push(`Reference "${cite.id}" not found in bibliography`);
    }
    
    return {
      valid,
      citationId: cite.id,
      position: cite.position,
      errors,
    };
  });
}

/**
 * Check if document has any citation errors
 */
export function hasCitationErrors(
  content: JSONContent | null,
  bibliography: BibliographyEntry[]
): boolean {
  const validations = validateCitations(content, bibliography);
  return validations.some(v => !v.valid);
}

/**
 * Get citation count for each reference
 * Returns map of referenceId -> count
 */
export function getCitationCounts(content: JSONContent | null): Map<string, number> {
  const citations = getAllCitations(content);
  const counts = new Map<string, number>();
  
  for (const cite of citations) {
    counts.set(cite.id, (counts.get(cite.id) || 0) + 1);
  }
  
  return counts;
}

/**
 * Sort bibliography entries by various criteria
 */
export function sortBibliography(
  entries: BibliographyEntry[],
  sortBy: 'author' | 'year' | 'title' | 'citation-order',
  content?: JSONContent | null
): BibliographyEntry[] {
  const sorted = [...entries];

  switch (sortBy) {
    case 'author':
      // Sort by first author's last name
      sorted.sort((a, b) => {
        const authorA = a.authors[0] || '';
        const authorB = b.authors[0] || '';
        return authorA.localeCompare(authorB);
      });
      break;

    case 'year':
      // Sort by year (newest first)
      sorted.sort((a, b) => b.year - a.year);
      break;

    case 'title':
      // Sort by title alphabetically
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;

    case 'citation-order':
      // Sort by first appearance in document
      if (!content) break;
      
      const citations = getAllCitations(content);
      const firstAppearance = new Map<string, number>();
      
      // Record first appearance position for each reference
      for (const cite of citations) {
        if (!firstAppearance.has(cite.id)) {
          firstAppearance.set(cite.id, cite.position);
        }
      }
      
      sorted.sort((a, b) => {
        const posA = firstAppearance.get(a.id) || Infinity;
        const posB = firstAppearance.get(b.id) || Infinity;
        return posA - posB;
      });
      break;
  }

  return sorted;
}

/**
 * Generate citation numbers for IEEE style
 * Returns map of referenceId -> citation number [1], [2], etc.
 */
export function generateCitationNumbers(
  bibliography: BibliographyEntry[],
  content: JSONContent | null,
  style: CitationStyle = 'ieee'
): Map<string, number> {
  const numbers = new Map<string, number>();
  
  // IEEE uses citation order
  if (style === 'ieee') {
    const sorted = sortBibliography(bibliography, 'citation-order', content);
    sorted.forEach((entry, index) => {
      numbers.set(entry.id, index + 1);
    });
  } else {
    // Other styles might not use numbers
    bibliography.forEach((entry, index) => {
      numbers.set(entry.id, index + 1);
    });
  }
  
  return numbers;
}

/**
 * Export bibliography to BibTeX format
 */
export function exportToBibTeX(entries: BibliographyEntry[]): string {
  const lines: string[] = [];
  
  for (const entry of entries) {
    const type = entry.type === 'article' ? 'article' : 
                 entry.type === 'book' ? 'book' :
                 entry.type === 'conference' ? 'inproceedings' :
                 'misc';
    
    lines.push(`@${type}{${entry.id},`);
    
    // Author
    if (entry.authors.length > 0) {
      const authors = entry.authors.join(' and ');
      lines.push(`  author = {${authors}},`);
    }
    
    // Title
    lines.push(`  title = {${entry.title}},`);
    
    // Year
    lines.push(`  year = {${entry.year}},`);
    
    // Type-specific fields
    if (entry.journal) {
      lines.push(`  journal = {${entry.journal}},`);
    }
    if (entry.volume) {
      lines.push(`  volume = {${entry.volume}},`);
    }
    if (entry.issue) {
      lines.push(`  number = {${entry.issue}},`);
    }
    if (entry.pages) {
      lines.push(`  pages = {${entry.pages}},`);
    }
    if (entry.publisher) {
      lines.push(`  publisher = {${entry.publisher}},`);
    }
    if (entry.doi) {
      lines.push(`  doi = {${entry.doi}},`);
    }
    if (entry.url) {
      lines.push(`  url = {${entry.url}},`);
    }
    
    lines.push('}');
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 * Export bibliography to JSON format
 */
export function exportToJSON(entries: BibliographyEntry[]): string {
  return JSON.stringify(entries, null, 2);
}

/**
 * Import bibliography from BibTeX format (basic parser)
 * Note: This is a simplified parser for basic BibTeX entries
 */
export function importFromBibTeX(bibtex: string): BibliographyEntry[] {
  const entries: BibliographyEntry[] = [];
  
  // Simple regex-based parser (production should use proper BibTeX parser)
  const entryRegex = /@(\w+)\{([^,]+),([^}]+)\}/g;
  let match;
  
  while ((match = entryRegex.exec(bibtex)) !== null) {
    const [, entryType, citeKey, fieldsStr] = match;
    
    const entry: Partial<BibliographyEntry> = {
      id: citeKey.trim(),
      type: entryType.toLowerCase() as any || 'other',
      authors: [],
      title: '',
      year: new Date().getFullYear(),
    };
    
    // Parse fields
    const fieldRegex = /(\w+)\s*=\s*\{([^}]+)\}/g;
    let fieldMatch;
    
    while ((fieldMatch = fieldRegex.exec(fieldsStr)) !== null) {
      const [, key, value] = fieldMatch;
      
      switch (key.toLowerCase()) {
        case 'author':
          entry.authors = value.split(' and ').map(a => a.trim());
          break;
        case 'title':
          entry.title = value;
          break;
        case 'year':
          entry.year = parseInt(value) || new Date().getFullYear();
          break;
        case 'journal':
          entry.journal = value;
          break;
        case 'volume':
          entry.volume = parseInt(value);
          break;
        case 'number':
          entry.issue = parseInt(value);
          break;
        case 'pages':
          entry.pages = value;
          break;
        case 'publisher':
          entry.publisher = value;
          break;
        case 'doi':
          entry.doi = value;
          break;
        case 'url':
          entry.url = value;
          break;
      }
    }
    
    if (entry.title) {
      entries.push(entry as BibliographyEntry);
    }
  }
  
  return entries;
}

/**
 * Generate a unique citation key from author and year
 * Example: "Smith, J. (2024)" -> "smith2024"
 */
export function generateCiteKey(
  authors: string[],
  year: number,
  existingKeys: string[] = []
): string {
  if (authors.length === 0) {
    return `ref${year}`;
  }
  
  // Extract last name from first author
  const firstAuthor = authors[0];
  const parts = firstAuthor.split(',');
  const lastName = parts[0].trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  
  let baseKey = `${lastName}${year}`;
  let key = baseKey;
  let suffix = 'a';
  
  // Handle duplicates by adding suffix (a, b, c, ...)
  while (existingKeys.includes(key)) {
    key = `${baseKey}${suffix}`;
    suffix = String.fromCharCode(suffix.charCodeAt(0) + 1);
  }
  
  return key;
}

/**
 * Format authors for display (short form)
 * Examples:
 * - ["Smith, J."] -> "Smith"
 * - ["Smith, J.", "Doe, A."] -> "Smith & Doe"
 * - ["Smith, J.", "Doe, A.", "Johnson, M."] -> "Smith et al."
 */
export function formatAuthorsShort(authors: string[]): string {
  if (authors.length === 0) return 'Unknown';
  if (authors.length === 1) return authors[0].split(',')[0].trim();
  if (authors.length === 2) {
    const a1 = authors[0].split(',')[0].trim();
    const a2 = authors[1].split(',')[0].trim();
    return `${a1} & ${a2}`;
  }
  return `${authors[0].split(',')[0].trim()} et al.`;
}

/**
 * Format page numbers consistently
 * Examples: "10" -> "p. 10", "10-15" -> "pp. 10-15"
 */
export function formatPageNumbers(pages?: string): string {
  if (!pages) return '';
  
  // Check if it's a range
  if (pages.includes('-') || pages.includes('–')) {
    return `pp. ${pages}`;
  }
  
  return `p. ${pages}`;
}

/**
 * Check if a bibliography entry is complete (has required fields)
 */
export function isEntryComplete(entry: BibliographyEntry): boolean {
  // Must have: id, type, authors, title, year
  if (!entry.id || !entry.type || !entry.title || !entry.year) {
    return false;
  }
  
  if (!entry.authors || entry.authors.length === 0) {
    return false;
  }
  
  // Type-specific requirements
  switch (entry.type) {
    case 'article':
      // Articles need journal
      return !!entry.journal;
      
    case 'book':
      // Books need publisher
      return !!entry.publisher;
      
    case 'conference':
      // Conference papers need conference name
      return !!entry.conference;
      
    default:
      return true;
  }
}

/**
 * Get missing required fields for a bibliography entry
 */
export function getMissingFields(entry: BibliographyEntry): string[] {
  const missing: string[] = [];
  
  if (!entry.id) missing.push('id');
  if (!entry.type) missing.push('type');
  if (!entry.title) missing.push('title');
  if (!entry.year) missing.push('year');
  if (!entry.authors || entry.authors.length === 0) missing.push('authors');
  
  // Type-specific
  switch (entry.type) {
    case 'article':
      if (!entry.journal) missing.push('journal');
      break;
    case 'book':
      if (!entry.publisher) missing.push('publisher');
      break;
    case 'conference':
      if (!entry.conference) missing.push('conference');
      break;
  }
  
  return missing;
}
