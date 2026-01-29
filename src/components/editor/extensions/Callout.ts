import { Node, mergeAttributes } from "@tiptap/core";

export interface CalloutOptions {
    HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        callout: {
            setCallout: (attributes?: { type?: string }) => ReturnType;
            toggleCallout: (attributes?: { type?: string }) => ReturnType;
        };
    }
}

export const Callout = Node.create<CalloutOptions>({
    name: "callout",

    addOptions() {
        return {
            HTMLAttributes: {},
        };
    },

    group: "block",

    content: "block+",

    defining: true,

    addAttributes() {
        return {
            type: {
                default: "info",
                parseHTML: (element) => element.getAttribute("data-callout-type") || "info",
                renderHTML: (attributes) => ({
                    "data-callout-type": attributes.type,
                }),
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-callout-type]',
            },
            {
                tag: 'div.callout',
            },
        ];
    },

    renderHTML({ node, HTMLAttributes }) {
        const type = node.attrs.type || "info";
        const icons: Record<string, string> = {
            info: "💡",
            warning: "⚠️",
            success: "✅",
            note: "📝",
        };

        return [
            "div",
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
                class: `callout callout-${type}`,
                "data-callout-type": type,
            }),
            [
                "span",
                { class: "callout-icon", contenteditable: "false" },
                icons[type] || icons.info,
            ],
            ["div", { class: "callout-content" }, 0],
        ];
    },

    addCommands() {
        return {
            setCallout:
                (attributes) =>
                ({ commands }) => {
                    return commands.wrapIn(this.name, attributes);
                },
            toggleCallout:
                (attributes) =>
                ({ commands }) => {
                    return commands.toggleWrap(this.name, attributes);
                },
        };
    },

    addKeyboardShortcuts() {
        return {
            "Mod-Shift-c": () => this.editor.commands.toggleCallout(),
        };
    },
});

export default Callout;
