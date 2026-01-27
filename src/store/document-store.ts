import { create } from "zustand";

// Debounce helper for syncBlocksToHtml
let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;
const SYNC_DEBOUNCE_MS = 150;

export interface DocumentBlock {
  id: string;
  type: "heading1" | "heading2" | "heading3" | "paragraph" | "list" | "quote" | "code_block" | "table" | "divider" | "callout";
  content: string;
  meta?: {
    listStyle?: "bullet" | "numbered";
    items?: string[];
    language?: string;
    calloutStyle?: "info" | "warning" | "success" | "note";
    author?: string;
    headers?: string[];
    rows?: string[][];
    caption?: string;
    customStyle?: {
      color?: string;
      fontSize?: number;
      textAlign?: "left" | "center" | "right" | "justify";
      fontWeight?: string;
      fontStyle?: string;
    };
  };
}

export interface DocumentState {
  title: string;
  subtitle: string;
  author: string;
  date: string;
  blocks: DocumentBlock[];
  selectedStyle: "professional" | "academic" | "modern" | "minimal";
  outputFormat: "docx" | "pdf";
  isProcessing: boolean;
  rawContent: string;
  // HTML content for Tiptap WYSIWYG editor
  htmlContent: string;
  // Editor mode toggle
  editorMode: "blocks" | "wysiwyg";
  // Sync tracking: version increments when blocks change
  blocksVersion: number;
  // Tracks if WYSIWYG has unsaved changes that would be lost on sync
  isHtmlDirty: boolean;
  // Last synced version - compare with blocksVersion to detect if sync needed
  lastSyncedVersion: number;

  setTitle: (title: string) => void;
  setSubtitle: (subtitle: string) => void;
  setAuthor: (author: string) => void;
  setDate: (date: string) => void;
  setBlocks: (blocks: DocumentBlock[]) => void;
  addBlock: (block: DocumentBlock, index?: number) => void;
  updateBlock: (id: string, updates: Partial<DocumentBlock>) => void;
  removeBlock: (id: string) => void;
  moveBlock: (fromIndex: number, toIndex: number) => void;
  setSelectedStyle: (style: DocumentState["selectedStyle"]) => void;
  setOutputFormat: (format: DocumentState["outputFormat"]) => void;
  setIsProcessing: (processing: boolean) => void;
  setRawContent: (content: string) => void;
  // HTML content setter for WYSIWYG
  setHtmlContent: (content: string, markDirty?: boolean) => void;
  setEditorMode: (mode: DocumentState["editorMode"]) => void;
  // Sync blocks to HTML (one-way sync)
  syncBlocksToHtml: () => void;
  // Debounced sync for performance (use during rapid edits)
  debouncedSyncBlocksToHtml: () => void;
  // Mark HTML as dirty (user edited in WYSIWYG)
  markHtmlDirty: () => void;
  // Clear dirty flag after acknowledging
  clearHtmlDirty: () => void;
  reset: () => void;
}

