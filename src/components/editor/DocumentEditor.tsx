"use client";

import { useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import {
  Bold,
  Italic,
  Strikethrough,
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
  Printer
} from "lucide-react";
import { useDocumentStore } from "@/store/document-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
        "p-2 rounded-md transition-colors",
        isActive
          ? "bg-primary/20 text-primary"
          : "hover:bg-secondary text-muted-foreground hover:text-foreground",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}

function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-1 p-2 border-b border-border bg-card/50 flex-wrap">
      {/* History */}
      <div className="flex items-center gap-0.5 pr-2 border-r border-border">
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
      <div className="flex items-center gap-0.5 px-2 border-r border-border">
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
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          title="Strikethrough"
        >
          <Strikethrough size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive("code")}
          title="Inline Code"
        >
          <Code size={18} />
        </ToolbarButton>
      </div>

      {/* Headings */}
      <div className="flex items-center gap-0.5 px-2 border-r border-border">
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
      <div className="flex items-center gap-0.5 px-2 border-r border-border">
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
      <div className="flex items-center gap-0.5 px-2 border-r border-border">
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
      </div>

      {/* Table */}
      <div className="flex items-center gap-0.5 px-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          title="Insert Table"
        >
          <TableIcon size={18} />
        </ToolbarButton>
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
    setHtmlContent,
    selectedStyle,
  } = useDocumentStore();

  const editorContainerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
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
    ],
    content: htmlContent || "",
    onUpdate: ({ editor }) => {
      setHtmlContent(editor.getHTML(), true);
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[500px]",
      },
    },
  });

  // Sync content from store when it changes externally
  useEffect(() => {
    if (editor && htmlContent !== editor.getHTML()) {
      editor.commands.setContent(htmlContent || "");
    }
  }, [htmlContent, editor]);

  const handlePrint = useCallback(() => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  }, [onPrint]);

  // Get style config based on selected style
  const getStyleConfig = () => {
    const configs = {
      professional: {
        fontFamily: "'Times New Roman', serif",
        headingColor: "#0f172a",
        accentColor: "#1e3a8a",
      },
      academic: {
        fontFamily: "'Times New Roman', serif",
        headingColor: "#000000",
        accentColor: "#000000",
      },
      modern: {
        fontFamily: "Arial, sans-serif",
        headingColor: "#2563eb",
        accentColor: "#0ea5e9",
      },
      minimal: {
        fontFamily: "Calibri, sans-serif",
        headingColor: "#171717",
        accentColor: "#737373",
      },
    };
    return configs[selectedStyle] || configs.professional;
  };

  const styleConfig = getStyleConfig();

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <EditorToolbar editor={editor} />

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

          {/* ===== CONTENT PAGE - Continuous Scroll with Visual Page Breaks ===== */}
          <div
            ref={editorContainerRef}
            className="bg-white shadow-xl document-page wysiwyg-content-page"
            style={{
              width: `${A4_WIDTH_MM}mm`,
              minHeight: `297mm`,
              padding: `${A4_MARGIN_MM}mm`,
              fontFamily: styleConfig.fontFamily,
              boxSizing: 'border-box',
              // Visual page break lines every A4 content height
              backgroundImage: `repeating-linear-gradient(
                to bottom,
                transparent 0mm,
                transparent ${A4_CONTENT_HEIGHT_MM}mm,
                rgba(59, 130, 246, 0.15) ${A4_CONTENT_HEIGHT_MM}mm,
                rgba(59, 130, 246, 0.15) calc(${A4_CONTENT_HEIGHT_MM}mm + 2px),
                transparent calc(${A4_CONTENT_HEIGHT_MM}mm + 2px)
              )`,
              backgroundPosition: '0 0',
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
            <p className="mb-1">
              📄 Blue lines indicate where page breaks will occur when printing
            </p>
            <p className="text-xs text-gray-400">
              Margins: 25mm (auto) • Width: A4 (210mm) • Browser will handle exact pagination when printing
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
