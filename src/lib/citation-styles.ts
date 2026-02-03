/**
 * Citation Style Formatters (SPRINT 4)
 * 
 * Implements formatting for major citation styles:
 * - APA 7th Edition (American Psychological Association)
 * - IEEE (Institute of Electrical and Electronics Engineers)
 * - Chicago Manual of Style (Author-Date)
 * - MLA 9th Edition (Modern Language Association)
 * 
 * Each style has:
 * - Inline citation formatter (text citations)
 * - Bibliography entry formatter (reference list)
 */

import { BibliographyEntry, CitationMark, CitationStyle } from '@/types/document-structure';
import { formatAuthorsShort, formatPageNumbers } from './citation-utils';

// ============================================
// INLINE CITATION FORMATTERS
// ============================================

/**
 * Format inline citation - APA Style
 * 
 * Examples:
 * - (Smith, 2024)
 * - (Smith, 2024, p. 10)
 * - (Smith & Jones, 2024)
 * - (Smith et al., 2024)
 * - see Smith (2024) for details
 */
export function formatInlineCitationAPA(
  entry: BibliographyEntry,
  cite?: CitationMark
): string {
  const authors = formatAuthorsShort(entry.authors);
  const year = entry.year;
  
  // Build base citation
  let citation = cite?.suppressAuthor 
    ? `${year}` 
    : `${authors}, ${year}`;
  
  // Add page numbers if provided
  if (cite?.pageNumbers) {
    const pages = formatPageNumbers(cite.pageNumbers);
    citation += `, ${pages}`;
  }
  
  // Add prefix/suffix
  if (cite?.prefix) {
    citation = `${cite.prefix} ${citation}`;
  }
  if (cite?.suffix) {
    citation += `, ${cite.suffix}`;
  }
  
  return `(${citation})`;
}

/**
 * Format inline citation - IEEE Style
 * 
 * Examples:
 * - [1]
 * - [1, p. 10]
 * - [1]–[3]
 */
export function formatInlineCitationIEEE(
  number: number,
  cite?: CitationMark
): string {
  let citation = `[${number}]`;
  
  // Add page numbers if provided (rare in IEEE)
  if (cite?.pageNumbers) {
    const pages = formatPageNumbers(cite.pageNumbers);
    citation += `, ${pages}`;
  }
  
  return citation;
}

/**
 * Format inline citation - Chicago Style (Author-Date)
 * 
 * Examples:
 * - (Smith 2024)
 * - (Smith 2024, 10)
 * - (Smith and Jones 2024)
 * - (Smith et al. 2024)
 */
export function formatInlineCitationChicago(
  entry: BibliographyEntry,
  cite?: CitationMark
): string {
  const authors = formatAuthorsShort(entry.authors).replace('&', 'and');
  const year = entry.year;
  
  // Build base citation (no comma between author and year in Chicago)
  let citation = cite?.suppressAuthor 
    ? `${year}` 
    : `${authors} ${year}`;
  
  // Add page numbers if provided (no "p." or "pp." in Chicago)
  if (cite?.pageNumbers) {
    citation += `, ${cite.pageNumbers}`;
  }
  
  // Add prefix/suffix
  if (cite?.prefix) {
    citation = `${cite.prefix} ${citation}`;
  }
  if (cite?.suffix) {
    citation += `, ${cite.suffix}`;
  }
  
  return `(${citation})`;
}

/**
 * Format inline citation - MLA Style
 * 
 * Examples:
 * - (Smith 10)
 * - (Smith and Jones 10-15)
 * - (Smith et al. 10)
 */
export function formatInlineCitationMLA(
  entry: BibliographyEntry,
  cite?: CitationMark
): string {
  const authors = formatAuthorsShort(entry.authors).replace('&', 'and');
  
  // MLA uses author and page only (no year in inline citation)
  let citation = authors;
  
  // Add page numbers (no "p." or "pp." in MLA)
  if (cite?.pageNumbers) {
    citation += ` ${cite.pageNumbers.replace(/^pp?\.\s*/, '')}`;
  }
  
  // Add prefix/suffix
  if (cite?.prefix) {
    citation = `${cite.prefix} ${citation}`;
  }
  if (cite?.suffix) {
    citation += `; ${cite.suffix}`;
  }
  
  return `(${citation})`;
}

/**
 * Universal inline citation formatter
 * Delegates to style-specific formatter
 */
export function formatInlineCitation(
  entry: BibliographyEntry,
  style: CitationStyle,
  cite?: CitationMark,
  number?: number
): string {
  switch (style) {
    case 'apa':
      return formatInlineCitationAPA(entry, cite);
    case 'ieee':
      return formatInlineCitationIEEE(number || 1, cite);
    case 'chicago':
      return formatInlineCitationChicago(entry, cite);
    case 'mla':
      return formatInlineCitationMLA(entry, cite);
    default:
      return formatInlineCitationAPA(entry, cite);
  }
}

