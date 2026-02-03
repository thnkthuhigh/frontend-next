'use client';

import { useState, useEffect } from 'react';
import { Search, X, Loader2, ExternalLink, BookOpen, FileText, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTavilySearch, type TavilySearchResult } from '@/lib/tavily';
import { useResearchStore } from '@/store/research-store';
import type { Editor } from '@tiptap/react';

interface ResearchPanelProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ResearchPanel({ editor, isOpen, onClose }: ResearchPanelProps) {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'general' | 'academic'>('general');
  const { isSearching, results, answer, error, search, searchAcademic, clear } = useTavilySearch();

  const { setContext } = useResearchStore();

  const handleSearch = async () => {
    if (!query.trim()) return;

    if (searchType === 'academic') {
      await searchAcademic(query, 5);
    } else {
      await search(query, { maxResults: 5, includeAnswer: true });
    }
  };

  // Save research context when results change
  useEffect(() => {
    if (results.length > 0 && query) {
      setContext(query, results);
    }
  }, [results, query, setContext]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleInsertCitation = (result: TavilySearchResult) => {
    if (!editor) return;

    // Simple citation format
    const citation = `[${result.title}](${result.url})`;
    editor.chain().focus().insertContent(citation).run();
  };

  const handleInsertContent = (result: TavilySearchResult) => {
    if (!editor) return;

    const content = `\n\n**Source:** ${result.title}\n\n${result.content}\n\n[Read more](${result.url})\n\n`;
    editor.chain().focus().insertContent(content).run();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl flex flex-col z-40">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Research</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setSearchType('general')}
            className={cn(
              'flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              searchType === 'general'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            )}
          >
            General
          </button>
          <button
            onClick={() => setSearchType('academic')}
            className={cn(
              'flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              searchType === 'academic'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            )}
          >
            Academic
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={searchType === 'academic' ? 'Search academic sources...' : 'Search the web...'}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                clear();
              }}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={handleSearch}
          disabled={!query.trim() || isSearching}
          className={cn(
            'w-full mt-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors',
            query.trim() && !isSearching
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
          )}
        >
          {isSearching ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching...
            </span>
          ) : (
            'Search'
          )}
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {answer && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">
              Quick Answer
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">{answer}</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Results ({results.length})
            </h3>
            {results.map((result, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                    {result.title}
                  </h4>
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                  {result.content}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleInsertCitation(result)}
                    className="flex-1 px-2 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    Insert Citation
                  </button>
                  <button
                    onClick={() => handleInsertContent(result)}
                    className="flex-1 px-2 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Insert Content
                  </button>
                </div>

                {result.published_date && (
                  <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-2">
                    Published: {new Date(result.published_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {!isSearching && !error && results.length === 0 && query && (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No results found</p>
          </div>
        )}

        {!query && !results.length && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Search the web or academic sources
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Insert citations directly into your document
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
