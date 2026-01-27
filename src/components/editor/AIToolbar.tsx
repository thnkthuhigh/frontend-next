"use client";

import { useState } from "react";
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

    if (!editor) return null;

    const getSelectedText = (): string => {
        const { from, to } = editor.state.selection;
        return editor.state.doc.textBetween(from, to, " ");
    };

    const replaceSelection = (newText: string) => {
        const { from, to } = editor.state.selection;
        editor.chain().focus().deleteRange({ from, to }).insertContent(newText).run();
    };

    const handleAIAction = async (
        action: () => Promise<string>,
        actionName: string
    ) => {
        const selectedText = getSelectedText();
        if (!selectedText.trim()) {
            alert("Vui lòng chọn đoạn văn bản để xử lý");
            return;
        }

        setIsLoading(true);
        setLoadingAction(actionName);

        try {
            const result = await action();
            replaceSelection(result);
        } catch (error) {
            console.error(`AI ${actionName} failed:`, error);
            alert(`Lỗi khi ${actionName}. Vui lòng thử lại.`);
        } finally {
            setIsLoading(false);
            setLoadingAction(null);
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

    return (
        <div className="flex items-center gap-1 px-2 py-1 border-b border-border bg-gradient-to-r from-purple-500/10 to-blue-500/10">
            <span className="text-xs font-medium text-muted-foreground mr-2 flex items-center gap-1">
                <Wand2 className="h-3 w-3" />
                AI Tools
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
                                    () => aiRewrite(getSelectedText(), style.value),
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
                                    () => aiTranslate(getSelectedText(), lang.value),
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
                    handleAIAction(() => aiSummarize(getSelectedText()), "summarize")
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
                    handleAIAction(() => aiExpand(getSelectedText()), "expand")
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
                    handleAIAction(() => aiFixGrammar(getSelectedText()), "fix-grammar")
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

            {!hasSelection && (
                <span className="text-xs text-muted-foreground ml-2">
                    Chọn văn bản để sử dụng
                </span>
            )}
        </div>
    );
}
