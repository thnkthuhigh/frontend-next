'use client';

import { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { Check, Type, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { AVAILABLE_FONTS, FONT_CATEGORY_LABELS, getFontsByCategory, type FontOption } from '@/lib/fonts';
import { fontLoader } from '@/lib/font-loader';

interface FontSelectorProps {
  editor: Editor | null;
  className?: string;
}

export function FontSelector({ editor, className }: FontSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingFont, setLoadingFont] = useState<string | null>(null);
  const [currentFont, setCurrentFont] = useState<string>('');

  // Update current font when editor selection changes
  useEffect(() => {
    if (!editor) return;

    const updateFont = () => {
      const fontFamily = editor.getAttributes('textStyle').fontFamily || '';
      setCurrentFont(fontFamily);
    };

    editor.on('selectionUpdate', updateFont);
    editor.on('update', updateFont);
    updateFont();

    return () => {
      editor.off('selectionUpdate', updateFont);
      editor.off('update', updateFont);
    };
  }, [editor]);

  if (!editor) return null;

  const handleFontChange = async (font: FontOption) => {
    setLoadingFont(font.name);
    
    try {
      // Load Google Font if needed
      if (font.googleFont) {
        await fontLoader.loadFont(font);
      }
      
      // Apply to editor
      editor.chain().focus().setFontFamily(font.value).run();
      
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to load font:', error);
    } finally {
      setLoadingFont(null);
    }
  };

  const clearFont = () => {
    editor.chain().focus().unsetFontFamily().run();
    setIsOpen(false);
  };

  // Preload font on hover
  const handleFontHover = (font: FontOption) => {
    if (font.googleFont && !fontLoader.isLoaded(font.name)) {
      fontLoader.preload(font);
    }
  };

  // Get current font display name
  const currentFontOption = AVAILABLE_FONTS.find(f => f.value === currentFont);
  const displayName = currentFontOption?.name || 'Default Font';

  // Group fonts by category
  const categories: Array<FontOption['category']> = ['sans-serif', 'serif', 'monospace'];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={cn("w-full justify-between", className)}
        >
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4" />
            <span className="truncate max-w-[120px]">{displayName}</span>
          </div>
          <ChevronDown className="w-3 h-3 ml-2 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-64 max-h-[400px] overflow-y-auto">
        <DropdownMenuLabel>Select Font</DropdownMenuLabel>
        
        {/* Default option */}
        <DropdownMenuItem onClick={clearFont}>
          <div className="flex items-center justify-between w-full">
            <span>Default</span>
            {!currentFont && <Check className="w-4 h-4" />}
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Font categories */}
        {categories.map(category => {
          const fonts = getFontsByCategory(category);
          if (fonts.length === 0) return null;
          
          return (
            <div key={category}>
              <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1">
                {FONT_CATEGORY_LABELS[category]}
              </DropdownMenuLabel>
              
              {fonts.map(font => (
                <DropdownMenuItem
                  key={font.value}
                  onClick={() => handleFontChange(font)}
                  className="cursor-pointer"
                >
                  <div 
                    className="flex items-center justify-between w-full"
                    onMouseEnter={() => handleFontHover(font)}
                  >
                    <span 
                      style={{ 
                        fontFamily: font.value,
                      }}
                      className="truncate"
                    >
                      {font.name}
                    </span>
                    <div className="flex items-center gap-2">
                      {loadingFont === font.name && (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      )}
                      {currentFont === font.value && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
              
              <DropdownMenuSeparator />
            </div>
          );
        })}
        
        {/* Font info */}
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          {currentFontOption?.googleFont ? (
            <span>✨ Google Font</span>
          ) : currentFontOption ? (
            <span>💻 System Font</span>
          ) : (
            <span>📝 Default Editor Font</span>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
