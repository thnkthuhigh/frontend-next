import { create } from 'zustand';
import type { TavilySearchResult } from '@/lib/tavily';

interface ResearchContext {
  results: TavilySearchResult[];
  query: string | null;
  timestamp: number | null;
}

interface ResearchStore {
  context: ResearchContext;
  setContext: (query: string, results: TavilySearchResult[]) => void;
  clearContext: () => void;
  hasContext: () => boolean;
  getContextString: () => string;
}

export const useResearchStore = create<ResearchStore>((set, get) => ({
  context: {
    results: [],
    query: null,
    timestamp: null,
  },
  
  setContext: (query: string, results: TavilySearchResult[]) => {
    set({
      context: {
        query,
        results: results.slice(0, 3), // Keep top 3 most relevant
        timestamp: Date.now(),
      },
    });
  },
  
  clearContext: () => {
    set({
      context: {
        results: [],
        query: null,
        timestamp: null,
      },
    });
  },
  
  hasContext: () => {
    const { context } = get();
    // Context valid for 5 minutes
    if (!context.timestamp) return false;
    const age = Date.now() - context.timestamp;
    return age < 5 * 60 * 1000 && context.results.length > 0;
  },
  
  getContextString: () => {
    const { context } = get();
    if (!context.query || context.results.length === 0) return '';
    
    const sources = context.results
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.content.slice(0, 200)}...\nSource: ${r.url}`)
      .join('\n\n');
    
    return `\n\n---RESEARCH CONTEXT---\nQuery: "${context.query}"\n\nTop Sources:\n${sources}\n---END CONTEXT---\n\n`;
  },
}));
