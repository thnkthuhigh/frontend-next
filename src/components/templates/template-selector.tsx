"use client";

import { useState, useMemo } from "react";
import { useDocumentStore } from "@/store/document-store";
import { cn } from "@/lib/utils";
import { LayoutTemplate, GraduationCap, Palette, FileText, Search, X } from "lucide-react";

const TEMPLATES = [
  { id: "professional", name: "Professional", icon: LayoutTemplate, color: "bg-slate-900", tags: ["business", "formal", "corporate"] },
  { id: "academic", name: "Academic", icon: GraduationCap, color: "bg-black", tags: ["research", "paper", "thesis", "education"] },
  { id: "modern", name: "Modern", icon: Palette, color: "bg-blue-600", tags: ["creative", "contemporary", "stylish"] },
  { id: "minimal", name: "Minimal", icon: FileText, color: "bg-neutral-800", tags: ["clean", "simple", "elegant"] },
];

export function TemplateSelector() {
  const { selectedStyle, setSelectedStyle } = useDocumentStore();
  // P2-008: Search/Filter input
  const [searchQuery, setSearchQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return TEMPLATES;
    const query = searchQuery.toLowerCase();
    return TEMPLATES.filter(t =>
      t.name.toLowerCase().includes(query) ||
      t.tags.some(tag => tag.includes(query))
    );
  }, [searchQuery]);

  return (
    <div
      className={cn(
        "fixed right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3 p-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur shadow-xl rounded-2xl border border-gray-200 dark:border-zinc-700 print-hidden transition-all duration-300",
        isExpanded ? "w-56" : "hover:scale-105"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
          Styles
        </span>
        {/* P2-008: Toggle search */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "p-1.5 rounded-lg transition-colors",
            isExpanded
              ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
              : "text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
          )}
        >
          {isExpanded ? <X size={14} /> : <Search size={14} />}
        </button>
      </div>
      
      {/* P2-008: Search input */}
      {isExpanded && (
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter styles..."
            className="w-full h-8 pl-8 pr-3 text-xs bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-gray-700 dark:text-zinc-300 placeholder:text-gray-400"
            autoFocus
          />
        </div>
      )}
      
      <div className={cn("flex flex-col gap-2", isExpanded && "max-h-48 overflow-y-auto")}>
        {filteredTemplates.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-2">No styles found</p>
        ) : (
          filteredTemplates.map((t) => {
            const Icon = t.icon;
            const isSelected = selectedStyle === t.id;
            
            return (
              <button
                key={t.id}
                onClick={() => setSelectedStyle(t.id as any)}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl transition-all duration-300",
                  isExpanded ? "p-2" : "justify-center w-12 h-12",
                  isSelected
                    ? `${t.color} text-white shadow-lg ${!isExpanded && "scale-110"}`
                    : "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
                )}
                title={t.name}
              >
                <div className={cn(
                  "flex items-center justify-center",
                  isExpanded ? "w-8 h-8 rounded-lg" : "",
                  isExpanded && isSelected ? "bg-white/20" : "",
                  isExpanded && !isSelected ? "bg-gray-200 dark:bg-zinc-700" : ""
                )}>
                  <Icon size={isExpanded ? 16 : 20} />
                </div>
                
                {isExpanded && (
                  <span className={cn(
                    "text-sm font-medium",
                    isSelected ? "text-white" : "text-gray-700 dark:text-zinc-300"
                  )}>
                    {t.name}
                  </span>
                )}
                
                {/* Tooltip - only show when collapsed */}
                {!isExpanded && (
                  <span className="absolute right-full mr-4 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {t.name}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
