"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Command, Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShortcutItem {
  keys: string[];
  description: string;
  category: string;
}

const SHORTCUTS: ShortcutItem[] = [
  // Text Formatting
  { keys: ["Ctrl", "B"], description: "Bold text", category: "Formatting" },
  { keys: ["Ctrl", "I"], description: "Italic text", category: "Formatting" },
  { keys: ["Ctrl", "U"], description: "Underline text", category: "Formatting" },
  { keys: ["Ctrl", "Shift", "S"], description: "Strikethrough", category: "Formatting" },
  { keys: ["Ctrl", "Shift", "H"], description: "Highlight text", category: "Formatting" },
  
  // Structure
  { keys: ["Ctrl", "Shift", "1"], description: "Heading 1", category: "Structure" },
  { keys: ["Ctrl", "Shift", "2"], description: "Heading 2", category: "Structure" },
  { keys: ["Ctrl", "Shift", "3"], description: "Heading 3", category: "Structure" },
  { keys: ["Ctrl", "Shift", "7"], description: "Ordered list", category: "Structure" },
  { keys: ["Ctrl", "Shift", "8"], description: "Bullet list", category: "Structure" },
  { keys: ["Ctrl", "Shift", "9"], description: "Blockquote", category: "Structure" },
  
  // Editor Actions
  { keys: ["Ctrl", "Z"], description: "Undo", category: "Actions" },
  { keys: ["Ctrl", "Y"], description: "Redo", category: "Actions" },
  { keys: ["Ctrl", "S"], description: "Save document", category: "Actions" },
  { keys: ["/"], description: "Open command menu", category: "Actions" },
  
  // Navigation
  { keys: ["Ctrl", "T"], description: "Toggle theme", category: "Navigation" },
  { keys: ["Esc"], description: "Close dialogs", category: "Navigation" },
  { keys: ["Ctrl", "/"], description: "Show shortcuts", category: "Navigation" },
];

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  // Group shortcuts by category
  const groupedShortcuts = SHORTCUTS.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, ShortcutItem[]>);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed z-[201] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[80vh] overflow-hidden"
          >
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <Keyboard className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Keyboard Shortcuts</h2>
                    <p className="text-xs text-muted-foreground">Speed up your workflow</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
                {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
                  <div key={category}>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      {category}
                    </h3>
                    <div className="space-y-2">
                      {shortcuts.map((shortcut, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                        >
                          <span className="text-sm text-foreground">{shortcut.description}</span>
                          <div className="flex items-center gap-1">
                            {shortcut.keys.map((key, keyIndex) => (
                              <span key={keyIndex} className="flex items-center">
                                <kbd className={cn(
                                  "px-2 py-1 text-xs font-mono rounded-md border",
                                  "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700",
                                  "text-zinc-700 dark:text-zinc-300 shadow-sm"
                                )}>
                                  {key}
                                </kbd>
                                {keyIndex < shortcut.keys.length - 1 && (
                                  <span className="mx-1 text-muted-foreground text-xs">+</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                <p className="text-xs text-muted-foreground text-center">
                  Press <kbd className="px-1.5 py-0.5 rounded border bg-white dark:bg-zinc-900 text-[10px] font-mono">Esc</kbd> to close
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Hook to manage keyboard shortcuts modal
export function useKeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  // Global shortcut to open modal (Ctrl + /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "/") {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  return { isOpen, open, close, toggle };
}

export default KeyboardShortcutsModal;
