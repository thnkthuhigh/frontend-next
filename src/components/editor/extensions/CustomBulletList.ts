/**
 * Custom Bullet List Extension for Tiptap
 * Extends the default BulletList with a bulletStyle attribute
 * Allows users to cycle through different bullet markers: disc, circle, square, dash, check, arrow
 */

import { BulletList } from "@tiptap/extension-bullet-list";
import { mergeAttributes } from "@tiptap/core";

// Define available bullet styles
export const BULLET_STYLES = [
  { id: "disc", label: "● Disc", icon: "●" },
  { id: "circle", label: "○ Circle", icon: "○" },
  { id: "square", label: "■ Square", icon: "■" },
  { id: "dash", label: "— Dash", icon: "—" },
  { id: "check", label: "✓ Check", icon: "✓" },
  { id: "arrow", label: "→ Arrow", icon: "→" },
] as const;

export type BulletStyle = (typeof BULLET_STYLES)[number]["id"];

// Declare the module augmentation for TypeScript
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    customBulletList: {
      /**
       * Set the bullet style for the current list
       */
      setBulletStyle: (style: BulletStyle) => ReturnType;
      /**
       * Cycle to the next bullet style
       */
      cycleBulletStyle: () => ReturnType;
    };
  }
}

export const CustomBulletList = BulletList.extend({
  name: "bulletList",

  addAttributes() {
    return {
      ...this.parent?.(),
      bulletStyle: {
        default: "disc",
        parseHTML: (element) => element.getAttribute("data-bullet-style") || "disc",
        renderHTML: (attributes) => ({
          "data-bullet-style": attributes.bulletStyle,
        }),
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    return ["ul", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      ...this.parent?.(),
      
      setBulletStyle:
        (style: BulletStyle) =>
        ({ commands, state }) => {
          const { selection } = state;
          const { $from } = selection;
          
          // Find the bullet list node
          let depth = $from.depth;
          while (depth > 0) {
            const node = $from.node(depth);
            if (node.type.name === "bulletList") {
              const pos = $from.before(depth);
              return commands.updateAttributes("bulletList", { bulletStyle: style });
            }
            depth--;
          }
          
          return false;
        },
        
      cycleBulletStyle:
        () =>
        ({ commands, state }) => {
          const { selection } = state;
          const { $from } = selection;
          
          // Find the bullet list node and its current style
          let depth = $from.depth;
          while (depth > 0) {
            const node = $from.node(depth);
            if (node.type.name === "bulletList") {
              const currentStyle = node.attrs.bulletStyle || "disc";
              const currentIndex = BULLET_STYLES.findIndex((s) => s.id === currentStyle);
              const nextIndex = (currentIndex + 1) % BULLET_STYLES.length;
              const nextStyle = BULLET_STYLES[nextIndex].id;
              
              return commands.updateAttributes("bulletList", { bulletStyle: nextStyle });
            }
            depth--;
          }
          
          return false;
        },
    };
  },
});

export default CustomBulletList;
