/**
 * List of Figures React Component (SPRINT 3)
 */

import React, { useEffect, useState, useCallback } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Image, RefreshCw } from 'lucide-react';
import { getAllFigures, CaptionInfo, formatFigureCaption } from '@/lib/caption-utils';
import { cn } from '@/lib/utils';

export function LOFComponent({ node, editor }: NodeViewProps) {
  const [figures, setFigures] = useState<CaptionInfo[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  const { title, autoUpdate } = node.attrs;

  /**
   * Generate LOF from current editor content
   */
  const generateLOF = useCallback(() => {
    setIsUpdating(true);

    try {
      const docContent = editor.getJSON();
      const allFigures = getAllFigures(docContent);
      setFigures(allFigures);
    } catch (error) {
      console.error('Error generating LOF:', error);
    } finally {
      setTimeout(() => setIsUpdating(false), 300);
    }
  }, [editor]);

  /**
   * Scroll to figure when clicked
   */
  const scrollToFigure = useCallback((figureId: string) => {
    const { doc } = editor.state;
    let figurePos: number | null = null;

    doc.descendants((node, pos) => {
      if (node.type.name === 'image' && node.attrs.id === figureId) {
        figurePos = pos;
        return false;
      }
    });

    if (figurePos !== null) {
      editor.commands.focus();
      editor.commands.setTextSelection(figurePos);
      
      const dom = editor.view.domAtPos(figurePos).node as HTMLElement;
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
      generateLOF();

      const handleUpdate = () => {
        generateLOF();
      };

      editor.on('update', handleUpdate);

      return () => {
        editor.off('update', handleUpdate);
      };
    }
  }, [autoUpdate, generateLOF, editor]);

  /**
   * Initial load
   */
  useEffect(() => {
    generateLOF();
  }, [generateLOF]);

  return (
    <NodeViewWrapper className="lof-block my-6">
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
          <div className="flex items-center gap-2">
            <Image className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-base text-foreground no-number">
              {title}
            </h3>
          </div>
          
          <button
            onClick={generateLOF}
            disabled={isUpdating}
            className={cn(
              "p-1.5 rounded hover:bg-muted transition-colors",
              isUpdating && "opacity-50 cursor-not-allowed"
            )}
            title="Update List of Figures"
          >
            <RefreshCw className={cn(
              "w-4 h-4 text-muted-foreground",
              isUpdating && "animate-spin"
            )} />
          </button>
        </div>

        {/* LOF Content */}
        <div className="px-4 py-4">
          {figures.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No figures found. Add images with captions to generate a list of figures.
            </p>
          ) : (
            <ol className="space-y-2 list-none">
              {figures.map((figure, index) => (
                <li
                  key={`${figure.id}-${index}`}
                  className="list-none"
                >
                  <button
                    onClick={() => scrollToFigure(figure.id)}
                    className={cn(
                      "text-left w-full group flex items-start",
                      "hover:text-accent transition-colors",
                      "py-1 px-2 rounded hover:bg-muted/50"
                    )}
                  >
                    <span className="text-sm group-hover:underline">
                      {formatFigureCaption(figure.number, figure.caption)}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Footer */}
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
