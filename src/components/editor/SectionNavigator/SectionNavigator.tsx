"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { SectionThumbnail, Section } from "./SectionThumbnail";
import { cn } from "@/lib/utils";

interface SectionNavigatorProps {
    jsonContent: Record<string, unknown> | null;
    onReorder: (newContent: Record<string, unknown>) => void;
    onSectionClick: (sectionId: string, nodeIndex: number) => void;
    activeSectionId?: string;
}

// Extract sections from Tiptap JSON content with error handling
function extractSections(json: Record<string, unknown> | null): Section[] {
    try {
        if (!json || !json.content || !Array.isArray(json.content)) {
            return [];
        }

        const content = json.content as Record<string, unknown>[];
        const sections: Section[] = [];
        let currentSection: Section | null = null;
        let sectionCounter = 0;

        content.forEach((node, index) => {
            const type = node.type as string;
            const attrs = node.attrs as Record<string, unknown> | undefined;

            // Check for section start: H1 heading or pageBreak
            const isH1 = type === "heading" && attrs?.level === 1;
            const isPageBreak = type === "pageBreak" || type === "horizontalRule";

            if (isH1 || isPageBreak) {
                // Save previous section
                if (currentSection) {
                    currentSection.endIndex = index - 1;
                    sections.push(currentSection);
                }

                // Get title from heading content
                let title = "";
                if (isH1 && node.content && Array.isArray(node.content)) {
                    const textNodes = node.content as Array<{ type: string; text?: string }>;
                    title = textNodes.map((t) => t.text || "").join("");
                }

                // Start new section
                sectionCounter++;
                currentSection = {
                    id: `section-${index}`,
                    title: isPageBreak ? `Page Break ${sectionCounter}` : title || `Section ${sectionCounter}`,
                    type: isPageBreak ? "pageBreak" : "heading",
                    preview: "",
                    nodeIndex: index,
                    endIndex: content.length - 1,
                };
            } else if (currentSection && type === "paragraph") {
                // Add preview text from paragraphs (only if we don't have one yet)
                if (!currentSection.preview && node.content && Array.isArray(node.content)) {
                    const textNodes = node.content as Array<{ type: string; text?: string }>;
                    currentSection.preview = textNodes
                        .map((t) => t.text || "")
                        .join("")
                        .slice(0, 100);
                }
            }
        });

        // Add last section
        if (currentSection) {
            // Use non-null assertion since we just checked
            (currentSection as Section).endIndex = content.length - 1;
            sections.push(currentSection);
        }

        // If no sections found, create a default one
        if (sections.length === 0 && content.length > 0) {
            let preview = "";
            const firstPara = content.find(
                (n) => (n.type as string) === "paragraph" && n.content && Array.isArray(n.content)
            );
            if (firstPara && firstPara.content) {
                const textNodes = firstPara.content as Array<{ type: string; text?: string }>;
                preview = textNodes.map((t) => t.text || "").join("").slice(0, 100);
            }

            sections.push({
                id: "section-0",
                title: "Document Content",
                type: "content",
                preview,
                nodeIndex: 0,
                endIndex: content.length - 1,
            });
        }

        return sections;
    } catch (error) {
        console.error("Error extracting sections:", error);
        return [];
    }
}

// Reorder content based on section order
function reorderContent(
    json: Record<string, unknown>,
    sections: Section[],
    oldIndex: number,
    newIndex: number
): Record<string, unknown> {
    const content = [...(json.content as Record<string, unknown>[])];
    const reorderedSections = arrayMove(sections, oldIndex, newIndex);

    // Build new content array
    const newContent: Record<string, unknown>[] = [];

    reorderedSections.forEach((section) => {
        // Extract nodes for this section
        for (let i = section.nodeIndex; i <= section.endIndex; i++) {
            if (content[i]) {
                newContent.push(content[i]);
            }
        }
    });

    return {
        ...json,
        content: newContent,
    };
}

export function SectionNavigator({
    jsonContent,
    onReorder,
    onSectionClick,
    activeSectionId,
}: SectionNavigatorProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [sections, setSections] = useState<Section[]>([]);

    // Extract sections when content changes - memoized to prevent unnecessary recalculations
    useEffect(() => {
        const extracted = extractSections(jsonContent);
        setSections(extracted);
    }, [jsonContent]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;

            if (over && active.id !== over.id) {
                const oldIndex = sections.findIndex((s) => s.id === active.id);
                const newIndex = sections.findIndex((s) => s.id === over.id);

                if (oldIndex !== -1 && newIndex !== -1 && jsonContent) {
                    // Atomic reorder operation
                    const newContent = reorderContent(jsonContent, sections, oldIndex, newIndex);
                    onReorder(newContent);

                    // Update local sections
                    setSections(arrayMove(sections, oldIndex, newIndex));
                }
            }
        },
        [sections, jsonContent, onReorder]
    );

    const sectionIds = useMemo(() => sections.map((s) => s.id), [sections]);

    if (isCollapsed) {
        return (
            <div className="w-10 flex flex-col items-center py-4 bg-[#12141a] border-r border-white/5">
                <button
                    onClick={() => setIsCollapsed(false)}
                    className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                    title="Expand Section Navigator"
                >
                    <ChevronRight size={16} />
                </button>
                <div className="mt-4 flex flex-col gap-2">
                    {sections.map((_, i) => (
                        <div
                            key={i}
                            className="w-6 h-8 rounded bg-white/10 flex items-center justify-center text-[8px] text-white/40"
                        >
                            {i + 1}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="w-56 flex flex-col bg-[#12141a] border-r border-white/5 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <Layers size={14} className="text-white/40" />
                    <span className="text-xs font-semibold text-white/60">Sections</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/40">
                        {sections.length}
                    </span>
                </div>
                <button
                    onClick={() => setIsCollapsed(true)}
                    className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                    title="Collapse"
                >
                    <ChevronLeft size={14} />
                </button>
            </div>

            {/* Section List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {sections.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-xs text-white/40">No sections found</p>
                        <p className="text-[10px] text-white/30 mt-1">
                            Add H1 headings to create sections
                        </p>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={sectionIds}
                            strategy={verticalListSortingStrategy}
                        >
                            {sections.map((section, index) => (
                                <SectionThumbnail
                                    key={section.id}
                                    section={section}
                                    index={index}
                                    isActive={section.id === activeSectionId}
                                    onClick={() => onSectionClick(section.id, section.nodeIndex)}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                )}
            </div>

            {/* Footer hint */}
            <div className="px-3 py-2 border-t border-white/5">
                <p className="text-[10px] text-white/30 text-center">
                    Drag to reorder • Click to navigate
                </p>
            </div>
        </div>
    );
}

export default SectionNavigator;
