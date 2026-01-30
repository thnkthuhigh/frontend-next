"use client";

import { useState, useCallback, useEffect } from "react";
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
  LogOut,
  User as UserIcon,
  Paintbrush,
  ArrowLeft,
  Cloud,
  CloudOff,
  Check,
  AlertCircle,
  History,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

import { OutlinePanel } from "@/components/editor/outline-panel";
import { DocumentEditor } from "@/components/editor/DocumentEditor";
import { DocumentStylesPanel } from "@/components/editor/DocumentStylesPanel";
import { VersionHistoryPanel } from "@/components/editor/VersionHistoryPanel";
import { TemplatesPanel } from "@/components/templates/templates-panel";
import { PageSetup } from "@/components/editor/PageSetup";
import { ThemeToggle } from "@/components/theme-toggle";
import { TutorialOverlay } from "@/components/tutorial-overlay";
import { useDocumentStore } from "@/store/document-store";
import { useEditorStore } from "@/store/editor-store";
import { analyzeContent, analyzeContentStream, formatStructure, downloadBlob, exportPdfV3 } from "@/lib/api";
import { jsonToMarkdown, downloadMarkdown } from "@/lib/markdown-exporter";
import { cn } from "@/lib/utils";
import { useToast, toastSuccess, toastError, toastWarning, toastInfo } from "@/components/toast-provider";
import { createClient } from "@/lib/supabase/client";
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";

type ViewMode = "input" | "editor";
type Tab = "paste" | "templates";
type SidebarTab = "theme" | "structure" | "styles" | "history";

import { STYLE_OPTIONS } from "@/lib/document-styles";

interface SaveStatus {
  isSaving: boolean;
  lastSaved: Date | null;
  saveError: string | null;
}

interface DocumentFormatterProps {
  initialViewMode?: ViewMode;
  documentId?: string;
  saveStatus?: SaveStatus;
}

