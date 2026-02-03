/**
 * Citation Mark Extension (SPRINT 4)
 * 
 * Tiptap Mark extension for inline citations
 * Allows users to cite references within text
 * 
 * Examples:
 * - APA: (Smith, 2024)
 * - IEEE: [1]
 * - Chicago: (Smith 2024)
 * - MLA: (Smith 10)
 * 
 * Features:
 * - Mark-based (inline, like bold/italic)
 * - References bibliography entries by ID
 * - Supports page numbers, prefix, suffix
 * - Style-aware formatting
 * - Click to edit citation details
 */

import { Mark, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { CitationMark } from '@/types/document-structure';

export interface CitationOptions {
  HTMLAttributes: Record<string, any>;
  /**
   * Callback when citation is clicked for editing
   */
  onCitationClick?: (citationId: string, attrs: CitationMark) => void;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    citation: {
      /**
       * Set a citation mark on the selected text
       */
      setCitation: (attrs: CitationMark) => ReturnType;
      /**
       * Toggle citation mark
       */
      toggleCitation: (attrs: CitationMark) => ReturnType;
      /**
       * Remove citation mark
       */
      unsetCitation: () => ReturnType;
      /**
       * Update existing citation attributes
       */
      updateCitation: (attrs: Partial<CitationMark>) => ReturnType;
    };
  }
}

export const CitationExtension = Mark.create<CitationOptions>({
  name: 'citation',

  priority: 1000,

  keepOnSplit: false,

  exitable: true,

  inclusive: false,

  addOptions() {
    return {
      HTMLAttributes: {},
      onCitationClick: undefined,
    };
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-citation-id'),
        renderHTML: attributes => {
          if (!attributes.id) {
            return {};
          }
          return {
            'data-citation-id': attributes.id,
          };
        },
      },
      pageNumbers: {
        default: null,
        parseHTML: element => element.getAttribute('data-page-numbers'),
        renderHTML: attributes => {
          if (!attributes.pageNumbers) {
            return {};
          }
          return {
            'data-page-numbers': attributes.pageNumbers,
          };
        },
      },
      prefix: {
        default: null,
        parseHTML: element => element.getAttribute('data-prefix'),
        renderHTML: attributes => {
          if (!attributes.prefix) {
            return {};
          }
          return {
            'data-prefix': attributes.prefix,
          };
        },
      },
      suffix: {
        default: null,
        parseHTML: element => element.getAttribute('data-suffix'),
        renderHTML: attributes => {
          if (!attributes.suffix) {
            return {};
          }
          return {
            'data-suffix': attributes.suffix,
          };
        },
      },
      suppressAuthor: {
        default: false,
        parseHTML: element => element.getAttribute('data-suppress-author') === 'true',
        renderHTML: attributes => {
          if (!attributes.suppressAuthor) {
            return {};
          }
          return {
            'data-suppress-author': 'true',
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-citation-id]',
        getAttrs: element => {
          const el = element as HTMLElement;
          return {
            id: el.getAttribute('data-citation-id'),
            pageNumbers: el.getAttribute('data-page-numbers'),
            prefix: el.getAttribute('data-prefix'),
            suffix: el.getAttribute('data-suffix'),
            suppressAuthor: el.getAttribute('data-suppress-author') === 'true',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        this.options.HTMLAttributes,
        HTMLAttributes,
        {
          class: 'citation-mark',
          'data-type': 'citation',
        }
      ),
      0,
    ];
  },

  addCommands() {
    return {
      setCitation:
        (attrs: CitationMark) =>
        ({ commands }) => {
          if (!attrs.id) {
            console.warn('Citation ID is required');
            return false;
          }
          return commands.setMark(this.name, attrs);
        },

      toggleCitation:
        (attrs: CitationMark) =>
        ({ commands }) => {
          if (!attrs.id) {
            console.warn('Citation ID is required');
            return false;
          }
          return commands.toggleMark(this.name, attrs);
        },

      unsetCitation:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },

      updateCitation:
        (attrs: Partial<CitationMark>) =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;

          // Find citation mark at cursor
          const citationMark = state.doc.type.schema.marks.citation;
          let foundMark: any = null;
          let foundPos = { from: 0, to: 0 };

          state.doc.nodesBetween(from, to, (node, pos) => {
            const mark = citationMark.isInSet(node.marks);
            if (mark) {
              foundMark = mark;
              foundPos = { from: pos, to: pos + node.nodeSize };
            }
          });

          if (!foundMark) {
            return false;
          }

          // Merge attributes
          const newAttrs = { ...foundMark.attrs, ...attrs } as CitationMark;

          // Remove old mark and add new one with updated attrs
          if (dispatch) {
            tr.removeMark(foundPos.from, foundPos.to, citationMark)
              .addMark(foundPos.from, foundPos.to, citationMark.create(newAttrs));
            dispatch(tr);
          }

          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      // Ctrl/Cmd + Shift + C to insert citation
      'Mod-Shift-c': () => {
        // Open citation dialog
        // This will be handled by the UI component
        return false;
      },
      // Delete key removes citation mark
      'Delete': () => {
        const { state } = this.editor;
        const { selection } = state;
        
        // Check if we're at a citation mark
        const citationMark = state.doc.type.schema.marks.citation;
        const $from = selection.$from;
        const marks = $from.marks();
        
        if (citationMark.isInSet(marks)) {
          return this.editor.commands.unsetCitation();
        }
        
        return false;
      },
    };
  },

  addProseMirrorPlugins() {
    const extensionThis = this;

    return [
      new Plugin({
        key: new PluginKey('citationClick'),
        props: {
          handleClick(view, pos, event) {
            const { doc } = view.state;
            const $pos = doc.resolve(pos);
            const marks = $pos.marks();
            
            const citationMark = marks.find(mark => mark.type.name === 'citation');
            
            if (citationMark && extensionThis.options.onCitationClick) {
              const attrs = citationMark.attrs as CitationMark;
              extensionThis.options.onCitationClick(attrs.id, attrs);
              return true;
            }
            
            return false;
          },
          
          // Add hover effect
          handleDOMEvents: {
            mouseover(view, event) {
              const target = event.target as HTMLElement;
              if (target.classList.contains('citation-mark')) {
                target.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                target.style.cursor = 'pointer';
              }
              return false;
            },
            mouseout(view, event) {
              const target = event.target as HTMLElement;
              if (target.classList.contains('citation-mark')) {
                target.style.backgroundColor = '';
                target.style.cursor = '';
              }
              return false;
            },
          },
        },
      }),
    ];
  },
});

