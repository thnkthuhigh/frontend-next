"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Editor } from "@tiptap/react";
import {
    Sparkles,
    Loader2,
    Send,
    MessageSquare,
    Wand2,
    Languages,
    FileText,
    Expand,
    SpellCheck,
    ChevronDown,
    ChevronRight,
    X,
    RotateCcw,
    Copy,
    Check,
    Trash2,
    PanelRightClose,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    aiRewrite,
    aiTranslate,
    aiSummarize,
    aiExpand,
    aiFixGrammar,
    customPrompt,
    RewriteStyle,
    TranslateLanguage,
} from "@/lib/api";

interface AISidePanelProps {
    editor: Editor | null;
    isOpen: boolean;
    onClose: () => void;
    isEditorFocused?: boolean; // For Focus Mode - fade panel when typing
}

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    action?: string;
}

// Quick action categories - Vietnamese labels
const AI_ACTIONS = {
    writing: [
        { id: "continue", label: "Viết tiếp", icon: ChevronRight, prompt: "Continue writing this text naturally, maintaining the same tone and style." },
        { id: "improve", label: "Cải thiện văn bản", icon: Wand2, prompt: "Improve and enhance this text while keeping the meaning." },
        { id: "expand", label: "Mở rộng", icon: Expand, prompt: "Expand this text with more details and examples." },
    ],
    transform: [
        { id: "summarize", label: "Tóm tắt", icon: FileText, prompt: "Summarize this text concisely, capturing the key points." },
        { id: "grammar", label: "Sửa ngữ pháp", icon: SpellCheck, prompt: "Fix any grammar and spelling errors in this text." },
    ],
    style: [
        { id: "professional", label: "Chuyên nghiệp", style: "professional" as RewriteStyle },
        { id: "casual", label: "Thân mật", style: "casual" as RewriteStyle },
        { id: "academic", label: "Học thuật", style: "academic" as RewriteStyle },
        { id: "creative", label: "Sáng tạo", style: "creative" as RewriteStyle },
    ],
    translate: [
        { id: "vi", label: "Tiếng Việt", lang: "vi" as TranslateLanguage },
        { id: "en", label: "Tiếng Anh", lang: "en" as TranslateLanguage },
        { id: "fr", label: "Tiếng Pháp", lang: "fr" as TranslateLanguage },
        { id: "ja", label: "Tiếng Nhật", lang: "ja" as TranslateLanguage },
    ],
};

