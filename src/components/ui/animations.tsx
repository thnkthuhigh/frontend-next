"use client";

import { motion, HTMLMotionProps, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

// ============================================
// ANIMATION VARIANTS - Reusable presets
// ============================================

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
};

export const fadeInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

export const fadeInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const slideInFromBottom = {
  initial: { opacity: 0, y: "100%" },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: "100%" },
};

// ============================================
// TRANSITION PRESETS
// ============================================

export const springTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

export const smoothTransition = {
  type: "tween" as const,
  ease: [0.25, 0.1, 0.25, 1] as const,
  duration: 0.3,
};

export const fastTransition = {
  type: "tween" as const,
  ease: "easeOut" as const,
  duration: 0.15,
};

// ============================================
// ANIMATION WRAPPER COMPONENTS
// ============================================

interface FadeInProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

/**
 * FadeIn - Simple fade animation
 */
export function FadeIn({ 
  children, 
  delay = 0, 
  duration = 0.3, 
  className,
  ...props 
}: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * FadeInUp - Fade in with upward slide
 */
export function FadeInUp({ 
  children, 
  delay = 0, 
  duration = 0.4, 
  className,
  ...props 
}: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * ScaleIn - Scale up with fade
 */
export function ScaleIn({ 
  children, 
  delay = 0, 
  duration = 0.3, 
  className,
  ...props 
}: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger Container - For staggered children animations
 */
interface StaggerContainerProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}

export function StaggerContainer({ 
  children, 
  staggerDelay = 0.05,
  className,
  ...props 
}: StaggerContainerProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={{
        animate: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger Item - Child of StaggerContainer
 */
export function StaggerItem({ 
  children, 
  className,
  ...props 
}: FadeInProps) {
  return (
    <motion.div
      variants={fadeInUp}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// INTERACTIVE COMPONENTS
// ============================================

/**
 * MotionButton - Button with hover/tap animations
 */
interface MotionButtonProps extends HTMLMotionProps<"button"> {
  children: ReactNode;
  variant?: "default" | "subtle" | "bounce";
  className?: string;
}

export function MotionButton({ 
  children, 
  variant = "default",
  className,
  ...props 
}: MotionButtonProps) {
  const variants = {
    default: {
      whileHover: { scale: 1.02 },
      whileTap: { scale: 0.98 },
    },
    subtle: {
      whileHover: { scale: 1.01 },
      whileTap: { scale: 0.99 },
    },
    bounce: {
      whileHover: { scale: 1.05, y: -2 },
      whileTap: { scale: 0.95 },
    },
  };

  return (
    <motion.button
      {...variants[variant]}
      transition={springTransition}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/**
 * MotionCard - Card with hover lift effect
 */
interface MotionCardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export function MotionCard({ 
  children, 
  className,
  hoverEffect = true,
  ...props 
}: MotionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hoverEffect ? { 
        y: -4, 
        boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.2)" 
      } : undefined}
      transition={smoothTransition}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// SKELETON LOADING COMPONENTS
// ============================================

/**
 * Skeleton - Animated loading placeholder
 */
interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ 
  className = "", 
  variant = "rectangular",
  width,
  height,
}: SkeletonProps) {
  const baseClass = "animate-pulse bg-zinc-200 dark:bg-zinc-800";
  
  const variantClasses = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  return (
    <div 
      className={`${baseClass} ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
    />
  );
}

/**
 * DocumentCardSkeleton - Loading state for document cards
 */
export function DocumentCardSkeleton() {
  return (
    <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-card">
      {/* Icon */}
      <Skeleton className="w-12 h-12 rounded-xl mb-4" />
      
      {/* Title */}
      <Skeleton className="h-5 w-3/4 mb-2" />
      
      {/* Description */}
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-2/3 mb-4" />
      
      {/* Footer */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
    </div>
  );
}

/**
 * DocumentListSkeleton - Grid of loading cards
 */
export function DocumentListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
        >
          <DocumentCardSkeleton />
        </motion.div>
      ))}
    </div>
  );
}

/**
 * TextSkeleton - Multiple lines of text loading
 */
export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className="h-4" 
          width={i === lines - 1 ? "60%" : "100%"}
        />
      ))}
    </div>
  );
}

// ============================================
// PAGE TRANSITION WRAPPER
// ============================================

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Re-export AnimatePresence for convenience
export { AnimatePresence, motion };