export function DocumentFormatter({
  initialViewMode = "input",
  documentId,
  saveStatus
}: DocumentFormatterProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [activeTab, setActiveTab] = useState<Tab>("paste");
  const [error, setError] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("structure");
  const [streamingText, setStreamingText] = useState<string>("");
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  // Sync viewMode with initialViewMode prop when it changes
  useEffect(() => {
    if (initialViewMode && initialViewMode !== viewMode) {
      setViewMode(initialViewMode);
    }
  }, [initialViewMode]);

  // Check auth state on mount
  useEffect(() => {
    const supabase = createClient();

    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const toast = useToast();
  const { editor } = useEditorStore();

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
    margins,
  } = useDocumentStore();

  const handleAnalyze = useCallback(async () => {
    if (!rawContent.trim()) {
      toast.addToast(toastError("Input Required", "Please enter some content first"));
      return;
    }

    setIsProcessing(true);
    setError(null);
    setStreamingText("");

    try {
      // Use Streaming API
      const result = await analyzeContentStream(rawContent, (chunk) => {
        setStreamingText((prev) => prev + chunk);
      });

      // Process final result (same as legacy fallback for now, but robust)
      setTitle(result.title || "");
      setSubtitle(result.subtitle || "");
      setAuthor(result.author || "");
      setDate(result.date || "");

      // Convert elements to Tiptap JSON format
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
      toast.addToast(toastSuccess("Analysis Complete", "Document structure has been generated successfully"));
    } catch (err) {
      toast.addToast(toastError("Analysis Failed", "Failed to analyze content. Please try again."));
      console.error(err);
    } finally {
      setIsProcessing(false);
      setStreamingText("");
    }
  }, [rawContent, setIsProcessing, setTitle, setSubtitle, setAuthor, setDate, setJsonContent, toast]);


  const handleExport = useCallback(async () => {
    setIsProcessing(true);
    setIsExporting(true);
    setExportProgress(0);
    setError(null);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setExportProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // ALWAYS generate fresh HTML from jsonContent for consistent export
      // This ensures Export from Edit tab produces same result as Preview tab
      let effectiveHtml = '';
      if (jsonContent) {
        const { generateHtmlFromJson } = await import('@/lib/html-generator');
        effectiveHtml = generateHtmlFromJson(jsonContent);
      } else if (htmlContent && htmlContent.trim() !== '' && htmlContent !== '<p></p>') {
        // Fallback to htmlContent only if jsonContent is not available
        effectiveHtml = htmlContent;
      }

      if (!effectiveHtml) {
        throw new Error('No content to export. Please add some content first.');
      }

      // Use document title for filename, sanitize for file system
      const safeTitle = (title || 'document').replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF\s\-_]/g, '').trim() || 'document';

      if (outputFormat === 'pdf') {
        // Build FULL styled HTML document using same buildPdfHtml as Preview tab
        // This ensures consistent styling with colors from styleConfig
        const { buildPdfHtml } = await import('@/lib/pdf-utils');
        const { getStyleConfig } = await import('@/lib/document-styles');
        const styleConfig = getStyleConfig(selectedStyle);
        
        // Build full PDF HTML with styled colors (headingColor, accentColor)
        const fullPdfHtml = buildPdfHtml(effectiveHtml, styleConfig, title, subtitle, author, date);
        
        // Use formatStructure endpoint with full HTML (same as Preview tab)
        const structure = {
          title: title || 'Document',
          subtitle,
          author,
          date,
          elements: [],
        };

        const blob = await formatStructure(
          structure,
          selectedStyle,
          'pdf',
          fullPdfHtml,  // Send FULL styled HTML document
          margins       // Include margins for consistent export
        );

        setExportProgress(100);
        downloadBlob(blob, `${safeTitle}.pdf`);
        toast.addToast(toastSuccess("Export Successful", "Document exported as PDF with full styling"));
      } else {
        // For DOCX, use the existing formatStructure endpoint
        // Create minimal structure for metadata
        const structure = {
          title,
          subtitle,
          author,
          date,
          elements: [],
        };

        const blob = await formatStructure(
          structure,
          selectedStyle,
          outputFormat,
          effectiveHtml
        );

        setExportProgress(100);
        downloadBlob(blob, `${safeTitle}.${outputFormat}`);
        toast.addToast(toastSuccess("Export Successful", `Document exported as ${outputFormat.toUpperCase()} successfully`));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      toast.addToast(toastError("Export Failed", `Failed to export document: ${errorMessage}`));
      console.error(err);
    } finally {
      clearInterval(progressInterval);
      setIsProcessing(false);
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [title, subtitle, author, date, selectedStyle, outputFormat, htmlContent, jsonContent, margins, setIsProcessing, toast]);

  const handleTemplateSelect = (content: string, style: any) => {
    setRawContent(content);
    setSelectedStyle(style);
    setActiveTab("paste");
  };

  const handleExportMarkdown = useCallback(() => {
    try {
      const markdown = jsonToMarkdown(jsonContent);
      const fullMarkdown = `# ${title}\n\n${subtitle ? `*${subtitle}*\n\n` : ""}${author ? `By: ${author}\n` : ""}${date ? `Date: ${date}\n\n` : ""}---\n\n${markdown}`;
      downloadMarkdown(fullMarkdown, `${title || "document"}.md`);
      toast.addToast(toastSuccess("Export Successful", "Markdown document exported successfully"));
    } catch (err) {
      toast.addToast(toastError("Export Failed", "Failed to export markdown document"));
      console.error(err);
    }
  }, [jsonContent, title, subtitle, author, date, toast]);

  // --- LANDING VIEW (INPUT) ---
  if (viewMode === "input") {
    // If we're in /editor route (has documentId), show Draft View instead of Landing
    if (documentId) {
      return (
        <>
          <div className="h-screen flex flex-col bg-background">
            {/* Simple Header for Draft View */}
            <header className="h-16 shrink-0 border-b border-border">
              <div className="h-full flex items-center justify-between px-5">
                <div className="flex items-center gap-4">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                  >
                    <ArrowLeft size={18} />
                    <span className="text-sm font-medium">Dashboard</span>
                  </Link>
                  <div className="h-6 w-px bg-border" />
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-blue-400" />
                    <span className="text-sm font-medium text-foreground">New Draft Document</span>
                  </div>
                </div>
                {user && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                    {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
              </div>
            </header>

            {/* Draft Content Area */}
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="max-w-3xl w-full space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                  <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-border">
                    <Wand2 className="w-8 h-8 text-blue-400" />
                  </div>
                  <h1 className="text-3xl font-bold text-foreground">Start Your Document</h1>
                  <p className="text-muted-foreground">
                    Paste your content or start typing. AI will help format it beautifully.
                  </p>
                </div>

                {/* Input Card */}
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="p-6 space-y-4">
                    <Textarea
                      value={rawContent}
                      onChange={(e) => setRawContent(e.target.value)}
                      placeholder="Start typing or paste your content here...\n\nFor example:\n- Meeting notes\n- Research findings\n- Blog post drafts\n- Technical documentation"
                      className="min-h-[300px] bg-transparent border-none resize-none text-base leading-relaxed focus-visible:ring-0 placeholder:text-muted-foreground"
                      autoFocus
                    />
                    
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="text-sm text-muted-foreground">
                        {rawContent.length > 0 && `${rawContent.length} characters`}
                      </div>
                      <button
                        onClick={handleAnalyze}
                        disabled={isProcessing || !rawContent.trim()}
                        className="px-6 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                          boxShadow: isProcessing || !rawContent.trim() ? 'none' : '0 8px 32px rgba(59, 130, 246, 0.35)'
                        }}
                      >
                        {isProcessing ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="animate-spin" size={18} />
                            Generating...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Wand2 size={18} />
                            Generate Document
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Hint */}
                <p className="text-center text-sm text-muted-foreground">
                  Your document will be automatically saved to your dashboard
                </p>
              </div>
            </div>

            {/* Streaming Terminal */}
            {isProcessing && streamingText && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <div className="w-full max-w-3xl bg-card rounded-xl shadow-2xl border border-border overflow-hidden">
                  <div className="flex items-center px-4 py-2 bg-secondary border-b border-border">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="ml-4 text-xs text-muted-foreground font-mono">AI Agent — Analyzing...</div>
                  </div>
                  <div className="p-6 font-mono text-sm text-green-400 h-[400px] overflow-y-auto">
                    <pre className="whitespace-pre-wrap break-words">
                      {streamingText}
                      <span className="animate-pulse">_</span>
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      );
    }

    // Landing view for non-authenticated users or home page
    return (
      <>
        <TutorialOverlay />
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
          {/* Top Navigation */}
          <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-400" />
              <span className="font-bold text-foreground hidden sm:inline">AI Doc Formatter</span>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                /* Logged in user */
                <>
                  <a
                    href="/dashboard"
                    className="px-4 py-2 text-sm font-semibold text-primary-foreground rounded-lg transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    }}
                  >
                    Dashboard
                  </a>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                    {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
                  </div>
                </>
              ) : (
                /* Not logged in */
                <>
                  <a
                    href="/login"
                    className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
                  >
                    Sign in
                  </a>
                  <a
                    href="/register"
                    className="px-4 py-2 text-sm font-semibold text-primary-foreground rounded-lg transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    }}
                  >
                    Get Started
                  </a>
                </>
              )}
            </div>
          </nav>

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

          <div className="max-w-4xl w-full space-y-10 z-10 mobile-p-4 mobile-space-y-4">
            {/* Header */}
            <div className="text-center space-y-6 animate-slide-up mobile-text-center">
              {/* Logo Badge */}
              <div className="inline-flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-xl opacity-50 animate-pulse" />
                  <div className="relative p-4 rounded-2xl glass-card">
                    <Sparkles className="w-10 h-10 text-blue-400 mobile-hidden" />
                    <Sparkles className="w-8 h-8 text-blue-400 hidden mobile:block" />
                  </div>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mobile-text-4xl">
                <span className="text-foreground">Create beautiful docs</span>
                <br />
                <span className="gradient-text bg-clip-text">at warp speed</span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mobile-text-lg mobile-px-4">
                Paste your rough notes, outlines, or messy thoughts. Our AI will transform them into
                <span className="text-foreground font-medium"> professional documents</span> in seconds.
              </p>

              {/* Feature Pills */}
              <div className="flex flex-wrap justify-center gap-3 pt-2 mobile-hidden">
                {['AI-Powered', 'DOCX & PDF', 'Beautiful Styles', 'Instant Export'].map((feature, i) => (
                  <span key={i} className="px-4 py-1.5 rounded-full text-sm font-medium bg-muted text-muted-foreground border border-border">
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            {/* Magic Input Box */}
            <div className="magic-border p-[2px] rounded-2xl animate-scale-in mobile-w-full" style={{ animationDelay: '0.2s' }}>
              <div className="bg-card rounded-2xl overflow-hidden border border-border">
                {/* Tab Headers */}
                <div className="flex border-b border-white/5">
                  <button
                    onClick={() => setActiveTab("paste")}
                    className={cn(
                      "flex-1 py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2.5 relative mobile-py-3",
                      activeTab === "paste"
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                    data-tab="paste"
                  >
                    <Edit3 size={18} className="mobile:hidden" />
                    <Edit3 size={16} className="hidden mobile:block" />
                    <span className="mobile:hidden">Paste Text</span>
                    <span className="hidden mobile:block">Paste</span>
                    {activeTab === "paste" && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mobile-hidden" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("templates")}
                    className={cn(
                      "flex-1 py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2.5 relative mobile-py-3",
                      activeTab === "templates"
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                    data-tab="templates"
                  >
                    <LayoutTemplate size={18} className="mobile:hidden" />
                    <LayoutTemplate size={16} className="hidden mobile:block" />
                    <span className="mobile:hidden">Templates</span>
                    <span className="hidden mobile:block">Templates</span>
                    {activeTab === "templates" && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mobile-hidden" />
                    )}
                  </button>
                </div>

                {/* Content Area */}
                <div className="p-6 min-h-[320px] mobile-p-4">
                  {activeTab === "paste" ? (
                    <div className="space-y-5">
                      <Textarea
                        value={rawContent}
                        onChange={(e) => setRawContent(e.target.value)}
                        placeholder="Start typing or paste your content here...\n\nFor example:\n- Meeting notes\n- Research findings\n- Blog post drafts\n- Technical documentation"
                        className="min-h-[220px] bg-transparent border-none resize-none text-base leading-relaxed focus-visible:ring-0 placeholder:text-muted-foreground mobile-min-h-[180px]"
                      />

                      {/* Action Bar */}
                      <div className="flex items-center justify-between pt-2 border-t border-border mobile-flex-col mobile-space-y-3">
                        <div className="text-sm text-muted-foreground mobile-text-xs">
                          {rawContent.length > 0 && `${rawContent.length} characters`}
                        </div>
                        <button
                          onClick={handleAnalyze}
                          disabled={isProcessing || !rawContent.trim()}
                          className="group relative px-8 py-3 rounded-xl font-semibold text-white transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed mobile-w-full mobile-px-4 mobile-py-2.5"
                          style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                            boxShadow: isProcessing || !rawContent.trim() ? 'none' : '0 8px 32px rgba(59, 130, 246, 0.35)'
                          }}
                          data-action="generate"
                        >
                          {/* Glow Effect */}
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300" />

                          <span className="relative flex items-center gap-2 justify-center">
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

            {/* Streaming Terminal Effect */}
            {isProcessing && streamingText && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
                <div className="w-full max-w-3xl bg-card rounded-xl shadow-2xl border border-border overflow-hidden mobile-w-[95vw] mobile-max-w-[95vw]">
                  <div className="flex items-center px-4 py-2 bg-secondary border-b border-border mobile-px-3 mobile-py-1.5">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="ml-4 text-xs text-muted-foreground font-mono mobile:text-[10px]">AI Agent — Analyzing Structure...</div>
                  </div>
                  <div className="p-6 font-mono text-sm text-green-400 h-[400px] overflow-y-auto custom-scrollbar mobile-p-3 mobile-h-[300px]">
                    <pre className="whitespace-pre-wrap break-words">
                      {streamingText}
                      <span className="animate-pulse">_</span>
                    </pre>
                  </div>
                </div>
              </div>
            )}


            {/* Footer Hint */}
            <p className="text-center text-muted-foreground text-sm animate-fade-in mobile-text-xs" style={{ animationDelay: '0.4s' }}>
              Powered by AI • Export to DOCX or PDF • Multiple professional styles
            </p>
          </div>
        </div>
      </>
    );
  }

  // --- WORKSPACE VIEW (EDITOR) ---
  return (
    <>
      <TutorialOverlay />
      <div className="h-screen flex flex-col overflow-hidden bg-background">
        {/* Premium Top Bar */}
        <header className="h-16 shrink-0 z-50 relative mobile:h-14">
          {/* Glassmorphism Header */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="relative h-full flex items-center justify-between px-5 mobile:px-3">
            {/* Left Section */}
            <div className="flex items-center gap-4 mobile:gap-2">
              {/* Back button - to dashboard if documentId exists, else to input mode */}
              {documentId ? (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 mobile:px-2 mobile:py-1.5"
                >
                  <ArrowLeft size={18} className="mobile:w-4 mobile:h-4" />
                  <span className="text-sm font-medium mobile:hidden">Dashboard</span>
                </Link>
              ) : (
                <button
                  onClick={() => setViewMode("input")}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 mobile:px-2 mobile:py-1.5"
                >
                  <ChevronLeft size={18} className="mobile:w-4 mobile:h-4" />
                  <span className="text-sm font-medium mobile:hidden">Back</span>
                </button>
              )}

              <div className="h-6 w-px bg-white/10 mobile:hidden" />

              {/* Document Title */}
              <div className="flex items-center gap-3 mobile:gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 mobile:p-1.5">
                  <FileText size={18} className="text-blue-400 mobile:w-4 mobile:h-4" />
                </div>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-9 w-72 bg-muted border-border hover:border-border-hover focus:border-primary focus:bg-muted transition-all font-medium text-foreground placeholder:text-muted-foreground rounded-lg mobile:w-40 mobile:h-8 mobile:text-sm"
                  placeholder="Untitled Document"
                />
              </div>
              
              {/* Save Status - Show when documentId exists */}
              {documentId && saveStatus && (
                <>
                  <div className="h-6 w-px bg-white/10 mobile:hidden" />
                  <div className="flex items-center gap-2 mobile:hidden">
                    {saveStatus.saveError ? (
                      <div className="flex items-center gap-2 text-red-400">
                        <AlertCircle size={14} />
                        <span className="text-xs">Error</span>
                      </div>
                    ) : saveStatus.isSaving ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 size={14} className="animate-spin" />
                        <span className="text-xs">Saving...</span>
                      </div>
                    ) : saveStatus.lastSaved ? (
                      <div className="flex items-center gap-2 text-green-500">
                        <Cloud size={14} />
                        <Check size={12} />
                        <span className="text-xs">Saved</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CloudOff size={14} />
                        <span className="text-xs">Not saved</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3 mobile:gap-1.5">
              {/* Format Toggle */}
              <div className="flex items-center p-1 rounded-xl bg-muted border border-border mobile:hidden">
                <button
                  onClick={() => setOutputFormat("docx")}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
                    outputFormat === "docx"
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-primary-foreground shadow-lg shadow-blue-500/25"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  DOCX
                </button>
                <button
                  onClick={() => setOutputFormat("pdf")}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
                    outputFormat === "pdf"
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-primary-foreground shadow-lg shadow-blue-500/25"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  PDF
                </button>
              </div>

              <div className="h-6 w-px bg-border mobile:hidden" />

              {/* Theme Toggle */}
              <div data-action="theme-toggle" className="mobile:hidden">
                <ThemeToggle />
              </div>

              {/* Markdown Export */}
              <button
                onClick={handleExportMarkdown}
                className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all border border-transparent hover:border-border mobile:p-1.5"
                title="Export as Markdown"
              >
                <FileCode size={18} className="mobile:w-4 mobile:h-4" />
              </button>

              {/* Main Export Button with Progress */}
              <div className="relative">
                <button
                  onClick={handleExport}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white transition-all duration-300 disabled:opacity-50 mobile:px-3 mobile:py-2 mobile:text-sm relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
                    boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)'
                  }}
                  data-action="export"
                >
                  {/* Progress bar background */}
                  {isExporting && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-purple-600/30"
                      style={{ width: `${exportProgress}%` }} />
                  )}

                  <div className="relative flex items-center gap-2">
                    {isExporting ? (
                      <>
                        <Loader2 className="animate-spin mobile:w-4 mobile:h-4" size={18} />
                        <span className="mobile:hidden">
                          {exportProgress < 100 ? `Exporting ${exportProgress}%` : 'Finalizing...'}
                        </span>
                      </>
                    ) : isProcessing ? (
                      <>
                        <Loader2 className="animate-spin mobile:w-4 mobile:h-4" size={18} />
                        <span className="mobile:hidden">Processing...</span>
                      </>
                    ) : (
                      <>
                        <Download size={18} className="mobile:w-4 mobile:h-4" />
                        <span className="mobile:hidden">Export</span>
                      </>
                    )}
                  </div>
                </button>

                {/* Progress indicator tooltip */}
                {isExporting && (
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap z-50">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-400 to-blue-400 rounded-full transition-all duration-300"
                          style={{ width: `${exportProgress}%` }}
                        />
                      </div>
                      <span>{exportProgress}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Workspace */}
        <div className="flex-1 flex overflow-hidden mobile:flex-col">
          {/* Premium Left Sidebar */}
          <div className="w-72 flex flex-col overflow-hidden relative mobile:w-full mobile:h-12 mobile:flex-row mobile:border-b mobile:border-white/10 mobile-sidebar-hidden">
            {/* Sidebar Background */}
            <div className="absolute inset-0 bg-card mobile:bg-gradient-to-r" />
            <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-border via-border/50 to-transparent mobile:hidden" />

            {/* Sidebar Tab Headers */}
            <div className="relative flex shrink-0 mobile:w-full">
              <div className="absolute inset-x-0 bottom-0 h-px bg-border mobile:hidden" />
              <button
                onClick={() => setSidebarTab("structure")}
                className={cn(
                  "flex-1 px-3 py-3.5 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 relative mobile:py-2 mobile:px-2",
                  sidebarTab === "structure"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutList size={13} className="mobile:w-3 mobile:h-3" />
                <span className="mobile:text-[10px]">Structure</span>
                {sidebarTab === "structure" && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mobile:hidden" />
                )}
              </button>
              <button
                onClick={() => setSidebarTab("styles")}
                className={cn(
                  "flex-1 px-3 py-3.5 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 relative mobile:py-2 mobile:px-2",
                  sidebarTab === "styles"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Paintbrush size={13} className="mobile:w-3 mobile:h-3" />
                <span className="mobile:text-[10px]">Styles</span>
                {sidebarTab === "styles" && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mobile:hidden" />
                )}
              </button>
              <button
                onClick={() => setSidebarTab("theme")}
                className={cn(
                  "flex-1 px-3 py-3.5 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 relative mobile:py-2 mobile:px-2",
                  sidebarTab === "theme"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Palette size={13} className="mobile:w-3 mobile:h-3" />
                <span className="mobile:text-[10px]">Theme</span>
                {sidebarTab === "theme" && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mobile:hidden" />
                )}
              </button>
              <button
                onClick={() => setSidebarTab("history")}
                className={cn(
                  "flex-1 px-3 py-3.5 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 relative mobile:py-2 mobile:px-2",
                  sidebarTab === "history"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <History size={13} className="mobile:w-3 mobile:h-3" />
                <span className="mobile:text-[10px]">History</span>
                {sidebarTab === "history" && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mobile:hidden" />
                )}
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="relative flex-1 overflow-y-auto p-4 custom-scrollbar mobile:hidden">
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
              ) : sidebarTab === "styles" ? (
                /* Document Styles Panel - Bulk Formatting */
                <DocumentStylesPanel editor={editor} />
              ) : sidebarTab === "history" ? (
                /* Version History Panel */
                <VersionHistoryPanel
                  documentId={documentId || null}
                  currentContent={jsonContent}
                  currentTitle={title}
                  onVersionRestored={() => {
                    // Reload document content after restore
                    window.location.reload();
                  }}
                />
              ) : (
                /* Theme & Metadata Panel */
                <div className="space-y-6">
                  {/* Theme Selection */}
                  <div>
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
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
                              : "bg-muted border border-border hover:border-primary/30 hover:bg-muted/80"
                          )}
                        >
                          <div className={cn("w-full h-1.5 rounded-full mb-2", style.color)} />
                          <span className={cn(
                            "text-xs font-semibold block",
                            selectedStyle === style.id ? "text-foreground" : "text-foreground/70 group-hover:text-foreground"
                          )}>{style.name}</span>
                          <span className="text-[10px] text-muted-foreground leading-tight">{style.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div>
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                      Document Info
                    </h3>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-medium text-muted-foreground">Subtitle</label>
                        <Input
                          value={subtitle}
                          onChange={(e) => setSubtitle(e.target.value)}
                          className="h-8 text-xs bg-muted border-border hover:border-primary/30 focus:border-primary rounded-lg text-foreground placeholder:text-muted-foreground"
                          placeholder="Optional subtitle..."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-medium text-muted-foreground">Author</label>
                        <Input
                          value={author}
                          onChange={(e) => setAuthor(e.target.value)}
                          className="h-8 text-xs bg-muted border-border hover:border-primary/30 focus:border-primary rounded-lg text-foreground placeholder:text-muted-foreground"
                          placeholder="Author name..."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-medium text-muted-foreground">Date</label>
                        <Input
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="h-8 text-xs bg-muted border-border hover:border-primary/30 focus:border-primary rounded-lg text-foreground placeholder:text-muted-foreground"
                          placeholder="Publication date..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Page Setup - Margins */}
                  <PageSetup />
                </div>
              )}
            </div>
          </div>

          {/* Center Canvas - Premium Editor Area */}
          <div className="flex-1 relative overflow-hidden flex flex-col mobile:w-full bg-background-secondary">
            {/* Subtle Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

            {/* Premium Status Bar */}
            <div className="relative h-10 flex items-center justify-between px-5 shrink-0 mobile:h-8 mobile:px-3">
              <div className="absolute inset-0 bg-muted/50" />
              <div className="absolute inset-x-0 bottom-0 h-px bg-border" />

              <div className="relative flex items-center gap-3 mobile:gap-1.5">
                <div className="flex items-center gap-2 mobile:gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mobile:w-1.5 mobile:h-1.5" />
                  <span className="text-xs font-medium text-muted-foreground mobile:text-[10px]">Page View</span>
                </div>
                <div className="h-3 w-px bg-border mobile:hidden" />
                <span className="text-xs text-muted-foreground mobile:hidden">Auto-saving</span>
              </div>

              <div className="relative flex items-center gap-3 mobile:gap-1.5">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mobile:text-[9px]">
                  {selectedStyle} style
                </span>
                <div className="px-2 py-0.5 rounded-md bg-muted border border-border mobile:px-1 mobile:py-0.25">
                  <span className="text-[10px] font-semibold text-foreground/70 mobile:text-[9px]">A4</span>
                </div>
              </div>
            </div>

            {/* WYSIWYG Editor - Always visible */}
            <div className="relative flex-1 overflow-hidden mobile:p-2">
              <DocumentEditor />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
