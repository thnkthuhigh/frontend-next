"use client";

import React, { useCallback } from "react";
import { Editor } from "@tiptap/react";
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Paintbrush,
  RotateCcw,
  Wand2,
  CircleDot,
  Circle,
  Square,
  Minus,
  Check,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BULLET_STYLES } from "./extensions/CustomBulletList";

interface DocumentStylesPanelProps {
  editor: Editor | null;
}

// Heading color presets
const HEADING_COLORS = [
  { id: "default", name: "Default", value: "" },
  { id: "blue", name: "Blue", value: "#2563eb" },
  { id: "purple", name: "Purple", value: "#7c3aed" },
  { id: "green", name: "Green", value: "#059669" },
  { id: "red", name: "Red", value: "#dc2626" },
  { id: "orange", name: "Orange", value: "#ea580c" },
  { id: "gray", name: "Gray", value: "#4b5563" },
];

// Text sizes for paragraphs
const PARAGRAPH_SIZES = [
  { id: "small", name: "Small", value: "0.875rem" },
  { id: "normal", name: "Normal", value: "1rem" },
  { id: "large", name: "Large", value: "1.125rem" },
];

// Bullet style icons
const BULLET_ICONS: Record<string, React.ReactNode> = {
  disc: <CircleDot size={14} />,
  circle: <Circle size={14} />,
  square: <Square size={14} />,
  dash: <Minus size={14} />,
  check: <Check size={14} />,
  arrow: <ArrowRight size={14} />,
};

