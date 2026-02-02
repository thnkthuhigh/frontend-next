'use client';

import { PanelRightClose, PanelRightOpen, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarToggleProps {
  isOpen: boolean;
  onToggle: () => void;
  side?: 'left' | 'right';
  position?: 'inside' | 'outside';
  className?: string;
}

export function SidebarToggle({ 
  isOpen, 
  onToggle, 
  side = 'right',
  position = 'inside',
  className 
}: SidebarToggleProps) {
  const Icon = side === 'right' 
    ? (isOpen ? PanelRightClose : PanelRightOpen)
    : (isOpen ? PanelLeftClose : PanelLeftOpen);

  const positionClass = position === 'inside'
    ? side === 'right' ? 'left-4' : 'right-4'
    : side === 'right' ? '-left-10' : '-right-10';

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className={cn(
        'absolute top-4 z-10',
        positionClass,
        className
      )}
      aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      title={`${isOpen ? 'Collapse' : 'Expand'} sidebar (Ctrl+B)`}
    >
      <Icon className="w-4 h-4" />
    </Button>
  );
}