export function AISidePanel({ editor, isOpen, onClose, isEditorFocused = false }: AISidePanelProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [expandedSection, setExpandedSection] = useState<string | null>("writing");
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [hasSelection, setHasSelection] = useState(false);
    // Tab state for horizontal tabs - MUST be at top level with other hooks
    const [activeTab, setActiveTab] = useState<"writing" | "transform" | "style" | "translate">("writing");
    // P1-002: Track which action button is currently processing
    const [processingAction, setProcessingAction] = useState<string | null>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Focus input when panel opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Track selection changes
    useEffect(() => {
        if (!editor) return;

        const updateSelection = () => {
            const { from, to } = editor.state.selection;
            setHasSelection(from !== to);
        };

        updateSelection();
        editor.on('selectionUpdate', updateSelection);

        return () => {
            editor.off('selectionUpdate', updateSelection);
        };
    }, [editor]);

    // Get selected text from editor
    const getSelectedText = useCallback((): string => {
        if (!editor) return "";
        const { from, to } = editor.state.selection;
        if (from === to) {
            // No selection - get current paragraph
            const $pos = editor.state.doc.resolve(from);
            const start = $pos.start();
            const end = $pos.end();
            return editor.state.doc.textBetween(start, end, " ");
        }
        return editor.state.doc.textBetween(from, to, " ");
    }, [editor]);

    // Add message to chat
    const addMessage = useCallback((role: "user" | "assistant", content: string, action?: string) => {
        const newMessage: Message = {
            id: Date.now().toString(),
            role,
            content,
            timestamp: new Date(),
            action,
        };
        setMessages(prev => [...prev, newMessage]);
        return newMessage.id;
    }, []);

    // Apply AI result to editor
    const applyToEditor = useCallback((text: string) => {
        if (!editor) return;

        const { from, to } = editor.state.selection;
        if (from === to) {
            // Insert at cursor
            editor.chain().focus().insertContent(text).run();
        } else {
            // Replace selection
            editor.chain().focus().deleteSelection().insertContent(text).run();
        }
    }, [editor]);

    // Handle custom prompt
    const handleCustomPrompt = useCallback(async (prompt: string) => {
        if (!editor || !prompt.trim()) return;

        const selectedText = getSelectedText();
        addMessage("user", prompt);
        setIsProcessing(true);
        setInputValue("");

        try {
            const result = await customPrompt({
                text: selectedText || "No text selected",
                prompt: prompt,
            });

            if (result.success && result.result) {
                addMessage("assistant", result.result, "custom");
            } else {
                addMessage("assistant", "Sorry, I couldn't process that request. Please try again.");
            }
        } catch (error) {
            console.error("AI error:", error);
            addMessage("assistant", "An error occurred. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    }, [editor, getSelectedText, addMessage]);

    // Handle quick actions - P1-002: Track which specific action is processing
    const handleQuickAction = useCallback(async (actionType: string, actionId: string) => {
        if (!editor) return;

        const selectedText = getSelectedText();
        if (!selectedText.trim()) {
            addMessage("assistant", "Please select some text first, or place your cursor in a paragraph.");
            return;
        }

        setIsProcessing(true);
        setProcessingAction(`${actionType}-${actionId}`); // P1-002: Track specific action

        try {
            let actionLabel = "";
            let resultText = "";

            switch (actionType) {
                case "writing":
                case "transform": {
                    const action = [...AI_ACTIONS.writing, ...AI_ACTIONS.transform].find(a => a.id === actionId);
                    if (action && 'prompt' in action) {
                        actionLabel = action.label;
                        addMessage("user", `${action.label}: "${selectedText.slice(0, 50)}..."`);
                        const response = await customPrompt({ text: selectedText, prompt: action.prompt });
                        if (response.success && response.result) {
                            resultText = response.result;
                        }
                    } else {
                        throw new Error("Invalid action");
                    }
                    break;
                }
                case "style": {
                    const style = AI_ACTIONS.style.find(s => s.id === actionId);
                    if (style) {
                        actionLabel = `Rewrite (${style.label})`;
                        addMessage("user", `Rewrite in ${style.label} style: "${selectedText.slice(0, 50)}..."`);
                        resultText = await aiRewrite(selectedText, style.style);
                    } else {
                        throw new Error("Invalid style");
                    }
                    break;
                }
                case "translate": {
                    const lang = AI_ACTIONS.translate.find(l => l.id === actionId);
                    if (lang) {
                        actionLabel = `Translate to ${lang.label}`;
                        addMessage("user", `Translate to ${lang.label}: "${selectedText.slice(0, 50)}..."`);
                        resultText = await aiTranslate(selectedText, lang.lang);
                    } else {
                        throw new Error("Invalid language");
                    }
                    break;
                }
                default:
                    throw new Error("Unknown action type");
            }

            if (resultText) {
                addMessage("assistant", resultText, actionLabel);
            } else {
                addMessage("assistant", "Sorry, I couldn't process that. Please try again.");
            }
        } catch (error) {
            console.error("AI action error:", error);
            addMessage("assistant", "An error occurred. Please try again.");
        } finally {
            setIsProcessing(false);
            setProcessingAction(null); // P1-002: Clear processing action
        }
    }, [editor, getSelectedText, addMessage]);

    // Copy message to clipboard
    const handleCopy = useCallback((id: string, content: string) => {
        navigator.clipboard.writeText(content);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    }, []);

    // Clear chat history
    const handleClearChat = useCallback(() => {
        setMessages([]);
    }, []);

    // Handle submit
    const handleSubmit = useCallback(() => {
        if (inputValue.trim() && !isProcessing) {
            handleCustomPrompt(inputValue);
        }
    }, [inputValue, isProcessing, handleCustomPrompt]);

    // Collapsible section component
    const Section = ({ id, title, icon: Icon, children }: { id: string; title: string; icon: React.ElementType; children: React.ReactNode }) => (
        <div className="border-b border-border/50">
            <button
                onClick={() => setExpandedSection(expandedSection === id ? null : id)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-all duration-150"
            >
                <span className="flex items-center gap-2">
                    <Icon size={14} className="text-amber-500" />
                    {title}
                </span>
                <ChevronDown
                    size={14}
                    className={cn(
                        "text-muted-foreground transition-transform duration-150",
                        expandedSection === id && "rotate-180"
                    )}
                />
            </button>
            <div
                className={cn(
                    "grid transition-all duration-150 ease-out",
                    expandedSection === id ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
            >
                <div className="overflow-hidden">
                    <div className="px-4 pb-3">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );

    if (!isOpen) return null;

    return (
        <div
            className={cn(
                "h-full bg-background border-l border-border flex flex-col overflow-hidden transition-all duration-150 ease-out group/aipanel",
                isOpen ? "w-80" : "w-0",
                // Focus Mode - Fade to 40% for better readability
                isOpen && isEditorFocused ? "opacity-40 hover:opacity-100 transition-opacity duration-150" : "opacity-100"
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/10">
                        <Sparkles size={16} className="text-amber-500" />
                    </div>
                    <span className="font-semibold text-sm">AI Assistant</span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Close panel"
                >
                    <PanelRightClose size={16} />
                </button>
            </div>

            {/* P0-002: Horizontal Tabs for AI Actions - Enhanced with animated underline indicator */}
            {hasSelection && (
                <div className="flex-shrink-0 border-b border-border">
                    {/* Tab Headers - P0-002: Added relative positioning for underline */}
                    <div className="relative flex px-2 pt-2 gap-1 overflow-x-auto">
                        {[
                            { id: "writing" as const, label: "Viết", icon: Wand2 },
                            { id: "transform" as const, label: "Biến đổi", icon: FileText },
                            { id: "style" as const, label: "Văn phong", icon: Wand2 },
                            { id: "translate" as const, label: "Dịch", icon: Languages },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all whitespace-nowrap",
                                    activeTab === tab.id
                                        ? "text-amber-600 dark:text-amber-400"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-t-lg"
                                )}
                            >
                                <tab.icon size={12} />
                                {tab.label}
                                {/* P0-002: Animated underline indicator for active tab */}
                                {activeTab === tab.id && (
                                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-amber-500 rounded-full animate-in slide-in-from-left-2 duration-200" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content - P1-002: Per-button loading states */}
                    <div className="p-3 bg-background/50">
                        {activeTab === "writing" && (
                            <div className="flex flex-wrap gap-1.5">
                                {AI_ACTIONS.writing.map(action => {
                                    const isThisProcessing = processingAction === `writing-${action.id}`;
                                    return (
                                        <button
                                            key={action.id}
                                            onClick={() => handleQuickAction("writing", action.id)}
                                            disabled={isProcessing}
                                            className={cn(
                                                "flex items-center gap-1.5 px-3 py-2 text-xs bg-muted hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg transition-all disabled:opacity-50 hover:shadow-sm",
                                                isThisProcessing && "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                            )}
                                        >
                                            {isThisProcessing ? (
                                                <Loader2 size={12} className="animate-spin" />
                                            ) : (
                                                <action.icon size={12} />
                                            )}
                                            {action.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {activeTab === "transform" && (
                            <div className="flex flex-wrap gap-1.5">
                                {AI_ACTIONS.transform.map(action => {
                                    const isThisProcessing = processingAction === `transform-${action.id}`;
                                    return (
                                        <button
                                            key={action.id}
                                            onClick={() => handleQuickAction("transform", action.id)}
                                            disabled={isProcessing}
                                            className={cn(
                                                "flex items-center gap-1.5 px-3 py-2 text-xs bg-muted hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg transition-all disabled:opacity-50 hover:shadow-sm",
                                                isThisProcessing && "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                            )}
                                        >
                                            {isThisProcessing ? (
                                                <Loader2 size={12} className="animate-spin" />
                                            ) : (
                                                <action.icon size={12} />
                                            )}
                                            {action.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {activeTab === "style" && (
                            <div className="flex flex-wrap gap-1.5">
                                {AI_ACTIONS.style.map(style => {
                                    const isThisProcessing = processingAction === `style-${style.id}`;
                                    return (
                                        <button
                                            key={style.id}
                                            onClick={() => handleQuickAction("style", style.id)}
                                            disabled={isProcessing}
                                            className={cn(
                                                "flex items-center gap-1.5 px-3 py-2 text-xs bg-muted hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg transition-all disabled:opacity-50 hover:shadow-sm",
                                                isThisProcessing && "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                            )}
                                        >
                                            {isThisProcessing && <Loader2 size={12} className="animate-spin" />}
                                            {style.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {activeTab === "translate" && (
                            <div className="flex flex-wrap gap-1.5">
                                {AI_ACTIONS.translate.map(lang => {
                                    const isThisProcessing = processingAction === `translate-${lang.id}`;
                                    return (
                                        <button
                                            key={lang.id}
                                            onClick={() => handleQuickAction("translate", lang.id)}
                                            disabled={isProcessing}
                                            className={cn(
                                                "flex items-center gap-1.5 px-3 py-2 text-xs bg-muted hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg transition-all disabled:opacity-50 hover:shadow-sm",
                                                isThisProcessing && "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                            )}
                                        >
                                            {isThisProcessing && <Loader2 size={12} className="animate-spin" />}
                                            {lang.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Selection Hint when no selection */}
            {!hasSelection && (
                <div className="flex-shrink-0 px-4 py-4 border-b border-border bg-muted/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-amber-500/10">
                            <Sparkles size={16} className="text-amber-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground">Chọn văn bản để bắt đầu</p>
                            <p className="text-xs text-muted-foreground">Hoặc hỏi AI bất cứ điều gì bên dưới</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Messages - Takes up 70%+ of remaining space */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
                {messages.length === 0 ? (
                    // Day 5: Simplified proactive suggestions - list style, not cards
                    <div className="flex flex-col gap-1 py-4">
                        <div className="flex items-center gap-2 mb-3 px-1">
                            <Sparkles size={14} className="text-amber-600" />
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Gợi ý nhanh</p>
                        </div>
                        {[
                            { icon: ChevronRight, text: "Viết tiếp mục này", prompt: "Continue writing this text naturally, maintaining the same tone and style." },
                            { icon: FileText, text: "Tóm tắt tài liệu", prompt: "Summarize this text concisely, capturing the key points." },
                            { icon: Wand2, text: "Sinh kết luận", prompt: "Write a conclusion for this document." },
                            { icon: Languages, text: "Dịch sang tiếng Việt", prompt: "Translate this text to Vietnamese." },
                        ].map((suggestion, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setInputValue(suggestion.prompt);
                                    inputRef.current?.focus();
                                }}
                                className="group relative flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-150 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40 rounded-md"
                            >
                                {/* Hover accent bar */}
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-0 group-hover:h-4 bg-amber-500 rounded-full transition-all duration-150 opacity-0 group-hover:opacity-100" />
                                <suggestion.icon size={14} className="text-muted-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
                                <span className="text-sm text-foreground/70 group-hover:text-foreground transition-colors">{suggestion.text}</span>
                            </button>
                        ))}
                        <p className="text-[10px] text-muted-foreground/50 text-center mt-3">
                            Hoặc tự gõ câu hỏi bên dưới
                        </p>
                    </div>
                ) : (
                    <>
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={cn(
                                    "group relative rounded-2xl px-4 py-3 text-sm animate-in fade-in slide-in-from-bottom-2 duration-200",
                                    message.role === "user"
                                        ? "bg-amber-500/10 text-foreground ml-4"
                                        : "bg-muted text-foreground mr-4"
                                )}
                            >
                                {message.action && (
                                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mb-1 block">
                                        {message.action}
                                    </span>
                                )}
                                <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>

                                {/* Message actions */}
                                {message.role === "assistant" && (
                                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/30">
                                        <button
                                            onClick={() => handleCopy(message.id, message.content)}
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-background rounded-lg transition-colors"
                                        >
                                            {copiedId === message.id ? <Check size={12} /> : <Copy size={12} />}
                                            {copiedId === message.id ? "Copied" : "Copy"}
                                        </button>
                                        <button
                                            onClick={() => applyToEditor(message.content)}
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                                        >
                                            <Check size={12} />
                                            Áp dụng vào tài liệu
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Clear chat button */}
            {messages.length > 0 && (
                <div className="flex-shrink-0 px-4 pb-2">
                    <button
                        onClick={handleClearChat}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                        <Trash2 size={12} />
                        Xóa lịch sử
                    </button>
                </div>
            )}

            {/* Input Area - Enhanced with larger input and better styling */}
            <div className="flex-shrink-0 p-4 border-t border-border bg-gradient-to-t from-muted/50 to-transparent">
                <div className="relative">
                    <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value.slice(0, 500))}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit();
                            }
                        }}
                        placeholder="Ask AI anything..."
                        disabled={isProcessing}
                        rows={3}
                        maxLength={500}
                        className={cn(
                            "w-full px-4 py-3 pr-14 text-sm bg-background border-2 rounded-2xl resize-none transition-all duration-200",
                            "placeholder:text-muted-foreground/50",
                            "focus:outline-none focus:border-amber-500/50 focus:shadow-lg focus:shadow-amber-500/10",
                            "border-border hover:border-border/80",
                            inputValue.length > 450 && "border-amber-400/50"
                        )}
                    />
                    {/* P1-007: Character counter */}
                    {inputValue.length > 0 && (
                        <span className={cn(
                            "absolute left-3 bottom-3 text-[10px] transition-colors",
                            inputValue.length > 450
                                ? "text-amber-500"
                                : "text-muted-foreground/50"
                        )}>
                            {inputValue.length}/500
                        </span>
                    )}
                    <button
                        onClick={handleSubmit}
                        disabled={!inputValue.trim() || isProcessing}
                        className={cn(
                            "absolute right-3 bottom-3 p-2.5 rounded-xl transition-all duration-200",
                            inputValue.trim() && !isProcessing
                                ? "bg-amber-500 text-zinc-900 hover:bg-amber-400 shadow-md hover:shadow-lg hover:scale-105"
                                : "bg-muted text-muted-foreground"
                        )}
                    >
                        {isProcessing ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <Send size={18} />
                        )}
                    </button>
                </div>
                <p className="text-[10px] text-muted-foreground/60 mt-2 text-center">
                    Nhấn Enter để gửi • Shift+Enter để xuống dòng
                </p>
            </div>
        </div>
    );
}

export default AISidePanel;
