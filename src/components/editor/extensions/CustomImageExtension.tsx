/**
 * Custom Image Extension with React NodeView
 * Features:
 * - Interactive resize handles
 * - Floating toolbar for alignment
 * - High-DPI (Retina) rendering optimization
 * - Caption support
 */

import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { mergeAttributes } from "@tiptap/core";
import { ImageBlock } from "../ImageBlock";

export interface CustomImageOptions {
  inline: boolean;
  allowBase64: boolean;
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    customImage: {
      /**
       * Set image with extended attributes
       */
      setImage: (options: {
        src: string;
        alt?: string;
        title?: string;
        width?: string | number;
        height?: string | number;
        align?: "left" | "center" | "right" | "full";
        naturalWidth?: number;
        naturalHeight?: number;
        caption?: string;
        loading?: boolean;
      }) => ReturnType;

      /**
       * Update image alignment
       */
      setImageAlign: (
        align: "left" | "center" | "right" | "full"
      ) => ReturnType;

      /**
       * Update image width
       */
      setImageWidth: (width: string | number) => ReturnType;

      /**
       * Update image caption
       */
      setImageCaption: (caption: string) => ReturnType;
    };
  }
}

export const CustomImageExtension = Image.extend<CustomImageOptions>({
  name: "image",

  // Make image a block node to prevent merging with text
  group: "block",
  
  // Ensure it's not inline
  inline: false,
  
  // Images should be isolating to prevent content around them from merging
  isolating: true,

  addOptions() {
    return {
      ...this.parent?.(),
      inline: false,
      allowBase64: true,
      HTMLAttributes: {
        class: "editor-image",
      },
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },

      // Display width (CSS pixels) - for layout
      width: {
        default: "100%",
        parseHTML: (element) =>
          element.getAttribute("width") ||
          element.style.width ||
          "100%",
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          return { width: attributes.width };
        },
      },

      // Display height
      height: {
        default: "auto",
        parseHTML: (element) =>
          element.getAttribute("height") ||
          element.style.height ||
          "auto",
        renderHTML: (attributes) => {
          if (!attributes.height || attributes.height === "auto") return {};
          return { height: attributes.height };
        },
      },

      // Alignment: left (float), center, right (float), full (100% width)
      align: {
        default: "center",
        parseHTML: (element) => element.getAttribute("data-align") || "center",
        renderHTML: (attributes) => {
          return { "data-align": attributes.align };
        },
      },

      // Natural dimensions (from original file) - for High-DPI calculations
      naturalWidth: {
        default: 0,
        parseHTML: (element) =>
          parseInt(element.getAttribute("data-natural-width") || "0", 10),
        renderHTML: (attributes) => {
          if (!attributes.naturalWidth) return {};
          return { "data-natural-width": attributes.naturalWidth };
        },
      },

      naturalHeight: {
        default: 0,
        parseHTML: (element) =>
          parseInt(element.getAttribute("data-natural-height") || "0", 10),
        renderHTML: (attributes) => {
          if (!attributes.naturalHeight) return {};
          return { "data-natural-height": attributes.naturalHeight };
        },
      },

      // Caption text
      caption: {
        default: "",
        parseHTML: (element) => {
          const figure = element.closest("figure");
          const figcaption = figure?.querySelector("figcaption");
          return (
            figcaption?.textContent ||
            element.getAttribute("data-caption") ||
            ""
          );
        },
        renderHTML: (attributes) => {
          if (!attributes.caption) return {};
          return { "data-caption": attributes.caption };
        },
      },

      // Loading state (for optimistic UI)
      loading: {
        default: false,
        parseHTML: () => false,
        renderHTML: (attributes) => {
          if (!attributes.loading) return {};
          return { "data-loading": "true" };
        },
      },
    };
  },

  // Use React NodeView for interactive component
  addNodeView() {
    return ReactNodeViewRenderer(ImageBlock);
  },

  // Fallback HTML rendering (for copy/paste, export)
  renderHTML({ HTMLAttributes }) {
    const align = HTMLAttributes["data-align"] || "center";
    const caption = HTMLAttributes["data-caption"] || "";
    const width = HTMLAttributes.width || "100%";

    // Calculate alignment styles
    let containerStyle = "";
    let imgStyle = `max-width: 100%; height: auto;`;

    switch (align) {
      case "left":
        containerStyle =
          "float: left; margin-right: 1rem; margin-bottom: 0.5rem;";
        break;
      case "right":
        containerStyle =
          "float: right; margin-left: 1rem; margin-bottom: 0.5rem;";
        break;
      case "full":
        containerStyle = "width: 100%; margin: 1rem 0;";
        imgStyle = "width: 100%; height: auto;";
        break;
      case "center":
      default:
        containerStyle =
          "display: flex; flex-direction: column; align-items: center; margin: 1rem 0;";
        break;
    }

    const figureAttrs = {
      class: `image-container image-align-${align}`,
      style: containerStyle,
    };

    const imgAttrs = mergeAttributes(this.options.HTMLAttributes, {
      ...HTMLAttributes,
      style: `${imgStyle} width: ${
        typeof width === "number" ? `${width}px` : width
      };`,
    });

    // Remove data attributes from img
    delete imgAttrs["data-align"];
    delete imgAttrs["data-caption"];
    delete imgAttrs["data-loading"];

    if (caption) {
      return [
        "figure",
        figureAttrs,
        ["img", imgAttrs],
        ["figcaption", { class: "image-caption" }, caption],
      ];
    }

    return ["figure", figureAttrs, ["img", imgAttrs]];
  },

  addCommands() {
    return {
      ...this.parent?.(),

      setImageAlign:
        (align) =>
        ({ commands }) => {
          return commands.updateAttributes("image", { align });
        },

      setImageWidth:
        (width) =>
        ({ commands }) => {
          return commands.updateAttributes("image", { width });
        },

      setImageCaption:
        (caption) =>
        ({ commands }) => {
          return commands.updateAttributes("image", { caption });
        },
    };
  },
});

export default CustomImageExtension;
