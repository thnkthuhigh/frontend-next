/**
 * Bibliography Node Extension (SPRINT 4)
 * 
 * Tiptap Node extension for bibliography/reference list
 * Auto-generates formatted bibliography from citation marks
 * 
 * Features:
 * - Node-based block (like TOC, LOF, LOT)
 * - Stores bibliography entries in node attributes
 * - Auto-updates when citations change
 * - Multiple citation styles (APA, IEEE, Chicago, MLA)
 * - Sorting options
 * - Export functionality
 */

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { BibliographyComponent } from './BibliographyView';
import { BibliographyEntry, CitationStyle } from '@/types/document-structure';

export interface BibliographyOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    bibliography: {
      /**
       * Insert a bibliography block
       */
      insertBibliography: (attrs?: Partial<BibliographyAttributes>) => ReturnType;
      /**
       * Update bibliography entries
       */
      updateBibliographyEntries: (entries: BibliographyEntry[]) => ReturnType;
      /**
       * Update bibliography style
       */
      updateBibliographyStyle: (style: CitationStyle) => ReturnType;
      /**
       * Add entry to bibliography
       */
      addBibliographyEntry: (entry: BibliographyEntry) => ReturnType;
      /**
       * Remove entry from bibliography
       */
      removeBibliographyEntry: (entryId: string) => ReturnType;
      /**
       * Update existing bibliography entry
       */
      updateBibliographyEntry: (entryId: string, updates: Partial<BibliographyEntry>) => ReturnType;
    };
  }
}

export interface BibliographyAttributes {
  title: string;
  style: CitationStyle;
  entries: BibliographyEntry[];
  sortBy: 'author' | 'year' | 'title' | 'citation-order';
  showNumbers: boolean;
}

