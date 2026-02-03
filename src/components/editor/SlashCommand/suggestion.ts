import { Editor, Range } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import tippy, { Instance as TippyInstance, Props } from "tippy.js";
import CommandList, { CommandListRef } from "./CommandList";

export interface CommandItem {
    title: string;
    description: string;
    icon: string;
    command: (props: { editor: Editor; range: Range }) => void;
    aliases?: string[];
    group: "ai" | "blocks" | "insert";
}

export const getSuggestionItems = ({ query }: { query: string }): CommandItem[] => {
    const items: CommandItem[] = [
        // 🤖 AI Magic
        {
            title: "AI Write",
            description: "Ask AI to write anything",
            icon: "✨",
            group: "ai",
            aliases: ["ai", "write", "generate"],
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).run();
                // Trigger AI write modal/inline
                const event = new CustomEvent("slash-ai-write", { detail: { editor } });
                window.dispatchEvent(event);
            },
        },
        {
            title: "Summarize",
            description: "Summarize text above",
            icon: "📝",
            group: "ai",
            aliases: ["summary", "tóm tắt", "tomtat"],
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).run();
                const event = new CustomEvent("slash-ai-summary", { detail: { editor } });
                window.dispatchEvent(event);
            },
        },
        {
            title: "Fix Grammar",
            description: "Fix grammar of paragraph above",
            icon: "🔧",
            group: "ai",
            aliases: ["fix", "grammar", "sửa lỗi", "sualoi"],
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).run();
                const event = new CustomEvent("slash-ai-fix", { detail: { editor } });
                window.dispatchEvent(event);
            },
        },
        {
            title: "Translate",
            description: "Translate block to another language",
            icon: "🌐",
            group: "ai",
            aliases: ["trans", "translate", "dịch", "dich"],
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).run();
                const event = new CustomEvent("slash-ai-translate", { detail: { editor } });
                window.dispatchEvent(event);
            },
        },

        // 📝 Basic Blocks
        {
            title: "Heading 1",
            description: "Large section heading",
            icon: "H1",
            group: "blocks",
            aliases: ["h1", "heading1", "title"],
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run();
            },
        },
        {
            title: "Heading 2",
            description: "Medium section heading",
            icon: "H2",
            group: "blocks",
            aliases: ["h2", "heading2", "subtitle"],
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run();
            },
        },
        {
            title: "Heading 3",
            description: "Small section heading",
            icon: "H3",
            group: "blocks",
            aliases: ["h3", "heading3"],
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run();
            },
        },
        {
            title: "Bullet List",
            description: "Create a bullet list",
            icon: "•",
            group: "blocks",
            aliases: ["list", "bullet", "ul", "danh sách"],
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleBulletList().run();
            },
        },
        {
            title: "Numbered List",
            description: "Create a numbered list",
            icon: "1.",
            group: "blocks",
            aliases: ["ol", "numbered", "ordered"],
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleOrderedList().run();
            },
        },
        {
            title: "Quote",
            description: "Create a blockquote",
            icon: "❝",
            group: "blocks",
            aliases: ["quote", "blockquote", "trích dẫn"],
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleBlockquote().run();
            },
        },
        {
            title: "Code Block",
            description: "Insert a code block",
            icon: "</>",
            group: "blocks",
            aliases: ["code", "codeblock", "pre"],
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
            },
        },

        // 🧱 Insert
        {
            title: "Table",
            description: "Insert a 3x3 table",
            icon: "📊",
            group: "insert",
            aliases: ["table", "bảng", "bang"],
            command: ({ editor, range }) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                    .run();
            },
        },
        {
            title: "Callout Info",
            description: "Insert info callout box",
            icon: "💡",
            group: "insert",
            aliases: ["callout", "info", "note", "tip"],
            command: ({ editor, range }) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .insertContent({
                        type: "callout",
                        attrs: { type: "info" },
                        content: [{ type: "paragraph", content: [{ type: "text", text: "Info: " }] }],
                    })
                    .run();
            },
        },
        {
            title: "Callout Warning",
            description: "Insert warning callout box",
            icon: "⚠️",
            group: "insert",
            aliases: ["warning", "caution", "cảnh báo"],
            command: ({ editor, range }) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .insertContent({
                        type: "callout",
                        attrs: { type: "warning" },
                        content: [{ type: "paragraph", content: [{ type: "text", text: "Warning: " }] }],
                    })
                    .run();
            },
        },
        {
            title: "Divider",
            description: "Insert horizontal rule",
            icon: "—",
            group: "insert",
            aliases: ["rule", "hr", "divider", "line"],
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setHorizontalRule().run();
            },
        },
        {
            title: "Unsplash Image",
            description: "Search & insert free images",
            icon: "🖼️",
            group: "insert",
            aliases: ["image", "photo", "unsplash", "picture", "ảnh", "hình"],
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).run();
                // Trigger Unsplash modal
                const event = new CustomEvent("slash-unsplash-image", { detail: { editor } });
                window.dispatchEvent(event);
            },
        },
        {
            title: "Table of Contents",
            description: "Insert auto-generated TOC",
            icon: "📑",
            group: "insert",
            aliases: ["toc", "contents", "mục lục", "mucluc"],
            command: ({ editor, range }) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .insertTOC()
                    .run();
            },
        },
        {
            title: "List of Figures",
            description: "Insert list of all figures",
            icon: "🖼️",
            group: "insert",
            aliases: ["lof", "figures", "danh sách hình"],
            command: ({ editor, range }) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .insertLOF()
                    .run();
            },
        },
        {
            title: "List of Tables",
            description: "Insert list of all tables",
            icon: "📊",
            group: "insert",
            aliases: ["lot", "tables", "danh sách bảng"],
            command: ({ editor, range }) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .insertLOT()
                    .run();
            },
        },
        {
            title: "Citation",
            description: "Insert citation reference",
            icon: "📝",
            group: "insert",
            aliases: ["cite", "reference", "trích dẫn"],
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).run();
                // Trigger Citation modal
                const event = new CustomEvent("slash-citation", { detail: { editor } });
                window.dispatchEvent(event);
            },
        },
        {
            title: "Bibliography",
            description: "Insert bibliography/references list",
            icon: "📚",
            group: "insert",
            aliases: ["references", "works cited", "tài liệu tham khảo"],
            command: ({ editor, range }) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .insertBibliography()
                    .run();
            },
        },
    ];

    // Filter by query
    const lowerQuery = query.toLowerCase();
    return items.filter((item) => {
        const matchTitle = item.title.toLowerCase().includes(lowerQuery);
        const matchAliases = item.aliases?.some((alias) => alias.toLowerCase().includes(lowerQuery));
        return matchTitle || matchAliases;
    });
};

