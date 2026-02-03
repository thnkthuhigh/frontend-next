/**
 * Bibliography View Component (SPRINT 4)
 * 
 * React component for rendering and managing bibliography
 * Used by BibliographyExtension as NodeView
 * 
 * Features:
 * - Display formatted bibliography entries
 * - Add/Edit/Delete entries
 * - Change citation style (APA, IEEE, Chicago, MLA)
 * - Sort bibliography
 * - Export to BibTeX/JSON
 * - Visual feedback for unused references
 */

import React, { useState, useMemo } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { BibliographyEntry, CitationStyle } from '@/types/document-structure';
import { 
  formatBibliographyEntry, 
  getBibliographyTitle,
  getStyleSortOrder 
} from '@/lib/citation-styles';
import { 
  sortBibliography,
  getAllCitations,
  exportToBibTeX,
  exportToJSON 
} from '@/lib/citation-utils';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const BibliographyComponent: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  editor,
}) => {
  const { title, style, entries, sortBy, showNumbers } = node.attrs;
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Get cited references from document
  const citedReferences = useMemo(() => {
    const content = editor.getJSON();
    const citations = getAllCitations(content);
    return new Set(citations.map(c => c.id));
  }, [editor]);

  // Sort bibliography entries
  const sortedEntries = useMemo(() => {
    const content = editor.getJSON();
    return sortBibliography(entries || [], sortBy, content);
  }, [entries, sortBy, editor]);

  // Handle style change
  const handleStyleChange = (newStyle: CitationStyle) => {
    updateAttributes({ style: newStyle });
    
    // Update title based on style
    const newTitle = getBibliographyTitle(newStyle);
    updateAttributes({ title: newTitle });
    
    // Update sort order based on style
    const newSortBy = getStyleSortOrder(newStyle);
    updateAttributes({ sortBy: newSortBy });
  };

  // Handle sort change
  const handleSortChange = (newSort: string) => {
    updateAttributes({ sortBy: newSort });
  };

  // Handle export
  const handleExport = (format: 'bibtex' | 'json') => {
    const data = format === 'bibtex' 
      ? exportToBibTeX(sortedEntries)
      : exportToJSON(sortedEntries);
    
    // Create download
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bibliography.${format === 'bibtex' ? 'bib' : 'json'}`;
    a.click();
    URL.revokeObjectURL(url);
    
    setShowExportMenu(false);
  };

  // Generate citation numbers for IEEE style
  const citationNumbers = useMemo(() => {
    const numbers = new Map<string, number>();
    if (style === 'ieee') {
      sortedEntries.forEach((entry, index) => {
        numbers.set(entry.id, index + 1);
      });
    }
    return numbers;
  }, [sortedEntries, style]);

  return (
    <NodeViewWrapper className="bibliography-block-wrapper">
      <div className="bibliography-container">
        {/* Header */}
        <div className="bibliography-header">
          <h2 className="bibliography-title">{title}</h2>
          
          <div className="bibliography-controls">
            {/* Style Selector */}
            <Select value={style} onValueChange={handleStyleChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apa">APA</SelectItem>
                <SelectItem value="ieee">IEEE</SelectItem>
                <SelectItem value="chicago">Chicago</SelectItem>
                <SelectItem value="mla">MLA</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Selector */}
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="author">By Author</SelectItem>
                <SelectItem value="year">By Year</SelectItem>
                <SelectItem value="title">By Title</SelectItem>
                <SelectItem value="citation-order">Citation Order</SelectItem>
              </SelectContent>
            </Select>

            {/* Export Menu */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExportMenu(!showExportMenu)}
              >
                Export ▾
              </Button>
              
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white border rounded shadow-lg z-10">
                  <button
                    className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                    onClick={() => handleExport('bibtex')}
                  >
                    Export as BibTeX
                  </button>
                  <button
                    className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                    onClick={() => handleExport('json')}
                  >
                    Export as JSON
                  </button>
                </div>
              )}
            </div>

            {/* Edit Mode Toggle */}
            <Button
              variant={isEditMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
            >
              {isEditMode ? 'View Mode' : 'Edit Mode'}
            </Button>
          </div>
        </div>

        {/* Bibliography Entries */}
        <div className="bibliography-entries">
          {sortedEntries.length === 0 ? (
            <div className="bibliography-empty">
              <p>No references yet. Add references to see them here.</p>
              <p className="text-sm text-gray-500 mt-2">
                Tip: Use citations in your document to automatically populate the bibliography.
              </p>
            </div>
          ) : (
            <ol className="bibliography-list" start={1}>
              {sortedEntries.map((entry, index) => {
                const isCited = citedReferences.has(entry.id);
                const citationNumber = style === 'ieee' ? citationNumbers.get(entry.id) : index + 1;
                
                return (
                  <li
                    key={entry.id}
                    className={`bibliography-entry ${!isCited ? 'unused' : ''}`}
                    data-entry-id={entry.id}
                  >
                    <div className="entry-content">
                      {/* Formatted entry */}
                      <div
                        className="entry-text"
                        dangerouslySetInnerHTML={{
                          __html: formatBibliographyEntry(entry, style, citationNumber),
                        }}
                      />
                      
                      {/* Unused warning */}
                      {!isCited && (
                        <div className="unused-warning">
                          <span className="text-xs text-amber-600">
                            ⚠ Not cited in document
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Edit controls (visible in edit mode) */}
                    {isEditMode && (
                      <div className="entry-actions">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // TODO: Open edit dialog
                            console.log('Edit entry:', entry.id);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const confirmed = confirm(
                              `Remove "${entry.title}" from bibliography?`
                            );
                            if (confirmed) {
                              editor.commands.removeBibliographyEntry(entry.id);
                            }
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* Footer Stats */}
        <div className="bibliography-footer">
          <div className="text-sm text-gray-500">
            {sortedEntries.length} {sortedEntries.length === 1 ? 'reference' : 'references'}
            {sortedEntries.length > 0 && (
              <>
                {' • '}
                {sortedEntries.filter(e => citedReferences.has(e.id)).length} cited
              </>
            )}
          </div>
        </div>
      </div>

      {/* Inline Styles */}
      <style jsx>{`
        .bibliography-block-wrapper {
          margin: 2rem 0;
          padding: 0;
        }

        .bibliography-container {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          padding: 1.5rem;
        }

        .bibliography-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e5e7eb;
        }

        .bibliography-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .bibliography-controls {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .bibliography-entries {
          min-height: 100px;
        }

        .bibliography-empty {
          text-align: center;
          padding: 3rem 1rem;
          color: #6b7280;
        }

        .bibliography-list {
          list-style: none;
          counter-reset: bib-counter;
          padding: 0;
          margin: 0;
        }

        .bibliography-entry {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 1rem 0;
          border-bottom: 1px solid #f3f4f6;
          position: relative;
        }

        .bibliography-entry:last-child {
          border-bottom: none;
        }

        .bibliography-entry.unused {
          opacity: 0.6;
          background: #fffbeb;
          padding: 1rem;
          border-radius: 4px;
          margin: 0.5rem 0;
        }

        .entry-content {
          flex: 1;
          padding-right: 1rem;
        }

        .entry-text {
          line-height: 1.6;
          color: #374151;
        }

        .entry-text :global(i) {
          font-style: italic;
        }

        .unused-warning {
          margin-top: 0.5rem;
        }

        .entry-actions {
          display: flex;
          gap: 0.25rem;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .bibliography-entry:hover .entry-actions {
          opacity: 1;
        }

        .bibliography-footer {
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
          text-align: center;
        }

        /* Print styles */
        @media print {
          .bibliography-controls,
          .entry-actions,
          .bibliography-footer {
            display: none;
          }

          .bibliography-container {
            border: none;
            padding: 0;
          }

          .bibliography-entry {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </NodeViewWrapper>
  );
};
