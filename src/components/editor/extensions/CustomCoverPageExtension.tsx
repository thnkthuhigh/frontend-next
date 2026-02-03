import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import CoverPageView from './CoverPageView';

export const CustomCoverPageExtension = Node.create({
  name: 'coverPage',

  group: 'block',

  content: 'block+',

  draggable: false,

  defining: true,

  isolating: true,

  parseHTML() {
    return [{ tag: 'div.cover-page' }];
  },

  renderHTML() {
    return ['div', { class: 'cover-page' }, 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CoverPageView);
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Backspace': () => {
        const { state, dispatch } = this.editor.view;
        const { selection } = state;
        const { $from, $to } = selection;

        // Prevent deletion of cover page block
        if ($from.node(-1).type.name === 'coverPage') {
          return true;
        }
        return false;
      },
    };
  },
});