// Helper: Check if current selection has citation mark
export function hasCitationMark(editor: any): boolean {
  return editor.isActive('citation');
}

// Helper: Get citation mark attributes at cursor
export function getCitationAtCursor(editor: any): CitationMark | null {
  const { state } = editor;
  const { selection } = state;
  const { $from } = selection;
  
  const citationMark = state.doc.type.schema.marks.citation;
  const marks = $from.marks();
  const mark = citationMark.isInSet(marks);
  
  return mark ? (mark.attrs as CitationMark) : null;
}

// Helper: Insert citation at cursor
export function insertCitation(
  editor: any,
  attrs: CitationMark,
  text?: string
): boolean {
  if (!attrs.id) {
    console.warn('Citation ID is required');
    return false;
  }

  // If text provided, insert it with citation mark
  if (text) {
    return editor
      .chain()
      .insertContent({
        type: 'text',
        text,
        marks: [
          {
            type: 'citation',
            attrs,
          },
        ],
      })
      .run();
  }

  // Otherwise, apply to selection
  return editor.commands.setCitation(attrs);
}

// Helper: Remove all citations for a specific reference
export function removeCitationsForReference(
  editor: any,
  referenceId: string
): boolean {
  const { state, view } = editor;
  const { doc } = state;
  const { tr } = state;
  const citationMark = state.doc.type.schema.marks.citation;
  
  let changed = false;
  
  doc.descendants((node: any, pos: number) => {
    if (!node.isText) return;
    
    node.marks.forEach((mark: any) => {
      if (mark.type === citationMark && mark.attrs.id === referenceId) {
        tr.removeMark(pos, pos + node.nodeSize, citationMark);
        changed = true;
      }
    });
  });
  
  if (changed) {
    view.dispatch(tr);
    return true;
  }
  
  return false;
}

// Helper: Update all citations for a specific reference
export function updateCitationsForReference(
  editor: any,
  referenceId: string,
  newAttrs: Partial<CitationMark>
): boolean {
  const { state, view } = editor;
  const { doc } = state;
  const { tr } = state;
  const citationMark = state.doc.type.schema.marks.citation;
  
  let changed = false;
  
  doc.descendants((node: any, pos: number) => {
    if (!node.isText) return;
    
    node.marks.forEach((mark: any) => {
      if (mark.type === citationMark && mark.attrs.id === referenceId) {
        const updatedAttrs = { ...mark.attrs, ...newAttrs };
        tr.removeMark(pos, pos + node.nodeSize, citationMark);
        tr.addMark(pos, pos + node.nodeSize, citationMark.create(updatedAttrs));
        changed = true;
      }
    });
  });
  
  if (changed) {
    view.dispatch(tr);
    return true;
  }
  
  return false;
}
