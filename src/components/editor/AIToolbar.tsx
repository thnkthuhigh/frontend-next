"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Editor } from "@tiptap/react";
import {
    Wand2,
    Languages,
    FileText,
    Expand,
    SpellCheck,
    ChevronDown,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
    aiRewrite,
    aiTranslate,
    aiSummarize,
    aiExpand,
    aiFixGrammar,
    RewriteStyle,
    TranslateLanguage,
} from "@/lib/api";

interface AIToolbarProps {
    editor: Editor | null;
}

export function AIToolbar({ editor }: AIToolbarProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
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
                return;
            }

            // Get selection coordinates
            const { view } = editor;
            const start = view.coordsAtPos(from);
            const end = view.coordsAtPos(to);

            // Position toolbar above the selection
            const toolbarHeight = 44;
            const toolbarWidth = toolbarRef.current?.offsetWidth || 320;

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
                }
            }, 150);
        });

        return () => {
            editor.off("selectionUpdate", updatePosition);
        };
    }, [editor]);

    // Early return after all hooks to comply with Rules of Hooks
    if (!editor) return null;

    // Type assertion: editor is guaranteed non-null after this point
    const editorInstance = editor as Editor;

    const getSelectedText = (): string => {
        const { from, to } = editorInstance.state.selection;
        return editorInstance.state.doc.textBetween(from, to, " ");
    };

    // AI Context interface
    interface AIContext {
        format: "list" | "paragraph" | "mixed";
        itemCount?: number;
        hasNested?: boolean;
        structure?: "flat" | "nested";
    }

    // Detect selection context for AI
    const detectSelectionContext = (): AIContext => {
        const { from, to } = editorInstance.state.selection;
        const doc = editorInstance.state.doc;
        
        let format: "list" | "paragraph" | "mixed" = "paragraph";
        let itemCount = 0;
        let hasNested = false;
        let hasListNode = false;
        let hasParagraphNode = false;
        
        // Traverse selected nodes to detect format
        doc.nodesBetween(from, to, (node) => {
            if (node.type.name === 'bulletList' || node.type.name === 'orderedList') {
                hasListNode = true;
                // Count list items
                node.forEach(child => {
                    if (child.type.name === 'listItem') {
                        itemCount++;
                        // Check for nested lists
                        child.forEach(grandchild => {
                            if (grandchild.type.name === 'bulletList' || grandchild.type.name === 'orderedList') {
                                hasNested = true;
                            }
                        });
                    }
                });
            } else if (node.type.name === 'paragraph' && node.textContent.trim()) {
                hasParagraphNode = true;
            }
        });
        
        // Determine format
        if (hasListNode && hasParagraphNode) {
            format = "mixed";
        } else if (hasListNode) {
            format = "list";
        } else {
            format = "paragraph";
        }
        
        return {
            format,
            itemCount: itemCount > 0 ? itemCount : undefined,
            hasNested,
            structure: hasNested ? "nested" : "flat"
        };
    };

    const parseInlineFormatting = (text: string): any[] => {
        const result: any[] = [];
        let currentPos = 0;
        
        // Regex patterns for markdown (order matters!)
        const patterns = [
            { regex: /\*\*\*(.+?)\*\*\*/g, marks: ['bold', 'italic'] },  // ***bold+italic***
            { regex: /\*\*(.+?)\*\*/g, marks: ['bold'] },                 // **bold**
            { regex: /__(.+?)__/g, marks: ['bold'] },                     // __bold__
            { regex: /\*(.+?)\*/g, marks: ['italic'] },                   // *italic*
            { regex: /_(.+?)_/g, marks: ['italic'] },                     // _italic_
            { regex: /`(.+?)`/g, marks: ['code'] },                       // `code`
        ];
        
        // Find all matches
        const allMatches: any[] = [];
        patterns.forEach(({ regex, marks }) => {
            const matches = [...text.matchAll(regex)];
            matches.forEach(match => {
                if (match.index !== undefined) {
                    allMatches.push({
                        start: match.index,
                        end: match.index + match[0].length,
                        text: match[1],
                        marks: marks,
                    });
                }
            });
        });
        
        // Sort by start position
        allMatches.sort((a, b) => a.start - b.start);
        
        // Build result
        allMatches.forEach(match => {
            // Add plain text before match
            if (match.start > currentPos) {
                const plainText = text.substring(currentPos, match.start);
                if (plainText) {
                    result.push({ type: 'text', text: plainText });
                }
            }
            
            // Add formatted text
            result.push({
                type: 'text',
                text: match.text,
                marks: match.marks.map((m: string) => ({ type: m }))
            });
            
            currentPos = match.end;
        });
        
        // Add remaining text
        if (currentPos < text.length) {
            const remainingText = text.substring(currentPos);
            if (remainingText) {
                result.push({ type: 'text', text: remainingText });
            }
        }
        
        // If no formatting found, return plain text
        if (result.length === 0 && text) {
            result.push({ type: 'text', text });
        }
        
        return result;
    };

    const parseMarkdownToTiptap = (text: string): any[] => {
        const lines = text.split('\n');
        const content: any[] = [];
        
        lines.forEach((line) => {
            // Check if line is a list item
            const listMatch = line.match(/^[\-\•\*]\s+(.+)$/);
            if (listMatch) {
                // Parse inline formatting in list item
                const parsedContent = parseInlineFormatting(listMatch[1]);
                content.push({
                    type: 'bulletList',
                    content: [{
                        type: 'listItem',
                        content: [{
                            type: 'paragraph',
                            content: parsedContent
                        }]
                    }]
                });
            } else if (line.trim()) {
                // Regular paragraph with inline formatting
                const parsedContent = parseInlineFormatting(line);
                content.push({
                    type: 'paragraph',
                    content: parsedContent
                });
            }
        });
        
        return content;
    };

    const replaceSelection = (newText: string, preserveFormatting?: { hasBold?: boolean; hasItalic?: boolean; hasCode?: boolean }) => {
        const { from, to } = editorInstance.state.selection;
        
        // Simple approach: Insert as plain text, apply formatting from original selection
        editorInstance.chain().focus().deleteRange({ from, to }).insertContent(newText).run();
        
        // If original selection had formatting, re-apply it
        if (preserveFormatting) {
            const newTo = from + newText.length;
            if (preserveFormatting.hasBold) {
                editorInstance.chain().setTextSelection({ from, to: newTo }).toggleBold().run();
            }
            if (preserveFormatting.hasItalic) {
                editorInstance.chain().setTextSelection({ from, to: newTo }).toggleItalic().run();
            }
            if (preserveFormatting.hasCode) {
                editorInstance.chain().setTextSelection({ from, to: newTo }).toggleCode().run();
            }
        }
    };

    const handleAIAction = async (
        action: (context: AIContext) => Promise<string>,
        actionName: string
    ) => {
        const text = getSelectedText();
        if (!text.trim()) {
            alert("Vui lòng chọn đoạn văn bản để xử lý");
            return;
        }

        const context = detectSelectionContext();
        setIsLoading(true);
        setLoadingAction(actionName);

        try {
            const result = await action(context);
            // Don't preserve formatting - let AI result be clean
            replaceSelection(result);
        } catch (error) {
            console.error(`AI ${actionName} failed:`, error);
            alert(`Lỗi khi ${actionName}. Vui lòng thử lại.`);
        } finally {
            setIsLoading(false);
            setLoadingAction(null);
            setIsVisible(false);
        }
    };

    const rewriteStyles: { label: string; value: RewriteStyle }[] = [
        { label: "Chuyên nghiệp", value: "professional" },
        { label: "Thân thiện", value: "casual" },
        { label: "Trang trọng", value: "formal" },
        { label: "Ngắn gọn", value: "concise" },
        { label: "Chi tiết", value: "detailed" },
    ];

    const languages: { label: string; value: TranslateLanguage }[] = [
        { label: "English", value: "en" },
        { label: "Tiếng Việt", value: "vi" },
        { label: "中文", value: "zh" },
        { label: "日本語", value: "ja" },
        { label: "한국어", value: "ko" },
        { label: "Français", value: "fr" },
        { label: "Deutsch", value: "de" },
        { label: "Español", value: "es" },
    ];

    const hasSelection = getSelectedText().trim().length > 0;

    // Prevent toolbar clicks from losing selection
    const handleToolbarMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
    };

    if (!isVisible) return null;

    return (
        <div
            ref={toolbarRef}
            onMouseDown={handleToolbarMouseDown}
            className="fixed z-[10000] flex items-center gap-1 px-2 py-1 rounded-full bg-popover dark:bg-[#1a1d24]/95 backdrop-blur-xl border border-border animate-in fade-in slide-in-from-bottom-2 duration-150"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.05)',
            }}
        >
            <span className="text-xs font-medium text-muted-foreground mr-2 flex items-center gap-1">
                <Wand2 className="h-3 w-3" />
                AI
            </span>

            {/* Rewrite Dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={isLoading || !hasSelection}
                        className="h-7 text-xs gap-1"
                    >
                        {loadingAction === "rewrite" ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <Wand2 className="h-3 w-3" />
                        )}
                        Viết lại
                        <ChevronDown className="h-3 w-3" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>Phong cách viết lại</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {rewriteStyles.map((style) => (
                        <DropdownMenuItem
                            key={style.value}
                            onClick={() =>
                                handleAIAction(
                                    (context) => aiRewrite(getSelectedText(), style.value, context),
                                    "rewrite"
                                )
                            }
                        >
                            {style.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Translate Dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={isLoading || !hasSelection}
                        className="h-7 text-xs gap-1"
                    >
                        {loadingAction === "translate" ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <Languages className="h-3 w-3" />
                        )}
                        Dịch
                        <ChevronDown className="h-3 w-3" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>Ngôn ngữ đích</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {languages.map((lang) => (
                        <DropdownMenuItem
                            key={lang.value}
                            onClick={() =>
                                handleAIAction(
                                    (context) => aiTranslate(getSelectedText(), lang.value, context),
                                    "translate"
                                )
                            }
                        >
                            {lang.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Summarize */}
            <Button
                variant="ghost"
                size="sm"
                disabled={isLoading || !hasSelection}
                onClick={() =>
                    handleAIAction((context) => aiSummarize(getSelectedText(), context), "summarize")
                }
                className="h-7 text-xs gap-1"
            >
                {loadingAction === "summarize" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                    <FileText className="h-3 w-3" />
                )}
                Tóm tắt
            </Button>

            {/* Expand */}
            <Button
                variant="ghost"
                size="sm"
                disabled={isLoading || !hasSelection}
                onClick={() =>
                    handleAIAction((context) => aiExpand(getSelectedText(), context), "expand")
                }
                className="h-7 text-xs gap-1"
            >
                {loadingAction === "expand" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                    <Expand className="h-3 w-3" />
                )}
                Mở rộng
            </Button>

            {/* Fix Grammar */}
            <Button
                variant="ghost"
                size="sm"
                disabled={isLoading || !hasSelection}
                onClick={() =>
                    handleAIAction((context) => aiFixGrammar(getSelectedText(), context), "fix-grammar")
                }
                className="h-7 text-xs gap-1"
            >
                {loadingAction === "fix-grammar" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                    <SpellCheck className="h-3 w-3" />
                )}
                Sửa lỗi
            </Button>
        </div>
    );
}
