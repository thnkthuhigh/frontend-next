               import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import FrontMatterView from './FrontMatterView';

export const FrontMatterExtension = Node.create({
  name: 'frontMatter',

  group: 'block',

  content: 'block+',

  draggable: false,

  defining: true,

  isolating: true,

  parseHTML() {
    return [{ tag: 'div.front-matter' }];
  },

  renderHTML() {
    return ['div', { class: 'front-matter' }, 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FrontMatterView);
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Backspace': () => {
        const { state, dispatch } = this.editor.view;
        const { selection } = state;
        const { $from, $to } = selection;

        // Prevent deletion of front matter block
        if ($from.node(-1).type.name === 'frontMatter') {
          return true;
        }
        return false;
      },
    };
  },
});