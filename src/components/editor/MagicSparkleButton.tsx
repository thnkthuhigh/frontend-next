"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Editor } from "@tiptap/react";
import {
    Sparkles,
    Loader2,
    X,
    ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { customPrompt } from "@/lib/api";

interface MagicSparkleButtonProps {
    editor: Editor | null;
}

const QUICK_AI_ACTIONS = [
    { id: "continue", label: "Continue writing...", prompt: "Continue writing this text naturally" },
    { id: "improve", label: "Improve this", prompt: "Improve and enhance this text" },
    { id: "summarize", label: "Summarize", prompt: "Summarize this text concisely" },
];

export function MagicSparkleButton({ editor }: MagicSparkleButtonProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [isVisible, setIsVisible] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Position FAB near the current cursor/paragraph
    useEffect(() => {
        if (!editor) return;

        const updatePosition = () => {
            const { from } = editor.state.selection;
            const { view } = editor;
            
            // Check if we're in a code block - hide if so
            if (editor.isActive("codeBlock")) {
                setIsVisible(false);
                return;
            }

            // Get current position
            const coords = view.coordsAtPos(from);
            
            // Get editor container bounds
            const editorElement = view.dom.closest('.editor-content-wrapper');
            if (!editorElement) return;
            
            const editorRect = editorElement.getBoundingClientRect();

            // Position to the right of the content area
            const left = editorRect.right + 16;
            const top = coords.top - 20;

            // Only show if within reasonable bounds
            if (top > editorRect.top - 50 && top < editorRect.bottom + 50) {
                setPosition({ top, left: Math.min(left, window.innerWidth - 200) });
                setIsVisible(true);
            }
        };

        // Update on cursor move
        editor.on("selectionUpdate", updatePosition);
        editor.on("focus", updatePosition);

        // Initial position
        updatePosition();

        return () => {
            editor.off("selectionUpdate", updatePosition);
            editor.off("focus", updatePosition);
        };
    }, [editor]);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsExpanded(false);
            }
        };

        if (isExpanded) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isExpanded]);

    // Focus input when expanded
    useEffect(() => {
        if (isExpanded && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isExpanded]);

    const handleAIAction = useCallback(async (prompt: string) => {
        if (!editor || !prompt.trim()) return;

        setIsProcessing(true);

        try {
            // Get current paragraph or selected text
            const { from, to } = editor.state.selection;
            const isEmpty = from === to;
            
            let textToProcess: string;
            let insertAt: number;
            
            if (isEmpty) {
                // Get current paragraph
                const $pos = editor.state.doc.resolve(from);
                const start = $pos.start();
                const end = $pos.end();
                textToProcess = editor.state.doc.textBetween(start, end, " ");
                insertAt = end;
            } else {
                // Use selected text
                textToProcess = editor.state.doc.textBetween(from, to, " ");
                insertAt = to;
            }

            // Call AI
            const result = await customPrompt({
                text: textToProcess || "empty paragraph",
                prompt: prompt
            });

            if (result.success && result.result) {
                if (prompt.toLowerCase().includes("continue")) {
                    // Insert after current position
                    editor.chain()
                        .focus()
                        .setTextSelection(insertAt)
                        .insertContent(" " + result.result)
                        .run();
                } else if (isEmpty) {
                    // Replace paragraph
                    const $pos = editor.state.doc.resolve(from);
                    const start = $pos.start();
                    const end = $pos.end();
                    editor.chain()
                        .focus()
                        .setTextSelection({ from: start, to: end })
                        .deleteSelection()
                        .insertContent(result.result)
                        .run();
                } else {
                    // Replace selection
                    editor.chain()
                        .focus()
                        .deleteSelection()
                        .insertContent(result.result)
                        .run();
                }
            }
        } catch (error) {
            console.error("AI action failed:", error);
        } finally {
            setIsProcessing(false);
            setIsExpanded(false);
            setInputValue("");
        }
    }, [editor]);

    const handleSubmit = useCallback(() => {
        if (inputValue.trim()) {
            handleAIAction(inputValue);
        }
    }, [inputValue, handleAIAction]);

    if (!editor || !isVisible) return null;

    return (
        <div
            ref={containerRef}
            className={cn(
                "fixed z-[9998] transition-all duration-300 ease-out",
                isExpanded ? "scale-100" : "scale-100"
            )}
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
            }}
        >
            {isExpanded ? (
                // Expanded Input Panel
                <div className="flex flex-col gap-2 p-3 bg-zinc-900 dark:bg-zinc-800 rounded-2xl border border-white/10 shadow-[0_16px_48px_-8px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-200 w-64">
                    {/* Input */}
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                                if (e.key === "Escape") {
                                    setIsExpanded(false);
                                    setInputValue("");
                                }
                            }}
                            placeholder="Ask AI anything..."
                            disabled={isProcessing}
                            className="w-full px-3 py-2 pr-10 text-sm text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/30 placeholder:text-white/30 transition-all"
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={!inputValue.trim() || isProcessing}
                            className={cn(
                                "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all",
                                inputValue.trim() && !isProcessing
                                    ? "bg-amber-500 text-zinc-900 hover:bg-amber-400"
                                    : "text-white/30"
                            )}
                        >
                            {isProcessing ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <ArrowRight size={14} />
                            )}
                        </button>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-1.5">
                        {QUICK_AI_ACTIONS.map((action) => (
                            <button
                                key={action.id}
                                onClick={() => handleAIAction(action.prompt)}
                                disabled={isProcessing}
                                className="px-2.5 py-1 text-xs bg-white/5 hover:bg-amber-500/20 text-white/60 hover:text-amber-300 rounded-full transition-all duration-200 border border-white/5 hover:border-amber-500/30"
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>

                    {/* Close button */}
                    <button
                        onClick={() => {
                            setIsExpanded(false);
                            setInputValue("");
                        }}
                        className="absolute -top-2 -right-2 p-1 bg-zinc-800 rounded-full text-white/50 hover:text-white hover:bg-zinc-700 transition-all border border-white/10"
                    >
                        <X size={12} />
                    </button>
                </div>
            ) : (
                // Collapsed FAB Button - Amber Accent (Monochrome Design)
                <button
                    onClick={() => setIsExpanded(true)}
                    className={cn(
                        "group flex items-center justify-center w-10 h-10 rounded-full",
                        "bg-amber-500 hover:bg-amber-400",
                        "shadow-lg shadow-amber-500/30",
                        "hover:shadow-xl hover:shadow-amber-500/40 hover:scale-110",
                        "transition-all duration-300 ease-out",
                        "animate-in fade-in zoom-in-50 duration-300"
                    )}
                    title="AI Magic ✨"
                >
                    <Sparkles size={18} className="text-zinc-900 group-hover:animate-pulse" />
                    
                    {/* Subtle glow ring - Amber */}
                    <div className="absolute inset-0 rounded-full bg-amber-500 opacity-50 blur-md -z-10 group-hover:opacity-70 transition-opacity" />
                </button>
            )}
        </div>
    );
}

export default MagicSparkleButton;
