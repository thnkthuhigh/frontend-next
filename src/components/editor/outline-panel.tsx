"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import {
  FileText,
  Hash,
  List,
  Maximize2,
  Minimize2,
  Table2,
  Image,
  Code,
  Minus,
} from "lucide-react";
import { useDocumentStore } from "@/store/document-store";
import { cn } from "@/lib/utils";
import { extractHeadings, getDocumentStats, type OutlineItemType } from "@/lib/json-utils";

// Outline Item Component - Enhanced with media markers
interface OutlineItemProps {
  id: string;
  text: string;
  level: number;
  index: number;
  isActive: boolean;
  type: OutlineItemType;
  parentHeadingIndex?: number;
  onScrollTo: (index: number) => void;
}

function OutlineItemComponent({
  id, text, level, index, isActive, type, parentHeadingIndex, onScrollTo
}: OutlineItemProps) {
  const isPageBreak = type === 'pageBreak';
  const isMedia = type === 'table' || type === 'image' || type === 'codeBlock';
  const isHeading = type === 'heading';

  // Indentation: headings by level, media indented more than parent
  const getIndent = () => {
    if (isMedia) return 52; // Media markers indented deeply
    if (level === 1) return 12;
    if (level === 2) return 28;
    if (level === 3) return 44;
    return 12;
  };

  // Icon for media types
  const MediaIcon = () => {
    if (type === 'table') return <Table2 size={12} className="text-blue-500 shrink-0" />;
    if (type === 'image') return <Image size={12} className="text-emerald-500 shrink-0" />;
    if (type === 'codeBlock') return <Code size={12} className="text-amber-500 shrink-0" />;
    if (type === 'pageBreak') return <Minus size={10} className="text-zinc-300 shrink-0" />;
    return null;
  };

  return (
    <button
      onClick={() => onScrollTo(index)}
      title={text || "Untitled"} // Show full text on hover
      className={cn(
        "group relative w-full flex items-center gap-1.5 text-left",
        "transition-all duration-150 ease-out",
        "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20",
        isActive && "bg-zinc-50 dark:bg-zinc-800/40",
        // H1 spacing
        isHeading && level === 1 && index > 0 && "mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800",
        // Media markers: smaller, subtle
        isMedia && "py-0.5"
      )}
      style={{
        paddingLeft: `${getIndent()}px`,
        paddingTop: isMedia ? '3px' : '6px',
        paddingBottom: isMedia ? '3px' : '6px',
        paddingRight: '8px'
      }}
    >
      {/* Active Indicator Bar */}
      {isHeading && (
        <div className={cn(
          "absolute left-0 top-1 bottom-1 w-[2px] transition-all duration-150",
          isActive ? "bg-zinc-300 dark:bg-zinc-600" : "bg-transparent group-hover:bg-zinc-200/50 dark:group-hover:bg-zinc-700/50"
        )} />
      )}

      {/* Icon for media types */}
      {(isMedia || isPageBreak) && <MediaIcon />}

      {/* Text */}
      <span className={cn(
        "truncate transition-colors duration-150 leading-snug",
        // Page break
        isPageBreak && "text-[9px] italic text-zinc-300 dark:text-zinc-600",
        // Media markers
        isMedia && "text-[10px] text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-400",
        // H1
        isHeading && level === 1 && cn(
          "text-[13px] font-semibold",
          isActive ? "text-zinc-700 dark:text-zinc-200" : "text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-700"
        ),
        // H2
        isHeading && level === 2 && cn(
          "text-[12px] font-medium",
          isActive ? "text-zinc-600 dark:text-zinc-300" : "text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-600"
        ),
        // H3
        isHeading && level === 3 && cn(
          "text-[11px] font-normal",
          isActive ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-500"
        )
      )}>
        {text || "Untitled"}
      </span>
    </button>
  );
}


// Main Outline Panel component - Flat design with active tracking
// P0-006: Enhanced with scroll sync via IntersectionObserver
interface OutlinePanelProps {
  onScrollToBlock?: (blockId: string) => void;
  onScrollToHeading?: (headingIndex: number) => void;
}

