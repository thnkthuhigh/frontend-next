import type { JSONContent } from '@tiptap/react';

/**
 * Professional Document Structure
 * Supports academic/enterprise documents with Front/Main/Back Matter
 */

export type DocumentSection = 'front' | 'main' | 'back';

export interface CoverPageData {
  title: string;
  subtitle?: string;
  author: string;
  institution?: string;
  date: string;
  style: 'simple' | 'formal';
}

export interface FrontMatter {
  coverPage?: CoverPageData;
  abstract?: JSONContent;
  acknowledgment?: JSONContent;
  tableOfContents?: {
    enabled: boolean;
    depth: 1 | 2 | 3; // H1, H1-H2, or H1-H2-H3
  };
  listOfFigures?: boolean;
  listOfTables?: boolean;
}

export interface BackMatter {
  references?: Reference[];
  appendices?: JSONContent[];
  glossary?: JSONContent;
}

export interface DocumentStructure {
  frontMatter: FrontMatter;
  mainContent: JSONContent; // Current editor content
  backMatter: BackMatter;
  
  // Metadata for section identification
  sectionMarkers: {
    frontMatterEnd?: number; // Block index where Front Matter ends
    backMatterStart?: number; // Block index where Back Matter starts
  };
}

// ============================================
// SPRINT 4: Citations & Bibliography System
// ============================================

/**
 * Citation styles supported by the system
 */
export type CitationStyle = 'apa' | 'ieee' | 'chicago' | 'mla';

/**
 * Reference types for bibliography entries
 */
export type ReferenceType =
  | 'book'
  | 'article'
  | 'website'
  | 'conference'
  | 'thesis'
  | 'report'
  | 'patent'
  | 'other';

/**
 * Bibliography Entry (Enhanced Reference interface)
 * Supports APA, IEEE, Chicago, MLA citation styles
 */
export interface BibliographyEntry {
  // Core identification
  id: string; // Unique cite key (e.g., "smith2024", "doe2023a")
  type: ReferenceType;
  
  // Author information
  authors: string[]; // ["Smith, John", "Doe, Jane A."]
  editors?: string[]; // For edited books
  
  // Title and publication info
  title: string;
  subtitle?: string;
  year: number;
  month?: string; // "January", "Jan", etc.
  
  // Journal/Article specific
  journal?: string;
  volume?: number;
  issue?: number;
  pages?: string; // "123-145" or "e12345"
  articleNumber?: string; // For electronic articles
  
  // Book specific
  publisher?: string;
  publisherLocation?: string; // "New York, NY"
  edition?: number | string; // 2 or "2nd" or "revised"
  isbn?: string;
  
  // Conference specific
  conference?: string; // Full conference name
  conferenceAcronym?: string; // "ICSE 2024"
  location?: string; // Conference location
  
  // Thesis/Dissertation specific
  school?: string; // University name
  degreeType?: string; // "PhD", "Master's"
  
  // Report specific
  institution?: string;
  reportNumber?: string;
  
  // Online/Website specific
  url?: string;
  doi?: string;
  accessed?: string; // "2024-02-03" - for websites
  
  // Additional metadata
  language?: string;
  note?: string; // Additional notes
  tags?: string[]; // User-defined tags for organization
  
  // System metadata
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Inline citation mark attributes
 * Used for mark-based citations in text
 */
export interface CitationMark {
  // Reference ID
  id: string; // Reference to BibliographyEntry.id
  
  // Citation modifiers
  pageNumbers?: string; // "pp. 123-125", "p. 10"
  prefix?: string; // "see", "cf.", "e.g."
  suffix?: string; // "for more details"
  
  // Display options
  suppressAuthor?: boolean; // Show only year: "(2024)" instead of "(Smith, 2024)"
  suppressYear?: boolean; // Rare, but possible
}

/**
 * Citation validation result
 */
export interface CitationValidation {
  valid: boolean;
  citationId: string;
  position: number;
  errors: string[]; // List of validation errors
}

/**
 * Legacy Reference interface (kept for backward compatibility)
 * @deprecated Use BibliographyEntry instead
 */
export interface Reference {
  id: string;
  type: 'book' | 'article' | 'website' | 'other';
  authors: string[];
  title: string;
  year: number;
  source?: string; // Journal, publisher, URL
  doi?: string;
}
