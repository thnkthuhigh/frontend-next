/**
 * Table of Contents Tiptap Extension (SPRINT 2)
 * 
 * Features:
 * - Auto-generates TOC from document headings
 * - Shows numbered headings with clickable links
 * - Updates dynamically when content changes
 * - Supports page numbers (for print/PDF)
 * - Customizable depth (H1, H2, H3)
 */

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { TOCComponent } from './TableOfContentsView';

export interface TOCOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    tableOfContents: {
      /**
       * Insert a Table of Contents block
       */
      insertTOC: () => ReturnType;
      /**
       * Update TOC content
       */
      updateTOC: () => ReturnType;
    };
  }
}

export const TableOfContentsExtension = Node.create<TOCOptions>({
  name: 'tableOfContents',

  group: 'block',

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      title: {
        default: 'Table of Contents',
        parseHTML: element => element.getAttribute('data-title'),
        renderHTML: attributes => ({
          'data-title': attributes.title,
        }),
      },
      depth: {
        default: 3, // Show H1, H2, H3
        parseHTML: element => {
          const depth = element.getAttribute('data-depth');
          return depth ? parseInt(depth, 10) : 3;
        },
        renderHTML: attributes => ({
          'data-depth': attributes.depth,
        }),
      },
      includeNumbers: {
        default: true,
        parseHTML: element => element.getAttribute('data-include-numbers') === 'true',
        renderHTML: attributes => ({
          'data-include-numbers': attributes.includeNumbers,
        }),
      },
      autoUpdate: {
        default: true,
        parseHTML: element => element.getAttribute('data-auto-update') === 'true',
        renderHTML: attributes => ({
          'data-auto-update': attributes.autoUpdate,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="table-of-contents"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'table-of-contents' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TOCComponent);
  },

  addCommands() {
    return {
      insertTOC:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              title: 'Table of Contents',
              depth: 3,
              includeNumbers: true,
              autoUpdate: true,
            },
          });
        },
      updateTOC:
        () =>
        ({ editor }) => {
          // Force re-render of all TOC blocks
          const { doc } = editor.state;
          let updated = false;

          doc.descendants((node, pos) => {
            if (node.type.name === 'tableOfContents') {
              // Trigger update by touching the node
              editor.commands.setNodeSelection(pos);
              updated = true;
            }
          });

          return updated;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-t': () => this.editor.commands.insertTOC(),
    };
  },
});
