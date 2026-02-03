/**
 * List of Tables React Component (SPRINT 3)
 */

import React, { useEffect, useState, useCallback } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Table, RefreshCw } from 'lucide-react';
import { getAllTables, CaptionInfo, formatTableCaption } from '@/lib/caption-utils';
import { cn } from '@/lib/utils';

export function LOTComponent({ node, editor }: NodeViewProps) {
  const [tables, setTables] = useState<CaptionInfo[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  const { title, autoUpdate } = node.attrs;

  /**
   * Generate LOT from current editor content
   */
  const generateLOT = useCallback(() => {
    setIsUpdating(true);

    try {
      const docContent = editor.getJSON();
      const allTables = getAllTables(docContent);
      setTables(allTables);
    } catch (error) {
      console.error('Error generating LOT:', error);
    } finally {
      setTimeout(() => setIsUpdating(false), 300);
    }
  }, [editor]);

  /**
   * Scroll to table when clicked
   */
  const scrollToTable = useCallback((tableId: string) => {
    const { doc } = editor.state;
    let tablePos: number | null = null;

    doc.descendants((node, pos) => {
      if (node.type.name === 'table' && node.attrs.id === tableId) {
        tablePos = pos;
        return false;
      }
    });

    if (tablePos !== null) {
      editor.commands.focus();
      editor.commands.setTextSelection(tablePos);
      
      const dom = editor.view.domAtPos(tablePos).node as HTMLElement;
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
      generateLOT();

      const handleUpdate = () => {
        generateLOT();
      };

      editor.on('update', handleUpdate);

      return () => {
        editor.off('update', handleUpdate);
      };
    }
  }, [autoUpdate, generateLOT, editor]);

  /**
   * Initial load
   */
  useEffect(() => {
    generateLOT();
  }, [generateLOT]);

  return (
    <NodeViewWrapper className="lot-block my-6">
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
          <div className="flex items-center gap-2">
            <Table className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-base text-foreground no-number">
              {title}
            </h3>
          </div>
          
          <button
            onClick={generateLOT}
            disabled={isUpdating}
            className={cn(
              "p-1.5 rounded hover:bg-muted transition-colors",
              isUpdating && "opacity-50 cursor-not-allowed"
            )}
            title="Update List of Tables"
          >
            <RefreshCw className={cn(
              "w-4 h-4 text-muted-foreground",
              isUpdating && "animate-spin"
            )} />
          </button>
        </div>

        {/* LOT Content */}
        <div className="px-4 py-4">
          {tables.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No tables found. Add tables with captions to generate a list of tables.
            </p>
          ) : (
            <ol className="space-y-2 list-none">
              {tables.map((table, index) => (
                <li
                  key={`${table.id}-${index}`}
                  className="list-none"
                >
                  <button
                    onClick={() => scrollToTable(table.id)}
                    className={cn(
                      "text-left w-full group flex items-start",
                      "hover:text-accent transition-colors",
                      "py-1 px-2 rounded hover:bg-muted/50"
                    )}
                  >
                    <span className="text-sm group-hover:underline">
                      {formatTableCaption(table.number, table.caption)}
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
