"use client";

import { useEffect, useCallback, useRef, useState, useMemo } from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import TextAlign from "@tiptap/extension-text-align";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import FontFamily from "@tiptap/extension-font-family";
import { CustomImageExtension } from "./extensions/CustomImageExtension";
import {
  Bold,
  Italic,
  Strikethrough,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Table as TableIcon,
  Minus,
  Undo,
  Redo,
  Eye,
  Edit3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  ListTodo,
  FileText,
  Printer,
  ChevronDown,
  Type,
} from "lucide-react";
import { useDocumentStore } from "@/store/document-store";
import { useEditorStore } from "@/store/editor-store";
import { cn } from "@/lib/utils";
import { PagedPreview } from "./PagedPreview";
import { FloatingToolbar } from "./FloatingToolbar";
import { UnsplashImageSearch } from "./UnsplashImageSearch";
import { KeyboardShortcutsModal, useKeyboardShortcuts } from "@/components/keyboard-shortcuts-modal";
import { SlashCommand } from "./SlashCommand";
import { AICommandHandler } from "./SlashCommand/AICommandHandler";
import { Callout } from "./extensions/Callout";
import { CustomBulletList, BULLET_STYLES, type BulletStyle } from "./extensions/CustomBulletList";
import { SectionNavigator } from "./SectionNavigator";
import { extractTOC, generateTOCJson } from "@/lib/toc-generator";
import { setupImageHandlers } from "@/lib/editor-image-handlers";

// A4 dimensions in mm for CSS
const A4_WIDTH_MM = 210;
const A4_MARGIN_MM = 25;
const A4_CONTENT_HEIGHT_MM = 247; // 297 - 25*2

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
  shortcut?: string;
}

function ToolbarButton({ onClick, isActive, disabled, children, title, shortcut }: ToolbarButtonProps) {
  // Format tooltip with shortcut
  const tooltipText = shortcut ? `${title} (${shortcut})` : title;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tooltipText}
      className={cn(
        "p-1.5 rounded-lg transition-all duration-200 group relative",
        isActive
          ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 shadow-sm"
          : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/80 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/60",
        disabled && "opacity-30 cursor-not-allowed hover:bg-transparent"
      )}
    >
      {children}
    </button>
  );
}

// Toolbar Divider Component
function ToolbarDivider() {
  return <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1.5" />;
}

