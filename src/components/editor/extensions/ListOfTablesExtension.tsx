/**
 * List of Tables (LOT) Extension (SPRINT 3)
 * Auto-generates list of all captioned tables in document
 */

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { LOTComponent } from './ListOfTablesView';

export interface LOTOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    listOfTables: {
      /**
       * Insert a List of Tables block
       */
      insertLOT: () => ReturnType;
    };
  }
}

export const ListOfTablesExtension = Node.create<LOTOptions>({
  name: 'listOfTables',

  group: 'block',

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      title: {
        default: 'List of Tables',
        parseHTML: element => element.getAttribute('data-title'),
        renderHTML: attributes => ({
          'data-title': attributes.title,
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
        tag: 'div[data-type="list-of-tables"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'list-of-tables' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LOTComponent);
  },

  addCommands() {
    return {
      insertLOT:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              title: 'List of Tables',
              autoUpdate: true,
            },
          });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-l': () => this.editor.commands.insertLOT(),
    };
  },
});