// ============================================
// BIBLIOGRAPHY ENTRY FORMATTERS
// ============================================

/**
 * Format authors for bibliography - APA Style
 * Examples:
 * - Smith, J.
 * - Smith, J., & Jones, A.
 * - Smith, J., Jones, A., & Brown, M.
 */
function formatAuthorsAPA(authors: string[]): string {
  if (authors.length === 0) return '';
  if (authors.length === 1) return authors[0];
  if (authors.length === 2) {
    return `${authors[0]}, & ${authors[1]}`;
  }
  
  // 3+ authors
  const allButLast = authors.slice(0, -1).join(', ');
  return `${allButLast}, & ${authors[authors.length - 1]}`;
}

/**
 * Format bibliography entry - APA 7th Edition
 * 
 * Examples:
 * 
 * Article:
 * Smith, J., & Jones, A. (2024). Title of article. Journal Name, 15(3), 123-145.
 *   https://doi.org/10.1234/example
 * 
 * Book:
 * Smith, J. (2024). Title of book (2nd ed.). Publisher Name.
 * 
 * Website:
 * Smith, J. (2024, January 15). Title of page. Site Name.
 *   https://example.com
 */
export function formatBibliographyEntryAPA(entry: BibliographyEntry): string {
  const parts: string[] = [];
  
  // Authors
  const authors = formatAuthorsAPA(entry.authors);
  parts.push(authors);
  
  // Year (with month for websites/blogs)
  if (entry.type === 'website' && entry.month) {
    parts.push(`(${entry.year}, ${entry.month})`);
  } else {
    parts.push(`(${entry.year})`);
  }
  
  // Title (italicized for books/journals, regular for articles)
  if (entry.type === 'book') {
    let title = `<i>${entry.title}</i>`;
    if (entry.subtitle) {
      title += `: <i>${entry.subtitle}</i>`;
    }
    if (entry.edition) {
      title += ` (${entry.edition}${typeof entry.edition === 'number' ? 'th' : ''} ed.)`;
    }
    parts.push(title);
  } else if (entry.type === 'article') {
    parts.push(entry.title);
  } else {
    parts.push(entry.title);
  }
  
  // Type-specific formatting
  switch (entry.type) {
    case 'article':
      // Journal info
      if (entry.journal) {
        let journalInfo = `<i>${entry.journal}</i>`;
        if (entry.volume) {
          journalInfo += `, ${entry.volume}`;
          if (entry.issue) {
            journalInfo += `(${entry.issue})`;
          }
        }
        if (entry.pages) {
          journalInfo += `, ${entry.pages}`;
        }
        parts.push(journalInfo);
      }
      break;
      
    case 'book':
      // Publisher
      if (entry.publisher) {
        parts.push(entry.publisher);
      }
      break;
      
    case 'conference':
      // Conference proceedings
      if (entry.conference) {
        parts.push(`<i>${entry.conference}</i>`);
      }
      if (entry.pages) {
        parts.push(`(pp. ${entry.pages})`);
      }
      break;
      
    case 'website':
      // Site name
      if (entry.publisher) {
        parts.push(entry.publisher);
      }
      break;
      
    case 'thesis':
      // Dissertation info
      parts.push(`[${entry.degreeType || 'Doctoral'} dissertation, ${entry.school}]`);
      break;
  }
  
  // DOI or URL
  if (entry.doi) {
    parts.push(`https://doi.org/${entry.doi}`);
  } else if (entry.url) {
    parts.push(entry.url);
  }
  
  return parts.join('. ') + '.';
}

/**
 * Format bibliography entry - IEEE Style
 * 
 * Examples:
 * 
 * [1] J. Smith and A. Jones, "Title of article," Journal Name, vol. 15, no. 3,
 *     pp. 123-145, 2024, doi: 10.1234/example.
 * 
 * [2] J. Smith, Title of Book, 2nd ed. New York: Publisher, 2024.
 */
