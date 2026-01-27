"use client";

import { useRef, useState, useMemo, useLayoutEffect } from "react";
import { useDocumentStore } from "@/store/document-store";
import { paginateBlocks, Page, PAGE_HEIGHT, PAGE_MARGIN_Y, CONTENT_HEIGHT } from "@/lib/pagination-utils";
import { TemplateSelector } from "@/components/templates/template-selector";
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight, X } from "lucide-react";

// A4 dimensions in pixels at 72 DPI
const A4_WIDTH_PT = 595;
const A4_HEIGHT_PT = 842;

interface StyleConfig {
  fontFamily: string;
  titleSize: number;
  subtitleSize: number;
  h1Size: number;
  h2Size: number;
  h3Size: number;
  bodySize: number;
  codeSize: number;
  lineHeight: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  codeBg: string;
  tableHeaderBg: string;
  tableHeaderText: string;
  tableAltBg: string;
}

const STYLE_CONFIG: Record<string, StyleConfig> = {
  professional: {
    fontFamily: "'Times New Roman', serif",
    titleSize: 28, subtitleSize: 16, h1Size: 18, h2Size: 15, h3Size: 13, bodySize: 11, codeSize: 9,
    lineHeight: 1.5,
    primaryColor: "#0f172a", secondaryColor: "#334155", accentColor: "#1e3a8a",
    codeBg: "#f1f5f9",
    tableHeaderBg: "#1e3a8a", tableHeaderText: "#ffffff", tableAltBg: "#f8fafc"
  },
  academic: {
    fontFamily: "'Times New Roman', serif",
    titleSize: 26, subtitleSize: 14, h1Size: 16, h2Size: 14, h3Size: 12, bodySize: 11, codeSize: 9,
    lineHeight: 1.8,
    primaryColor: "#000000", secondaryColor: "#141414", accentColor: "#000000",
    codeBg: "#f5f5f5",
    tableHeaderBg: "#000000", tableHeaderText: "#ffffff", tableAltBg: "#ffffff"
  },
  modern: {
    fontFamily: "Arial, sans-serif",
    titleSize: 30, subtitleSize: 16, h1Size: 20, h2Size: 16, h3Size: 13, bodySize: 10, codeSize: 9,
    lineHeight: 1.4,
    primaryColor: "#2563eb", secondaryColor: "#374151", accentColor: "#0ea5e9",
    codeBg: "#eff6ff",
    tableHeaderBg: "#2563eb", tableHeaderText: "#ffffff", tableAltBg: "#f0f9ff"
  },
  minimal: {
    fontFamily: "Calibri, sans-serif",
    titleSize: 28, subtitleSize: 14, h1Size: 18, h2Size: 15, h3Size: 13, bodySize: 10, codeSize: 9,
    lineHeight: 1.4,
    primaryColor: "#171717", secondaryColor: "#404040", accentColor: "#737373",
    codeBg: "#fafafa",
    tableHeaderBg: "#404040", tableHeaderText: "#ffffff", tableAltBg: "#f5f5f5"
  }
};

interface DocumentPreviewProps {
  scale?: number;
}