// Helper: Escape HTML entities to prevent XSS
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Helper: Convert blocks to HTML with data-block-id for scroll sync
// Content is escaped to prevent XSS attacks
function blocksToHtml(blocks: DocumentBlock[]): string {
  return blocks.map(block => {
    const id = block.id;
    const content = escapeHtml(block.content || '');
    switch (block.type) {
      case 'heading1':
        return `<h1 data-block-id="${id}">${content}</h1>`;
      case 'heading2':
        return `<h2 data-block-id="${id}">${content}</h2>`;
      case 'heading3':
        return `<h3 data-block-id="${id}">${content}</h3>`;
      case 'paragraph':
        return `<p data-block-id="${id}">${content}</p>`;
      case 'list':
        const items = (block.meta?.items || []).map(item => `<li>${escapeHtml(item)}</li>`).join('');
        if (block.meta?.listStyle === 'numbered') {
          return `<ol data-block-id="${id}">${items}</ol>`;
        }
        return `<ul data-block-id="${id}">${items}</ul>`;
      case 'quote':
        return `<blockquote data-block-id="${id}">${content}</blockquote>`;
      case 'code_block':
        return `<pre data-block-id="${id}"><code>${content}</code></pre>`;
      case 'divider':
        return `<hr data-block-id="${id}" />`;
      case 'callout':
        const calloutStyle = escapeHtml(block.meta?.calloutStyle || 'info');
        return `<div data-block-id="${id}" class="callout callout-${calloutStyle}">${content}</div>`;
      case 'table':
        const headers = (block.meta?.headers || []).map(h => `<th>${escapeHtml(h)}</th>`).join('');
        const rows = (block.meta?.rows || []).map(row => 
          `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`
        ).join('');
        return `<table data-block-id="${id}"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
      default:
        return `<p data-block-id="${id}">${content}</p>`;
    }
  }).join('\n');
}

const initialState = {
  title: "",
  subtitle: "",
  author: "",
  date: "",
  blocks: [] as DocumentBlock[],
  selectedStyle: "professional" as const,
  outputFormat: "docx" as const,
  isProcessing: false,
  rawContent: "",
  htmlContent: "",
  editorMode: "wysiwyg" as const,
  blocksVersion: 0,
  isHtmlDirty: false,
  lastSyncedVersion: 0,
};

export const useDocumentStore = create<DocumentState>((set) => ({
  ...initialState,

  setTitle: (title) => set({ title }),
  setSubtitle: (subtitle) => set({ subtitle }),
  setAuthor: (author) => set({ author }),
  setDate: (date) => set({ date }),
  setBlocks: (blocks) => set((state) => ({
    blocks,
    blocksVersion: state.blocksVersion + 1,
  })),

  addBlock: (block, index) =>
    set((state) => {
      const newBlocks = [...state.blocks];
      if (index !== undefined) {
        newBlocks.splice(index, 0, block);
      } else {
        newBlocks.push(block);
      }
      return { blocks: newBlocks, blocksVersion: state.blocksVersion + 1 };
    }),

  updateBlock: (id, updates) =>
    set((state) => ({
      blocks: state.blocks.map((block) =>
        block.id === id ? { ...block, ...updates } : block
      ),
      blocksVersion: state.blocksVersion + 1,
    })),

  removeBlock: (id) =>
    set((state) => ({
      blocks: state.blocks.filter((block) => block.id !== id),
      blocksVersion: state.blocksVersion + 1,
    })),

  moveBlock: (fromIndex, toIndex) =>
    set((state) => {
      const newBlocks = [...state.blocks];
      const [removed] = newBlocks.splice(fromIndex, 1);
      newBlocks.splice(toIndex, 0, removed);
      return { blocks: newBlocks, blocksVersion: state.blocksVersion + 1 };
    }),

  setSelectedStyle: (selectedStyle) => set({ selectedStyle }),
  setOutputFormat: (outputFormat) => set({ outputFormat }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setRawContent: (rawContent) => set({ rawContent }),
  setHtmlContent: (htmlContent, markDirty = false) => set((state) => ({
    htmlContent,
    isHtmlDirty: markDirty ? true : state.isHtmlDirty,
  })),
  setEditorMode: (editorMode) => set({ editorMode }),

  // One-way sync: blocks -> htmlContent (immediate)
  syncBlocksToHtml: () => set((state) => {
    const html = blocksToHtml(state.blocks);
    return {
      htmlContent: html,
      lastSyncedVersion: state.blocksVersion,
      isHtmlDirty: false,
    };
  }),

  // Debounced sync: prevents excessive updates during rapid block changes
  debouncedSyncBlocksToHtml: () => {
    if (syncDebounceTimer) {
      clearTimeout(syncDebounceTimer);
    }
    syncDebounceTimer = setTimeout(() => {
      useDocumentStore.getState().syncBlocksToHtml();
      syncDebounceTimer = null;
    }, SYNC_DEBOUNCE_MS);
  },

  markHtmlDirty: () => set({ isHtmlDirty: true }),
  clearHtmlDirty: () => set({ isHtmlDirty: false }),

  reset: () => set(initialState),
}));
