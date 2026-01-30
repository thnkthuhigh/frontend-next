"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Database } from "@/lib/supabase/database.types";
import { useDocumentStore } from "@/store/document-store";
import { useAutoSave } from "@/hooks/use-documents";
import { DocumentFormatter } from "@/components/document-formatter";
import {
  ArrowLeft,
  Cloud,
  CloudOff,
  Loader2,
  Check,
  AlertCircle
} from "lucide-react";
import { Json } from "@/lib/supabase/database.types";

type Document = Database["public"]["Tables"]["documents"]["Row"];

interface EditorPageClientProps {
  document: Document;
  userId: string;
}

interface SaveStatus {
  isSaving: boolean;
  lastSaved: Date | null;
  saveError: string | null;
}

export function EditorPageClient({ document, userId }: EditorPageClientProps) {
  const router = useRouter();
  const [initializedDocId, setInitializedDocId] = useState<string | null>(null);

  // Use status field to determine initial view mode
  // draft -> show input/generate view
  // generated -> show editor view
  const initialViewMode = document.status === 'generated' ? 'editor' : 'input';

  const {
    title,
    setTitle,
    subtitle,
    setSubtitle,
    author,
    setAuthor,
    date,
    setDate,
    jsonContent,
    setJsonContent,
    htmlContent,
    setHtmlContent,
    selectedStyle,
    setSelectedStyle,
    margins,
    setMargins,
    marginPreset,
    setMarginPreset,
    setRawContent,
    reset,
  } = useDocumentStore();

  // Initialize store from document data - triggers when document.id changes
  useEffect(() => {
    if (initializedDocId !== document.id) {
      // Reset rawContent to prevent showing content from previous document
      setRawContent("");
      
      // Load document data into store
      setTitle(document.title || "");

      // Parse content JSON
      if (document.content && typeof document.content === 'object') {
        const content = document.content as Record<string, unknown>;

        // Check if it's a structured document with metadata (P1-DATA-001: Persist settings)
        if (content.metadata) {
          const metadata = content.metadata as Record<string, unknown>;
          setSubtitle((metadata.subtitle as string) || "");
          setAuthor((metadata.author as string) || "");
          setDate((metadata.date as string) || "");
          setSelectedStyle((metadata.style as string) || "professional");
          
          // Restore margins and marginPreset if available
          if (metadata.margins && typeof metadata.margins === 'object') {
            setMargins(metadata.margins as any);
          }
          if (metadata.marginPreset) {
            setMarginPreset(metadata.marginPreset as any);
          }
        } else {
          // Reset metadata fields for new/empty documents
          setSubtitle("");
          setAuthor("");
          setDate("");
        }

        // Set JSON content (Tiptap format)
        if (content.tiptap) {
          setJsonContent(content.tiptap as Record<string, unknown>);
        } else if (content.type === 'doc') {
          // Direct Tiptap JSON format
          setJsonContent(content as Record<string, unknown>);
        } else {
          // Reset JSON content for new/empty documents
          setJsonContent({ type: 'doc', content: [] });
        }

        // Set HTML if available
        if (content.html) {
          setHtmlContent(content.html as string);
        } else {
          // Reset HTML content for new/empty documents
          setHtmlContent("");
        }
      } else {
        // Reset all content fields for completely empty documents
        setSubtitle("");
        setAuthor("");
        setDate("");
        setJsonContent({ type: 'doc', content: [] });
        setHtmlContent("");
      }

      setInitializedDocId(document.id);
    }
  }, [document, initializedDocId, setTitle, setSubtitle, setAuthor, setDate, setJsonContent, setHtmlContent, setSelectedStyle, setRawContent]);

  // Prepare content for auto-save (P1-DATA-001: Persist all settings)
  const contentToSave: Json = {
    metadata: {
      subtitle,
      author,
      date,
      style: selectedStyle,
      margins: margins as unknown as Json,
      marginPreset,
    } as Json,
    tiptap: jsonContent as Json,
    html: htmlContent,
  } as Json;

  // Auto-save hook
  const { isSaving, lastSaved, saveError } = useAutoSave(
    document.id,
    contentToSave,
    title,
    1500 // 1.5 second debounce
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Don't reset if navigating to another editor page
      // reset();
    };
  }, []);

  const handleBack = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  if (initializedDocId !== document.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  // Prepare save status for unified header
  const saveStatus: SaveStatus = {
    isSaving,
    lastSaved,
    saveError,
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main Editor with unified header */}
      <DocumentFormatter
        initialViewMode={initialViewMode}
        documentId={document.id}
        saveStatus={saveStatus}
      />
    </div>
  );
}
