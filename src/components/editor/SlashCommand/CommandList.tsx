"use client";

import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useState,
    useCallback,
    useMemo,
} from "react";
import { Editor, Range } from "@tiptap/core";
import { CommandItem } from "./suggestion";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    Type,
    List,
    Quote,
    Code,
    Table,
    Image,
    Minus,
    FileText,
    Languages,
    Wand2,
    CheckCircle,
} from "lucide-react";

export interface CommandListRef {
    onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface CommandListProps {
    items: CommandItem[];
    command: (item: CommandItem) => void;
    editor: Editor;
    range: Range;
}

const GROUP_LABELS: Record<string, { label: string; color: string }> = {
    ai: { label: "AI", color: "text-violet-500" },
    blocks: { label: "Basic", color: "text-zinc-500 dark:text-zinc-400" },
    insert: { label: "Insert", color: "text-zinc-500 dark:text-zinc-400" },
};

// Map icon strings to Lucide icons
const getIconComponent = (iconStr: string, isAI: boolean = false) => {
    const iconClass = cn("w-4 h-4", isAI ? "text-violet-500" : "text-muted-foreground");
    
    switch (iconStr) {
        case "✨": return <Sparkles className={iconClass} />;
        case "📝": return <FileText className={iconClass} />;
        case "🔧": return <CheckCircle className={iconClass} />;
        case "🌐": return <Languages className={iconClass} />;
        case "H1": return <span className="text-xs font-bold">H1</span>;
        case "H2": return <span className="text-xs font-bold">H2</span>;
        case "H3": return <span className="text-xs font-bold">H3</span>;
        case "•": return <List className={iconClass} />;
        case "1.": return <List className={iconClass} />;
        case "❝": return <Quote className={iconClass} />;
        case "</>": return <Code className={iconClass} />;
        case "📊": return <Table className={iconClass} />;
        case "🖼️": return <Image className={iconClass} />;
        case "—": return <Minus className={iconClass} />;
        default: return <span className="text-sm">{iconStr}</span>;
    }
};

const CommandList = forwardRef<CommandListRef, CommandListProps>(
    ({ items, command }, ref) => {
        const [selectedIndex, setSelectedIndex] = useState(0);

        // Memoized grouping of items
        const groupedItems = useMemo(() => {
            return items.reduce((acc, item) => {
                if (!acc[item.group]) acc[item.group] = [];
                acc[item.group].push(item);
                return acc;
            }, {} as Record<string, CommandItem[]>);
        }, [items]);

        const groupOrder = ["ai", "blocks", "insert"];

        // Memoized flat list of items for keyboard navigation
        const flatItems = useMemo(() => {
            return groupOrder.flatMap((group) => groupedItems[group] || []);
        }, [groupedItems]);

        const selectItem = useCallback(
            (index: number) => {
                const item = flatItems[index];
                if (item) {
                    command(item);
                }
            },
            [command, flatItems]
        );

        const upHandler = useCallback(() => {
            setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
        }, [flatItems.length]);

        const downHandler = useCallback(() => {
            setSelectedIndex((prev) => (prev + 1) % flatItems.length);
        }, [flatItems.length]);

        const enterHandler = useCallback(() => {
            selectItem(selectedIndex);
        }, [selectItem, selectedIndex]);

        useEffect(() => {
            setSelectedIndex(0);
        }, [items]);

        useImperativeHandle(ref, () => ({
            onKeyDown: ({ event }: { event: KeyboardEvent }) => {
                if (event.key === "ArrowUp") {
                    upHandler();
                    return true;
                }

                if (event.key === "ArrowDown") {
                    downHandler();
                    return true;
                }

                if (event.key === "Enter") {
                    enterHandler();
                    return true;
                }

                return false;
            },
        }));

        if (flatItems.length === 0) {
            return (
                <div className="w-64 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xl p-4">
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm text-center">No results</p>
                </div>
            );
        }

        let globalIndex = 0;

        // P2-004: Menu animation with stagger
        return (
            <motion.div
                className="w-64 max-h-80 overflow-y-auto rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xl py-1"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
            >
                {groupOrder.map((groupKey, groupIndex) => {
                    const groupItems = groupedItems[groupKey];
                    if (!groupItems || groupItems.length === 0) return null;

                    const groupInfo = GROUP_LABELS[groupKey];
                    const isAI = groupKey === "ai";

                    return (
                        <motion.div
                            key={groupKey}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                                duration: 0.2,
                                delay: groupIndex * 0.05,
                                ease: "easeOut"
                            }}
                        >
                            {/* Group Header - Minimal */}
                            <div className="px-3 pt-2 pb-1">
                                <span className={cn(
                                    "text-[10px] font-semibold uppercase tracking-wider",
                                    groupInfo.color
                                )}>
                                    {groupInfo.label}
                                </span>
                            </div>

                            {/* Group Items - Stagger animation */}
                            {groupItems.map((item: CommandItem, itemIndex: number) => {
                                const currentIndex = globalIndex++;
                                const isSelected = currentIndex === selectedIndex;

                                return (
                                    <motion.button
                                        key={item.title}
                                        onClick={() => selectItem(currentIndex)}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{
                                            duration: 0.15,
                                            delay: (groupIndex * 0.05) + (itemIndex * 0.02),
                                            ease: "easeOut"
                                        }}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                                            isSelected
                                                ? "bg-zinc-100 dark:bg-zinc-700"
                                                : "hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                                        )}
                                    >
                                        {/* Icon */}
                                        <div className={cn(
                                            "w-7 h-7 flex items-center justify-center rounded border transition-all",
                                            isSelected
                                                ? "border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 scale-105"
                                                : "border-transparent bg-zinc-100 dark:bg-zinc-700/50"
                                        )}>
                                            {getIconComponent(item.icon, isAI)}
                                        </div>
                                        
                                        {/* Text */}
                                        <div className="flex-1 min-w-0">
                                            <p className={cn(
                                                "text-sm font-medium truncate",
                                                isAI ? "text-violet-600 dark:text-violet-400" : "text-zinc-800 dark:text-zinc-200"
                                            )}>
                                                {item.title}
                                            </p>
                                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                                {item.description}
                                            </p>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </motion.div>
                    );
                })}

                {/* Footer - Minimal keyboard hint */}
                <motion.div
                    className="px-3 py-1.5 mt-1 border-t border-zinc-200 dark:border-zinc-700"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center">
                        ↑↓ to navigate · ↵ to select
                    </p>
                </motion.div>
            </motion.div>
        );
    }
);

CommandList.displayName = "CommandList";

export default CommandList;