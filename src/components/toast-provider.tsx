"use client";

import * as React from "react";
import { Toast } from "@/components/ui/toast";
import { AnimatePresence } from "framer-motion";
import { useEditorStore } from "@/store/editor-store";
import { cn } from "@/lib/utils";

export type ToastType = "default" | "destructive" | "success" | "warning" | "info";

export interface ToastMessage {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastType;
  duration?: number;
  action?: React.ReactNode;
}

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);
  // P1-011: Get AI panel state for adaptive positioning
  const isAIPanelOpen = useEditorStore((state) => state.isAIPanelOpen);

  const addToast = React.useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };

    setToasts((prev) => [...prev, newToast]);

    // Auto-remove after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, toast.duration || 5000);
    }

    return id;
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = React.useCallback(() => {
    setToasts([]);
  }, []);

  const value = React.useMemo(
    () => ({
      toasts,
      addToast,
      removeToast,
      clearToasts,
    }),
    [toasts, addToast, removeToast, clearToasts]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* P1-011: Adaptive positioning - shift left when AI panel is open (panel is ~350px wide) */}
      <div
        className={cn(
          "fixed top-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none transition-all duration-300",
          isAIPanelOpen ? "right-[370px]" : "right-4"
        )}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              variant={toast.variant}
              title={toast.title}
              description={toast.description}
              action={toast.action}
              onClose={() => removeToast(toast.id)}
              duration={toast.duration}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// Convenience functions
export function toastSuccess(title: string, description?: string, action?: React.ReactNode) {
  return { title, description, variant: "success" as ToastType, action };
}

export function toastError(title: string, description?: string, action?: React.ReactNode) {
  return { title, description, variant: "destructive" as ToastType, action };
}

export function toastWarning(title: string, description?: string, action?: React.ReactNode) {
  return { title, description, variant: "warning" as ToastType, action };
}

export function toastInfo(title: string, description?: string, action?: React.ReactNode) {
  return { title, description, variant: "info" as ToastType, action };
}