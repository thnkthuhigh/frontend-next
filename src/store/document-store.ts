/**
 * Document Store - Single Source of Truth Architecture
 *
 * The editor uses Tiptap JSON (jsonContent) as the primary data format.
 * HTML is derived from JSON for export/preview compatibility.
 *
 * Note: Uses localStorage for quick access.
 * IndexedDB auto-save is handled separately by AutoSaveManager.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { JSONContent } from "@tiptap/react";

// Page margins configuration (in mm)
export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

// Standard margin presets (in mm)
export const MARGIN_PRESETS = {
  normal: { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 },   // 1 inch
  narrow: { top: 12.7, right: 12.7, bottom: 12.7, left: 12.7 },   // 0.5 inch
  wide: { top: 25.4, right: 50.8, bottom: 25.4, left: 50.8 },     // 1 inch top/bottom, 2 inch sides
  custom: null, // User-defined
} as const;

export type MarginPreset = keyof typeof MARGIN_PRESETS;

import { DocumentStructure } from "../types/document-structure";

export interface DocumentState {
  // Document metadata
  title: string;
  subtitle: string;
  author: string;
  date: string;

  // Document structure for professional documents
  structure?: DocumentStructure;

  // Single Source of Truth - Tiptap JSON content
  jsonContent: JSONContent | null;

  // Style and format settings
  selectedStyle: string;
  outputFormat: "docx" | "pdf";
  isProcessing: boolean;
  rawContent: string;
  
  // HTML content - derived from JSON for export compatibility
  htmlContent: string;

  // Page layout settings
  margins: PageMargins;
  marginPreset: MarginPreset;

  // Actions
  setTitle: (title: string) => void;
  setSubtitle: (subtitle: string) => void;
  setAuthor: (author: string) => void;
  setDate: (date: string) => void;
  setStructure: (structure: DocumentStructure) => void;
  setSelectedStyle: (style: string) => void;
  setOutputFormat: (format: DocumentState["outputFormat"]) => void;
  setIsProcessing: (processing: boolean) => void;
  setRawContent: (content: string) => void;
  setHtmlContent: (content: string, markDirty?: boolean) => void;
  setJsonContent: (content: JSONContent) => void;
  setMargins: (margins: PageMargins) => void;
  setMarginPreset: (preset: MarginPreset) => void;
  reset: () => void;
}

// Add setStructure to initialState and store

const initialState = {
  title: "",
  subtitle: "",
  author: "",
  date: "",
  structure: undefined,
  jsonContent: null as JSONContent | null,
  selectedStyle: "professional",
  outputFormat: "docx" as const,
  isProcessing: false,
  rawContent: "",
  htmlContent: "",
  margins: { ...MARGIN_PRESETS.normal },
  marginPreset: "normal" as MarginPreset,
};

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set) => ({
      ...initialState,

      setTitle: (title) => set({ title }),
      setSubtitle: (subtitle) => set({ subtitle }),
      setAuthor: (author) => set({ author }),
      setDate: (date) => set({ date }),
      setStructure: (structure) => set({ structure }),
      setSelectedStyle: (selectedStyle) => set({ selectedStyle }),
      setOutputFormat: (outputFormat) => set({ outputFormat }),
      setIsProcessing: (isProcessing) => set({ isProcessing }),
      setRawContent: (rawContent) => set({ rawContent }),
      setHtmlContent: (htmlContent) => set({ htmlContent }),
      setJsonContent: (jsonContent) => set({ jsonContent }),
      setMargins: (margins) => set({ margins, marginPreset: "custom" }),
      setMarginPreset: (preset) => set({
        marginPreset: preset,
        margins: preset === "custom" ? undefined : { ...MARGIN_PRESETS[preset]! }
      }),
      reset: () => set(initialState),
    }),
    {
      name: "ai-doc-formatter-storage", // localStorage for quick sync access
      // Note: IndexedDB auto-save handled separately by AutoSaveManager
      partialize: (state) => ({
        // Only persist these fields
        title: state.title,
        subtitle: state.subtitle,
        author: state.author,
        date: state.date,
        structure: state.structure,
        jsonContent: state.jsonContent,
        htmlContent: state.htmlContent,
        rawContent: state.rawContent,
        selectedStyle: state.selectedStyle,
        margins: state.margins,
        marginPreset: state.marginPreset,
      }),
    }
  )
);
