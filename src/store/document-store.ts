/**
 * Document Store - Single Source of Truth Architecture
 * 
 * The editor uses Tiptap JSON (jsonContent) as the primary data format.
 * HTML is derived from JSON for export/preview compatibility.
 */

import { create } from "zustand";
import type { JSONContent } from "@tiptap/react";

export interface DocumentState {
  // Document metadata
  title: string;
  subtitle: string;
  author: string;
  date: string;

  // Single Source of Truth - Tiptap JSON content
  jsonContent: JSONContent | null;

  // Style and format settings
  selectedStyle: string;
  outputFormat: "docx" | "pdf";
  isProcessing: boolean;
  rawContent: string;
  
  // HTML content - derived from JSON for export compatibility
  htmlContent: string;

  // Actions
  setTitle: (title: string) => void;
  setSubtitle: (subtitle: string) => void;
  setAuthor: (author: string) => void;
  setDate: (date: string) => void;
  setSelectedStyle: (style: string) => void;
  setOutputFormat: (format: DocumentState["outputFormat"]) => void;
  setIsProcessing: (processing: boolean) => void;
  setRawContent: (content: string) => void;
  setHtmlContent: (content: string, markDirty?: boolean) => void;
  setJsonContent: (content: JSONContent) => void;
  reset: () => void;
}

const initialState = {
  title: "",
  subtitle: "",
  author: "",
  date: "",
  jsonContent: null as JSONContent | null,
  selectedStyle: "professional",
  outputFormat: "docx" as const,
  isProcessing: false,
  rawContent: "",
  htmlContent: "",
};

export const useDocumentStore = create<DocumentState>((set) => ({
  ...initialState,

  setTitle: (title) => set({ title }),
  setSubtitle: (subtitle) => set({ subtitle }),
  setAuthor: (author) => set({ author }),
  setDate: (date) => set({ date }),
  setSelectedStyle: (selectedStyle) => set({ selectedStyle }),
  setOutputFormat: (outputFormat) => set({ outputFormat }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setRawContent: (rawContent) => set({ rawContent }),
  setHtmlContent: (htmlContent) => set({ htmlContent }),
  setJsonContent: (jsonContent) => set({ jsonContent }),
  reset: () => set(initialState),
}));
