"use client";

import { useState, useCallback, useEffect } from "react";
import { Editor } from "@tiptap/react";
import { X, BookOpen, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { BibliographyEntry, CitationMark } from "@/types/document-structure";
import { formatInlineCitation } from "@/lib/citation-styles";

interface CitationViewProps {
  editor: Editor;
  onClose: () => void;
  isOpen: boolean;
  existingCitationId?: string; // For editing existing citation
}

export function CitationView({
  editor,
  onClose,
  isOpen,
  existingCitationId
}: CitationViewProps) {
  const [selectedEntryId, setSelectedEntryId] = useState<string>("");
  const [pageNumbers, setPageNumbers] = useState<string>("");
  const [prefix, setPrefix] = useState<string>("");
  const [suffix, setSuffix] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [availableEntries, setAvailableEntries] = useState<BibliographyEntry[]>([]);
  const [citationStyle, setCitationStyle] = useState<"apa" | "ieee" | "chicago" | "mla">("apa");

  // Load bibliography entries from document
  useEffect(() => {
    if (!isOpen) return;

    // Find bibliography node in document
    const bibliographyNode = editor.state.doc.descendants((node) => {
      if (node.type.name === 'bibliography') {
        const entries = node.attrs.entries as BibliographyEntry[];
        const style = node.attrs.style || 'apa';
        setAvailableEntries(entries || []);
        setCitationStyle(style);
        return false; // Stop searching
      }
      return true;
    });
  }, [isOpen, editor]);

  // Load existing citation data if editing
  useEffect(() => {
    if (existingCitationId && isOpen) {
      // Get citation mark at cursor
      const { state } = editor;
      const { from, to } = state.selection;
      
      state.doc.nodesBetween(from, to, (node) => {
        if (node.marks) {
          const citationMark = node.marks.find(m => m.type.name === 'citation');
          if (citationMark && citationMark.attrs.id === existingCitationId) {
            setSelectedEntryId(citationMark.attrs.id);
            setPageNumbers(citationMark.attrs.pageNumbers || "");
            setPrefix(citationMark.attrs.prefix || "");
            setSuffix(citationMark.attrs.suffix || "");
          }
        }
      });
    }
  }, [existingCitationId, isOpen, editor]);

  const handleInsertCitation = useCallback(() => {
    if (!selectedEntryId) return;

    const selectedEntry = availableEntries.find(e => e.id === selectedEntryId);
    if (!selectedEntry) return;

    // Build citation mark
    const citeMark: CitationMark = {
      id: selectedEntryId,
      pageNumbers: pageNumbers || undefined,
      prefix: prefix || undefined,
      suffix: suffix || undefined,
    };

    // Format the citation text
    const citationText = formatInlineCitation(
      selectedEntry,
      citationStyle,
      citeMark
    );

    // Insert or update citation
    const { from, to } = editor.state.selection;
    
    editor
      .chain()
      .focus()
      .deleteRange({ from, to })
      .insertContent(citationText)
      .setMark('citation', {
        id: selectedEntryId,
        pageNumbers: pageNumbers || undefined,
        prefix: prefix || undefined,
        suffix: suffix || undefined,
      })
      .run();

    onClose();
    resetForm();
  }, [selectedEntryId, pageNumbers, prefix, suffix, availableEntries, citationStyle, editor, onClose]);

  const resetForm = () => {
    setSelectedEntryId("");
    setPageNumbers("");
    setPrefix("");
    setSuffix("");
    setSearchQuery("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Filter entries by search query
  const filteredEntries = searchQuery
    ? availableEntries.filter(entry => {
        const searchLower = searchQuery.toLowerCase();
        return (
          entry.id.toLowerCase().includes(searchLower) ||
          entry.title.toLowerCase().includes(searchLower) ||
          entry.authors.some(a => a.toLowerCase().includes(searchLower)) ||
          entry.year.toString().includes(searchLower)
        );
      })
    : availableEntries;

  // Preview formatted citation
  const previewCitation = (() => {
    if (!selectedEntryId) return "";
    
    const selectedEntry = availableEntries.find(e => e.id === selectedEntryId);
    if (!selectedEntry) return "";
    
    const citeMark: CitationMark = {
      id: selectedEntryId,
      pageNumbers: pageNumbers || undefined,
      prefix: prefix || undefined,
      suffix: suffix || undefined,
    };
    
    return formatInlineCitation(selectedEntry, citationStyle, citeMark);
  })();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {existingCitationId ? "Edit Citation" : "Insert Citation"}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {availableEntries.length} references available
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by author, title, or year..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(80vh-200px)]">
          {/* No bibliography warning */}
          {availableEntries.length === 0 && (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">No bibliography found</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Insert a bibliography block first using <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">/bibliography</code>
              </p>
            </div>
          )}

          {/* Reference Selection */}
          {availableEntries.length > 0 && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Reference *
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  {filteredEntries.map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => setSelectedEntryId(entry.id)}
                      className={cn(
                        "w-full text-left px-4 py-3 transition-colors",
                        selectedEntryId === entry.id
                          ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {entry.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {entry.authors.join(", ")} ({entry.year})
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Cite key: <code className="px-1 bg-gray-100 dark:bg-gray-800 rounded">{entry.id}</code>
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                  {filteredEntries.length === 0 && (
                    <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No references match your search
                    </div>
                  )}
                </div>
              </div>

              {/* Citation Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Page Numbers
                  </label>
                  <input
                    type="text"
                    value={pageNumbers}
                    onChange={(e) => setPageNumbers(e.target.value)}
                    placeholder="e.g., 10-15, p. 42"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Prefix
                  </label>
                  <input
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    placeholder="e.g., see, cf."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Suffix
                </label>
                <input
                  type="text"
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                  placeholder="e.g., for more details"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Preview */}
              {previewCitation && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Preview ({citationStyle.toUpperCase()})
                  </label>
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-gray-900 dark:text-white font-mono text-sm">
                      {previewCitation}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {availableEntries.length > 0 && (
          <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleInsertCitation}
              disabled={!selectedEntryId}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors",
                selectedEntryId
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed"
              )}
            >
              {existingCitationId ? "Update Citation" : "Insert Citation"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