export function formatBibliographyEntryIEEE(
  entry: BibliographyEntry,
  number: number
): string {
  const parts: string[] = [];
  
  // Number
  parts.push(`[${number}]`);
  
  // Authors (initials first in IEEE)
  const authors = entry.authors.map(author => {
    // Convert "Smith, John" to "J. Smith"
    const parts = author.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      const lastName = parts[0];
      const firstName = parts[1];
      const initial = firstName.charAt(0).toUpperCase();
      return `${initial}. ${lastName}`;
    }
    return author;
  }).join(' and ');
  
  parts.push(authors + ',');
  
  // Type-specific formatting
  switch (entry.type) {
    case 'article':
      // "Title of article,"
      parts.push(`"${entry.title},"`);
      
      // Journal info
      if (entry.journal) {
        let journalInfo = `<i>${entry.journal}</i>`;
        if (entry.volume) {
          journalInfo += `, vol. ${entry.volume}`;
        }
        if (entry.issue) {
          journalInfo += `, no. ${entry.issue}`;
        }
        if (entry.pages) {
          journalInfo += `, pp. ${entry.pages}`;
        }
        journalInfo += `, ${entry.year}`;
        parts.push(journalInfo + ',');
      }
      break;
      
    case 'book':
      // Title of Book
      let title = `<i>${entry.title}</i>`;
      if (entry.edition) {
        title += `, ${entry.edition}${typeof entry.edition === 'number' ? 'th' : ''} ed.`;
      }
      parts.push(title + '.');
      
      // Location: Publisher, year
      if (entry.publisherLocation && entry.publisher) {
        parts.push(`${entry.publisherLocation}: ${entry.publisher}, ${entry.year}.`);
      } else if (entry.publisher) {
        parts.push(`${entry.publisher}, ${entry.year}.`);
      }
      break;
      
    case 'conference':
      // "Title,"
      parts.push(`"${entry.title},"`);
      
      // in Conference Name
      if (entry.conference) {
        parts.push(`in <i>${entry.conference}</i>,`);
      }
      parts.push(`${entry.year},`);
      
      if (entry.pages) {
        parts.push(`pp. ${entry.pages},`);
      }
      break;
      
    default:
      parts.push(`"${entry.title}," ${entry.year},`);
  }
  
  // DOI
  if (entry.doi) {
    parts.push(`doi: ${entry.doi}.`);
  } else if (entry.url) {
    parts.push(`[Online]. Available: ${entry.url}`);
  }
  
  return parts.join(' ').replace(/,\s*\.$/, '.');
}

/**
 * Format bibliography entry - Chicago Style (Author-Date)
 * 
 * Examples:
 * 
 * Smith, John, and Alice Jones. 2024. "Title of Article." Journal Name 15 (3): 123-45.
 * 
 * Smith, John. 2024. Title of Book. 2nd ed. New York: Publisher.
 */
export function formatBibliographyEntryChicago(entry: BibliographyEntry): string {
  const parts: string[] = [];
  
  // Authors (full names, last name first for first author)
  const formattedAuthors = entry.authors.map((author, index) => {
    if (index === 0) return author; // First author: "Smith, John"
    
    // Subsequent authors: "John Smith"
    const nameParts = author.split(',').map(p => p.trim());
    if (nameParts.length >= 2) {
      return `${nameParts[1]} ${nameParts[0]}`;
    }
    return author;
  });
  
  // Join with proper punctuation
  let authors = '';
  if (formattedAuthors.length === 1) {
    authors = formattedAuthors[0];
  } else if (formattedAuthors.length === 2) {
    authors = formattedAuthors.join(' and ');
  } else {
    const allButLast = formattedAuthors.slice(0, -1).join(', ');
    authors = `${allButLast}, and ${formattedAuthors[formattedAuthors.length - 1]}`;
  }
  
  parts.push(authors);
  
  // Year
  parts.push(`${entry.year}.`);
  
  // Type-specific formatting
  switch (entry.type) {
    case 'article':
      // "Title of Article."
      parts.push(`"${entry.title}."`);
      
      // Journal info
      if (entry.journal) {
        let journalInfo = `<i>${entry.journal}</i>`;
        if (entry.volume) {
          journalInfo += ` ${entry.volume}`;
          if (entry.issue) {
            journalInfo += ` (${entry.issue})`;
          }
        }
        if (entry.pages) {
          journalInfo += `: ${entry.pages}`;
        }
        parts.push(journalInfo + '.');
      }
      break;
      
    case 'book':
      // Title of Book
      let title = `<i>${entry.title}</i>`;
      if (entry.subtitle) {
        title += `: <i>${entry.subtitle}</i>`;
      }
      if (entry.edition) {
        title += `. ${entry.edition}${typeof entry.edition === 'number' ? 'th' : ''} ed`;
      }
      parts.push(title + '.');
      
      // Location: Publisher
      if (entry.publisherLocation && entry.publisher) {
        parts.push(`${entry.publisherLocation}: ${entry.publisher}.`);
      } else if (entry.publisher) {
        parts.push(`${entry.publisher}.`);
      }
      break;
      
    case 'conference':
      // "Title of Paper."
      parts.push(`"${entry.title}."`);
      
      // In Conference Name
      if (entry.conference) {
        parts.push(`In <i>${entry.conference}</i>`);
        if (entry.pages) {
          parts.push(`, ${entry.pages}.`);
        } else {
          parts.push('.');
        }
      }
      break;
      
    default:
      parts.push(`"${entry.title}."`);
  }
  
  // DOI or URL
  if (entry.doi) {
    parts.push(`https://doi.org/${entry.doi}.`);
  } else if (entry.url) {
    parts.push(entry.url + '.');
  }
  
  return parts.join(' ').replace(/\s+/g, ' ').replace(/\.\./g, '.');
}

