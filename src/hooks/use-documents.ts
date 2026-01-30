"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/database.types";
import { Json } from "@/lib/supabase/database.types";

type Document = Database["public"]["Tables"]["documents"]["Row"];

/**
 * Custom hook for debouncing values
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for fetching a single document
 */
export function useDocument(documentId: string | null) {
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) {
      setDocument(null);
      setIsLoading(false);
      return;
    }

    const fetchDocument = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from("documents")
          .select("*")
          .eq("id", documentId)
          .single();

        if (fetchError) throw fetchError;
        setDocument(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch document");
        setDocument(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();
  }, [documentId]);

  return { document, isLoading, error, setDocument };
}

/**
 * Hook for auto-saving document content with debounce
 */
export function useAutoSave(
  documentId: string | null,
  content: Json | null,
  title: string,
  debounceMs: number = 1000
) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Track if content has actually changed
  const lastContentRef = useRef<string>("");
  const lastTitleRef = useRef<string>("");

  // Debounce both content and title
  const debouncedContent = useDebounce(content, debounceMs);
  const debouncedTitle = useDebounce(title, debounceMs);

  useEffect(() => {
    if (!documentId || !debouncedContent) return;

    const contentString = JSON.stringify(debouncedContent);

    // Skip if nothing changed
    if (contentString === lastContentRef.current && debouncedTitle === lastTitleRef.current) {
      return;
    }

    const saveDocument = async () => {
      setIsSaving(true);
      setSaveError(null);

      try {
        const supabase = createClient();
        
        // Check if content has actual data (not just empty structure)
        const hasContent = () => {
          if (typeof debouncedContent !== 'object' || !debouncedContent) return false;
          const content = debouncedContent as Record<string, unknown>;
          
          // Check tiptap content
          if (content.tiptap && typeof content.tiptap === 'object') {
            const tiptap = content.tiptap as Record<string, unknown>;
            if (tiptap.content && Array.isArray(tiptap.content) && tiptap.content.length > 0) {
              // Check if there's actual text or meaningful content (not just empty paragraphs)
              const hasText = tiptap.content.some((node: unknown) => {
                const n = node as Record<string, unknown>;
                return n.type !== 'paragraph' || (n.content && Array.isArray(n.content) && n.content.length > 0);
              });
              return hasText;
            }
          }
          
          // Check HTML content
          if (content.html && typeof content.html === 'string' && content.html.length > 50) {
            return true;
          }
          
          return false;
        };

        // Prepare update object
        const updateData: Record<string, unknown> = {
          content: debouncedContent,
          title: debouncedTitle,
          updated_at: new Date().toISOString(),
        };

        // Auto-update status to 'generated' if content exists
        if (hasContent()) {
          updateData.status = 'generated';
        }

        const { error } = await supabase
          .from("documents")
          .update(updateData as never)
          .eq("id", documentId);

        if (error) throw error;

        lastContentRef.current = contentString;
        lastTitleRef.current = debouncedTitle;
        setLastSaved(new Date());
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Failed to save");
        console.error("Auto-save error:", err);
      } finally {
        setIsSaving(false);
      }
    };

    saveDocument();
  }, [documentId, debouncedContent, debouncedTitle]);

  return { isSaving, lastSaved, saveError };
}

/**
 * Hook for document CRUD operations
 */
export function useDocumentOperations() {
  const [isLoading, setIsLoading] = useState(false);

  const createDocument = useCallback(async (userId: string, title: string = "Untitled Document") => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("documents")
        .insert({
          user_id: userId,
          title,
          content: { type: "doc", content: [] } as Json,
          status: 'draft',
        } as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateDocument = useCallback(async (
    documentId: string,
    updates: { title?: string; content?: Json }
  ) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("documents")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", documentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteDocument = useCallback(async (documentId: string) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);

      if (error) throw error;
      return true;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const duplicateDocument = useCallback(async (document: Document) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("documents")
        .insert({
          user_id: document.user_id,
          title: `${document.title} (Copy)`,
          content: document.content,
          status: document.status, // Keep same status as original
        } as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createDocument,
    updateDocument,
    deleteDocument,
    duplicateDocument,
    isLoading,
  };
}
