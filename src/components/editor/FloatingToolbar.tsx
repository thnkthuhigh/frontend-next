"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Editor } from "@tiptap/react";
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Sparkles,
    ChevronDown,
    Loader2,
    Wand2,
    MessageSquare,
    Scissors,
    BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { aiRewrite, aiExpand, aiFixGrammar } from "@/lib/api";

interface FloatingToolbarProps {
    editor: Editor | null;
}

interface AIAction {
    id: string;
    label: string;
    icon: React.ReactNode;
    action: (text: string) => Promise<string>;
}

const AI_ACTIONS: AIAction[] = [
    {
        id: "rewrite",
        label: "Rewrite",
        icon: <Wand2 size={14} />,
        action: (text) => aiRewrite(text, "professional"),
    },
    {
        id: "shorter",
        label: "Make Shorter",
        icon: <Scissors size={14} />,
        action: (text) => aiRewrite(text, "concise"),
    },
    {
        id: "expand",
        label: "Expand",
        icon: <BookOpen size={14} />,
        action: (text) => aiExpand(text),
    },
    {
        id: "grammar",
        label: "Fix Grammar",
        icon: <MessageSquare size={14} />,
        action: (text) => aiFixGrammar(text),
    },
];

export function FloatingToolbar({ editor }: FloatingToolbarProps) {
    const [showAIMenu, setShowAIMenu] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingAction, setProcessingAction] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const toolbarRef = useRef<HTMLDivElement>(null);

    // Update toolbar position based on selection
    useEffect(() => {
        if (!editor) return;

        const updatePosition = () => {
            const { from, to } = editor.state.selection;
            const hasSelection = from !== to && !editor.state.selection.empty;
            const isInCodeBlock = editor.isActive("codeBlock");

            if (!hasSelection || isInCodeBlock) {
                setIsVisible(false);
                setShowAIMenu(false);
                return;
            }

            // Get selection coordinates
            const { view } = editor;
            const start = view.coordsAtPos(from);
            const end = view.coordsAtPos(to);

            // Position toolbar above the selection
            const toolbarHeight = 44;
            const toolbarWidth = toolbarRef.current?.offsetWidth || 280;

            // Calculate center of selection
            const selectionCenterX = (start.left + end.right) / 2;

            // Get editor container bounds
            const editorElement = view.dom.closest('.editor-content-wrapper');
            const editorRect = editorElement?.getBoundingClientRect() || { left: 0, right: window.innerWidth };

            // Calculate left position, keeping toolbar within bounds
            let left = selectionCenterX - toolbarWidth / 2;
            left = Math.max(editorRect.left + 8, Math.min(left, editorRect.right - toolbarWidth - 8));

            // Position above the selection
            const top = start.top - toolbarHeight - 8;

            setPosition({ top, left });
            setIsVisible(true);
        };

        // Listen to selection changes
        editor.on("selectionUpdate", updatePosition);
        editor.on("blur", () => {
            // Delay hiding to allow clicking toolbar buttons
            setTimeout(() => {
                if (!toolbarRef.current?.contains(document.activeElement)) {
                    setIsVisible(false);
                    setShowAIMenu(false);
                }
            }, 150);
        });

        return () => {
            editor.off("selectionUpdate", updatePosition);
        };
    }, [editor]);

    const handleAIAction = useCallback(async (action: AIAction) => {
        if (!editor) return;

        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to, " ");

        if (!selectedText.trim()) return;

        setIsProcessing(true);
        setProcessingAction(action.id);
        setShowAIMenu(false);

        try {
            const result = await action.action(selectedText);

            // Replace selected text with AI result
            editor
                .chain()
                .focus()
                .deleteSelection()
                .insertContent(result)
                .run();
        } catch (error) {
            console.error("AI action failed:", error);
        } finally {
            setIsProcessing(false);
            setProcessingAction(null);
            setIsVisible(false);
        }
    }, [editor]);

    // Prevent toolbar clicks from losing selection
    const handleToolbarMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
    };

    if (!editor || !isVisible) return null;

    const ToolbarButton = ({
        onClick,
        isActive,
        disabled,
        children,
        title
    }: {
        onClick: () => void;
        isActive?: boolean;
        disabled?: boolean;
        children: React.ReactNode;
        title?: string;
    }) => (
        <button
            onMouseDown={handleToolbarMouseDown}
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={cn(
                "p-2 rounded-lg transition-all duration-150",
                isActive
                    ? "bg-primary/20 text-foreground"
                    : "text-foreground/70 hover:text-foreground hover:bg-muted",
                disabled && "opacity-40 cursor-not-allowed"
            )}
        >
            {children}
        </button>
    );

    return (
        <div
            ref={toolbarRef}
            onMouseDown={handleToolbarMouseDown}
            className="fixed z-40 flex items-center gap-0.5 px-1.5 py-1 rounded-full bg-popover dark:bg-[#1a1d24]/95 backdrop-blur-xl border border-border animate-in fade-in slide-in-from-bottom-2 duration-150"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.05)',
            }}
        >
            {/* Formatting buttons */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive("bold")}
                title="Bold (Ctrl+B)"
            >
                <Bold size={16} />
            </ToolbarButton>

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive("italic")}
                title="Italic (Ctrl+I)"
            >
                <Italic size={16} />
            </ToolbarButton>

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                isActive={editor.isActive("underline")}
                title="Underline (Ctrl+U)"
            >
                <Underline size={16} />
            </ToolbarButton>

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                isActive={editor.isActive("strike")}
                title="Strikethrough"
            >
                <Strikethrough size={16} />
            </ToolbarButton>

            {/* Divider */}
            <div className="w-px h-5 bg-white/20 mx-1" />

            {/* AI Magic Button */}
            <div className="relative">
                <button
                    onMouseDown={handleToolbarMouseDown}
                    onClick={() => setShowAIMenu(!showAIMenu)}
                    disabled={isProcessing}
                    className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all duration-150",
                        showAIMenu
                            ? "bg-gradient-to-r from-violet-500/30 to-purple-500/30 text-purple-300"
                            : "text-purple-300/80 hover:text-purple-300 hover:bg-purple-500/20",
                        isProcessing && "opacity-60"
                    )}
                    title="AI Edit"
                >
                    {isProcessing ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <Sparkles size={16} />
                    )}
                    <span className="text-xs font-medium">AI</span>
                    <ChevronDown
                        size={12}
                        className={cn(
                            "transition-transform duration-200",
                            showAIMenu && "rotate-180"
                        )}
                    />
                </button>

                {/* AI Actions Dropdown */}
                {showAIMenu && (
                    <div
                        className="absolute top-full left-0 mt-2 w-40 py-1 rounded-xl bg-[#1a1d24]/95 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/30 z-50"
                    >
                        {AI_ACTIONS.map((action) => (
                            <button
                                key={action.id}
                                onMouseDown={handleToolbarMouseDown}
                                onClick={() => handleAIAction(action)}
                                disabled={isProcessing}
                                className={cn(
                                    "w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                                    processingAction === action.id
                                        ? "bg-purple-500/20 text-purple-300"
                                        : "text-foreground/70 hover:text-foreground hover:bg-muted"
                                )}
                            >
                                {processingAction === action.id ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    action.icon
                                )}
                                <span>{action.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default FloatingToolbar;
