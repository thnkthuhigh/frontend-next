"use client";

import { useEffect, useState, useCallback } from "react";
import { Editor } from "@tiptap/core";
import { aiRewrite, aiSummarize, aiFixGrammar } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface AICommandHandlerProps {
    editor: Editor | null;
}

export function AICommandHandler({ editor }: AICommandHandlerProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingType, setProcessingType] = useState<string | null>(null);

    // Get context: the paragraph above the cursor
    const getContextAbove = useCallback(() => {
        if (!editor) return "";

        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;

        // Get the position before current cursor
        const pos = $from.pos;

        // Find the previous block
        let text = "";
        let foundBlock = false;

        state.doc.nodesBetween(0, pos, (node, nodePos) => {
            if (foundBlock) return false;

            if (node.isBlock && node.textContent && nodePos < pos - 1) {
                text = node.textContent;
            }
        });

        // If no previous block, try to get text from current block
        if (!text) {
            const currentBlock = $from.parent;
            if (currentBlock && currentBlock.textContent) {
                text = currentBlock.textContent;
            }
        }

        return text.trim();
    }, [editor]);

    // Insert AI response at cursor
    const insertAIResponse = useCallback(
        (response: string) => {
            if (!editor) return;

            editor
                .chain()
                .focus()
                .insertContent([
                    { type: "paragraph", content: [{ type: "text", text: response }] },
                ])
                .run();
        },
        [editor]
    );

    // Handle AI Summary
    const handleSummary = useCallback(async () => {
        const context = getContextAbove();
        if (!context) {
            insertAIResponse("⚠️ No text found above to summarize.");
            return;
        }

        setIsProcessing(true);
        setProcessingType("summary");

        try {
            // Insert placeholder
            editor?.chain().focus().insertContent("✨ AI is thinking...").run();

            const result = await aiSummarize(context);

            // Replace placeholder with result
            editor
                ?.chain()
                .focus()
                .deleteRange({
                    from: editor.state.selection.$anchor.pos - "✨ AI is thinking...".length,
                    to: editor.state.selection.$anchor.pos,
                })
                .insertContent([
                    {
                        type: "callout",
                        attrs: { type: "info" },
                        content: [
                            {
                                type: "paragraph",
                                content: [{ type: "text", text: "📝 Summary: " + result }],
                            },
                        ],
                    },
                ])
                .run();
        } catch (error) {
            console.error("AI Summary failed:", error);
            insertAIResponse("⚠️ Failed to generate summary. Please try again.");
        } finally {
            setIsProcessing(false);
            setProcessingType(null);
        }
    }, [editor, getContextAbove, insertAIResponse]);

    // Handle AI Fix Grammar
    const handleFix = useCallback(async () => {
        const context = getContextAbove();
        if (!context) {
            insertAIResponse("⚠️ No text found above to fix.");
            return;
        }

        setIsProcessing(true);
        setProcessingType("fix");

        try {
            editor?.chain().focus().insertContent("✨ AI is fixing...").run();

            const result = await aiFixGrammar(context);

            // Replace placeholder with result
            editor
                ?.chain()
                .focus()
                .deleteRange({
                    from: editor.state.selection.$anchor.pos - "✨ AI is fixing...".length,
                    to: editor.state.selection.$anchor.pos,
                })
                .insertContent([
                    {
                        type: "paragraph",
                        content: [{ type: "text", text: "✅ Fixed: " + result }],
                    },
                ])
                .run();
        } catch (error) {
            console.error("AI Fix failed:", error);
            insertAIResponse("⚠️ Failed to fix grammar. Please try again.");
        } finally {
            setIsProcessing(false);
            setProcessingType(null);
        }
    }, [editor, getContextAbove, insertAIResponse]);

    // Handle AI Translate (default to English)
    const handleTranslate = useCallback(async () => {
        const context = getContextAbove();
        if (!context) {
            insertAIResponse("⚠️ No text found above to translate.");
            return;
        }

        setIsProcessing(true);
        setProcessingType("translate");

        try {
            editor?.chain().focus().insertContent("✨ AI is translating...").run();

            // Use rewrite with translation style (or could use dedicated translate API)
            const result = await aiRewrite(context, "professional");

            // Replace placeholder with result
            editor
                ?.chain()
                .focus()
                .deleteRange({
                    from: editor.state.selection.$anchor.pos - "✨ AI is translating...".length,
                    to: editor.state.selection.$anchor.pos,
                })
                .insertContent([
                    {
                        type: "paragraph",
                        content: [{ type: "text", text: "🌐 Translation: " + result }],
                    },
                ])
                .run();
        } catch (error) {
            console.error("AI Translate failed:", error);
            insertAIResponse("⚠️ Failed to translate. Please try again.");
        } finally {
            setIsProcessing(false);
            setProcessingType(null);
        }
    }, [editor, getContextAbove, insertAIResponse]);

    // Handle AI Write (placeholder for more complex implementation)
    const handleWrite = useCallback(async () => {
        // For now, just insert a placeholder
        // In a full implementation, this would open a modal for user to enter prompt
        editor
            ?.chain()
            .focus()
            .insertContent([
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "💡 Tip: Select text and use the floating toolbar for AI rewrite, or type your content and use /summary to summarize it.",
                        },
                    ],
                },
            ])
            .run();
    }, [editor]);

    // Listen for custom events from slash commands
    useEffect(() => {
        const onSummary = () => handleSummary();
        const onFix = () => handleFix();
        const onTranslate = () => handleTranslate();
        const onWrite = () => handleWrite();

        window.addEventListener("slash-ai-summary", onSummary);
        window.addEventListener("slash-ai-fix", onFix);
        window.addEventListener("slash-ai-translate", onTranslate);
        window.addEventListener("slash-ai-write", onWrite);

        return () => {
            window.removeEventListener("slash-ai-summary", onSummary);
            window.removeEventListener("slash-ai-fix", onFix);
            window.removeEventListener("slash-ai-translate", onTranslate);
            window.removeEventListener("slash-ai-write", onWrite);
        };
    }, [handleSummary, handleFix, handleTranslate, handleWrite]);

    // Show global loading indicator when processing
    if (isProcessing) {
        return (
            <div className="fixed bottom-20 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a1d24]/95 backdrop-blur-xl border border-white/10 shadow-lg">
                <Loader2 size={16} className="animate-spin text-purple-400" />
                <span className="text-sm text-white/70">
                    {processingType === "summary" && "Summarizing..."}
                    {processingType === "fix" && "Fixing grammar..."}
                    {processingType === "translate" && "Translating..."}
                </span>
            </div>
        );
    }

    return null;
}

export default AICommandHandler;
