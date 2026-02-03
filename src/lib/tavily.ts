/**
 * Tavily API Wrapper for Research Agent
 * Provides web search capabilities for academic research
 */

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

export interface TavilySearchResponse {
  query: string;
  results: TavilySearchResult[];
  answer?: string;
  images?: string[];
}

export interface TavilySearchOptions {
  searchDepth?: 'basic' | 'advanced';
  topic?: 'general' | 'news';
  maxResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
  includeAnswer?: boolean;
  includeImages?: boolean;
}

class TavilyClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }

  /**
   * Search the web using Tavily API
   */
  async search(
    query: string,
    options: TavilySearchOptions = {}
  ): Promise<TavilySearchResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/research/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          search_depth: options.searchDepth || 'basic',
          topic: options.topic || 'general',
          max_results: options.maxResults || 5,
          include_domains: options.includeDomains || [],
          exclude_domains: options.excludeDomains || [],
          include_answer: options.includeAnswer !== false,
          include_images: options.includeImages || false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Tavily search failed:', error);
      throw error;
    }
  }

  /**
   * Search academic sources
   */
  async searchAcademic(
    query: string,
    maxResults: number = 5
  ): Promise<TavilySearchResponse> {
    const academicDomains = [
      'scholar.google.com',
      'arxiv.org',
      'pubmed.ncbi.nlm.nih.gov',
      'ieee.org',
      'springer.com',
      'sciencedirect.com',
      'jstor.org',
      'researchgate.net',
    ];

    return this.search(query, {
      searchDepth: 'advanced',
      maxResults,
      includeDomains: academicDomains,
      includeAnswer: true,
    });
  }

  /**
   * Search news sources
   */
  async searchNews(
    query: string,
    maxResults: number = 5
  ): Promise<TavilySearchResponse> {
    return this.search(query, {
      topic: 'news',
      maxResults,
      includeAnswer: false,
    });
  }

  /**
   * Quick answer (single comprehensive response)
   */
  async quickAnswer(query: string): Promise<string> {
    const response = await this.search(query, {
      searchDepth: 'basic',
      maxResults: 3,
      includeAnswer: true,
    });

    return response.answer || 'No answer found';
  }
}

// Export singleton instance
export const tavilyClient = new TavilyClient();

/**
 * React Hook for Tavily Search
 */
import { useState, useCallback } from 'react';

export function useTavilySearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<TavilySearchResult[]>([]);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(
    async (query: string, options?: TavilySearchOptions) => {
      setIsSearching(true);
      setError(null);

      try {
        const response = await tavilyClient.search(query, options);
        setResults(response.results);
        setAnswer(response.answer || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults([]);
        setAnswer(null);
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  const searchAcademic = useCallback(
    async (query: string, maxResults?: number) => {
      setIsSearching(true);
      setError(null);

      try {
        const response = await tavilyClient.searchAcademic(query, maxResults);
        setResults(response.results);
        setAnswer(response.answer || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Academic search failed');
        setResults([]);
        setAnswer(null);
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  const clear = useCallback(() => {
    setResults([]);
    setAnswer(null);
    setError(null);
  }, []);

  return {
    isSearching,
    results,
    answer,
    error,
    search,
    searchAcademic,
    clear,
  };
}
