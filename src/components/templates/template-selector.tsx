"use client";

import { useDocumentStore } from "@/store/document-store";
import { cn } from "@/lib/utils";
import { LayoutTemplate, GraduationCap, Palette, FileText, Type } from "lucide-react";

const TEMPLATES = [
  { id: "professional", name: "Professional", icon: LayoutTemplate, color: "bg-slate-900" },
  { id: "academic", name: "Academic", icon: GraduationCap, color: "bg-black" },
  { id: "modern", name: "Modern", icon: Palette, color: "bg-blue-600" },
  { id: "minimal", name: "Minimal", icon: FileText, color: "bg-neutral-800" },
];

export function TemplateSelector() {
  const { selectedStyle, setSelectedStyle } = useDocumentStore();

  return (
    <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4 p-4 bg-white/90 backdrop-blur shadow-xl rounded-2xl border border-gray-200 print-hidden transition-all hover:scale-105">
      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center mb-2">
        Styles
      </div>
      
      {TEMPLATES.map((t) => {
        const Icon = t.icon;
        const isSelected = selectedStyle === t.id;
        
        return (
          <button
            key={t.id}
            onClick={() => setSelectedStyle(t.id as any)}
            className={cn(
              "group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300",
              isSelected 
                ? `${t.color} text-white shadow-lg scale-110` 
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            )}
            title={t.name}
          >
            <Icon size={20} />
            
            {/* Tooltip */}
            <span className="absolute right-full mr-4 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {t.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
