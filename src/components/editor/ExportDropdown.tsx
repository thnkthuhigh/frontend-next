"use client";

import { useState } from "react";
import {
  Download,
  FileText,
  FileCode,
  FileType,
  Loader2,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ExportDropdownProps {
  onExportPdf: () => void;
  onExportDocx: () => void;
  onExportMarkdown: () => void;
  isExporting: boolean;
  isProcessing: boolean;
  exportProgress: number;
}

export function ExportDropdown({
  onExportPdf,
  onExportDocx,
  onExportMarkdown,
  isExporting,
  isProcessing,
  exportProgress
}: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const isLoading = isExporting || isProcessing;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          disabled={isLoading}
          className={cn(
            "gap-2 font-medium bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-gray-100 transition-colors",
            isLoading ? "pl-4 pr-4" : "pl-4 pr-3"
          )}
        >
          {/* Progress Overlay */}
          {isExporting && (
            <div
              className="absolute inset-0 bg-white/20 transition-all duration-300"
              style={{ width: `${exportProgress}%` }}
            />
          )}

          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}

          <span className="relative z-10">
            {isExporting ? `Exporting ${exportProgress}%` : isProcessing ? "Processing..." : "Export"}
          </span>

          {!isLoading && (
            <ChevronDown className={cn("w-3.5 h-3.5 opacity-70 transition-transform", isOpen && "rotate-180")} />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-2">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-1.5">
          Download As
        </DropdownMenuLabel>

        <DropdownMenuItem onClick={onExportPdf} className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer focus:bg-accent">
          <div className="p-2 rounded-md bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
            <FileType className="w-4 h-4" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-sm">PDF Document</span>
            <span className="text-[10px] text-muted-foreground">Best for printing & sharing</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onExportDocx} className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer focus:bg-accent mt-1">
          <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <FileText className="w-4 h-4" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-sm">Word Document</span>
            <span className="text-[10px] text-muted-foreground">Editable .docx file</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1.5" />

        <DropdownMenuItem onClick={onExportMarkdown} className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer focus:bg-accent">
          <div className="p-2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            <FileCode className="w-4 h-4" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-sm">Markdown</span>
            <span className="text-[10px] text-muted-foreground">Raw content for dev</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
