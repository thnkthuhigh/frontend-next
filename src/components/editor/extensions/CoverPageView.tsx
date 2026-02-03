import React from 'react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Replaced shadcn components with native HTML elements for compatibility

export const CoverPageView = ({ node, updateAttributes }: NodeViewProps) => {
  const { title, subtitle, author, date, style } = node.attrs;

  const handleInputChange = (field: string, value: string) => {
    updateAttributes({
      ...node.attrs,
      [field]: value,
    });
  };

  return (
    <NodeViewWrapper className="border rounded-lg p-6 mb-8 bg-zinc-50 dark:bg-zinc-900">
      <div className="flex flex-col space-y-4">
        <div>
          <Label>Title</Label>
          <Input
            value={title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Document Title"
          />
        </div>
        
        <div>
          <Label>Subtitle</Label>
          <Input
            value={subtitle}
            onChange={(e) => handleInputChange('subtitle', e.target.value)}
            placeholder="Optional Subtitle"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Author</Label>
            <Input
              value={author}
              onChange={(e) => handleInputChange('author', e.target.value)}
              placeholder="Author Name"
            />
          </div>
          
          <div>
            <Label>Date</Label>
            <Input
              value={date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              placeholder="e.g., January 1, 2025"
            />
          </div>
        </div>

        <div>
          <Label>Style</Label>
          <select
            value={style}
            onChange={(e) => handleInputChange('style', e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="simple">Simple</option>
            <option value="formal">Formal</option>
          </select>
        </div>

        <div className="pt-2">
          <Button variant="outline" size="sm">
            Preview Cover Page
          </Button>
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export default CoverPageView;