// Text Type Dropdown Component
function TextTypeDropdown({ editor }: { editor: Editor }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getCurrentType = () => {
    if (editor.isActive("heading", { level: 1 })) return "Heading 1";
    if (editor.isActive("heading", { level: 2 })) return "Heading 2";
    if (editor.isActive("heading", { level: 3 })) return "Heading 3";
    return "Paragraph";
  };

  const options = [
    { label: "Paragraph", icon: <Type size={14} />, action: () => editor.chain().focus().setParagraph().run() },
    { label: "Heading 1", icon: <Heading1 size={14} />, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: "Heading 2", icon: <Heading2 size={14} />, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "Heading 3", icon: <Heading3 size={14} />, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
  ];

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all duration-200 text-sm font-medium",
          "text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100/80",
          "dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/60"
        )}
        title="Text Type"
      >
        <Type size={14} />
        <span className="hidden sm:inline text-xs">{getCurrentType()}</span>
        <ChevronDown size={12} className={cn("transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-36 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg z-50">
          {options.map((option) => (
            <button
              key={option.label}
              onClick={() => {
                option.action();
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors",
                getCurrentType() === option.label
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              )}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EditorToolbar({ editor, viewMode, onViewModeChange, focusMode, onFocusModeChange }: {
  editor: Editor | null;
  viewMode: "edit" | "preview";
  onViewModeChange: (mode: "edit" | "preview") => void;
  focusMode: boolean;
  onFocusModeChange: (mode: boolean) => void;
}) {
  if (!editor) return null;

  return (
    <div className="relative flex items-center justify-center px-6 py-4 overflow-visible">
      {/* Floating Pill Toolbar - Glassmorphism Design */}
      <div className="flex items-center gap-0.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-700/30 shadow-lg shadow-black/5 dark:shadow-black/20">

        {/* ===== SEGMENT 1: History ===== */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
            shortcut="Ctrl+Z"
          >
            <Undo size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
            shortcut="Ctrl+Y"
          >
            <Redo size={16} />
          </ToolbarButton>
        </div>

        <ToolbarDivider />

        {/* ===== SEGMENT 2: Text Type Dropdown ===== */}
        <TextTypeDropdown editor={editor} />

        <ToolbarDivider />

        {/* ===== SEGMENT 3: Formatting ===== */}
        <div className={cn("flex items-center gap-0.5", viewMode === "preview" && "opacity-30 pointer-events-none")}>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="Bold"
            shortcut="Ctrl+B"
          >
            <Bold size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            title="Italic"
            shortcut="Ctrl+I"
          >
            <Italic size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            title="Underline"
            shortcut="Ctrl+U"
          >
            <UnderlineIcon size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
            title="Strikethrough"
            shortcut="Ctrl+Shift+S"
          >
            <Strikethrough size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            isActive={editor.isActive("highlight")}
            title="Highlight"
            shortcut="Ctrl+Shift+H"
          >
            <Highlighter size={16} />
          </ToolbarButton>
        </div>

        <ToolbarDivider />

        {/* ===== SEGMENT 4: Alignment ===== */}
        <div className={cn("flex items-center gap-0.5", viewMode === "preview" && "opacity-30 pointer-events-none")}>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            isActive={editor.isActive({ textAlign: "left" })}
            title="Align Left"
          >
            <AlignLeft size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            isActive={editor.isActive({ textAlign: "center" })}
            title="Align Center"
          >
            <AlignCenter size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            isActive={editor.isActive({ textAlign: "right" })}
            title="Align Right"
          >
            <AlignRight size={16} />
          </ToolbarButton>
        </div>

        <ToolbarDivider />

        {/* ===== SEGMENT 5: Lists & Blocks ===== */}
        <div className={cn("flex items-center gap-0.5", viewMode === "preview" && "opacity-30 pointer-events-none")}>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            title="Bullet List"
          >
            <List size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            title="Numbered List"
          >
            <ListOrdered size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive("blockquote")}
            title="Quote"
          >
            <Quote size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive("codeBlock")}
            title="Code Block"
          >
            <Code size={16} />
          </ToolbarButton>
        </div>

        <ToolbarDivider />

        {/* ===== SEGMENT 6: Insert ===== */}
        <div className={cn("flex items-center gap-0.5", viewMode === "preview" && "opacity-30 pointer-events-none")}>
          <ToolbarButton
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            title="Insert Table"
          >
            <TableIcon size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Rule"
          >
            <Minus size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => {
              const tocItems = extractTOC(editor.getJSON());
              if (tocItems.length === 0) {
                alert("Không có heading nào để tạo mục lục");
                return;
              }
              const tocJson = generateTOCJson(tocItems);
              editor.chain().focus().insertContentAt(0, tocJson.content || []).run();
            }}
            title="Insert Table of Contents"
          >
            <ListTodo size={16} />
          </ToolbarButton>
        </div>

        <ToolbarDivider />

        {/* ===== SEGMENT 7: View Mode Controls ===== */}
        <div className="flex items-center gap-1">
          {/* Focus/Print Mode Toggle */}
          <div className="flex items-center p-0.5 rounded-full bg-zinc-100/80 dark:bg-zinc-800/60">
            <button
              onClick={() => onFocusModeChange(true)}
              className={cn(
                "p-1.5 rounded-full transition-all text-xs font-medium",
                focusMode
                  ? "bg-white dark:bg-zinc-700 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Focus Mode - Continuous scroll, no page breaks"
            >
              <FileText size={14} />
            </button>
            <button
              onClick={() => onFocusModeChange(false)}
              className={cn(
                "p-1.5 rounded-full transition-all text-xs font-medium",
                !focusMode
                  ? "bg-white dark:bg-zinc-700 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Print Mode - A4 pages with margins"
            >
              <Printer size={14} />
            </button>
          </div>

          {/* Edit/Preview Toggle */}
          <div className="flex items-center p-0.5 rounded-full bg-zinc-100/80 dark:bg-zinc-800/60">
            <button
              onClick={() => onViewModeChange("edit")}
              className={cn(
                "p-1.5 rounded-full transition-all",
                viewMode === "edit"
                  ? "bg-white dark:bg-zinc-700 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Edit mode"
            >
              <Edit3 size={14} />
            </button>
            <button
              onClick={() => onViewModeChange("preview")}
              className={cn(
                "p-1.5 rounded-full transition-all",
                viewMode === "preview"
                  ? "bg-white dark:bg-zinc-700 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Preview mode"
            >
              <Eye size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DocumentEditorProps {
  onPrint?: () => void;
}

export function DocumentEditor({ onPrint }: DocumentEditorProps) {
  const {
    title,
    subtitle,
    author,
    date,
    htmlContent,
    jsonContent,
    setHtmlContent,
    setJsonContent,
    selectedStyle,
  } = useDocumentStore();

  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [focusMode, setFocusMode] = useState(true); // Focus mode default - continuous scroll
  const [showUnsplashSearch, setShowUnsplashSearch] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | undefined>();
  const [showSectionNav, setShowSectionNav] = useState(false); // Hidden - use Outline instead

  // Keyboard shortcuts modal
  const { isOpen: showShortcutsModal, close: closeShortcutsModal } = useKeyboardShortcuts();

  // Handle section reordering from SectionNavigator
  const handleSectionReorder = useCallback((newContent: Record<string, unknown>) => {
    setJsonContent(newContent);
  }, [setJsonContent]);

  // Handle section click - scroll to section in editor
  const handleSectionClick = useCallback((sectionId: string, nodeIndex: number) => {
    setActiveSectionId(sectionId);

    // Find the heading element in the editor and scroll to it
    const editorElement = document.querySelector('.ProseMirror');
    if (editorElement) {
      const headings = editorElement.querySelectorAll('h1, h2, h3, [data-page-break]');
      let targetIndex = 0;

      // Count H1s to find the right one
      headings.forEach((heading, i) => {
        if (heading.tagName === 'H1') {
          targetIndex++;
          if (targetIndex === nodeIndex + 1 || sectionId === `section-${i}`) {
            heading.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      });
    }
  }, []);

  // Memoize extensions to prevent duplicate registration warnings
  const extensions = useMemo(() => [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
      // Disable default bulletList - we use CustomBulletList instead
      bulletList: false,
    }),
    // Custom BulletList with bulletStyle attribute
    CustomBulletList,
    Placeholder.configure({
      placeholder: 'Start typing... or press "/" for commands',
    }),
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
    TextStyle,
    Color,
    Highlight.configure({
      multicolor: true,
    }),
    Underline,
    // Phase 3: Font Family support
    FontFamily.configure({
      types: ['textStyle'],
    }),
    // Phase 4: Advanced Image support with High-DPI, resize, caption
    CustomImageExtension.configure({
      inline: false,
      allowBase64: true,
      HTMLAttributes: {
        class: 'editor-image',
      },
    }),
    Callout,
    SlashCommand,
  ], []);

  const { setEditor, setEditorFocused } = useEditorStore();

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    // Initialize from JSON (Single Source of Truth) or fall back to HTML (legacy)
    content: jsonContent || htmlContent || "",
    onUpdate: ({ editor }) => {
      // Save JSON as Single Source of Truth
      setJsonContent(editor.getJSON());
      // Also save HTML for backward compatibility (export, preview)
      setHtmlContent(editor.getHTML(), true);
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[500px]",
      },
    },
  });

  // Store editor instance globally for sidebar access
  useEffect(() => {
    setEditor(editor);
    return () => setEditor(null);
  }, [editor, setEditor]);

  // Focus Mode: Track editor focus state for sidebar opacity transitions
  useEffect(() => {
    if (!editor) return;

    const handleFocus = () => {
      setEditorFocused(true);
    };

    const handleBlur = () => {
      // Add a small delay before unfocusing to prevent flicker
      setTimeout(() => {
        setEditorFocused(false);
      }, 150);
    };

    editor.on("focus", handleFocus);
    editor.on("blur", handleBlur);

    return () => {
      editor.off("focus", handleFocus);
      editor.off("blur", handleBlur);
    };
  }, [editor, setEditorFocused]);

  // Listen for Unsplash image search event from SlashCommand
  useEffect(() => {
    const handleUnsplashEvent = () => {
      setShowUnsplashSearch(true);
    };

    window.addEventListener("slash-unsplash-image", handleUnsplashEvent);
    return () => {
      window.removeEventListener("slash-unsplash-image", handleUnsplashEvent);
    };
  }, []);

  // Phase 4: Setup image paste & drop handlers
  useEffect(() => {
    if (!editor) return;

    const cleanup = setupImageHandlers(editor, {
      onUploadStart: () => {
        console.log('Uploading image...');
      },
      onUploadComplete: (url) => {
        console.log('Image uploaded:', url);
      },
      onUploadError: (error) => {
        console.error('Image upload failed:', error);
        alert(`Upload failed: ${error}`);
      },
    });

    return cleanup;
  }, [editor]);

  // Sync content from store when it changes externally (e.g., AI analysis)
  // Prioritize JSON content over HTML
  useEffect(() => {
    if (!editor) return;

    // If jsonContent exists and differs from editor, update from JSON
    if (jsonContent) {
      const currentJson = JSON.stringify(editor.getJSON());
      const storeJson = JSON.stringify(jsonContent);
      if (currentJson !== storeJson) {
        editor.commands.setContent(jsonContent);
      }
    } else if (htmlContent && htmlContent !== editor.getHTML()) {
      // Fallback to HTML for legacy documents
      editor.commands.setContent(htmlContent);
    }
  }, [jsonContent, htmlContent, editor]);

  const handlePrint = useCallback(() => {
    // Switch to preview mode first for accurate output
    setViewMode("preview");
    setTimeout(() => {
      if (onPrint) {
        onPrint();
      } else {
        window.print();
      }
    }, 500);
  }, [onPrint]);

  // Get style config from centralized styles
  const getStyleConfig = () => {
    const configs: Record<string, { fontFamily: string; headingColor: string; accentColor: string }> = {
      professional: { fontFamily: "'Times New Roman', serif", headingColor: "#0f172a", accentColor: "#1e3a8a" },
      academic: { fontFamily: "'Times New Roman', serif", headingColor: "#000000", accentColor: "#000000" },
      modern: { fontFamily: "Arial, sans-serif", headingColor: "#2563eb", accentColor: "#0ea5e9" },
      minimal: { fontFamily: "Calibri, sans-serif", headingColor: "#171717", accentColor: "#737373" },
      elegant: { fontFamily: "'Georgia', serif", headingColor: "#78350f", accentColor: "#b45309" },
      corporate: { fontFamily: "'Helvetica Neue', Arial, sans-serif", headingColor: "#312e81", accentColor: "#4338ca" },
      creative: { fontFamily: "'Poppins', sans-serif", headingColor: "#be185d", accentColor: "#ec4899" },
      newsletter: { fontFamily: "'Merriweather', Georgia, serif", headingColor: "#0d9488", accentColor: "#14b8a6" },
      resume: { fontFamily: "'Roboto', Arial, sans-serif", headingColor: "#047857", accentColor: "#059669" },
      technical: { fontFamily: "'Consolas', 'Monaco', monospace", headingColor: "#c2410c", accentColor: "#ea580c" },
    };
    return configs[selectedStyle] || configs.professional;
  };

  const styleConfig = getStyleConfig();

  // If in preview mode, show PagedPreview component (fullscreen)
  if (viewMode === "preview") {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <PagedPreview onBackToEdit={() => setViewMode("edit")} />
      </div>
    );
  }

  // Edit mode - continuous scroll editor
  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <EditorToolbar
        editor={editor}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        focusMode={focusMode}
        onFocusModeChange={setFocusMode}
      />

      {/* Main Content Area with Section Navigator */}
      <div className="flex-1 flex overflow-hidden">
        {/* Section Navigator Sidebar */}
        {showSectionNav && (
          <SectionNavigator
            jsonContent={jsonContent}
            onReorder={handleSectionReorder}
            onSectionClick={handleSectionClick}
            activeSectionId={activeSectionId}
          />
        )}

        {/* Scrollable Document View - Focus Mode vs Print Mode */}
        <div className={cn(
          "flex-1 overflow-auto transition-all duration-300",
          focusMode
            ? "bg-background" // Clean background for focus
            : "bg-slate-100 dark:bg-zinc-950 pt-12 pb-20" // Cool gray paper background
        )}>
          {focusMode ? (
            /* ===== FOCUS MODE - Continuous scroll, no page breaks ===== */
            <div className="max-w-3xl mx-auto px-10 py-16">
              {/* Optional Title Block */}
              {(title || subtitle) && (
                <div className="mb-12 pb-8 border-b border-border">
                  {title && (
                    <h1
                      className="text-4xl font-bold mb-3"
                      style={{ color: styleConfig.headingColor }}
                    >
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="text-lg text-muted-foreground italic">{subtitle}</p>
                  )}
                  {(author || date) && (
                    <div className="text-sm text-muted-foreground mt-4 flex items-center gap-3">
                      {author && <span>{author}</span>}
                      {author && date && <span>•</span>}
                      {date && <span>{date}</span>}
                    </div>
                  )}
                </div>
              )}

              {/* Editable Content - Clean, distraction-free */}
              <div
                className="document-content editor-content-wrapper prose prose-zinc dark:prose-invert max-w-none"
                style={{
                  fontFamily: styleConfig.fontFamily,
                  '--heading-color': styleConfig.headingColor,
                  '--accent-color': styleConfig.accentColor,
                } as React.CSSProperties}
              >
                <EditorContent editor={editor} />
              </div>
            </div>
          ) : (
            /* ===== PRINT MODE - A4 pages with margins ===== */
            <div className="flex flex-col items-center gap-12 px-4 mt-10">
              {/* Cover Page */}
              <div
                className="bg-white dark:bg-zinc-900 document-page transition-all duration-500"
                style={{
                  width: `${A4_WIDTH_MM}mm`,
                  minHeight: `297mm`,
                  padding: `${A4_MARGIN_MM + 10}mm`,
                  fontFamily: styleConfig.fontFamily,
                  boxSizing: 'border-box',
                  /* Multi-layer shadow for floating effect */
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.02)',
                }}
              >
                <div
                  className="h-full flex flex-col justify-center items-center text-center border-b-2"
                  style={{
                    borderColor: styleConfig.accentColor,
                    minHeight: `${A4_CONTENT_HEIGHT_MM}mm`,
                  }}
                >
                  <h1
                    className="text-3xl font-bold mb-4"
                    style={{ color: styleConfig.headingColor }}
                  >
                    {title || "Untitled Document"}
                  </h1>
                  {subtitle && (
                    <h2
                      className="text-xl italic mb-6"
                      style={{ color: styleConfig.accentColor }}
                    >
                      {subtitle}
                    </h2>
                  )}
                  <div className="w-16 h-0.5 my-6" style={{ backgroundColor: styleConfig.accentColor }} />
                  <div className="text-sm text-muted-foreground mt-auto mb-8">
                    {author && <p>{author}</p>}
                    {date && <p className="mt-1">{date}</p>}
                  </div>
                </div>
              </div>

              {/* Page Break Indicator */}
              <div className="flex items-center justify-center w-full max-w-[210mm] print:hidden">
                <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                <span className="text-[10px] text-zinc-400 dark:text-zinc-600 px-4 py-1 font-medium">
                  Page Break
                </span>
                <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
              </div>

              {/* Content Page */}
              <div
                className="bg-white dark:bg-zinc-900 document-page transition-all duration-500"
                style={{
                  width: `${A4_WIDTH_MM}mm`,
                  minHeight: `297mm`,
                  padding: `${A4_MARGIN_MM + 10}mm`,
                  fontFamily: styleConfig.fontFamily,
                  boxSizing: 'border-box',
                  /* Multi-layer shadow for floating effect */
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.02)',
                }}
              >
                <div
                  className="document-content editor-content-wrapper"
                  style={{
                    fontFamily: styleConfig.fontFamily,
                    '--heading-color': styleConfig.headingColor,
                    '--accent-color': styleConfig.accentColor,
                  } as React.CSSProperties}
                >
                  <EditorContent editor={editor} />
                </div>
              </div>
            </div>
          )}

          {/* Floating Toolbar - appears on text selection (formatting only) */}
          <FloatingToolbar editor={editor} />

          {/* AI Command Handler - listens for slash command events */}
          <AICommandHandler editor={editor} />

          {/* Unsplash Image Search Modal */}
          {editor && (
            <UnsplashImageSearch
              editor={editor}
              isOpen={showUnsplashSearch}
              onClose={() => setShowUnsplashSearch(false)}
            />
          )}

          {/* Keyboard Shortcuts Modal */}
          <KeyboardShortcutsModal
            isOpen={showShortcutsModal}
            onClose={closeShortcutsModal}
          />

          {/* Minimal Hint - only show when editor is empty */}
          {!focusMode && (
            <div className="text-center text-xs text-zinc-400 dark:text-zinc-500 pb-8 print:hidden max-w-[210mm] mx-auto">
              Type <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-mono text-zinc-600 dark:text-zinc-400">/</kbd> for commands
              <span className="mx-2 text-zinc-300 dark:text-zinc-600">•</span>
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-mono text-zinc-600 dark:text-zinc-400">Ctrl+/</kbd> for shortcuts
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DocumentEditor;