export function OutlinePanel({ onScrollToBlock, onScrollToHeading }: OutlinePanelProps) {
  const { jsonContent, title } = useDocumentStore();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  // P1-010: Enhanced collapse states - "all" shows everything, "h1" shows only H1, "h1h2" shows H1+H2
  const [displayLevel, setDisplayLevel] = useState<"all" | "h1" | "h1h2">("all");
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isScrollingRef = useRef(false);

  // Extract headings from JSON content (Projection View)
  const headings = useMemo(() => {
    const result = extractHeadings(jsonContent);
    
    // If no headings found but title exists, add title as virtual H1
    if (result.length === 0 && title && title.trim()) {
      return [{
        id: 'document-title',
        text: title,
        level: 1,
        index: 0,
        type: 'heading' as OutlineItemType,
      }];
    }
    
    return result;
  }, [jsonContent, title]);

  // Get document statistics
  const stats = useMemo(() => {
    return getDocumentStats(jsonContent);
  }, [jsonContent]);

  // P0-006: Scroll sync - Track visible headings with IntersectionObserver
  useEffect(() => {
    // Disconnect previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Don't observe if user is scrolling via outline click
    if (isScrollingRef.current) return;

    const editorContent = document.querySelector('.ProseMirror');
    if (!editorContent) return;

    const headingElements = editorContent.querySelectorAll('h1, h2, h3');
    if (headingElements.length === 0) return;

    // Create IntersectionObserver to track which heading is in view
    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Skip if user is actively scrolling from outline
        if (isScrollingRef.current) return;

        // Find the first heading that's entering the viewport
        const visibleEntries = entries.filter(entry => entry.isIntersecting);

        if (visibleEntries.length > 0) {
          // Get the topmost visible heading
          const topmostEntry = visibleEntries.reduce((prev, current) => {
            return prev.boundingClientRect.top < current.boundingClientRect.top ? prev : current;
          });

          const headingIndex = Array.from(headingElements).indexOf(topmostEntry.target as HTMLElement);
          if (headingIndex !== -1) {
            setActiveIndex(headingIndex);
          }
        }
      },
      {
        // Trigger when heading enters top 30% of viewport
        rootMargin: '-10% 0px -70% 0px',
        threshold: 0
      }
    );

    // Observe all headings
    headingElements.forEach((heading) => {
      observerRef.current?.observe(heading);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [headings, jsonContent]);

  // Scroll to heading by index (scrolls to N-th heading in editor)
  const handleScrollToHeading = useCallback((index: number) => {
    // Mark that we're scrolling from outline (disable observer briefly)
    isScrollingRef.current = true;
    setActiveIndex(index);

    // Special case: if clicking on virtual title (index 0 and id is 'document-title')
    const heading = headings[index];
    if (heading?.id === 'document-title') {
      // Scroll to top of document
      const editorContent = document.querySelector('.ProseMirror');
      if (editorContent) {
        editorContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 800);
      return;
    }

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

    // Re-enable observer after scroll animation completes
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 800);
  }, [onScrollToHeading, headings]);

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

  // P1-010: Filter headings based on display level
  const filteredHeadings = useMemo(() => {
    if (displayLevel === "all") return headings;
    if (displayLevel === "h1") return headings.filter(h => h.level === 1);
    if (displayLevel === "h1h2") return headings.filter(h => h.level <= 2);
    return headings;
  }, [headings, displayLevel]);

  // P1-010: Cycle through display levels
  const cycleDisplayLevel = useCallback(() => {
    setDisplayLevel(prev => {
      if (prev === "all") return "h1";
      if (prev === "h1") return "h1h2";
      return "all";
    });
  }, []);

  return (
    <div className="space-y-3 px-1">
      {/* Header - P1-010: Enhanced collapse/expand with level controls */}
      <div className="flex justify-between items-center px-2">
        <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
          Outline
        </span>
        <div className="flex items-center gap-1">
          {/* P1-010: Show filtered count vs total */}
          <span className="text-[10px] text-muted-foreground/40 bg-muted/50 px-1.5 py-0.5 rounded">
            {filteredHeadings.length}{displayLevel !== "all" && `/${headings.length}`}
          </span>
          {/* P1-010: Collapse to H1 only button */}
          {headings.some(h => h.level > 1) && (
            <button
              onClick={() => setDisplayLevel(displayLevel === "h1" ? "all" : "h1")}
              className={cn(
                "p-1 rounded transition-colors",
                displayLevel === "h1"
                  ? "bg-zinc-200 dark:bg-zinc-700 text-foreground"
                  : "hover:bg-muted/50 text-muted-foreground/50 hover:text-muted-foreground"
              )}
              title={displayLevel === "h1" ? "Expand all levels" : "Show H1 only"}
            >
              <Minimize2 size={11} />
            </button>
          )}
          {/* P1-010: Expand all button */}
          {displayLevel !== "all" && (
            <button
              onClick={() => setDisplayLevel("all")}
              className="p-1 rounded hover:bg-muted/50 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              title="Expand all levels"
            >
              <Maximize2 size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Outline list - headings + media markers */}
      <div className="flex flex-col gap-0.5 transition-all duration-300">
        {filteredHeadings.map((heading) => (
          <OutlineItemComponent
            key={heading.id}
            id={heading.id}
            text={heading.text}
            level={heading.level}
            index={heading.index}
            type={heading.type}
            parentHeadingIndex={heading.parentHeadingIndex}
            isActive={activeIndex === heading.index}
            onScrollTo={handleScrollToHeading}
          />
        ))}
      </div>

      {/* Document stats - Only show when there's actual content */}
      {stats.words > 0 && (
        <div className="pt-3 mt-4 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-center gap-3 text-[10px] text-zinc-400 dark:text-zinc-500">
            <span className="flex items-center gap-1">
              <span>📄</span>
              <span>{stats.words} words</span>
            </span>
            <span className="text-zinc-200 dark:text-zinc-700">•</span>
            <span className="flex items-center gap-1">
              <span>⏱</span>
              <span>{Math.ceil(stats.words / 200)} min</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
