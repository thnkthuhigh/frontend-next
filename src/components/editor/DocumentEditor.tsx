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
  Printer,
  Eye,
  Edit3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Palette,
  Plus,
  Trash2,
  RowsIcon,
  Columns,
  ListTodo,
} from "lucide-react";
import { useDocumentStore } from "@/store/document-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PagedPreview } from "./PagedPreview";
import { AIToolbar } from "./AIToolbar";
import { extractTOC, generateTOCJson } from "@/lib/toc-generator";

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
}

function ToolbarButton({ onClick, isActive, disabled, children, title }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "p-2 rounded-lg transition-all duration-200 relative group",
        isActive
          ? "bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-400 shadow-sm shadow-blue-500/10"
          : "text-white/40 hover:text-white/80 hover:bg-white/5",
        disabled && "opacity-30 cursor-not-allowed hover:bg-transparent hover:text-white/40"
      )}
    >
      {isActive && (
        <div className="absolute inset-0 rounded-lg border border-blue-500/30" />
      )}
      <span className="relative">{children}</span>
    </button>
  );
}

function EditorToolbar({ editor, viewMode, onViewModeChange }: {
  editor: Editor | null;
  viewMode: "edit" | "preview";
  onViewModeChange: (mode: "edit" | "preview") => void;
}) {
  if (!editor) return null;

  return (
    <div className="relative flex items-center justify-between px-4 py-2.5 overflow-x-auto">
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      {/* Left: Formatting tools (only visible in edit mode) - scrollable on mobile */}
      <div className={cn("relative flex items-center gap-1 flex-nowrap min-w-0", viewMode === "preview" && "opacity-30 pointer-events-none")}>
        {/* History */}
        <div className="flex items-center gap-0.5 pr-3 mr-1 border-r border-white/10">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <Undo size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <Redo size={18} />
          </ToolbarButton>
        </div>

        {/* Text Formatting */}
        <div className="flex items-center gap-0.5 px-2 border-r border-white/10">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="Bold"
          >
            <Bold size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            title="Italic"
          >
            <Italic size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            title="Underline"
          >
            <UnderlineIcon size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
            title="Strikethrough"
          >
            <Strikethrough size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            isActive={editor.isActive("highlight")}
            title="Highlight"
          >
            <Highlighter size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive("code")}
            title="Inline Code"
          >
            <Code size={18} />
          </ToolbarButton>
        </div>

        {/* Text Alignment */}
        <div className="flex items-center gap-0.5 px-2 border-r border-white/10">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            isActive={editor.isActive({ textAlign: "left" })}
            title="Align Left"
          >
            <AlignLeft size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            isActive={editor.isActive({ textAlign: "center" })}
            title="Align Center"
          >
            <AlignCenter size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            isActive={editor.isActive({ textAlign: "right" })}
            title="Align Right"
          >
            <AlignRight size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            isActive={editor.isActive({ textAlign: "justify" })}
            title="Justify"
          >
            <AlignJustify size={18} />
          </ToolbarButton>
        </div>

        {/* Colors */}
        <div className="flex items-center gap-0.5 px-2 border-r border-white/10">
          <ToolbarButton
            onClick={() => editor.chain().focus().setColor("#dc2626").run()}
            title="Red Text"
          >
            <span className="w-4 h-4 rounded bg-red-600" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setColor("#2563eb").run()}
            title="Blue Text"
          >
            <span className="w-4 h-4 rounded bg-blue-600" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setColor("#16a34a").run()}
            title="Green Text"
          >
            <span className="w-4 h-4 rounded bg-green-600" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().unsetColor().run()}
            title="Remove Color"
          >
            <Palette size={18} />
          </ToolbarButton>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-0.5 px-2 border-r border-white/10">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive("heading", { level: 1 })}
            title="Heading 1"
          >
            <Heading1 size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive("heading", { level: 2 })}
            title="Heading 2"
          >
            <Heading2 size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive("heading", { level: 3 })}
            title="Heading 3"
          >
            <Heading3 size={18} />
          </ToolbarButton>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-0.5 px-2 border-r border-white/10">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            title="Bullet List"
          >
            <List size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            title="Numbered List"
          >
            <ListOrdered size={18} />
          </ToolbarButton>
        </div>

        {/* Block Elements */}
        <div className="flex items-center gap-0.5 px-2 border-r border-white/10">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive("blockquote")}
            title="Quote"
          >
            <Quote size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive("codeBlock")}
            title="Code Block"
          >
            <Code size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Rule"
          >
            <Minus size={18} />
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
            <ListTodo size={18} />
          </ToolbarButton>
        </div>

        {/* Table */}
        <div className="flex items-center gap-0.5 px-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            title="Insert Table"
          >
            <TableIcon size={18} />
          </ToolbarButton>
          {editor.isActive("table") && (
            <>
              <ToolbarButton
                onClick={() => editor.chain().focus().addRowAfter().run()}
                title="Add Row"
              >
                <Plus size={14} />
                <RowsIcon size={14} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                title="Add Column"
              >
                <Plus size={14} />
                <Columns size={14} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().deleteRow().run()}
                title="Delete Row"
              >
                <Trash2 size={14} className="text-destructive" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().deleteTable().run()}
                title="Delete Table"
              >
                <TableIcon size={14} className="text-destructive" />
              </ToolbarButton>
            </>
          )}
        </div>
      </div>

      {/* Right: View Mode Toggle */}
      <div className="relative flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
        <button
          onClick={() => onViewModeChange("edit")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200",
            viewMode === "edit"
              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
              : "text-white/50 hover:text-white/80"
          )}
        >
          <Edit3 size={14} />
          Edit
        </button>
        <button
          onClick={() => onViewModeChange("preview")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200",
            viewMode === "preview"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25"
              : "text-white/50 hover:text-white/80"
          )}
        >
          <Eye size={14} />
          Preview
        </button>
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

  // Memoize extensions to prevent duplicate registration warnings
  const extensions = useMemo(() => [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
    }),
    Placeholder.configure({
      placeholder: "Start typing your document content here...",
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
  ], []);

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
      <EditorToolbar editor={editor} viewMode={viewMode} onViewModeChange={setViewMode} />

      {/* AI Toolbar - Premium Features */}
      <AIToolbar editor={editor} />

      {/* Scrollable Document View */}
      <div className="flex-1 overflow-auto bg-neutral-200 dark:bg-neutral-800 py-8">
        <div className="flex flex-col items-center gap-8 px-4">

          {/* ===== COVER PAGE ===== */}
          <div
            className="bg-white shadow-xl document-page"
            style={{
              width: `${A4_WIDTH_MM}mm`,
              minHeight: `297mm`,
              padding: `${A4_MARGIN_MM}mm`,
              fontFamily: styleConfig.fontFamily,
              boxSizing: 'border-box',
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
              <div className="text-sm text-gray-600 mt-auto mb-8">
                {author && <p>{author}</p>}
                {date && <p className="mt-1">{date}</p>}
              </div>
            </div>
          </div>

          {/* Page Break Indicator */}
          <div className="flex items-center justify-center w-full max-w-[210mm] print:hidden">
            <div className="flex-1 h-px bg-blue-300" />
            <span className="text-xs text-blue-400 px-4 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full mx-2">
              Page Break • Content starts on next page
            </span>
            <div className="flex-1 h-px bg-blue-300" />
          </div>

          {/* ===== CONTENT PAGE - Continuous Scroll ===== */}
          <div
            className="bg-white shadow-xl document-page"
            style={{
              width: `${A4_WIDTH_MM}mm`,
              minHeight: `297mm`,
              padding: `${A4_MARGIN_MM}mm`,
              fontFamily: styleConfig.fontFamily,
              boxSizing: 'border-box',
            }}
          >
            {/* Editable Content */}
            <div
              className="document-content"
              style={{
                fontFamily: styleConfig.fontFamily,
                '--heading-color': styleConfig.headingColor,
                '--accent-color': styleConfig.accentColor,
              } as React.CSSProperties}
            >
              <EditorContent editor={editor} />
            </div>
          </div>

          {/* Info Footer */}
          <div className="text-center text-sm text-gray-500 pb-4 print:hidden max-w-[210mm]">
            <p className="mb-2">
              💡 Switch to <strong>Preview</strong> mode to see exact page breaks
            </p>
            <p className="text-xs text-gray-400">
              Edit mode uses continuous scroll • Preview mode shows paginated A4 pages
            </p>
          </div>
        </div>
      </div>

      {/* Print Button */}
      <div className="fixed bottom-6 right-6 print:hidden z-50">
        <Button
          onClick={handlePrint}
          size="lg"
          className="shadow-xl bg-primary hover:bg-primary/90"
        >
          <Printer className="mr-2" size={20} />
          Print / Export PDF
        </Button>
      </div>
    </div>
  );
}

export default DocumentEditor;
