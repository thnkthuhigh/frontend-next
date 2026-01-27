"use client";

import { useState, useCallback, useEffect } from "react";
import {
  FileDown,
  Wand2,
  FileText,
  LayoutTemplate,
  Eye,
  Edit3,
  Loader2,
  Settings2,
  PanelLeftClose,
  PanelLeft,
  ChevronLeft,
  Sparkles,
  Download,
  Palette,
  Type,
  LayoutList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

import { OutlinePanel } from "@/components/editor/outline-panel";
import { DocumentEditor } from "@/components/editor/DocumentEditor";
import { TemplatesPanel } from "@/components/templates/templates-panel";
import { useDocumentStore, DocumentBlock } from "@/store/document-store";
import { analyzeContent, formatStructure, downloadBlob } from "@/lib/api";
import { cn } from "@/lib/utils";

type ViewMode = "input" | "editor";
type Tab = "paste" | "templates";
type SidebarTab = "theme" | "structure";

import { STYLE_OPTIONS } from "@/lib/document-styles";

export function DocumentFormatter() {
  const [viewMode, setViewMode] = useState<ViewMode>("input");
  const [activeTab, setActiveTab] = useState<Tab>("paste");
  const [error, setError] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("structure");

  const {
    title,
    setTitle,
    subtitle,
    setSubtitle,
    author,
    setAuthor,
    date,
    setDate,
    blocks,
    setBlocks,
    updateBlock,
    selectedStyle,
    setSelectedStyle,
    outputFormat,
    setOutputFormat,
    isProcessing,
    setIsProcessing,
    rawContent,
    setRawContent,
    htmlContent,
    setHtmlContent,
    editorMode,
    setEditorMode,
    // Sync-related
    blocksVersion,
    lastSyncedVersion,
    isHtmlDirty,
    syncBlocksToHtml,
    clearHtmlDirty,
  } = useDocumentStore();

  // ============================================
  // REACTIVE ONE-WAY SYNC: blocks -> htmlContent
  // ============================================
  // When blocks change (blocksVersion increments), auto-sync to HTML
  // This ensures WYSIWYG always has up-to-date content from Block Editor
  useEffect(() => {
    // Only sync if blocks have changed since last sync
    if (blocksVersion > lastSyncedVersion && blocks.length > 0) {
      // If user has dirty WYSIWYG edits, we could warn them here
      // For now, we auto-sync (Structure > Format per spec)
      syncBlocksToHtml();
    }
  }, [blocksVersion, lastSyncedVersion, blocks.length, syncBlocksToHtml]);

  const handleAnalyze = useCallback(async () => {
    if (!rawContent.trim()) {
      setError("Please enter some content first");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await analyzeContent(rawContent);

      setTitle(result.title || "");
      setSubtitle(result.subtitle || "");
      setAuthor(result.author || "");
      setDate(result.date || "");

      const newBlocks: DocumentBlock[] = result.elements.map((el, index) => ({
        id: `block-${Date.now()}-${index}`,
        type: el.type as DocumentBlock["type"],
        content: el.content || "",
        meta: {
          listStyle: el.style as "bullet" | "numbered",
          items: el.items,
          language: el.language,
          calloutStyle: el.style as "info" | "warning" | "success" | "note",
          author: el.author,
          headers: el.headers,
          rows: el.rows,
          caption: el.caption,
        },
      }));

      setBlocks(newBlocks);

      // IMMEDIATELY sync blocks to HTML so WYSIWYG has content
      // This fixes the "Blank Tab" issue when switching to WYSIWYG for the first time
      // Note: setBlocks triggers blocksVersion increment, useEffect will handle sync
      // But we call syncBlocksToHtml explicitly here for immediate availability
      setTimeout(() => {
        useDocumentStore.getState().syncBlocksToHtml();
      }, 0);

      setViewMode("editor");
    } catch (err) {
      setError("Failed to analyze content. Make sure the backend is running.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, [rawContent, setIsProcessing, setTitle, setSubtitle, setAuthor, setDate, setBlocks]);

  const handleExport = useCallback(async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const structure = {
        title,
        subtitle,
        author,
        date,
        elements: blocks.map((block) => ({
          type: block.type,
          content: block.content,
          style: block.meta?.listStyle || block.meta?.calloutStyle,
          items: block.meta?.items,
          language: block.meta?.language,
          author: block.meta?.author,
          headers: block.meta?.headers,
          rows: block.meta?.rows,
          caption: block.meta?.caption,
        })),
      };

      const blob = await formatStructure(structure, selectedStyle, outputFormat);
      downloadBlob(blob, `formatted_document.${outputFormat}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to export document: ${errorMessage}`);
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, [title, subtitle, author, date, blocks, selectedStyle, outputFormat, setIsProcessing]);

  const handleTemplateSelect = (content: string, style: any) => {
    setRawContent(content);
    setSelectedStyle(style);
    setActiveTab("paste");
  };

  // --- LANDING VIEW (INPUT) ---
  if (viewMode === "input") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-float" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] animate-float" style={{ animationDelay: "2s" }} />
        </div>

        <div className="max-w-4xl w-full space-y-8 z-10">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 mb-4 shadow-2xl">
              <Sparkles className="text-primary w-8 h-8" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              <span className="text-white">Create beautiful docs</span>
              <br />
              <span className="gradient-text">at warp speed</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Paste your rough notes, outlines, or messy thoughts. Our AI will transform them into professional documents, slides, or reports in seconds.
            </p>
          </div>

          {/* Magic Input Box */}
          <div className="magic-border p-[1px] rounded-xl shadow-2xl animate-in">
            <div className="bg-card rounded-xl overflow-hidden">
              <div className="flex border-b border-border">
                <button
                  onClick={() => setActiveTab("paste")}
                  className={cn(
                    "flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                    activeTab === "paste" ? "bg-white/5 text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"
                  )}
                >
                  <Edit3 size={16} /> Paste Text
                </button>
                <button
                  onClick={() => setActiveTab("templates")}
                  className={cn(
                    "flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                    activeTab === "templates" ? "bg-white/5 text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"
                  )}
                >
                  <LayoutTemplate size={16} /> Templates
                </button>
              </div>

              <div className="p-6 min-h-[300px]">
                {activeTab === "paste" ? (
                  <div className="space-y-4">
                    <Textarea
                      value={rawContent}
                      onChange={(e) => setRawContent(e.target.value)}
                      placeholder="Start typing or paste your content here..."
                      className="min-h-[200px] bg-transparent border-none resize-none text-lg focus-visible:ring-0 placeholder:text-muted-foreground/50"
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={handleAnalyze}
                        disabled={isProcessing || !rawContent.trim()}
                        size="lg"
                        className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 rounded-full px-8"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="animate-spin mr-2" size={20} />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Wand2 className="mr-2" size={20} />
                            Generate Document
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <TemplatesPanel onSelect={handleTemplateSelect} />
                )}
              </div>
            </div>
          </div>

          {/* Footer / Error */}
          {error && (
            <div className="text-center p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 animate-in">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- WORKSPACE VIEW (EDITOR) ---
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("input")}
            className="text-muted-foreground hover:text-white"
          >
            <ChevronLeft size={18} className="mr-1" />
            Back
          </Button>
          <div className="h-6 w-[1px] bg-border" />
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-primary" />
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 w-64 bg-transparent border-transparent hover:border-border focus:border-primary transition-all font-medium"
              placeholder="Untitled Document"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-secondary/50 rounded-lg p-1">
            <button
              onClick={() => setOutputFormat("docx")}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-medium transition-all",
                outputFormat === "docx" ? "bg-card shadow text-white" : "text-muted-foreground hover:text-white"
              )}
            >
              DOCX
            </button>
            <button
              onClick={() => setOutputFormat("pdf")}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-medium transition-all",
                outputFormat === "pdf" ? "bg-card shadow text-white" : "text-muted-foreground hover:text-white"
              )}
            >
              PDF
            </button>
          </div>
          <Button
            onClick={handleExport}
            disabled={isProcessing}
            className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
          >
            {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} className="mr-2" />}
            Export
          </Button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar with Tabs */}
        <div className="w-72 border-r border-border bg-card/30 flex flex-col overflow-hidden">
          {/* Sidebar Tab Headers */}
          <div className="flex border-b border-border shrink-0">
            <button
              onClick={() => setSidebarTab("structure")}
              className={cn(
                "flex-1 px-3 py-2 text-xs font-medium transition-all flex items-center justify-center gap-1.5",
                sidebarTab === "structure"
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutList size={12} />
              Structure
            </button>
            <button
              onClick={() => setSidebarTab("theme")}
              className={cn(
                "flex-1 px-3 py-2 text-xs font-medium transition-all flex items-center justify-center gap-1.5",
                sidebarTab === "theme"
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Palette size={12} />
              Theme
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-3">
            {sidebarTab === "structure" ? (
              /* Structure / Outline Panel */
              <OutlinePanel
                onScrollToBlock={(blockId) => {
                  // Find the element with data-block-id and scroll to it
                  const element = document.querySelector(`[data-block-id="${blockId}"]`);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Add a brief highlight effect
                    element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
                    setTimeout(() => {
                      element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
                    }, 1500);
                  }
                }}
              />
            ) : (
              /* Theme & Metadata Panel */
              <div className="space-y-5">
                {/* Theme Selection */}
                <div>
                  <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Style
                  </h3>
                  <div className="grid grid-cols-2 gap-1.5">
                    {STYLE_OPTIONS.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={cn(
                          "p-2 rounded-lg border text-left transition-all",
                          selectedStyle === style.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-muted-foreground/50 bg-card/50"
                        )}
                      >
                        <div className={cn("w-full h-1 rounded-full mb-1.5 opacity-80", style.color)} />
                        <span className="text-[11px] font-medium block text-white">{style.name}</span>
                        <span className="text-[9px] text-muted-foreground">{style.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Metadata */}
                <div>
                  <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Metadata
                  </h3>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Subtitle</label>
                      <Input
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        className="h-7 text-xs bg-secondary/50 border-transparent focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Author</label>
                      <Input
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        className="h-7 text-xs bg-secondary/50 border-transparent focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Date</label>
                      <Input
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="h-7 text-xs bg-secondary/50 border-transparent focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Canvas - Always WYSIWYG */}
        <div className="flex-1 bg-background relative overflow-hidden flex flex-col">
          {/* Minimal Toolbar */}
          <div className="h-9 border-b border-border flex items-center justify-between px-4 bg-card/20">
            <span className="text-xs text-muted-foreground">
              Page View
            </span>
            <span className="text-[10px] text-muted-foreground">
              {blocks.length} blocks • {selectedStyle}
            </span>
          </div>

          {/* WYSIWYG Editor - Always visible */}
          <div className="flex-1 overflow-hidden">
            <DocumentEditor />
          </div>
        </div>
      </div>
    </div>
  );
}