export const BibliographyExtension = Node.create<BibliographyOptions>({
  name: 'bibliography',

  group: 'block',

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      title: {
        default: 'References',
        parseHTML: element => element.getAttribute('data-title') || 'References',
        renderHTML: attributes => ({
          'data-title': attributes.title,
        }),
      },
      style: {
        default: 'apa' as CitationStyle,
        parseHTML: element => {
          const style = element.getAttribute('data-style');
          return (style as CitationStyle) || 'apa';
        },
        renderHTML: attributes => ({
          'data-style': attributes.style,
        }),
      },
      entries: {
        default: [] as BibliographyEntry[],
        parseHTML: element => {
          const entriesStr = element.getAttribute('data-entries');
          if (entriesStr) {
            try {
              return JSON.parse(entriesStr);
            } catch (e) {
              console.error('Failed to parse bibliography entries:', e);
              return [];
            }
          }
          return [];
        },
        renderHTML: attributes => {
          if (!attributes.entries || attributes.entries.length === 0) {
            return {};
          }
          return {
            'data-entries': JSON.stringify(attributes.entries),
          };
        },
      },
      sortBy: {
        default: 'author' as const,
        parseHTML: element => {
          const sortBy = element.getAttribute('data-sort-by');
          return sortBy || 'author';
        },
        renderHTML: attributes => ({
          'data-sort-by': attributes.sortBy,
        }),
      },
      showNumbers: {
        default: true,
        parseHTML: element => element.getAttribute('data-show-numbers') !== 'false',
        renderHTML: attributes => ({
          'data-show-numbers': attributes.showNumbers ? 'true' : 'false',
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="bibliography"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 
        'data-type': 'bibliography',
        class: 'bibliography-block',
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(BibliographyComponent);
  },

  addCommands() {
    return {
      insertBibliography:
        (attrs?: Partial<BibliographyAttributes>) =>
        ({ commands }) => {
          const defaultAttrs: BibliographyAttributes = {
            title: 'References',
            style: 'apa',
            entries: [],
            sortBy: 'author',
            showNumbers: true,
          };

          return commands.insertContent({
            type: this.name,
            attrs: { ...defaultAttrs, ...attrs },
          });
        },

      updateBibliographyEntries:
        (entries: BibliographyEntry[]) =>
        ({ tr, state, dispatch }) => {
          const { doc } = state;
          let updated = false;

          // Find bibliography node
          doc.descendants((node, pos) => {
            if (node.type.name === this.name) {
              if (dispatch) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  entries,
                });
              }
              updated = true;
              return false; // Stop after first bibliography
            }
          });

          if (updated && dispatch) {
            dispatch(tr);
          }

          return updated;
        },

      updateBibliographyStyle:
        (style: CitationStyle) =>
        ({ tr, state, dispatch }) => {
          const { doc } = state;
          let updated = false;

          doc.descendants((node, pos) => {
            if (node.type.name === this.name) {
              if (dispatch) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  style,
                });
              }
              updated = true;
              return false;
            }
          });

          if (updated && dispatch) {
            dispatch(tr);
          }

          return updated;
        },

      addBibliographyEntry:
        (entry: BibliographyEntry) =>
        ({ tr, state, dispatch }) => {
          const { doc } = state;
          let updated = false;

          doc.descendants((node, pos) => {
            if (node.type.name === this.name) {
              const currentEntries = node.attrs.entries || [];
              
              // Check if entry already exists
              const existingIndex = currentEntries.findIndex(
                (e: BibliographyEntry) => e.id === entry.id
              );

              let newEntries;
              if (existingIndex >= 0) {
                // Update existing entry
                newEntries = [...currentEntries];
                newEntries[existingIndex] = entry;
              } else {
                // Add new entry
                newEntries = [...currentEntries, entry];
              }

              if (dispatch) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  entries: newEntries,
                });
              }
              updated = true;
              return false;
            }
          });

          if (updated && dispatch) {
            dispatch(tr);
          }

          return updated;
        },

      removeBibliographyEntry:
        (entryId: string) =>
        ({ tr, state, dispatch }) => {
          const { doc } = state;
          let updated = false;

          doc.descendants((node, pos) => {
            if (node.type.name === this.name) {
              const currentEntries = node.attrs.entries || [];
              const newEntries = currentEntries.filter(
                (e: BibliographyEntry) => e.id !== entryId
              );

              if (dispatch) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  entries: newEntries,
                });
              }
              updated = true;
              return false;
            }
          });

          if (updated && dispatch) {
            dispatch(tr);
          }

          return updated;
        },

      updateBibliographyEntry:
        (entryId: string, updates: Partial<BibliographyEntry>) =>
        ({ tr, state, dispatch }) => {
          const { doc } = state;
          let updated = false;

          doc.descendants((node, pos) => {
            if (node.type.name === this.name) {
              const currentEntries = node.attrs.entries || [];
              const entryIndex = currentEntries.findIndex(
                (e: BibliographyEntry) => e.id === entryId
              );

              if (entryIndex >= 0) {
                const newEntries = [...currentEntries];
                newEntries[entryIndex] = {
                  ...newEntries[entryIndex],
                  ...updates,
                };

                if (dispatch) {
                  tr.setNodeMarkup(pos, undefined, {
                    ...node.attrs,
                    entries: newEntries,
                  });
                }
                updated = true;
              }
              return false;
            }
          });

          if (updated && dispatch) {
            dispatch(tr);
          }

          return updated;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      // Ctrl/Cmd + Shift + B to insert bibliography
      'Mod-Shift-b': () => this.editor.commands.insertBibliography(),
    };
  },
});

// Helper: Check if document has bibliography
export function hasBibliography(editor: any): boolean {
  const { doc } = editor.state;
  let found = false;

  doc.descendants((node: any) => {
    if (node.type.name === 'bibliography') {
      found = true;
      return false; // Stop searching
    }
  });

  return found;
}

// Helper: Get bibliography entries from document
export function getBibliographyEntries(editor: any): BibliographyEntry[] {
  const { doc } = editor.state;
  let entries: BibliographyEntry[] = [];

  doc.descendants((node: any) => {
    if (node.type.name === 'bibliography') {
      entries = node.attrs.entries || [];
      return false; // Stop after first bibliography
    }
  });

  return entries;
}

// Helper: Get bibliography node attributes
export function getBibliographyAttrs(editor: any): BibliographyAttributes | null {
  const { doc } = editor.state;
  let attrs: BibliographyAttributes | null = null;

  doc.descendants((node: any) => {
    if (node.type.name === 'bibliography') {
      attrs = node.attrs as BibliographyAttributes;
      return false;
    }
  });

  return attrs;
}

// Helper: Find entry by ID
export function findBibliographyEntry(
  editor: any,
  entryId: string
): BibliographyEntry | null {
  const entries = getBibliographyEntries(editor);
  return entries.find(e => e.id === entryId) || null;
}

// Helper: Check if entry exists
export function hasBibliographyEntry(editor: any, entryId: string): boolean {
  return findBibliographyEntry(editor, entryId) !== null;
}