/**
 * Format bibliography entry - MLA 9th Edition
 * 
 * Examples:
 * 
 * Smith, John, and Alice Jones. "Title of Article." Journal Name, vol. 15, no. 3,
 *   2024, pp. 123-45.
 * 
 * Smith, John. Title of Book. 2nd ed., Publisher, 2024.
 */
export function formatBibliographyEntryMLA(entry: BibliographyEntry): string {
  const parts: string[] = [];
  
  // Authors (full names, last name first for first author)
  const authors = entry.authors.map((author, index) => {
    if (index === 0) return author; // First author: "Smith, John"
    
    // Subsequent authors: "John Smith"
    const nameParts = author.split(',').map(p => p.trim());
    if (nameParts.length >= 2) {
      return `${nameParts[1]} ${nameParts[0]}`;
    }
    return author;
  }).join(', and ');
  
  parts.push(authors + '.');
  
  // Type-specific formatting
  switch (entry.type) {
    case 'article':
      // "Title of Article."
      parts.push(`"${entry.title}."`);
      
      // Journal info
      if (entry.journal) {
        let journalInfo = `<i>${entry.journal}</i>`;
        if (entry.volume) {
          journalInfo += `, vol. ${entry.volume}`;
        }
        if (entry.issue) {
          journalInfo += `, no. ${entry.issue}`;
        }
        journalInfo += `, ${entry.year}`;
        if (entry.pages) {
          journalInfo += `, pp. ${entry.pages}`;
        }
        parts.push(journalInfo + '.');
      }
      break;
      
    case 'book':
      // Title of Book
      let title = `<i>${entry.title}</i>`;
      if (entry.subtitle) {
        title += `: <i>${entry.subtitle}</i>`;
      }
      parts.push(title + '.');
      
      // Edition, Publisher, Year
      const pubParts: string[] = [];
      if (entry.edition) {
        pubParts.push(`${entry.edition}${typeof entry.edition === 'number' ? 'th' : ''} ed.`);
      }
      if (entry.publisher) {
        pubParts.push(entry.publisher);
      }
      pubParts.push(entry.year.toString());
      parts.push(pubParts.join(', ') + '.');
      break;
      
    case 'conference':
      // "Title of Paper."
      parts.push(`"${entry.title}."`);
      
      // Conference Name
      if (entry.conference) {
        parts.push(`<i>${entry.conference}</i>, ${entry.year}.`);
      }
      break;
      
    case 'website':
      // "Title of Page."
      parts.push(`"${entry.title}."`);
      
      // Site Name
      if (entry.publisher) {
        parts.push(`<i>${entry.publisher}</i>,`);
      }
      parts.push(`${entry.year}.`);
      
      // URL and access date
      if (entry.url) {
        parts.push(entry.url + '.');
      }
      if (entry.accessed) {
        parts.push(`Accessed ${entry.accessed}.`);
      }
      break;
      
    default:
      parts.push(`"${entry.title}." ${entry.year}.`);
  }
  
  return parts.join(' ').replace(/\s+/g, ' ').replace(/\.\./g, '.');
}

/**
 * Universal bibliography entry formatter
 * Delegates to style-specific formatter
 */
export function formatBibliographyEntry(
  entry: BibliographyEntry,
  style: CitationStyle,
  number?: number
): string {
  switch (style) {
    case 'apa':
      return formatBibliographyEntryAPA(entry);
    case 'ieee':
      return formatBibliographyEntryIEEE(entry, number || 1);
    case 'chicago':
      return formatBibliographyEntryChicago(entry);
    case 'mla':
      return formatBibliographyEntryMLA(entry);
    default:
      return formatBibliographyEntryAPA(entry);
  }
}

/**
 * Get bibliography section title for style
 */
export function getBibliographyTitle(style: CitationStyle): string {
  switch (style) {
    case 'apa':
      return 'References';
    case 'ieee':
      return 'References';
    case 'chicago':
      return 'References';
    case 'mla':
      return 'Works Cited';
    default:
      return 'References';
  }
}

/**
 * Get style-specific sort order
 */
export function getStyleSortOrder(style: CitationStyle): 'author' | 'citation-order' {
  switch (style) {
    case 'apa':
      return 'author'; // Alphabetical by author
    case 'ieee':
      return 'citation-order'; // Order of appearance
    case 'chicago':
      return 'author'; // Alphabetical by author
    case 'mla':
      return 'author'; // Alphabetical by author
    default:
      return 'author';
  }
}
