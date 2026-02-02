"use client";

import * as React from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-xl border p-4 pr-10 shadow-lg backdrop-blur-sm",
  {
    variants: {
      variant: {
        default: "border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 text-foreground",
        destructive:
          "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
        success: "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400",
        warning: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
        info: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof toastVariants> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  onClose?: () => void;
  duration?: number;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant, title, description, action, onClose, duration = 5000, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(true);

    React.useEffect(() => {
      if (duration > 0) {
        const timer = setTimeout(() => {
          setIsOpen(false);
          setTimeout(() => onClose?.(), 300);
        }, duration);

        return () => clearTimeout(timer);
      }
    }, [duration, onClose]);

    if (!isOpen) return null;

    const icons = {
      default: <Info className="h-5 w-5" />,
      destructive: <AlertCircle className="h-5 w-5" />,
      success: <CheckCircle className="h-5 w-5" />,
      warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      info: <Info className="h-5 w-5" />,
    };

    // Exclude problematic props that conflict with framer-motion
    const { onDrag, onDragStart, onDragEnd, onAnimationStart, ...safeProps } = props as Record<string, unknown>;

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, x: 50, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 50, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={cn(toastVariants({ variant }), className)}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{icons[variant || "default"]}</div>
          <div className="grid gap-1">
            {title && <div className="font-semibold">{title}</div>}
            {description && (
              <div className="text-sm opacity-90">{description}</div>
            )}
          </div>
        </div>
        {action}
        <button
          onClick={() => {
            setIsOpen(false);
            setTimeout(() => onClose?.(), 300);
          }}
          className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none group-hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    );
  }
);
Toast.displayName = "Toast";

export { Toast, toastVariants };