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

export interface CommandListRef {
    onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface CommandListProps {
    items: CommandItem[];
    command: (item: CommandItem) => void;
    editor: Editor;
    range: Range;
}

const GROUP_LABELS: Record<string, { label: string; icon: string }> = {
    ai: { label: "AI Magic", icon: "🤖" },
    blocks: { label: "Basic Blocks", icon: "📝" },
    insert: { label: "Insert", icon: "🧱" },
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
                <div className="w-72 rounded-xl bg-[#1a1d24]/95 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/30 p-4">
                    <p className="text-white/50 text-sm text-center">No commands found</p>
                </div>
            );
        }

        let globalIndex = 0;

        return (
            <div className="w-72 max-h-80 overflow-y-auto rounded-xl bg-[#1a1d24]/95 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/30 py-2">
                {groupOrder.map((groupKey) => {
                    const groupItems = groupedItems[groupKey];
                    if (!groupItems || groupItems.length === 0) return null;

                    const groupInfo = GROUP_LABELS[groupKey];

                    return (
                        <div key={groupKey}>
                            {/* Group Header */}
                            <div className="px-3 py-1.5 flex items-center gap-2">
                                <span className="text-sm">{groupInfo.icon}</span>
                                <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                                    {groupInfo.label}
                                </span>
                            </div>

                            {/* Group Items */}
                            {groupItems.map((item: CommandItem) => {
                                const currentIndex = globalIndex++;
                                const isSelected = currentIndex === selectedIndex;

                                return (
                                    <button
                                        key={item.title}
                                        onClick={() => selectItem(currentIndex)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                                            isSelected
                                                ? "bg-white/10 text-white"
                                                : "text-white/70 hover:bg-white/5 hover:text-white"
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium",
                                                isSelected
                                                    ? "bg-gradient-to-br from-blue-500/30 to-purple-500/30"
                                                    : "bg-white/5"
                                            )}
                                        >
                                            {item.icon}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{item.title}</p>
                                            <p className="text-xs text-white/40 truncate">
                                                {item.description}
                                            </p>
                                        </div>
                                        {isSelected && (
                                            <span className="text-[10px] text-white/30 px-1.5 py-0.5 rounded bg-white/5">
                                                Enter
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    );
                })}

                {/* Footer hint */}
                <div className="px-3 pt-2 mt-1 border-t border-white/5">
                    <p className="text-[10px] text-white/30 text-center">
                        ↑↓ Navigate • Enter Select • Esc Close
                    </p>
                </div>
            </div>
        );
    }
);

CommandList.displayName = "CommandList";

export default CommandList;
