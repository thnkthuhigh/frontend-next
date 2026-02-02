'use client';

import { Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StopStreamButtonProps {
  isStreaming: boolean;
  onStop: () => void;
  className?: string;
}

export function StopStreamButton({ 
  isStreaming, 
  onStop, 
  className 
}: StopStreamButtonProps) {
  if (!isStreaming) return null;
  
  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={onStop}
      className={cn('animate-pulse', className)}
    >
      <Square className="w-4 h-4 mr-2 fill-current" />
      Stop Generating
    </Button>
  );
}
