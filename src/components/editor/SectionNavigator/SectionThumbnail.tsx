"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Section {
    id: string;
    title: string;
    type: "heading" | "pageBreak" | "content";
    preview: string;
    nodeIndex: number;
    endIndex: number;
}

interface SectionThumbnailProps {
    section: Section;
    index: number;
    isActive: boolean;
    onClick: () => void;
}

export function SectionThumbnail({ section, index, isActive, onClick }: SectionThumbnailProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group relative flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-all duration-150",
                isDragging && "z-50 opacity-90 shadow-xl scale-105",
                isActive
                    ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30"
                    : "hover:bg-white/5 border border-transparent"
            )}
            onClick={onClick}
        >
            {/* Drag Handle */}
            <button
                {...attributes}
                {...listeners}
                className={cn(
                    "flex-shrink-0 p-1 rounded cursor-grab active:cursor-grabbing transition-opacity",
                    "opacity-0 group-hover:opacity-100",
                    isDragging && "opacity-100"
                )}
            >
                <GripVertical size={14} className="text-white/40" />
            </button>

            {/* Thumbnail Preview */}
            <div className="flex-1 min-w-0">
                {/* Section number badge */}
                <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded",
                        section.type === "heading" 
                            ? "bg-blue-500/20 text-blue-300" 
                            : section.type === "pageBreak"
                            ? "bg-orange-500/20 text-orange-300"
                            : "bg-white/10 text-white/50"
                    )}>
                        {section.type === "pageBreak" ? "Break" : `§${index + 1}`}
                    </span>
                </div>

                {/* Section Title */}
                <p className={cn(
                    "text-sm font-medium truncate",
                    isActive ? "text-white" : "text-white/80"
                )}>
                    {section.title || "Untitled Section"}
                </p>

                {/* Mini Preview - Skeleton lines */}
                <div className="mt-2 space-y-1">
                    {section.preview ? (
                        <p className="text-[10px] text-white/40 line-clamp-2">
                            {section.preview}
                        </p>
                    ) : (
                        <>
                            <div className="h-1.5 w-full bg-white/10 rounded" />
                            <div className="h-1.5 w-3/4 bg-white/10 rounded" />
                            <div className="h-1.5 w-1/2 bg-white/10 rounded" />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SectionThumbnail;
