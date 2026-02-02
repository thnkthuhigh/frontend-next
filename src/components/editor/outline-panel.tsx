"use client";

import { useMemo, useState } from "react";
import {
  FileText,
  Hash,
  List,
} from "lucide-react";
import { useDocumentStore } from "@/store/document-store";
import { cn } from "@/lib/utils";
import { extractHeadings, getDocumentStats } from "@/lib/json-utils";

// Outline Item Component - Enhanced with strong indentation and active state
interface OutlineItemProps {
  id: string;
  text: string;
  level: number;
  index: number;
  isActive: boolean;
  onScrollTo: (index: number) => void;
}

function OutlineItemComponent({ id, text, level, index, isActive, onScrollTo }: OutlineItemProps) {
  const isPageBreak = level === 0;
  
  // Strong indentation for hierarchy - 16px per level for clear tree structure
  const indentPadding = level === 1 ? 8 : level === 2 ? 24 : level === 3 ? 40 : 8;

  return (
    <button
      onClick={() => onScrollTo(index)}
      className={cn(
        "group relative w-full flex items-center gap-2 py-2.5 text-left transition-all duration-300 ease-out",
        "hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-lg",
        isActive && "bg-zinc-100 dark:bg-zinc-800/60"
      )}
      style={{ paddingLeft: `${indentPadding}px` }}
    >
      {/* Active Indicator Bar - Neutral color stripe on left */}
      <div className={cn(
        "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full transition-all duration-300",
        isActive
          ? "h-6 bg-zinc-800 dark:bg-zinc-200 opacity-100"
          : "h-0 bg-zinc-400 opacity-0 group-hover:h-4 group-hover:opacity-60"
      )} />
      
      {/* Text with strong typography hierarchy */}
      <span className={cn(
        "truncate transition-colors duration-200 flex-1 pl-2",
        isPageBreak
          ? "text-[10px] italic text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
          : level === 1
            ? "text-[13px] font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-zinc-100"
            : level === 2
              ? "text-[12px] font-semibold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200"
              : "text-[11px] font-medium text-zinc-500 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300",
        isActive && "!text-zinc-900 dark:!text-zinc-100 font-semibold"
      )}>
        {text || "Untitled"}
      </span>
    </button>
  );
}


// Main Outline Panel component - Flat design with active tracking
interface OutlinePanelProps {
  onScrollToBlock?: (blockId: string) => void;
  onScrollToHeading?: (headingIndex: number) => void;
}

export function OutlinePanel({ onScrollToBlock, onScrollToHeading }: OutlinePanelProps) {
  const { jsonContent } = useDocumentStore();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Extract headings from JSON content (Projection View)
  const headings = useMemo(() => extractHeadings(jsonContent), [jsonContent]);

  // Get document statistics
  const stats = useMemo(() => getDocumentStats(jsonContent), [jsonContent]);

  // Scroll to heading by index (scrolls to N-th heading in editor)
  const handleScrollToHeading = (index: number) => {
    setActiveIndex(index); // Track active heading
    
    if (onScrollToHeading) {
      onScrollToHeading(index);
    } else {
      // Fallback: find heading elements in the DOM and scroll
      const editorContent = document.querySelector('.ProseMirror');
      if (editorContent) {
        const headingElements = editorContent.querySelectorAll('h1, h2, h3');
        if (headingElements[index]) {
          headingElements[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  };

  // Empty state - minimal
  if (headings.length === 0) {
    return (
      <div className="py-6 px-2">
        <div className="text-center">
          <FileText size={24} className="mx-auto mb-2 text-muted-foreground/30" />
          <p className="text-[11px] text-muted-foreground/50">
            Add headings to see outline
          </p>
        </div>

        {/* Stats - minimal */}
        {stats.words > 0 && (
          <div className="mt-6 pt-4 border-t border-border/30">
            <div className="flex justify-between text-[10px] text-muted-foreground/40 px-1">
              <span>{stats.words} words</span>
              <span>{stats.paragraphs} ¶</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 px-1">
      {/* Header - minimal */}
      <div className="flex justify-between items-center px-2">
        <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
          Outline
        </span>
        <span className="text-[10px] text-muted-foreground/40 bg-muted/50 px-1.5 py-0.5 rounded">
          {headings.length}
        </span>
      </div>

      {/* Heading list - with active tracking */}
      <div className="flex flex-col gap-0.5">
        {headings.map((heading, idx) => (
          <OutlineItemComponent
            key={heading.id}
            id={heading.id}
            text={heading.text}
            level={heading.level}
            index={heading.index}
            isActive={activeIndex === heading.index}
            onScrollTo={handleScrollToHeading}
          />
        ))}
      </div>

      {/* Document stats - enhanced */}
      <div className="pt-4 mt-4 border-t border-border/20">
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="text-center p-2 rounded bg-muted/30">
            <div className="font-semibold text-foreground/70">{stats.words}</div>
            <div className="text-muted-foreground/50">words</div>
          </div>
          <div className="text-center p-2 rounded bg-muted/30">
            <div className="font-semibold text-foreground/70">{Math.ceil(stats.words / 200)}</div>
            <div className="text-muted-foreground/50">min read</div>
          </div>
        </div>
      </div>
    </div>
  );
}
