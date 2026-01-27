/**
 * Document Schema Types
 * These types mirror the backend Pydantic models for type consistency.
 * Source of truth: backend/main.py DocumentStructure model
 */

// Matches backend DocumentElement Pydantic model
export interface DocumentElement {
  type: string;
  content?: string | null;
  style?: string | null;
  items?: string[] | null;
  language?: string | null;
  author?: string | null;
  headers?: string[] | null;
  rows?: string[][] | null;
  caption?: string | null;
}

// Matches backend DocumentStructure Pydantic model
export interface DocumentStructure {
  title?: string | null;
  subtitle?: string | null;
  author?: string | null;
  date?: string | null;
  elements: DocumentElement[];
}

// Matches backend FormatRequest Pydantic model
export interface FormatRequest {
  content: string;
  style?: string;
  output_format?: string;
}

// Matches backend AnalyzeRequest Pydantic model
export interface AnalyzeRequest {
  content: string;
}

// Matches backend FormatStructureRequest Pydantic model
export interface FormatStructureRequest {
  structure?: DocumentStructure | null;
  html?: string | null;
  style?: string;
  output_format?: string;
}

// API Response types
export interface AnalyzeResponse extends DocumentStructure {}

export interface StyleOption {
  id: string;
  name: string;
  description: string;
}

export interface StylesResponse {
  styles: StyleOption[];
}

// Frontend-specific types (extend backend types)
export type BlockType = 
  | 'heading1' 
  | 'heading2' 
  | 'heading3' 
  | 'paragraph' 
  | 'list' 
  | 'quote' 
  | 'code_block' 
  | 'table' 
  | 'divider' 
  | 'callout' 
  | 'page_break';

export interface BlockMeta {
  items?: string[];
  listStyle?: 'bullet' | 'numbered';
  language?: string;
  author?: string;
  headers?: string[];
  rows?: string[][];
  caption?: string;
  calloutStyle?: 'info' | 'warning' | 'success' | 'note';
}

export interface DocumentBlock {
  id: string;
  type: BlockType;
  content: string;
  meta?: BlockMeta;
}

// Style types
export type StyleName = 'professional' | 'academic' | 'modern' | 'minimal' | 'vintage';
export type OutputFormat = 'docx' | 'pdf';
export type EditorMode = 'wysiwyg' | 'blocks';
