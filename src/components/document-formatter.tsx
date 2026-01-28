"use client";

import { useState, useCallback } from "react";
import {
  Wand2,
  FileText,
  LayoutTemplate,
  Edit3,
  Loader2,
  ChevronLeft,
  Sparkles,
  Download,
  Palette,
  LayoutList,
  FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

import { OutlinePanel } from "@/components/editor/outline-panel";
import { DocumentEditor } from "@/components/editor/DocumentEditor";
import { TemplatesPanel } from "@/components/templates/templates-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { useDocumentStore } from "@/store/document-store";
import { analyzeContent, analyzeTiptapContent, formatStructure, downloadBlob } from "@/lib/api";
import { jsonToMarkdown, downloadMarkdown } from "@/lib/markdown-exporter";
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
    selectedStyle,
    setSelectedStyle,
    outputFormat,
    setOutputFormat,
    isProcessing,
    setIsProcessing,
    rawContent,
    setRawContent,
    htmlContent,
    setJsonContent,
    jsonContent,
  } = useDocumentStore();

  const handleAnalyze = useCallback(async () => {
    if (!rawContent.trim()) {
      setError("Please enter some content first");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Use new Tiptap JSON endpoint for direct editor integration
      const result = await analyzeTiptapContent(rawContent);

      // Set document metadata
      setTitle(result.title || "");
      setSubtitle(result.subtitle || "");
      setAuthor(result.author || "");
      setDate(result.date || "");

      // Set Tiptap JSON directly - Single Source of Truth
      // No intermediate blocks conversion needed!
      if (result.tiptap_json) {
        setJsonContent(result.tiptap_json);
      }

      setViewMode("editor");
    } catch (err) {
      // Fallback to legacy endpoint if Tiptap endpoint fails
      console.warn("Tiptap endpoint failed, falling back to legacy", err);
      try {
        const result = await analyzeContent(rawContent);
        setTitle(result.title || "");
        setSubtitle(result.subtitle || "");
        setAuthor(result.author || "");
        setDate(result.date || "");

        // Convert legacy elements to Tiptap JSON format
        const tiptapContent = result.elements.map((el) => {
          if (el.type === "heading1") {
            return { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: el.content || "" }] };
          } else if (el.type === "heading2") {
            return { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: el.content || "" }] };
          } else if (el.type === "heading3") {
            return { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: el.content || "" }] };
          } else if (el.type === "list") {
            const listType = el.style === "numbered" ? "orderedList" : "bulletList";
            const items = (el.items || []).map((item) => ({
              type: "listItem",
              content: [{ type: "paragraph", content: [{ type: "text", text: item }] }]
            }));
            return { type: listType, content: items };
          } else if (el.type === "quote") {
            return { type: "blockquote", content: [{ type: "paragraph", content: [{ type: "text", text: el.content || "" }] }] };
          } else if (el.type === "code_block") {
            return { type: "codeBlock", attrs: { language: el.language || null }, content: [{ type: "text", text: el.content || "" }] };
          } else {
            return { type: "paragraph", content: el.content ? [{ type: "text", text: el.content }] : [] };
          }
        });

        setJsonContent({ type: "doc", content: tiptapContent });
        setViewMode("editor");
      } catch (fallbackErr) {
        setError("Failed to analyze content. Make sure the backend is running.");
        console.error(fallbackErr);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [rawContent, setIsProcessing, setTitle, setSubtitle, setAuthor, setDate, setJsonContent]);


  const handleExport = useCallback(async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Create minimal structure for metadata
      const structure = {
        title,
        subtitle,
        author,
        date,
        elements: [],
      };

      // Get effective HTML content - prioritize htmlContent, fallback to jsonContent
      let effectiveHtml = htmlContent;
      if (!htmlContent || htmlContent.trim() === '' || htmlContent === '<p></p>') {
        if (jsonContent) {
          // Import and use the same generateHtmlFromJson as PagedPreview
          const { generateHtmlFromJson } = await import('@/lib/html-generator');
          effectiveHtml = generateHtmlFromJson(jsonContent);
        }
      }

      let exportHtml = effectiveHtml;

      // For PDF: Build full HTML document with cover page for Playwright rendering
      if (outputFormat === 'pdf') {
        const { buildPdfHtml } = await import('@/lib/pdf-utils');
        const { getStyleConfig } = await import('@/lib/document-styles');
        const styleConfig = getStyleConfig(selectedStyle);
        exportHtml = buildPdfHtml(effectiveHtml, styleConfig, title, subtitle, author, date);
      }

      // Pass the appropriate HTML content
      const blob = await formatStructure(
        structure,
        selectedStyle,
        outputFormat,
        exportHtml
      );

      // Use document title for filename, sanitize for file system
      const safeTitle = (title || 'document').replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF\s\-_]/g, '').trim() || 'document';
      downloadBlob(blob, `${safeTitle}.${outputFormat}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to export document: ${errorMessage}`);
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, [title, subtitle, author, date, selectedStyle, outputFormat, htmlContent, jsonContent, setIsProcessing]);

  const handleTemplateSelect = (content: string, style: any) => {
    setRawContent(content);
    setSelectedStyle(style);
    setActiveTab("paste");
  };

  const handleExportMarkdown = useCallback(() => {
    const markdown = jsonToMarkdown(jsonContent);
    const fullMarkdown = `# ${title}\n\n${subtitle ? `*${subtitle}*\n\n` : ""}${author ? `By: ${author}\n` : ""}${date ? `Date: ${date}\n\n` : ""}---\n\n${markdown}`;
    downloadMarkdown(fullMarkdown, `${title || "document"}.md`);
  }, [jsonContent, title, subtitle, author, date]);

  // --- LANDING VIEW (INPUT) ---
  if (viewMode === "input") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Premium Background Effects */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          {/* Gradient Orbs */}
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-[120px] animate-float-slow" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-[120px] animate-float-slow" style={{ animationDelay: "3s" }} />
          <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] animate-float" style={{ animationDelay: "1.5s" }} />
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
          
          {/* Radial Gradient Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--background)_70%)]" />
        </div>

        <div className="max-w-4xl w-full space-y-10 z-10">
          {/* Header */}
          <div className="text-center space-y-6 animate-slide-up">
            {/* Logo Badge */}
            <div className="inline-flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-xl opacity-50 animate-pulse" />
                <div className="relative p-4 rounded-2xl glass-card">
                  <Sparkles className="w-10 h-10 text-blue-400" />
                </div>
              </div>
            </div>
            
            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="text-white">Create beautiful docs</span>
              <br />
              <span className="gradient-text bg-clip-text">at warp speed</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
              Paste your rough notes, outlines, or messy thoughts. Our AI will transform them into 
              <span className="text-white/80 font-medium"> professional documents</span> in seconds.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              {['AI-Powered', 'DOCX & PDF', 'Beautiful Styles', 'Instant Export'].map((feature, i) => (
                <span key={i} className="px-4 py-1.5 rounded-full text-sm font-medium bg-white/5 text-white/70 border border-white/10">
                  {feature}
                </span>
              ))}
            </div>
          </div>

          {/* Magic Input Box */}
          <div className="magic-border p-[2px] rounded-2xl animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <div className="bg-gradient-to-b from-[#1a1c24] to-[#12141a] rounded-2xl overflow-hidden">
              {/* Tab Headers */}
              <div className="flex border-b border-white/5">
                <button
                  onClick={() => setActiveTab("paste")}
                  className={cn(
                    "flex-1 py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2.5 relative",
                    activeTab === "paste" 
                      ? "text-white" 
                      : "text-white/40 hover:text-white/70 hover:bg-white/[0.02]"
                  )}
                >
                  <Edit3 size={18} /> Paste Text
                  {activeTab === "paste" && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("templates")}
                  className={cn(
                    "flex-1 py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2.5 relative",
                    activeTab === "templates" 
                      ? "text-white" 
                      : "text-white/40 hover:text-white/70 hover:bg-white/[0.02]"
                  )}
                >
                  <LayoutTemplate size={18} /> Templates
                  {activeTab === "templates" && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
                  )}
                </button>
              </div>

              {/* Content Area */}
              <div className="p-6 min-h-[320px]">
                {activeTab === "paste" ? (
                  <div className="space-y-5">
                    <Textarea
                      value={rawContent}
                      onChange={(e) => setRawContent(e.target.value)}
                      placeholder="Start typing or paste your content here...\n\nFor example:\n- Meeting notes\n- Research findings\n- Blog post drafts\n- Technical documentation"
                      className="min-h-[220px] bg-transparent border-none resize-none text-base leading-relaxed focus-visible:ring-0 placeholder:text-white/20"
                    />
                    
                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <div className="text-sm text-white/30">
                        {rawContent.length > 0 && `${rawContent.length} characters`}
                      </div>
                      <button
                        onClick={handleAnalyze}
                        disabled={isProcessing || !rawContent.trim()}
                        className="group relative px-8 py-3 rounded-xl font-semibold text-white transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                          boxShadow: isProcessing || !rawContent.trim() ? 'none' : '0 8px 32px rgba(59, 130, 246, 0.35)'
                        }}
                      >
                        {/* Glow Effect */}
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
                        
                        <span className="relative flex items-center gap-2">
                          {isProcessing ? (
                            <>
                              <Loader2 className="animate-spin" size={20} />
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <Wand2 size={20} />
                              <span>Generate Document</span>
                            </>
                          )}
                        </span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <TemplatesPanel onSelect={handleTemplateSelect} />
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-center p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 animate-scale-in backdrop-blur-sm">
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Footer Hint */}
          <p className="text-center text-white/30 text-sm animate-fade-in" style={{ animationDelay: '0.4s' }}>
            Powered by AI • Export to DOCX or PDF • Multiple professional styles
          </p>
        </div>
      </div>
    );
  }

  // --- WORKSPACE VIEW (EDITOR) ---
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'linear-gradient(180deg, #0d0e12 0%, #0a0b0f 100%)' }}>
      {/* Premium Top Bar */}
      <header className="h-16 shrink-0 z-50 relative">
        {/* Glassmorphism Header */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        
        <div className="relative h-full flex items-center justify-between px-5">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setViewMode("input")}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              <ChevronLeft size={18} />
              <span className="text-sm font-medium">Back</span>
            </button>
            
            <div className="h-6 w-px bg-white/10" />
            
            {/* Document Title */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10">
                <FileText size={18} className="text-blue-400" />
              </div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9 w-72 bg-white/5 border-white/10 hover:border-white/20 focus:border-blue-500/50 focus:bg-white/[0.07] transition-all font-medium text-white placeholder:text-white/30 rounded-lg"
                placeholder="Untitled Document"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Format Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10">
              <button
                onClick={() => setOutputFormat("docx")}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
                  outputFormat === "docx" 
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25" 
                    : "text-white/50 hover:text-white/80"
                )}
              >
                DOCX
              </button>
              <button
                onClick={() => setOutputFormat("pdf")}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
                  outputFormat === "pdf" 
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25" 
                    : "text-white/50 hover:text-white/80"
                )}
              >
                PDF
              </button>
            </div>

            <div className="h-6 w-px bg-white/10" />

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Markdown Export */}
            <button
              onClick={handleExportMarkdown}
              className="p-2.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
              title="Export as Markdown"
            >
              <FileCode size={18} />
            </button>

            {/* Main Export Button */}
            <button
              onClick={handleExport}
              disabled={isProcessing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white transition-all duration-300 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
                boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)'
              }}
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <Download size={18} />
                  <span>Export</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Premium Left Sidebar */}
        <div className="w-72 flex flex-col overflow-hidden relative">
          {/* Sidebar Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#12141a] to-[#0d0e12]" />
          <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent" />
          
          {/* Sidebar Tab Headers */}
          <div className="relative flex shrink-0">
            <div className="absolute inset-x-0 bottom-0 h-px bg-white/5" />
            <button
              onClick={() => setSidebarTab("structure")}
              className={cn(
                "flex-1 px-4 py-3.5 text-xs font-semibold transition-all flex items-center justify-center gap-2 relative",
                sidebarTab === "structure"
                  ? "text-white"
                  : "text-white/40 hover:text-white/70"
              )}
            >
              <LayoutList size={14} />
              Structure
              {sidebarTab === "structure" && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setSidebarTab("theme")}
              className={cn(
                "flex-1 px-4 py-3.5 text-xs font-semibold transition-all flex items-center justify-center gap-2 relative",
                sidebarTab === "theme"
                  ? "text-white"
                  : "text-white/40 hover:text-white/70"
              )}
            >
              <Palette size={14} />
              Theme
              {sidebarTab === "theme" && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
              )}
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="relative flex-1 overflow-y-auto p-4 custom-scrollbar">
            {sidebarTab === "structure" ? (
              /* Structure / Outline Panel */
              <OutlinePanel
                onScrollToBlock={(blockId) => {
                  const element = document.querySelector(`[data-block-id="${blockId}"]`);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('ring-2', 'ring-blue-500/50', 'ring-offset-2', 'ring-offset-transparent');
                    setTimeout(() => {
                      element.classList.remove('ring-2', 'ring-blue-500/50', 'ring-offset-2', 'ring-offset-transparent');
                    }, 1500);
                  }
                }}
              />
            ) : (
              /* Theme & Metadata Panel */
              <div className="space-y-6">
                {/* Theme Selection */}
                <div>
                  <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">
                    Document Style
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {STYLE_OPTIONS.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={cn(
                          "p-3 rounded-xl text-left transition-all duration-200 group",
                          selectedStyle === style.id
                            ? "bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 shadow-lg shadow-blue-500/10"
                            : "bg-white/[0.03] border border-white/5 hover:border-white/15 hover:bg-white/[0.05]"
                        )}
                      >
                        <div className={cn("w-full h-1.5 rounded-full mb-2", style.color)} />
                        <span className={cn(
                          "text-xs font-semibold block",
                          selectedStyle === style.id ? "text-white" : "text-white/70 group-hover:text-white"
                        )}>{style.name}</span>
                        <span className="text-[10px] text-white/40 leading-tight">{style.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Metadata */}
                <div>
                  <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">
                    Document Info
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-medium text-white/50">Subtitle</label>
                      <Input
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        className="h-8 text-xs bg-white/[0.03] border-white/10 hover:border-white/20 focus:border-blue-500/50 rounded-lg text-white placeholder:text-white/30"
                        placeholder="Optional subtitle..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-medium text-white/50">Author</label>
                      <Input
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        className="h-8 text-xs bg-white/[0.03] border-white/10 hover:border-white/20 focus:border-blue-500/50 rounded-lg text-white placeholder:text-white/30"
                        placeholder="Author name..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-medium text-white/50">Date</label>
                      <Input
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="h-8 text-xs bg-white/[0.03] border-white/10 hover:border-white/20 focus:border-blue-500/50 rounded-lg text-white placeholder:text-white/30"
                        placeholder="Publication date..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Canvas - Premium Editor Area */}
        <div className="flex-1 relative overflow-hidden flex flex-col" style={{ background: 'linear-gradient(180deg, #0f1014 0%, #0a0b0e 100%)' }}>
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
          
          {/* Premium Status Bar */}
          <div className="relative h-10 flex items-center justify-between px-5 shrink-0">
            <div className="absolute inset-0 bg-white/[0.02]" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-white/5" />
            
            <div className="relative flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-medium text-white/50">Page View</span>
              </div>
              <div className="h-3 w-px bg-white/10" />
              <span className="text-xs text-white/30">Auto-saving</span>
            </div>
            
            <div className="relative flex items-center gap-3">
              <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">
                {selectedStyle} style
              </span>
              <div className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                <span className="text-[10px] font-semibold text-white/60">A4</span>
              </div>
            </div>
          </div>

          {/* WYSIWYG Editor - Always visible */}
          <div className="relative flex-1 overflow-hidden">
            <DocumentEditor />
          </div>
        </div>
      </div>
    </div>
  );
}
