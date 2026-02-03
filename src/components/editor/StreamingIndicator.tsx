'use client';

import { Loader2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreamingIndicatorProps {
  isStreaming: boolean;
  tokenCount?: number;
  className?: string;
}

export function StreamingIndicator({
  isStreaming,
  tokenCount = 0,
  className,
}: StreamingIndicatorProps) {
  if (!isStreaming) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg',
        'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30',
        'border border-blue-200 dark:border-blue-800',
        'animate-pulse',
        className
      )}
    >
      <div className="relative flex items-center justify-center">
        <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
        <Zap className="w-2.5 h-2.5 text-yellow-500 absolute animate-ping" />
      </div>
      
      <div className="flex flex-col">
        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
          AI is writing...
        </span>
        {tokenCount > 0 && (
          <span className="text-[10px] text-blue-600/70 dark:text-blue-400/70">
            {tokenCount} tokens
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Compact version for toolbar
 */
export function StreamingIndicatorCompact({
  isStreaming,
  className,
}: Omit<StreamingIndicatorProps, 'tokenCount'>) {
  if (!isStreaming) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded-md',
        'bg-blue-100 dark:bg-blue-900/30',
        'animate-pulse',
        className
      )}
    >
      <Loader2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-spin" />
      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
        Streaming
      </span>
    </div>
  );
}