export const renderSuggestion = () => {
    let component: ReactRenderer<CommandListRef> | null = null;
    let popup: TippyInstance<Props>[] | null = null;

    return {
        onStart: (props: { editor: Editor; clientRect: (() => DOMRect | null) | null }) => {
            component = new ReactRenderer(CommandList, {
                props,
                editor: props.editor,
            });

            if (!props.clientRect) return;

            const clientRect = props.clientRect;

            popup = tippy("body", {
                getReferenceClientRect: () => clientRect() || new DOMRect(),
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
                arrow: false,
                offset: [0, 8],
                zIndex: 50,
                popperOptions: {
                    modifiers: [
                        {
                            name: "flip",
                            options: {
                                fallbackPlacements: ["top-start"],
                            },
                        },
                    ],
                },
            });
        },

        onUpdate: (props: { editor: Editor; clientRect: (() => DOMRect | null) | null }) => {
            component?.updateProps(props);

            if (!props.clientRect) return;

            const clientRect = props.clientRect;

            popup?.[0]?.setProps({
                getReferenceClientRect: () => clientRect() || new DOMRect(),
            });
        },

        onKeyDown: (props: { event: KeyboardEvent }) => {
            if (props.event.key === "Escape") {
                popup?.[0]?.hide();
                return true;
            }

            return component?.ref?.onKeyDown(props) ?? false;
        },

        onExit: () => {
            popup?.[0]?.destroy();
            component?.destroy();
        },
    };
};
