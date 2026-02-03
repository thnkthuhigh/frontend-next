"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Editor } from "@tiptap/react";
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Palette,
    Heading1,
    Heading2,
} from "lucide-react";

// Color palette for text - carefully curated monochrome + accent colors
const TEXT_COLORS = [
    { name: "Default", color: null, preview: "bg-zinc-800 dark:bg-zinc-200" },
    { name: "Amber", color: "#f59e0b", preview: "bg-amber-500" },
    { name: "Red", color: "#ef4444", preview: "bg-red-500" },
    { name: "Green", color: "#22c55e", preview: "bg-green-500" },
    { name: "Blue", color: "#3b82f6", preview: "bg-blue-500" },
    { name: "Purple", color: "#a855f7", preview: "bg-purple-500" },
    { name: "Pink", color: "#ec4899", preview: "bg-pink-500" },
    { name: "Gray", color: "#6b7280", preview: "bg-gray-500" },
];
import { cn } from "@/lib/utils";

interface FloatingToolbarProps {
    editor: Editor | null;
}

// P1-008: Recent colors storage key
const RECENT_COLORS_KEY = 'docformatter_recent_colors';
const MAX_RECENT_COLORS = 5;

export function FloatingToolbar({ editor }: FloatingToolbarProps) {
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showHeadingMenu, setShowHeadingMenu] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const toolbarRef = useRef<HTMLDivElement>(null);

    // P1-008: Recent colors state
    const [recentColors, setRecentColors] = useState<string[]>([]);

    // P1-008: Load recent colors from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(RECENT_COLORS_KEY);
            if (stored) {
                setRecentColors(JSON.parse(stored));
            }
        } catch {
            // Ignore parsing errors
        }
    }, []);

    // P1-008: Add color to recent colors and save to localStorage
    const addToRecentColors = useCallback((color: string) => {
        if (!color) return;

        setRecentColors(prev => {
            const filtered = prev.filter(c => c !== color);
            const updated = [color, ...filtered].slice(0, MAX_RECENT_COLORS);
            try {
                localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(updated));
            } catch {
                // Ignore storage errors
            }
            return updated;
        });
    }, []);

    // P0-003: Update toolbar position with improved collision detection
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

            // P0-003: Dynamic toolbar dimensions
            const toolbarHeight = toolbarRef.current?.offsetHeight || 44;
            const toolbarWidth = toolbarRef.current?.offsetWidth || 280;
            const padding = 12; // Increased padding from edges
            const verticalOffset = 20; // Day 4: Increased breathing room above selection

            // Calculate center of selection
            const selectionCenterX = (start.left + end.right) / 2;

            // Get editor container bounds
            const editorElement = view.dom.closest('.editor-content-wrapper');
            const editorRect = editorElement?.getBoundingClientRect() || { left: 0, right: window.innerWidth, top: 0 };

            // P0-003: Calculate left position with viewport collision detection
            let left = selectionCenterX - toolbarWidth / 2;
            // Prevent left overflow
            left = Math.max(padding, left);
            // Prevent right overflow
            left = Math.min(left, window.innerWidth - toolbarWidth - padding);
            // Also respect editor bounds
            left = Math.max(editorRect.left + padding, Math.min(left, editorRect.right - toolbarWidth - padding));

            // P0-003 + P0-1: Calculate top position with viewport collision detection + breathing room
            let top = start.top - toolbarHeight - padding - verticalOffset;
            let flipToBottom = false;

            // If toolbar would be above viewport, flip to bottom of selection
            if (top < padding) {
                top = end.bottom + padding;
                flipToBottom = true;
            }

            // If still overflows bottom, position at viewport top
            if (flipToBottom && top + toolbarHeight > window.innerHeight - padding) {
                top = padding;
            }

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
                    setShowColorPicker(false);
                    setShowHeadingMenu(false);
                }
            }, 150);
        });

        return () => {
            editor.off("selectionUpdate", updatePosition);
        };
    }, [editor]);

    // Prevent toolbar clicks from losing selection
    const handleToolbarMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
    };

    if (!editor || !isVisible) return null;

    // Floating toolbar button - Light mode with dark mode support
    const ToolbarBtn = ({
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
                "p-2 rounded-full transition-all duration-200",
                isActive
                    ? "bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700",
                disabled && "opacity-30 cursor-not-allowed"
            )}
        >
            {children}
        </button>
    );

    return (
        <div
            ref={toolbarRef}
            onMouseDown={handleToolbarMouseDown}
            data-floating-toolbar
            className="fixed z-[9999] flex items-center gap-1 px-3 py-2 rounded-full bg-white dark:bg-zinc-800 backdrop-blur-xl shadow-md shadow-black/5 dark:shadow-black/20 border border-zinc-200/80 dark:border-zinc-700/60 animate-in fade-in zoom-in-95 slide-in-from-bottom-1 duration-150"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
            }}
        >
            {/* Formatting buttons */}
            <ToolbarBtn
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive("bold")}
                title="Bold"
            >
                <Bold size={15} />
            </ToolbarBtn>

            <ToolbarBtn
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive("italic")}
                title="Italic"
            >
                <Italic size={15} />
            </ToolbarBtn>

            <ToolbarBtn
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                isActive={editor.isActive("underline")}
                title="Underline"
            >
                <Underline size={15} />
            </ToolbarBtn>

            <ToolbarBtn
                onClick={() => editor.chain().focus().toggleStrike().run()}
                isActive={editor.isActive("strike")}
                title="Strikethrough"
            >
                <Strikethrough size={15} />
            </ToolbarBtn>

            {/* Divider - dot style */}
            <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600 mx-1" />

            {/* Color Picker */}
            <div className="relative">
                <ToolbarBtn
                    onClick={() => {
                        setShowColorPicker(!showColorPicker);
                        setShowHeadingMenu(false);
                    }}
                    title="Text Color"
                >
                    <Palette size={15} />
                </ToolbarBtn>

                {showColorPicker && (
                    <div
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-3 p-3 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xl z-[9999]"
                        onMouseDown={handleToolbarMouseDown}
                    >
                        {/* P1-008: Recent colors row */}
                        {recentColors.length > 0 && (
                            <div className="mb-2 pb-2 border-b border-zinc-200 dark:border-zinc-700">
                                <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mb-1.5 font-medium uppercase tracking-wide">Recent</div>
                                <div className="flex gap-2">
                                    {recentColors.map((color, idx) => (
                                        <button
                                            key={`recent-${idx}`}
                                            onClick={() => {
                                                editor.chain().focus().setColor(color).run();
                                                addToRecentColors(color);
                                                setShowColorPicker(false);
                                            }}
                                            title={color}
                                            className="w-6 h-6 rounded-full transition-all duration-200 hover:scale-125 hover:ring-2 hover:ring-zinc-400 dark:hover:ring-zinc-500"
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Preset colors */}
                        <div className="flex gap-2">
                            {TEXT_COLORS.map((item) => (
                                <button
                                    key={item.name}
                                    onClick={() => {
                                        if (item.color) {
                                            editor.chain().focus().setColor(item.color).run();
                                            addToRecentColors(item.color);
                                        } else {
                                            editor.chain().focus().unsetColor().run();
                                        }
                                        setShowColorPicker(false);
                                    }}
                                    title={item.name}
                                    className={cn(
                                        "w-6 h-6 rounded-full transition-all duration-200 hover:scale-125 hover:ring-2 hover:ring-zinc-400 dark:hover:ring-zinc-500",
                                        item.preview
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Heading Quick Access */}
            <div className="relative">
                <ToolbarBtn
                    onClick={() => {
                        setShowHeadingMenu(!showHeadingMenu);
                        setShowColorPicker(false);
                    }}
                    isActive={editor.isActive("heading")}
                    title="Convert to Heading"
                >
                    <Heading1 size={15} />
                </ToolbarBtn>

                {showHeadingMenu && (
                    <div
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-3 py-2 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xl z-[9999] min-w-[140px]"
                        onMouseDown={handleToolbarMouseDown}
                    >
                        <button
                            onClick={() => {
                                editor.chain().focus().toggleHeading({ level: 1 }).run();
                                setShowHeadingMenu(false);
                            }}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-150",
                                editor.isActive("heading", { level: 1 })
                                    ? "bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                            )}
                        >
                            <Heading1 size={16} className="text-zinc-400 dark:text-zinc-500" />
                            <span className="text-sm font-bold">Heading 1</span>
                        </button>
                        <button
                            onClick={() => {
                                editor.chain().focus().toggleHeading({ level: 2 }).run();
                                setShowHeadingMenu(false);
                            }}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-150",
                                editor.isActive("heading", { level: 2 })
                                    ? "bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                            )}
                        >
                            <Heading2 size={16} className="text-zinc-400 dark:text-zinc-500" />
                            <span className="text-sm font-semibold">Heading 2</span>
                        </button>
                        <button
                            onClick={() => {
                                editor.chain().focus().setParagraph().run();
                                setShowHeadingMenu(false);
                            }}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-150",
                                !editor.isActive("heading")
                                    ? "bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                            )}
                        >
                            <span className="w-4 text-center text-zinc-400 dark:text-zinc-500 text-sm">¶</span>
                            <span className="text-sm">Paragraph</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default FloatingToolbar;