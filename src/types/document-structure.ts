/**
 * Professional Document Structure Types
 * 
 * Supports academic/enterprise documents with Front/Main/Back Matter
 * Used for thesis, research papers, reports, and formal documents
 * 
 * @module document-structure
 */

import { JSONContent } from '@tiptap/core';

/**
 * Document section types
 */
export type DocumentSection = 'front' | 'main' | 'back';

/**
 * Cover page data for formal documents
 */
export interface CoverPageData {
  /** Main document title */
  title: string;
  
  /** Optional subtitle */
  subtitle?: string;
  
  /** Author name(s) */
  author: string;
  
  /** Institution/Organization */
  institution?: string;
  
  /** Document date (ISO format YYYY-MM-DD) */
  date: string;
  
  /** Visual style */
  style: 'simple' | 'formal';
  
  /** Additional metadata */
  metadata?: {
    department?: string;
    supervisor?: string;
    degree?: string;
    [key: string]: any;
  };
}

/**
 * Table of Contents configuration
 */
export interface TOCConfig {
  /** Enable/disable TOC generation */
  enabled: boolean;
  
  /** Heading depth (1 = H1 only, 2 = H1-H2, 3 = H1-H2-H3) */
  depth: 1 | 2 | 3;
  
  /** Custom title (default: "Table of Contents") */
  title?: string;
  
  /** Show page numbers */
  showPageNumbers?: boolean;
}

/**
 * Front Matter section
 * Contains pre-content pages like Abstract, TOC, etc.
 */
export interface FrontMatter {
  /** Cover page data */
  coverPage?: CoverPageData;
  
  /** Abstract section */
  abstract?: JSONContent;
  
  /** Acknowledgments */
  acknowledgment?: JSONContent;
  
  /** Preface */
  preface?: JSONContent;
  
  /** Table of Contents */
  tableOfContents?: TOCConfig;
  
  /** List of Figures */
  listOfFigures?: boolean;
  
  /** List of Tables */
  listOfTables?: boolean;
  
  /** List of Abbreviations */
  abbreviations?: JSONContent;
}

/**
 * Reference/Citation entry
 */
export interface Reference {
  /** Unique identifier */
  id: string;
  
  /** Reference type */
  type: 'book' | 'article' | 'website' | 'conference' | 'thesis' | 'report' | 'other';
  
  /** Author(s) */
  authors: string[];
  
  /** Title */
  title: string;
  
  /** Publication year */
  year: number;
  
  /** Source (journal, publisher, URL) */
  source?: string;
  
  /** Volume/Issue */
  volume?: string;
  issue?: string;
  
  /** Pages */
  pages?: string;
  
  /** DOI */
  doi?: string;
  
  /** ISBN */
  isbn?: string;
  
  /** URL */
  url?: string;
  
  /** Access date (for web sources) */
  accessDate?: string;
  
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Back Matter section
 * Contains post-content pages like References, Appendices
 */
export interface BackMatter {
  /** References/Bibliography */
  references?: Reference[];
  
  /** Appendices */
  appendices?: JSONContent[];
  
  /** Glossary */
  glossary?: JSONContent;
  
  /** Index */
  index?: JSONContent;
}

/**
 * Complete document structure
 */
export interface DocumentStructure {
  /** Front Matter (optional) */
  frontMatter: FrontMatter;
  
  /** Main Content (required) */
  mainContent: JSONContent;
  
  /** Back Matter (optional) */
  backMatter: BackMatter;
  
  /** Section markers for navigation */
  sectionMarkers: {
    /** Block index where Front Matter ends */
    frontMatterEnd?: number;
    
    /** Block index where Back Matter starts */
    backMatterStart?: number;
  };
  
  /** Document version for migration */
  version: number;
}

/**
 * Heading with section context
 */
export interface SectionHeading {
  /** Heading ID */
  id: string;
  
  /** Heading text */
  text: string;
  
  /** Heading level (1-3) */
  level: number;
  
  /** Section type */
  section: DocumentSection;
  
  /** Auto-generated number (e.g., "1.2.3") */
  number?: string;
  
  /** Block index in document */
  index: number;
}

/**
 * Citation style format
 */
export type CitationStyle = 'ieee' | 'apa' | 'mla' | 'chicago';

/**
 * Figure/Table caption data
 */
export interface CaptionData {
  /** Auto-generated number (e.g., "Figure 1", "Table 2") */
  number: number;
  
  /** Caption text */
  text: string;
  
  /** Type */
  type: 'figure' | 'table';
}

/**
 * Document metadata for structured documents
 */
export interface StructuredDocumentMetadata {
  /** Document type */
  documentType: 'thesis' | 'paper' | 'report' | 'proposal' | 'article' | 'book' | 'other';
  
  /** Language */
  language: string;
  
  /** Keywords */
  keywords?: string[];
  
  /** Citation style */
  citationStyle: CitationStyle;
  
  /** Page numbering style */
  pageNumbering: {
    /** Front Matter uses Roman numerals */
    frontMatter: 'roman' | 'none';
    
    /** Main Content uses Arabic numerals */
    mainContent: 'arabic';
    
    /** Back Matter continues from Main */
    backMatter: 'continue' | 'restart';
  };
}

/**
 * Default document structure for new documents
 */
export const DEFAULT_DOCUMENT_STRUCTURE: DocumentStructure = {
  frontMatter: {},
  mainContent: {
    type: 'doc',
    content: [],
  },
  backMatter: {},
  sectionMarkers: {},
  version: 1,
};

/**
 * Default metadata for structured documents
 */
export const DEFAULT_STRUCTURED_METADATA: StructuredDocumentMetadata = {
  documentType: 'other',
  language: 'en',
  citationStyle: 'ieee',
  pageNumbering: {
    frontMatter: 'roman',
    mainContent: 'arabic',
    backMatter: 'continue',
  },
};
