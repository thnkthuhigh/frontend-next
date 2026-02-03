/**
 * List of Figures (LOF) Extension (SPRINT 3)
 * Auto-generates list of all captioned figures in document
 */

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { LOFComponent } from './ListOfFiguresView';

export interface LOFOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    listOfFigures: {
      /**
       * Insert a List of Figures block
       */
      insertLOF: () => ReturnType;
    };
  }
}

export const ListOfFiguresExtension = Node.create<LOFOptions>({
  name: 'listOfFigures',

  group: 'block',

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      title: {
        default: 'List of Figures',
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
        tag: 'div[data-type="list-of-figures"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'list-of-figures' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LOFComponent);
  },

  addCommands() {
    return {
      insertLOF:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              title: 'List of Figures',
              autoUpdate: true,
            },
          });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-f': () => this.editor.commands.insertLOF(),
    };
  },
});
