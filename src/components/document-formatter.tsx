"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
  ChevronRight,
  PanelRightClose,
  PanelRightOpen,
  StopCircle,
  MessageSquarePlus,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

import { OutlinePanel } from "@/components/editor/outline-panel";
import { DocumentEditor } from "@/components/editor/DocumentEditor";
import { AISidePanel } from "@/components/editor/AISidePanel";
import { DocumentStylesPanel } from "@/components/editor/DocumentStylesPanel";
import { VersionHistoryPanel } from "@/components/editor/VersionHistoryPanel";
import { TemplatesPanel } from "@/components/templates/templates-panel";
import { PageSetup } from "@/components/editor/PageSetup";
import { ThemeToggle } from "@/components/theme-toggle";
import { TutorialOverlay } from "@/components/tutorial-overlay";
import { ExportDropdown } from "@/components/editor/ExportDropdown";
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
  const [streamingDisplay, setStreamingDisplay] = useState<string>(""); // Human-readable display
  const [displayedText, setDisplayedText] = useState<string>(""); // For typing animation
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiPanelOpen, setAiPanelOpen] = useState(false); // AI Side Panel state
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  // Get editor focus state from store for Focus Mode (fade sidebars when typing)
  const { isEditorFocused } = useEditorStore();
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLineCountRef = useRef<number>(0);

  // Typing animation effect - gradually reveal text
  useEffect(() => {
    if (!streamingDisplay) {
      setDisplayedText("");
      return;
    }
    
    // Clear previous interval
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }
    
    // If displayed text is behind, animate to catch up
    if (displayedText.length < streamingDisplay.length) {
      const charsToAdd = streamingDisplay.length - displayedText.length;
      const charsPerTick = Math.max(1, Math.ceil(charsToAdd / 10)); // Faster for longer gaps
      
      typingIntervalRef.current = setInterval(() => {
        setDisplayedText(prev => {
          const nextLength = Math.min(prev.length + charsPerTick, streamingDisplay.length);
          const newText = streamingDisplay.substring(0, nextLength);
          
          if (nextLength >= streamingDisplay.length) {
            if (typingIntervalRef.current) {
              clearInterval(typingIntervalRef.current);
            }
          }
          return newText;
        });
      }, 20); // 20ms per tick = smooth animation
    }
    
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, [streamingDisplay]);

  // Extract readable text from streaming JSON
  const extractReadableText = useCallback((jsonText: string): string => {
    // Try to extract "content" values from partial JSON
    const contentMatches = jsonText.match(/"content"\s*:\s*"([^"]+)"/g);
    const textMatches = jsonText.match(/"text"\s*:\s*"([^"]+)"/g);
    const titleMatch = jsonText.match(/"title"\s*:\s*"([^"]+)"/);
    
    let display = "";
    
    if (titleMatch) {
      // Decode escape sequences
      const title = titleMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
      display += `📄 ${title}\n\n`;
    }
    
    const allMatches = [...(contentMatches || []), ...(textMatches || [])];
    allMatches.forEach(match => {
      const value = match.match(/"(?:content|text)"\s*:\s*"([^"]+)"/);
      if (value && value[1] && value[1].length > 2) {
        // Decode escape sequences like \n, \"
        const decoded = value[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
        display += decoded + "\n";
      }
    });
    
    return display || "Đang phân tích cấu trúc văn bản...";
  }, []);

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

  // Update editor content based on displayed text (with typing animation)
  useEffect(() => {
    if (!displayedText) return;
    
    const lines = displayedText.split('\n').filter(l => l.trim());
    if (lines.length === 0) return;
    
    const streamContent = lines.map(line => ({
      type: "paragraph",
      content: line ? [{ type: "text", text: line }] : []
    }));
    
    // Only update during processing (not after final content is set)
    if (isProcessing) {
      setJsonContent({ type: "doc", content: streamContent });
    }
    
    // Only scroll when a new line is added (not every character)
    if (lines.length > lastLineCountRef.current && isProcessing) {
      lastLineCountRef.current = lines.length;
      
      requestAnimationFrame(() => {
        const proseMirror = document.querySelector('.ProseMirror');
        if (proseMirror) {
          const lastParagraph = proseMirror.querySelector('p:last-of-type');
          if (lastParagraph) {
            // Scroll with element in the center of the viewport
            lastParagraph.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      });
    }
  }, [displayedText, isProcessing, setJsonContent]);

  const handleStop = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsProcessing(false);
      // Content is preserved - the streaming already updated jsonContent
      toast.addToast(toastSuccess("Đã dừng", "Nội dung đã sinh được giữ lại. Bạn có thể chỉnh sửa tiếp."));
    }
  }, [abortController, toast, setIsProcessing]);

  const handleAnalyze = useCallback(async () => {
    if (!rawContent.trim()) {
      toast.addToast(toastError("Input Required", "Please enter some content first"));
      return;
    }

    setIsProcessing(true);
    setError(null);
    setStreamingText("");
    setStreamingDisplay("");
    setDisplayedText("");
    lastLineCountRef.current = 0;
    
    // Switch to editor view immediately to show streaming in editor
    setViewMode("editor");
    
    // Set initial placeholder content in editor
    setJsonContent({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "⏳ Đang kết nối với AI..." }]
        }
      ]
    });

    // Create new AbortController
    const controller = new AbortController();
    setAbortController(controller);
    
    let lastContent: any = null; // Store last valid content for stop functionality

    try {
      let fullText = "";

      // Use Streaming API with AbortSignal
      await analyzeContentStream(
        rawContent,
        (chunk) => {
          fullText += chunk;
          setStreamingText(fullText);
          
          // Try to parse partial JSON and update editor in real-time
          const readable = extractReadableText(fullText);
          setStreamingDisplay(readable);
          
          // Update streaming display - typing animation useEffect will update editor
          // Don't call setJsonContent directly here to avoid jerky updates
        },
        undefined,
        undefined,
        controller.signal
      );

      // Parse final result from accumulated text
      let result;
      try {
        result = JSON.parse(fullText);
      } catch (e) {
        console.error("Failed to parse AI response:", fullText);
        // If stopped early or empty, keep the streaming content
        if (!fullText.trim() || lastContent) {
          if (lastContent) {
            toast.addToast(toastSuccess("Content Generated", "Nội dung đã được tạo (partial)"));
          }
          return;
        }
        throw new Error("Received invalid data from AI");
      }

      // Process final result
      setTitle(result.title || "");
      setSubtitle(result.subtitle || "");
      setAuthor(result.author || "");
      setDate(result.date || "");

      // Helper to decode escape sequences
      const decodeText = (text: string) => {
        if (!text) return "";
        return text.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\t/g, '\t');
      };

      // Convert elements to Tiptap JSON format
      const tiptapContent = result.elements.map((el: any) => {
        const content = decodeText(el.content || "");
        
        if (el.type === "heading1") {
          return { type: "heading", attrs: { level: 1 }, content: content ? [{ type: "text", text: content }] : [] };
        } else if (el.type === "heading2") {
          return { type: "heading", attrs: { level: 2 }, content: content ? [{ type: "text", text: content }] : [] };
        } else if (el.type === "heading3") {
          return { type: "heading", attrs: { level: 3 }, content: content ? [{ type: "text", text: content }] : [] };
        } else if (el.type === "list") {
          const listType = el.style === "numbered" ? "orderedList" : "bulletList";
          const items = (el.items || []).map((item: string) => ({
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: decodeText(item) }] }]
          }));
          return { type: listType, content: items };
        } else if (el.type === "quote") {
          return { type: "blockquote", content: [{ type: "paragraph", content: content ? [{ type: "text", text: content }] : [] }] };
        } else if (el.type === "code_block") {
          return { type: "codeBlock", attrs: { language: el.language || null }, content: content ? [{ type: "text", text: content }] : [] };
        } else {
          // For paragraphs with \n, split into multiple paragraphs
          if (content.includes('\n')) {
            const paragraphs = content.split('\n').filter((p: string) => p.trim());
            if (paragraphs.length > 1) {
              return paragraphs.map((p: string) => ({
                type: "paragraph",
                content: [{ type: "text", text: p.trim() }]
              }));
            }
          }
          return { type: "paragraph", content: content ? [{ type: "text", text: content }] : [] };
        }
      }).flat(); // Flatten in case of split paragraphs

      setJsonContent({ type: "doc", content: tiptapContent });
      setViewMode("editor");
      toast.addToast(toastSuccess("Analysis Complete", "Document structure has been generated successfully"));
    } catch (err: any) {
      // If aborted by user, keep the content that was generated
      if (err.message === 'CANCELLED' || err.name === 'AbortError') {
        if (lastContent) {
          toast.addToast(toastInfo("Đã dừng", "Đã giữ lại nội dung đã sinh"));
        }
        return;
      }
      toast.addToast(toastError(
        "Analysis Failed",
        `Failed to analyze content: ${err.message}`,
        <button
          onClick={handleAnalyze}
          className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-md text-xs font-semibold transition-colors border border-white/10"
        >
          Retry
        </button>
      ));
      console.error(err);
    } finally {
      setIsProcessing(false);
      setStreamingText("");
      setStreamingDisplay("");
      setDisplayedText("");
      lastLineCountRef.current = 0;
      setAbortController(null);
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
                    <FileText size={18} className="text-amber-500" />
                    <span className="text-sm font-medium text-foreground">New Draft Document</span>
                  </div>
                </div>
                {user && (
                  <div className="w-8 h-8 rounded-full bg-zinc-700 dark:bg-zinc-300 flex items-center justify-center text-zinc-100 dark:text-zinc-800 text-sm font-semibold">
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
                  <div className="inline-flex p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <Wand2 className="w-8 h-8 text-amber-500" />
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
                        className="px-6 py-3 rounded-xl font-semibold text-zinc-900 bg-amber-500 hover:bg-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40"
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

            {/* Modal removed - streaming now happens directly in editor */}
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
              <Sparkles className="w-6 h-6 text-amber-500" />
              <span className="font-bold text-foreground hidden sm:inline">AI Doc Formatter</span>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                /* Logged in user */
                <>
                  <a
                    href="/dashboard"
                    className="px-4 py-2 text-sm font-semibold text-zinc-900 bg-amber-500 hover:bg-amber-400 rounded-lg transition-all shadow-sm"
                  >
                    Dashboard
                  </a>
                  <div className="w-8 h-8 rounded-full bg-zinc-700 dark:bg-zinc-300 flex items-center justify-center text-zinc-100 dark:text-zinc-800 text-sm font-semibold">
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
                    className="px-4 py-2 text-sm font-semibold text-zinc-900 bg-amber-500 hover:bg-amber-400 rounded-lg transition-all shadow-sm"
                  >
                    Get Started
                  </a>
                </>
              )}
            </div>
          </nav>

          {/* Premium Background Effects - Monochrome */}
          <div className="absolute inset-0 -z-10 pointer-events-none">
            {/* Subtle Ambient Orbs - Zinc tones */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-zinc-500/5 dark:bg-zinc-400/5 rounded-full blur-[120px] animate-float-slow" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] animate-float-slow" style={{ animationDelay: "3s" }} />
            <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-zinc-500/5 rounded-full blur-[80px] animate-float" style={{ animationDelay: "1.5s" }} />

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
                  <div className="absolute inset-0 bg-amber-500 rounded-2xl blur-xl opacity-30 animate-pulse" />
                  <div className="relative p-4 rounded-2xl glass-card">
                    <Sparkles className="w-10 h-10 text-amber-500 mobile-hidden" />
                    <Sparkles className="w-8 h-8 text-amber-500 hidden mobile:block" />
                  </div>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mobile-text-4xl">
                <span className="text-foreground">Create beautiful docs</span>
                <br />
                <span className="text-amber-500">at warp speed</span>
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
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-amber-500 rounded-full mobile-hidden" />
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
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-amber-500 rounded-full mobile-hidden" />
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
                          onClick={isProcessing ? handleStop : handleAnalyze}
                          disabled={!rawContent.trim() && !isProcessing}
                          className={cn(
                            "group relative px-8 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed mobile-w-full mobile-px-4 mobile-py-2.5",
                            isProcessing 
                              ? "bg-red-500 hover:bg-red-600 text-white" 
                              : "bg-amber-500 hover:bg-amber-400 text-zinc-900 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40"
                          )}
                          data-action="generate"
                        >
                          <span className="relative flex items-center gap-2 justify-center">
                            {isProcessing ? (
                              <>
                                <LogOut className="rotate-180" size={20} />
                                <span>STOP</span>
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

            {/* Modal removed - streaming now happens directly in editor */}


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
        {/* Minimal Clean Header */}
        <header className="h-12 shrink-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm mobile:h-14">
          <div className="h-full flex items-center justify-between px-4 mobile:px-3">
            {/* Left Section - Breadcrumb Style */}
            <div className="flex items-center gap-3 mobile:gap-2">
              {/* Back button */}
              {documentId ? (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft size={16} />
                  <span className="text-sm mobile:hidden">Dashboard</span>
                </Link>
              ) : (
                <button
                  onClick={() => setViewMode("input")}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft size={16} />
                  <span className="text-sm mobile:hidden">Back</span>
                </button>
              )}

              {/* Breadcrumb separator */}
              <ChevronRight size={14} className="text-muted-foreground/50 mobile:hidden" />

              {/* Document Title - Inline editable */}
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-8 min-w-[180px] w-auto bg-transparent border-none hover:bg-muted/50 focus:bg-muted focus:ring-0 transition-all font-medium text-sm text-foreground placeholder:text-muted-foreground rounded px-2"
                placeholder="Untitled Document"
              />

              {/* Save Status - Minimal */}
              {documentId && saveStatus && (
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mobile:hidden">
                  {saveStatus.isSaving ? (
                    <>
                      <Loader2 size={10} className="animate-spin" />
                      <span>Saving</span>
                    </>
                  ) : saveStatus.saveError ? (
                    <span className="text-red-400 flex items-center gap-1">
                      <AlertCircle size={10} />
                      Error
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <Check size={10} />
                      Saved
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Center - Empty for respiratory space */}
            <div className="flex-1" />

            {/* Right Section - Actions */}
            <div className="flex items-center gap-2">
              {/* AI Assistant Toggle Button - Subtle when inactive, visible when active */}
              <button
                onClick={() => setAiPanelOpen(!aiPanelOpen)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
                  aiPanelOpen
                    ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700"
                    : "bg-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                )}
                title={aiPanelOpen ? "Close AI Assistant" : "Open AI Assistant"}
              >
                <Sparkles size={14} className={cn(aiPanelOpen ? "text-amber-500" : "text-amber-500")} />
                <span>AI Assistant</span>
              </button>

              {/* Theme Toggle - Minimal */}
              <ThemeToggle />
              
              {/* Sidebar Toggle - Hover only icon */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={cn(
                  "p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors mobile:hidden",
                  !sidebarOpen && "text-foreground"
                )}
                title={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
              >
                {sidebarOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
              </button>

              {/* Export Button - Primary Action */}
              <ExportDropdown
                onExportPdf={() => { setOutputFormat("pdf"); handleExport(); }}
                onExportDocx={() => { setOutputFormat("docx"); handleExport(); }}
                onExportMarkdown={handleExportMarkdown}
                isExporting={isExporting}
                isProcessing={isProcessing}
                exportProgress={exportProgress}
              />
            </div>
          </div>
        </header>

        {/* Main Workspace */}
        <div className="flex-1 flex overflow-hidden mobile:flex-col">
          {/* Minimalist Left Sidebar - Navigation Rail Style with Focus Mode */}
          <div className={cn(
            "flex flex-col overflow-hidden relative mobile:w-full mobile:h-12 mobile:flex-row mobile:border-b mobile:border-border mobile-sidebar-hidden transition-all duration-300 ease-in-out bg-transparent group/sidebar",
            sidebarOpen ? "w-64" : "w-0 opacity-0",
            // Focus Mode: Fade sidebar when editor is focused, show on hover
            sidebarOpen && isEditorFocused ? "opacity-50 hover:opacity-100" : "opacity-100"
          )}>
            {/* Minimal border only */}
            <div className="absolute inset-y-0 right-0 w-px bg-border mobile:hidden" />

            {/* Sidebar Tab Headers - 3 main tabs */}
            <div className="relative flex shrink-0 mobile:w-full border-b border-border bg-muted/30">
              <button
                onClick={() => setSidebarTab("structure")}
                className={cn(
                  "flex-1 px-4 py-3 text-xs font-medium transition-all flex items-center justify-center gap-2 relative",
                  sidebarTab === "structure"
                    ? "text-foreground bg-background border-b-2 border-amber-500"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <LayoutList size={14} />
                <span>Outline</span>
              </button>
              <button
                onClick={() => setSidebarTab("theme")}
                className={cn(
                  "flex-1 px-4 py-3 text-xs font-medium transition-all flex items-center justify-center gap-2 relative",
                  sidebarTab === "theme"
                    ? "text-foreground bg-background border-b-2 border-amber-500"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Palette size={14} />
                <span>Style</span>
              </button>
              <button
                onClick={() => setSidebarTab("history")}
                className={cn(
                  "flex-1 px-4 py-3 text-xs font-medium transition-all flex items-center justify-center gap-2 relative",
                  sidebarTab === "history"
                    ? "text-foreground bg-background border-b-2 border-amber-500"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <History size={14} />
                <span>History</span>
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
                      element.classList.add('ring-2', 'ring-amber-500/50', 'ring-offset-2', 'ring-offset-transparent');
                      setTimeout(() => {
                        element.classList.remove('ring-2', 'ring-amber-500/50', 'ring-offset-2', 'ring-offset-transparent');
                      }, 1500);
                    }
                  }}
                />
              ) : sidebarTab === "history" ? (
                /* Version History Panel */
                <VersionHistoryPanel
                  documentId={(documentId || null) as string | null}
                  currentContent={jsonContent}
                  currentTitle={title}
                  onVersionRestored={() => {
                    // Reload to fetch restored content
                    window.location.reload();
                  }}
                />
              ) : (
                /* Theme, Styles & Metadata Panel - Combined */
                <div className="space-y-6">
                  {/* Document Style Selection */}
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
                              ? "bg-amber-500/10 border border-amber-500/30 shadow-lg shadow-amber-500/10"
                              : "bg-muted/50 border border-border hover:border-amber-500/30 hover:bg-muted"
                          )}
                        >
                          <div className={cn("w-full h-1 rounded-full mb-2", style.color)} />
                          <span className={cn(
                            "text-xs font-semibold block",
                            selectedStyle === style.id ? "text-amber-600 dark:text-amber-400" : "text-foreground/70 group-hover:text-foreground"
                          )}>{style.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Document Metadata */}
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
                          className="h-8 text-xs bg-background border-border hover:border-amber-500/30 focus:border-amber-500 rounded-lg text-foreground placeholder:text-muted-foreground"
                          placeholder="Optional subtitle..."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-medium text-muted-foreground">Author</label>
                        <Input
                          value={author}
                          onChange={(e) => setAuthor(e.target.value)}
                          className="h-8 text-xs bg-background border-border hover:border-amber-500/30 focus:border-amber-500 rounded-lg text-foreground placeholder:text-muted-foreground"
                          placeholder="Author name..."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-medium text-muted-foreground">Date</label>
                        <Input
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="h-8 text-xs bg-background border-border hover:border-amber-500/30 focus:border-amber-500 rounded-lg text-foreground placeholder:text-muted-foreground"
                          placeholder="Publication date..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Page Setup */}
                  <PageSetup />
                </div>
              )}
            </div>
          </div>

          {/* Center Canvas - Premium Editor Area with smooth center transition */}
          <div className={cn(
            "flex-1 relative overflow-hidden flex flex-col mobile:w-full transition-all duration-300 ease-in-out",
            !sidebarOpen && "mx-auto max-w-5xl" // Center when sidebar closed
          )}>
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
              {/* Full overlay when processing - blocks all interactions */}
              {isProcessing && (
                <>
                  {/* Overlay to block clicks */}
                  <div className="absolute inset-0 z-20 bg-transparent" />
                  
                  {/* Top status bar */}
                  <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <div className="absolute inset-0 h-5 w-5 animate-ping opacity-30 rounded-full bg-white" />
                      </div>
                      <div>
                        <span className="text-sm font-medium">AI đang tạo nội dung...</span>
                        <p className="text-xs text-white/70">Nội dung sẽ hiển thị bên dưới khi được sinh ra</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleStop}
                      className="px-4 py-2 text-sm font-semibold bg-white text-purple-600 hover:bg-white/90 rounded-lg transition-colors flex items-center gap-2 shadow-md"
                    >
                      <StopCircle className="h-4 w-4" />
                      Dừng & Giữ nội dung
                    </button>
                  </div>
                  
                  {/* Progress indicator at bottom */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
                    <div className="bg-card/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-border flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{animationDelay: '0ms'}} />
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{animationDelay: '150ms'}} />
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{animationDelay: '300ms'}} />
                      </div>
                      <span className="text-xs text-muted-foreground">Đang sinh nội dung với Vertex AI</span>
                    </div>
                  </div>
                </>
              )}
              <DocumentEditor />
            </div>
          </div>

          {/* Right AI Side Panel with Focus Mode */}
          <AISidePanel
            editor={editor}
            isOpen={aiPanelOpen}
            onClose={() => setAiPanelOpen(false)}
            isEditorFocused={isEditorFocused}
          />
        </div>
      </div>
    </>
  );
}
