import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { getSuggestionItems, renderSuggestion } from "./suggestion";
import type { Editor } from "@tiptap/core";
import type { Range } from "@tiptap/core";

interface SuggestionProps {
    command: (props: { editor: Editor; range: Range }) => void;
}

export const SlashCommand = Extension.create({
    name: "slashCommand",

    addOptions() {
        return {
            suggestion: {
                char: "/",
                command: ({
                    editor,
                    range,
                    props,
                }: {
                    editor: Editor;
                    range: Range;
                    props: SuggestionProps;
                }) => {
                    props.command({ editor, range });
                },
            },
        };
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
                items: getSuggestionItems,
                render: renderSuggestion,
            }),
        ];
    },
});

export default SlashCommand;
