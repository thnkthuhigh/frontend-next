"use client";

import { useMemo } from "react";
import {
  Heading1,
  Heading2,
  Heading3,
  FileText,
  Hash,
  List,
} from "lucide-react";
import { useDocumentStore } from "@/store/document-store";
import { cn } from "@/lib/utils";
import { extractHeadings, getDocumentStats } from "@/lib/json-utils";

// Heading icon map by level
const headingIcons: Record<number, React.ElementType> = {
  1: Heading1,
  2: Heading2,
  3: Heading3,
};

// Outline Item Component - displays a single heading
interface OutlineItemProps {
  id: string;
  text: string;
  level: number;
  index: number;
  onScrollTo: (index: number) => void;
}

function OutlineItemComponent({ id, text, level, index, onScrollTo }: OutlineItemProps) {
  const IconComponent = headingIcons[level] || Hash;
  const indentClass = level === 1 ? "pl-0" : level === 2 ? "pl-3" : "pl-6";

  return (
    <button
      onClick={() => onScrollTo(index)}
      className={cn(
        "w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all",
        "hover:bg-card/80 hover:border-border border border-transparent",
        indentClass
      )}
    >
      <div className={cn(
        "p-1 rounded shrink-0",
        level === 1 ? "bg-primary/20 text-primary" : 
        level === 2 ? "bg-blue-500/20 text-blue-500" : 
        "bg-secondary/50 text-muted-foreground"
      )}>
        <IconComponent size={12} />
      </div>
      <span className={cn(
        "text-xs truncate flex-1",
        level === 1 ? "font-semibold text-foreground" : "text-muted-foreground"
      )}>
        {text || "Untitled"}
      </span>
    </button>
  );
}

// Main Outline Panel component - reads from jsonContent (Single Source of Truth)
interface OutlinePanelProps {
  onScrollToBlock?: (blockId: string) => void;
  onScrollToHeading?: (headingIndex: number) => void;
}

export function OutlinePanel({ onScrollToBlock, onScrollToHeading }: OutlinePanelProps) {
  const { jsonContent } = useDocumentStore();

  // Extract headings from JSON content (Projection View)
  const headings = useMemo(() => extractHeadings(jsonContent), [jsonContent]);
  
  // Get document statistics
  const stats = useMemo(() => getDocumentStats(jsonContent), [jsonContent]);

  // Scroll to heading by index (scrolls to N-th heading in editor)
  const handleScrollToHeading = (index: number) => {
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

  // Empty state
  if (headings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="p-3 rounded-full bg-secondary/50 mb-3">
          <List size={20} className="text-muted-foreground opacity-60" />
        </div>
        <p className="text-xs text-muted-foreground mb-1">
          No headings yet
        </p>
        <p className="text-[10px] text-muted-foreground/60">
          Add headings (H1, H2, H3) to see outline
        </p>
        
        {/* Stats */}
        {stats.words > 0 && (
          <div className="mt-4 pt-4 border-t border-border w-full">
            <div className="flex justify-around text-[10px] text-muted-foreground">
              <div className="text-center">
                <div className="font-medium text-foreground">{stats.words}</div>
                <div>words</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-foreground">{stats.paragraphs}</div>
                <div>paragraphs</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header with stats */}
      <div className="flex justify-between items-center px-1 pb-2 border-b border-border">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Outline
        </span>
        <span className="text-[10px] text-muted-foreground">
          {headings.length} heading{headings.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Heading list */}
      <div className="flex flex-col gap-0.5">
        {headings.map((heading, idx) => (
          <OutlineItemComponent
            key={heading.id}
            id={heading.id}
            text={heading.text}
            level={heading.level}
            index={heading.index}
            onScrollTo={handleScrollToHeading}
          />
        ))}
      </div>

      {/* Document stats */}
      <div className="pt-3 mt-3 border-t border-border">
        <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <FileText size={10} />
            <span>{stats.words} words</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Hash size={10} />
            <span>{stats.characters} chars</span>
          </div>
        </div>
      </div>
    </div>
  );
}