export function DocumentStylesPanel({ editor }: DocumentStylesPanelProps) {
  // Count elements in document
  const getElementCounts = useCallback(() => {
    if (!editor) return { h1: 0, h2: 0, h3: 0, p: 0, ul: 0, ol: 0, quote: 0, code: 0 };

    const json = editor.getJSON();
    const counts = { h1: 0, h2: 0, h3: 0, p: 0, ul: 0, ol: 0, quote: 0, code: 0 };

    const countNodes = (nodes: any[]) => {
      nodes?.forEach((node) => {
        if (node.type === "heading") {
          if (node.attrs?.level === 1) counts.h1++;
          else if (node.attrs?.level === 2) counts.h2++;
          else if (node.attrs?.level === 3) counts.h3++;
        } else if (node.type === "paragraph") counts.p++;
        else if (node.type === "bulletList") counts.ul++;
        else if (node.type === "orderedList") counts.ol++;
        else if (node.type === "blockquote") counts.quote++;
        else if (node.type === "codeBlock") counts.code++;

        if (node.content) countNodes(node.content);
      });
    };

    countNodes(json.content || []);
    return counts;
  }, [editor]);

  // Apply color to all headings of a specific level
  const applyHeadingColor = useCallback(
    (level: number, color: string) => {
      if (!editor) return;

      const { state, view } = editor;
      const { tr, doc } = state;
      let modified = false;

      doc.descendants((node, pos) => {
        if (node.type.name === "heading" && node.attrs.level === level) {
          // Find text nodes and apply color mark
          node.descendants((textNode, textPos) => {
            if (textNode.isText) {
              const from = pos + 1 + textPos;
              const to = from + textNode.nodeSize;

              if (color) {
                tr.addMark(
                  from,
                  to,
                  state.schema.marks.textStyle.create({ color })
                );
              } else {
                tr.removeMark(from, to, state.schema.marks.textStyle);
              }
              modified = true;
            }
          });
        }
      });

      if (modified) {
        view.dispatch(tr);
      }
    },
    [editor]
  );

  // Apply bullet style to all bullet lists
  const applyBulletStyleToAll = useCallback(
    (style: string) => {
      if (!editor) return;

      const { state, view } = editor;
      const { tr, doc } = state;
      let modified = false;

      doc.descendants((node, pos) => {
        if (node.type.name === "bulletList") {
          tr.setNodeMarkup(pos, undefined, { ...node.attrs, bulletStyle: style });
          modified = true;
        }
      });

      if (modified) {
        view.dispatch(tr);
      }
    },
    [editor]
  );

  // Convert all headings of one level to another
  const convertHeadingLevel = useCallback(
    (fromLevel: number, toLevel: number) => {
      if (!editor || fromLevel === toLevel) return;

      const { state, view } = editor;
      const { tr, doc } = state;
      let modified = false;

      doc.descendants((node, pos) => {
        if (node.type.name === "heading" && node.attrs.level === fromLevel) {
          tr.setNodeMarkup(pos, undefined, { ...node.attrs, level: toLevel });
          modified = true;
        }
      });

      if (modified) {
        view.dispatch(tr);
      }
    },
    [editor]
  );

  // Reset all formatting
  const resetAllFormatting = useCallback(() => {
    if (!editor) return;

    const { state, view } = editor;
    const { tr, doc } = state;
    let modified = false;

    // Remove all marks from text
    doc.descendants((node, pos) => {
      if (node.isText && node.marks.length > 0) {
        const from = pos;
        const to = pos + node.nodeSize;
        node.marks.forEach((mark) => {
          if (mark.type.name !== "link") {
            tr.removeMark(from, to, mark.type);
          }
        });
        modified = true;
      }

      // Reset bullet styles
      if (node.type.name === "bulletList" && node.attrs.bulletStyle !== "disc") {
        tr.setNodeMarkup(pos, undefined, { ...node.attrs, bulletStyle: "disc" });
        modified = true;
      }
    });

    if (modified) {
      view.dispatch(tr);
    }
  }, [editor]);

  const counts = getElementCounts();

  if (!editor) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        Editor not available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Document Statistics */}
      <div>
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
          <Type size={12} />
          Document Stats
        </h3>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded-lg bg-muted/50 border border-border">
            <div className="text-lg font-bold text-foreground">{counts.h1}</div>
            <div className="text-[10px] text-muted-foreground">H1</div>
          </div>
          <div className="p-2 rounded-lg bg-muted/50 border border-border">
            <div className="text-lg font-bold text-foreground">{counts.h2}</div>
            <div className="text-[10px] text-muted-foreground">H2</div>
          </div>
          <div className="p-2 rounded-lg bg-muted/50 border border-border">
            <div className="text-lg font-bold text-foreground">{counts.h3}</div>
            <div className="text-[10px] text-muted-foreground">H3</div>
          </div>
          <div className="p-2 rounded-lg bg-muted/50 border border-border">
            <div className="text-lg font-bold text-foreground">{counts.p}</div>
            <div className="text-[10px] text-muted-foreground">Para</div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center mt-2">
          <div className="p-2 rounded-lg bg-muted/50 border border-border">
            <div className="text-lg font-bold text-foreground">{counts.ul}</div>
            <div className="text-[10px] text-muted-foreground">Lists</div>
          </div>
          <div className="p-2 rounded-lg bg-muted/50 border border-border">
            <div className="text-lg font-bold text-foreground">{counts.ol}</div>
            <div className="text-[10px] text-muted-foreground">Num</div>
          </div>
          <div className="p-2 rounded-lg bg-muted/50 border border-border">
            <div className="text-lg font-bold text-foreground">{counts.quote}</div>
            <div className="text-[10px] text-muted-foreground">Quote</div>
          </div>
          <div className="p-2 rounded-lg bg-muted/50 border border-border">
            <div className="text-lg font-bold text-foreground">{counts.code}</div>
            <div className="text-[10px] text-muted-foreground">Code</div>
          </div>
        </div>
      </div>

      {/* Bulk Heading Colors */}
      <div>
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
          <Paintbrush size={12} />
          Heading Colors
        </h3>
        <div className="space-y-3">
          {/* H1 Colors */}
          {counts.h1 > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Heading1 size={14} className="text-muted-foreground" />
                <span className="text-xs text-foreground font-medium">
                  All H1 ({counts.h1})
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {HEADING_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => applyHeadingColor(1, color.value)}
                    className={cn(
                      "w-6 h-6 rounded-md border transition-all hover:scale-110",
                      color.value
                        ? "border-border hover:border-primary/50"
                        : "border-dashed border-border bg-muted"
                    )}
                    style={{ backgroundColor: color.value || undefined }}
                    title={color.name}
                  >
                    {!color.value && (
                      <RotateCcw size={12} className="mx-auto text-muted-foreground" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* H2 Colors */}
          {counts.h2 > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Heading2 size={14} className="text-muted-foreground" />
                <span className="text-xs text-foreground font-medium">
                  All H2 ({counts.h2})
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {HEADING_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => applyHeadingColor(2, color.value)}
                    className={cn(
                      "w-6 h-6 rounded-md border transition-all hover:scale-110",
                      color.value
                        ? "border-border hover:border-primary/50"
                        : "border-dashed border-border bg-muted"
                    )}
                    style={{ backgroundColor: color.value || undefined }}
                    title={color.name}
                  >
                    {!color.value && (
                      <RotateCcw size={12} className="mx-auto text-muted-foreground" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* H3 Colors */}
          {counts.h3 > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Heading3 size={14} className="text-muted-foreground" />
                <span className="text-xs text-foreground font-medium">
                  All H3 ({counts.h3})
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {HEADING_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => applyHeadingColor(3, color.value)}
                    className={cn(
                      "w-6 h-6 rounded-md border transition-all hover:scale-110",
                      color.value
                        ? "border-border hover:border-primary/50"
                        : "border-dashed border-border bg-muted"
                    )}
                    style={{ backgroundColor: color.value || undefined }}
                    title={color.name}
                  >
                    {!color.value && (
                      <RotateCcw size={12} className="mx-auto text-muted-foreground" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bulk List Styles */}
      {counts.ul > 0 && (
        <div>
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
            <List size={12} />
            All List Bullets ({counts.ul})
          </h3>
          <div className="flex flex-wrap gap-1">
            {BULLET_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => applyBulletStyleToAll(style.id)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs bg-muted hover:bg-muted/80 border border-border transition-colors"
                title={`Apply ${style.label} to all lists`}
              >
                {BULLET_ICONS[style.id]}
                <span className="text-foreground">{style.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Heading Level Conversion */}
      <div>
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
          <Wand2 size={12} />
          Convert Headings
        </h3>
        <div className="space-y-2">
          {counts.h1 > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-16">H1 → </span>
              <button
                onClick={() => convertHeadingLevel(1, 2)}
                className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded border border-border"
              >
                H2
              </button>
              <button
                onClick={() => convertHeadingLevel(1, 3)}
                className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded border border-border"
              >
                H3
              </button>
            </div>
          )}
          {counts.h2 > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-16">H2 → </span>
              <button
                onClick={() => convertHeadingLevel(2, 1)}
                className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded border border-border"
              >
                H1
              </button>
              <button
                onClick={() => convertHeadingLevel(2, 3)}
                className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded border border-border"
              >
                H3
              </button>
            </div>
          )}
          {counts.h3 > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-16">H3 → </span>
              <button
                onClick={() => convertHeadingLevel(3, 1)}
                className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded border border-border"
              >
                H1
              </button>
              <button
                onClick={() => convertHeadingLevel(3, 2)}
                className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded border border-border"
              >
                H2
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reset All */}
      <div>
        <button
          onClick={resetAllFormatting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 transition-colors"
        >
          <RotateCcw size={14} />
          Reset All Formatting
        </button>
      </div>
    </div>
  );
}
