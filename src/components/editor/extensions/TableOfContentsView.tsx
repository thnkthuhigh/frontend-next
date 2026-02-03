/**
 * Table of Contents React Component (SPRINT 2)
 * 
 * Renders a dynamic TOC with:
 * - Numbered headings from Main Content
 * - Clickable links that scroll to heading
 * - Hierarchical indentation
 * - Update button (manual refresh)
 * - Page numbers (when available)
 */

import React, { useEffect, useState, useCallback } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { BookOpen, RefreshCw, Settings } from 'lucide-react';
import { generateTOCHeadings, TOCHeading } from '@/lib/numbering-utils';
import { cn } from '@/lib/utils';

export function TOCComponent({ node, editor, updateAttributes }: NodeViewProps) {
  const [headings, setHeadings] = useState<TOCHeading[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  const { title, depth, includeNumbers, autoUpdate } = node.attrs;

  /**
   * Generate TOC from current editor content
   */
  const generateTOC = useCallback(() => {
    setIsUpdating(true);

    try {
      const docContent = editor.getJSON();
      
      // Get document structure if available (3-zone)
      const documentStructure = (editor as any).storage?.documentStructure || undefined;
      
      // Generate numbered headings
      const tocHeadings = generateTOCHeadings(docContent, documentStructure);
      
      // Filter by depth
      const filteredHeadings = tocHeadings.filter(h => h.level <= depth);
      
      setHeadings(filteredHeadings);
    } catch (error) {
      console.error('Error generating TOC:', error);
    } finally {
      setTimeout(() => setIsUpdating(false), 300);
    }
  }, [editor, depth]);

  /**
   * Scroll to heading when clicked
   */
  const scrollToHeading = useCallback((headingId: string) => {
    // Find heading in editor
    const { doc } = editor.state;
    let headingPos: number | null = null;

    doc.descendants((node, pos) => {
      if (node.type.name === 'heading' && node.attrs.id === headingId) {
        headingPos = pos;
        return false; // Stop traversal
      }
    });

    if (headingPos !== null) {
      // Set cursor to heading position
      editor.commands.focus();
      editor.commands.setTextSelection(headingPos);
      
      // Scroll into view
      const dom = editor.view.domAtPos(headingPos).node as HTMLElement;
      if (dom) {
        dom.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [editor]);

  /**
   * Auto-update on content change
   */
  useEffect(() => {
    if (autoUpdate) {
      generateTOC();

      // Listen for editor updates
      const handleUpdate = () => {
        generateTOC();
      };

      editor.on('update', handleUpdate);

      return () => {
        editor.off('update', handleUpdate);
      };
    }
  }, [autoUpdate, generateTOC, editor]);

  /**
   * Initial load
   */
  useEffect(() => {
    generateTOC();
  }, [generateTOC]);

  return (
    <NodeViewWrapper className="toc-block my-6">
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-base text-foreground no-number">
              {title}
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Manual Update Button */}
            <button
              onClick={generateTOC}
              disabled={isUpdating}
              className={cn(
                "p-1.5 rounded hover:bg-muted transition-colors",
                isUpdating && "opacity-50 cursor-not-allowed"
              )}
              title="Update Table of Contents"
            >
              <RefreshCw className={cn(
                "w-4 h-4 text-muted-foreground",
                isUpdating && "animate-spin"
              )} />
            </button>

            {/* Settings placeholder for future */}
            <button
              className="p-1.5 rounded hover:bg-muted transition-colors opacity-50 cursor-not-allowed"
              title="TOC Settings (Coming Soon)"
              disabled
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* TOC Content */}
        <div className="px-4 py-4">
          {headings.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No headings found. Add headings to your document to generate a table of contents.
            </p>
          ) : (
            <ol className="space-y-2">
              {headings.map((heading, index) => {
                const indent = (heading.level - 1) * 24; // 24px per level
                
                return (
                  <li
                    key={`${heading.id}-${index}`}
                    style={{ marginLeft: `${indent}px` }}
                    className="list-none"
                  >
                    <button
                      onClick={() => scrollToHeading(heading.id)}
                      className={cn(
                        "text-left w-full group flex items-start justify-between",
                        "hover:text-accent transition-colors",
                        "py-1 px-2 rounded hover:bg-muted/50",
                        heading.level === 1 && "font-semibold text-foreground",
                        heading.level === 2 && "font-medium text-foreground/90",
                        heading.level === 3 && "text-foreground/80"
                      )}
                    >
                      <span className="flex-1 flex items-baseline gap-2">
                        {includeNumbers && heading.number && (
                          <span className="text-muted-foreground font-mono text-sm shrink-0">
                            {heading.number}
                          </span>
                        )}
                        <span className="group-hover:underline">
                          {heading.text || 'Untitled'}
                        </span>
                      </span>
                      
                      {heading.page && (
                        <span className="text-xs text-muted-foreground font-mono ml-2 shrink-0">
                          {heading.page}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* Footer - Auto-update indicator */}
        {autoUpdate && (
          <div className="px-4 py-2 bg-muted/20 border-t border-border">
            <p className="text-xs text-muted-foreground">
              ✓ Auto-updating enabled
            </p>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
