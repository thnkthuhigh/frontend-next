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

// Quick action categories
const AI_ACTIONS = {
    writing: [
        { id: "continue", label: "Continue writing", icon: ChevronRight, prompt: "Continue writing this text naturally, maintaining the same tone and style." },
        { id: "improve", label: "Improve text", icon: Wand2, prompt: "Improve and enhance this text while keeping the meaning." },
        { id: "expand", label: "Expand", icon: Expand, prompt: "Expand this text with more details and examples." },
    ],
    transform: [
        { id: "summarize", label: "Summarize", icon: FileText, prompt: "Summarize this text concisely, capturing the key points." },
        { id: "grammar", label: "Fix grammar", icon: SpellCheck, prompt: "Fix any grammar and spelling errors in this text." },
    ],
    style: [
        { id: "professional", label: "Professional", style: "professional" as RewriteStyle },
        { id: "casual", label: "Casual", style: "casual" as RewriteStyle },
        { id: "academic", label: "Academic", style: "academic" as RewriteStyle },
        { id: "creative", label: "Creative", style: "creative" as RewriteStyle },
    ],
    translate: [
        { id: "vi", label: "Vietnamese", lang: "vi" as TranslateLanguage },
        { id: "en", label: "English", lang: "en" as TranslateLanguage },
        { id: "fr", label: "French", lang: "fr" as TranslateLanguage },
        { id: "ja", label: "Japanese", lang: "ja" as TranslateLanguage },
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

    // Handle quick actions
    const handleQuickAction = useCallback(async (actionType: string, actionId: string) => {
        if (!editor) return;

        const selectedText = getSelectedText();
        if (!selectedText.trim()) {
            addMessage("assistant", "Please select some text first, or place your cursor in a paragraph.");
            return;
        }

        setIsProcessing(true);

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
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
                <span className="flex items-center gap-2">
                    <Icon size={14} className="text-amber-500" />
                    {title}
                </span>
                <ChevronDown
                    size={14}
                    className={cn(
                        "text-muted-foreground transition-transform duration-200",
                        expandedSection === id && "rotate-180"
                    )}
                />
            </button>
            <div
                className={cn(
                    "grid transition-all duration-200 ease-in-out",
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
                "h-full bg-background border-l border-border flex flex-col overflow-hidden transition-all duration-300 ease-in-out group/aipanel",
                isOpen ? "w-80" : "w-0",
                // Focus Mode: Fade AI panel when editor is focused, show on hover
                isOpen && isEditorFocused ? "opacity-50 hover:opacity-100" : "opacity-100"
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

            {/* Horizontal Tabs for AI Actions */}
            {hasSelection && (
                <div className="flex-shrink-0 border-b border-border">
                    {/* Tab Headers */}
                    <div className="flex px-2 pt-2 gap-1 overflow-x-auto">
                        {[
                            { id: "writing" as const, label: "Writing", icon: Wand2 },
                            { id: "transform" as const, label: "Transform", icon: FileText },
                            { id: "style" as const, label: "Rewrite Style", icon: Wand2 },
                            { id: "translate" as const, label: "Translate", icon: Languages },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-all whitespace-nowrap",
                                    activeTab === tab.id
                                        ? "bg-background border border-b-0 border-border text-amber-600 dark:text-amber-400"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                <tab.icon size={12} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    
                    {/* Tab Content */}
                    <div className="p-3 bg-background/50">
                        {activeTab === "writing" && (
                            <div className="flex flex-wrap gap-1.5">
                                {AI_ACTIONS.writing.map(action => (
                                    <button
                                        key={action.id}
                                        onClick={() => handleQuickAction("writing", action.id)}
                                        disabled={isProcessing}
                                        className="flex items-center gap-1.5 px-3 py-2 text-xs bg-muted hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg transition-all disabled:opacity-50 hover:shadow-sm"
                                    >
                                        <action.icon size={12} />
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        )}
                        {activeTab === "transform" && (
                            <div className="flex flex-wrap gap-1.5">
                                {AI_ACTIONS.transform.map(action => (
                                    <button
                                        key={action.id}
                                        onClick={() => handleQuickAction("transform", action.id)}
                                        disabled={isProcessing}
                                        className="flex items-center gap-1.5 px-3 py-2 text-xs bg-muted hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg transition-all disabled:opacity-50 hover:shadow-sm"
                                    >
                                        <action.icon size={12} />
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        )}
                        {activeTab === "style" && (
                            <div className="flex flex-wrap gap-1.5">
                                {AI_ACTIONS.style.map(style => (
                                    <button
                                        key={style.id}
                                        onClick={() => handleQuickAction("style", style.id)}
                                        disabled={isProcessing}
                                        className="px-3 py-2 text-xs bg-muted hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg transition-all disabled:opacity-50 hover:shadow-sm"
                                    >
                                        {style.label}
                                    </button>
                                ))}
                            </div>
                        )}
                        {activeTab === "translate" && (
                            <div className="flex flex-wrap gap-1.5">
                                {AI_ACTIONS.translate.map(lang => (
                                    <button
                                        key={lang.id}
                                        onClick={() => handleQuickAction("translate", lang.id)}
                                        disabled={isProcessing}
                                        className="px-3 py-2 text-xs bg-muted hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg transition-all disabled:opacity-50 hover:shadow-sm"
                                    >
                                        {lang.label}
                                    </button>
                                ))}
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
                            <p className="text-sm font-medium text-foreground">Select text to get started</p>
                            <p className="text-xs text-muted-foreground">Or ask AI anything below</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Messages - Takes up 70%+ of remaining space */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-8">
                        <MessageSquare size={40} className="mb-4 opacity-20" />
                        <p className="text-sm font-medium mb-1">No messages yet</p>
                        <p className="text-xs text-muted-foreground/70 max-w-[200px]">
                            Select text and use quick actions, or type a custom prompt below.
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
                                            Apply to Document
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
                        Clear chat
                    </button>
                </div>
            )}

            {/* Input Area - Enhanced with larger input and better styling */}
            <div className="flex-shrink-0 p-4 border-t border-border bg-gradient-to-t from-muted/50 to-transparent">
                <div className="relative">
                    <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit();
                            }
                        }}
                        placeholder="Ask AI anything..."
                        disabled={isProcessing}
                        rows={3}
                        className={cn(
                            "w-full px-4 py-3 pr-14 text-sm bg-background border-2 rounded-2xl resize-none transition-all duration-200",
                            "placeholder:text-muted-foreground/50",
                            "focus:outline-none focus:border-amber-500/50 focus:shadow-lg focus:shadow-amber-500/10",
                            "border-border hover:border-border/80"
                        )}
                    />
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
                    Press Enter to send • Shift+Enter for new line
                </p>
            </div>
        </div>
    );
}

export default AISidePanel;