export function DocumentPreview({ scale = 0.55 }: DocumentPreviewProps) {
  const { title, subtitle, author, date, blocks, selectedStyle, updateBlock } = useDocumentStore();
  const [measuredHeights, setMeasuredHeights] = useState<Record<string, number>>({});
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const hiddenContainerRef = useRef<HTMLDivElement>(null);
  
  // Scaled dimensions
  const A4_WIDTH = Math.round(A4_WIDTH_PT * scale);
  const A4_HEIGHT = Math.round(A4_HEIGHT_PT * scale);
  const MARGIN_X = Math.round(40 * scale);
  const MARGIN_Y = Math.round(35 * scale);

  const pages = useMemo(() => paginateBlocks(blocks, measuredHeights), [blocks, measuredHeights]);
  const style = STYLE_CONFIG[selectedStyle];
  const scaledSize = (s: number) => Math.round(s * scale);

  // Measure blocks
  useLayoutEffect(() => {
    if (hiddenContainerRef.current && blocks.length > 0) {
      const newHeights: Record<string, number> = {};
      const children = hiddenContainerRef.current.children;
      
      for (let i = 0; i < children.length; i++) {
        const child = children[i] as HTMLElement;
        const id = child.getAttribute("data-block-id");
        if (id) {
          const cs = window.getComputedStyle(child);
          const mt = parseFloat(cs.marginTop) || 0;
          const mb = parseFloat(cs.marginBottom) || 0;
          newHeights[id] = Math.ceil(child.offsetHeight + mt + mb);
        }
      }
      
      if (JSON.stringify(newHeights) !== JSON.stringify(measuredHeights)) {
        setMeasuredHeights(newHeights);
      }
    }
  }, [blocks, selectedStyle]);

  const formatText = (t: string) => t.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*(.+?)\*/g, "<i>$1</i>");
  
  const handleBlur = (id: string, e: React.FocusEvent<HTMLElement>) => {
    updateBlock(id, { content: e.currentTarget.innerText });
  };

  const handleUpdateStyle = (key: string, value: any) => {
    if (!activeBlockId) return;
    const block = blocks.find(b => b.id === activeBlockId);
    if (block) {
      updateBlock(activeBlockId, { 
        meta: { ...block.meta, customStyle: { ...block.meta?.customStyle, [key]: value } }
      });
    }
  };

  // Measurement render (unscaled)
  const renderMeasure = (block: any) => {
    const base = { fontFamily: style.fontFamily, color: style.secondaryColor, fontSize: style.bodySize, lineHeight: style.lineHeight, marginBottom: 6 };

    switch (block.type) {
      case "heading1": 
        return <h1 key={block.id} data-block-id={block.id} style={{ ...base, fontSize: style.h1Size, fontWeight: 'bold', color: style.primaryColor, marginTop: 12, marginBottom: 8, borderBottom: `1px solid ${style.accentColor}` }}>{block.content}</h1>;
      case "heading2": 
        return <h2 key={block.id} data-block-id={block.id} style={{ ...base, fontSize: style.h2Size, fontWeight: 'bold', color: style.accentColor, marginTop: 10, marginBottom: 6 }}>{block.content}</h2>;
      case "heading3": 
        return <h3 key={block.id} data-block-id={block.id} style={{ ...base, fontSize: style.h3Size, fontWeight: 'bold', marginTop: 8, marginBottom: 4 }}>{block.content}</h3>;
      case "paragraph": 
        return <p key={block.id} data-block-id={block.id} style={{ ...base, textAlign: 'justify' }} dangerouslySetInnerHTML={{ __html: formatText(block.content) }} />;
      case "list": 
        return (
          <div key={block.id} data-block-id={block.id} style={{ marginLeft: 16, marginBottom: 8 }}>
            {block.meta?.items?.map((item: string, i: number) => (
              <div key={i} style={{ ...base, display: 'flex', marginBottom: 2 }}>
                <span style={{ marginRight: 6, color: style.primaryColor }}>{block.meta.listStyle === 'numbered' ? `${i+1}.` : '•'}</span>
                <span dangerouslySetInnerHTML={{ __html: formatText(item) }} />
              </div>
            ))}
          </div>
        );
      case "divider": 
        return <hr key={block.id} data-block-id={block.id} style={{ border: 'none', borderTop: `1px solid ${style.accentColor}`, opacity: 0.3, margin: '10px 0' }} />;
      default: 
        return <div key={block.id} data-block-id={block.id} style={base}>{block.content}</div>;
    }
  };

  // Display render (scaled)
  const renderBlock = (block: any) => {
    const custom = block.meta?.customStyle || {};
    const isActive = activeBlockId === block.id;
    const base: React.CSSProperties = { 
      fontFamily: style.fontFamily, 
      color: custom.color || style.secondaryColor, 
      fontSize: scaledSize(style.bodySize), 
      lineHeight: style.lineHeight, 
      marginBottom: scaledSize(6),
      textAlign: custom.textAlign || 'left',
      fontWeight: custom.fontWeight,
      fontStyle: custom.fontStyle
    };
    
    const editableClass = `rounded px-0.5 cursor-text transition-colors ${isActive ? 'bg-blue-100/50' : 'hover:bg-blue-50/30'}`;
    
    const editable = {
      contentEditable: true,
      suppressContentEditableWarning: true,
      onBlur: (e: React.FocusEvent<HTMLElement>) => handleBlur(block.id, e),
      onClick: (e: React.MouseEvent) => { e.stopPropagation(); setActiveBlockId(block.id); },
      className: editableClass
    };

    switch (block.type) {
      case "heading1": 
        return <h1 key={block.id} {...editable} style={{ ...base, fontSize: scaledSize(style.h1Size), fontWeight: 'bold', color: custom.color || style.primaryColor, marginTop: scaledSize(12), marginBottom: scaledSize(8), borderBottom: `1px solid ${style.accentColor}` }}>{block.content}</h1>;
      case "heading2": 
        return <h2 key={block.id} {...editable} style={{ ...base, fontSize: scaledSize(style.h2Size), fontWeight: 'bold', color: custom.color || style.accentColor, marginTop: scaledSize(10), marginBottom: scaledSize(6) }}>{block.content}</h2>;
      case "heading3": 
        return <h3 key={block.id} {...editable} style={{ ...base, fontSize: scaledSize(style.h3Size), fontWeight: 'bold', marginTop: scaledSize(8), marginBottom: scaledSize(4) }}>{block.content}</h3>;
      case "paragraph": 
        return <p key={block.id} {...editable} style={{ ...base, textAlign: custom.textAlign || 'justify' }} dangerouslySetInnerHTML={{ __html: formatText(block.content) }} />;
      case "list": 
        return (
          <div key={block.id} style={{ marginLeft: scaledSize(16), marginBottom: scaledSize(8) }}>
            {block.meta?.items?.map((item: string, i: number) => (
              <div key={i} style={{ ...base, display: 'flex', marginBottom: scaledSize(2) }}>
                <span style={{ marginRight: scaledSize(6), color: style.primaryColor }}>{block.meta.listStyle === 'numbered' ? `${i+1}.` : '•'}</span>
                <span dangerouslySetInnerHTML={{ __html: formatText(item) }} />
              </div>
            ))}
          </div>
        );
      case "divider": 
        return <hr key={block.id} style={{ border: 'none', borderTop: `1px solid ${style.accentColor}`, opacity: 0.3, margin: `${scaledSize(10)}px 0` }} />;
      default: 
        return <div key={block.id} style={base}>{block.content}</div>;
    }
  };

  return (
    <div 
      className="flex flex-col items-center gap-4 py-4 bg-neutral-800 min-h-full overflow-y-auto overflow-x-hidden"
      onClick={() => setActiveBlockId(null)}
    >
      {/* Floating Toolbar */}
      {activeBlockId && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white shadow-xl border rounded-full px-4 py-2 flex items-center gap-3 z-50 print-hidden">
          <div className="flex items-center gap-1 border-r pr-3">
            <button onClick={() => handleUpdateStyle('fontWeight', 'bold')} className="p-1.5 hover:bg-gray-100 rounded-full"><Bold size={16} /></button>
            <button onClick={() => handleUpdateStyle('fontStyle', 'italic')} className="p-1.5 hover:bg-gray-100 rounded-full"><Italic size={16} /></button>
          </div>
          <div className="flex items-center gap-1 border-r pr-3">
            <button onClick={() => handleUpdateStyle('textAlign', 'left')} className="p-1.5 hover:bg-gray-100 rounded-full"><AlignLeft size={16} /></button>
            <button onClick={() => handleUpdateStyle('textAlign', 'center')} className="p-1.5 hover:bg-gray-100 rounded-full"><AlignCenter size={16} /></button>
            <button onClick={() => handleUpdateStyle('textAlign', 'right')} className="p-1.5 hover:bg-gray-100 rounded-full"><AlignRight size={16} /></button>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => handleUpdateStyle('color', '#ef4444')} className="w-5 h-5 rounded-full bg-red-500" />
            <button onClick={() => handleUpdateStyle('color', '#3b82f6')} className="w-5 h-5 rounded-full bg-blue-500" />
            <button onClick={() => handleUpdateStyle('color', '#000000')} className="w-5 h-5 rounded-full bg-black" />
          </div>
          <button onClick={() => setActiveBlockId(null)} className="ml-2 p-1.5 hover:bg-red-50 text-red-500 rounded-full"><X size={16} /></button>
        </div>
      )}

      <TemplateSelector />

      {/* Hidden measurement container */}
      <div ref={hiddenContainerRef} style={{ position: 'absolute', visibility: 'hidden', width: A4_WIDTH_PT - 80, zIndex: -1000 }}>
        {blocks.map(renderMeasure)}
      </div>

      {/* Cover Page */}
      <div className="bg-white shadow-lg print-page flex-shrink-0" style={{ width: A4_WIDTH, height: A4_HEIGHT }}>
        <div style={{ padding: `${MARGIN_Y}px ${MARGIN_X}px`, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <h1 style={{ fontFamily: style.fontFamily, fontSize: scaledSize(style.titleSize), fontWeight: 'bold', color: style.primaryColor, marginBottom: scaledSize(12) }}>
            {title || "Untitled Document"}
          </h1>
          {subtitle && (
            <h2 style={{ fontFamily: style.fontFamily, fontSize: scaledSize(style.subtitleSize), fontStyle: 'italic', color: style.accentColor, marginBottom: scaledSize(24) }}>
              {subtitle}
            </h2>
          )}
          <div style={{ width: '30%', height: 1, background: style.accentColor, marginBottom: scaledSize(24) }} />
          <div style={{ marginTop: 'auto', marginBottom: scaledSize(40) }}>
            {author && <p style={{ fontFamily: style.fontFamily, fontSize: scaledSize(12), color: style.secondaryColor }}>{author}</p>}
            {date && <p style={{ fontFamily: style.fontFamily, fontSize: scaledSize(10), color: style.accentColor, marginTop: 4 }}>{date}</p>}
          </div>
        </div>
      </div>

      {/* Content Pages */}
      {pages.map((page, idx) => (
        <div key={page.id} className="bg-white shadow-lg print-page flex-shrink-0 relative" style={{ width: A4_WIDTH, height: A4_HEIGHT, overflow: 'hidden' }}>
          <div style={{ padding: `${MARGIN_Y}px ${MARGIN_X}px`, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Page header */}
            <div style={{ fontSize: scaledSize(8), color: '#9ca3af', textAlign: 'right', marginBottom: scaledSize(8) }} className="print-hidden">
              Page {idx + 1} of {pages.length} • {page.blocks.length} blocks
            </div>
            
            {/* Content */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {page.blocks.map(renderBlock)}
            </div>
            
            {/* Page number footer */}
            <div style={{ fontSize: scaledSize(9), color: '#6b7280', textAlign: 'center', paddingTop: scaledSize(8) }}>
              {idx + 1}
            </div>
          </div>
        </div>
      ))}

      {/* Info footer */}
      <div className="text-xs text-gray-500 print-hidden py-2">
        {pages.length + 1} pages total • {blocks.length} blocks
      </div>
    </div>
  );
}
