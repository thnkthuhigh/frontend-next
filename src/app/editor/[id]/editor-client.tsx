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

export function EditorPageClient({ document, userId }: EditorPageClientProps) {
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  
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
    reset,
  } = useDocumentStore();

  // Initialize store from document data
  useEffect(() => {
    if (!isInitialized) {
      // Load document data into store
      setTitle(document.title || "");
      
      // Parse content JSON
      if (document.content && typeof document.content === 'object') {
        const content = document.content as Record<string, unknown>;
        
        // Check if it's a structured document with metadata
        if (content.metadata) {
          const metadata = content.metadata as Record<string, string>;
          setSubtitle(metadata.subtitle || "");
          setAuthor(metadata.author || "");
          setDate(metadata.date || "");
          setSelectedStyle(metadata.style || "professional");
        }
        
        // Set JSON content (Tiptap format)
        if (content.tiptap) {
          setJsonContent(content.tiptap as Record<string, unknown>);
        } else if (content.type === 'doc') {
          // Direct Tiptap JSON format
          setJsonContent(content as Record<string, unknown>);
        }
        
        // Set HTML if available
        if (content.html) {
          setHtmlContent(content.html as string);
        }
      }
      
      setIsInitialized(true);
    }
  }, [document, isInitialized, setTitle, setSubtitle, setAuthor, setDate, setJsonContent, setHtmlContent, setSelectedStyle]);

  // Prepare content for auto-save (combine all document data)
  const contentToSave: Json = {
    metadata: {
      subtitle,
      author,
      date,
      style: selectedStyle,
    },
    tiptap: jsonContent as Json,
    html: htmlContent,
  };

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

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0e12]">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Cloud Sync Status Bar */}
      <div className="h-10 bg-[#0a0b0e] border-b border-white/5 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <span className="text-white/30 text-xs">
            Editing: {document.title}
          </span>
        </div>

        {/* Save Status */}
        <div className="flex items-center gap-2">
          {saveError ? (
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle size={14} />
              <span className="text-xs">Error saving</span>
            </div>
          ) : isSaving ? (
            <div className="flex items-center gap-2 text-white/50">
              <Loader2 size={14} className="animate-spin" />
              <span className="text-xs">Saving...</span>
            </div>
          ) : lastSaved ? (
            <div className="flex items-center gap-2 text-green-400/70">
              <Cloud size={14} />
              <Check size={12} />
              <span className="text-xs">Saved</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-white/30">
              <CloudOff size={14} />
              <span className="text-xs">Not saved yet</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1">
        <DocumentFormatter />
      </div>
    </div>
  );
}
