'use client';

import { Check, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SaveStatusType = 'idle' | 'saving' | 'saved' | 'error';

interface SaveStatusProps {
  status: SaveStatusType;
  lastSaved?: Date;
  className?: string;
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return date.toLocaleDateString();
}

export function SaveStatus({ status, lastSaved, className }: SaveStatusProps) {
  const config = {
    idle: { icon: null, text: '', color: '' },
    saving: { 
      icon: <Loader2 className="w-3 h-3 animate-spin" />, 
      text: 'Saving...', 
      color: 'text-blue-600' 
    },
    saved: { 
      icon: <Check className="w-3 h-3" />, 
      text: lastSaved ? `Saved ${formatTimeAgo(lastSaved)}` : 'Saved', 
      color: 'text-green-600' 
    },
    error: { 
      icon: <AlertCircle className="w-3 h-3" />, 
      text: 'Error saving', 
      color: 'text-red-600' 
    },
  };

  const { icon, text, color } = config[status];

  if (!text) return null;

  return (
    <div className={cn('flex items-center gap-1.5 text-xs', color, className)}>
      {icon}
      <span>{text}</span>
    </div>
  );
}
