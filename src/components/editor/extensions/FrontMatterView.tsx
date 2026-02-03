import { useState, useEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CoverPageData, FrontMatter } from '@/types/document-structure';
import {
  FRONT_MATTER_TEMPLATES,
  applyTemplate,
  validateCoverPage,
  type FrontMatterTemplate
} from '@/lib/front-matter-templates';
import { FileText, AlertCircle, CheckCircle2 } from 'lucide-react';

interface FrontMatterViewProps {
  node: {
    attrs: FrontMatter;
  };
  updateAttributes: (attrs: Partial<FrontMatter>) => void;
}

const FrontMatterView = ({ node, updateAttributes }: FrontMatterViewProps) => {
  const { coverPage } = node.attrs;
  
  // Initialize state with current values or defaults
  const [title, setTitle] = useState(coverPage?.title || '');
  const [subtitle, setSubtitle] = useState(coverPage?.subtitle || '');
  const [author, setAuthor] = useState(coverPage?.author || '');
  const [institution, setInstitution] = useState(coverPage?.institution || '');
  const [date, setDate] = useState(coverPage?.date || new Date().toISOString().split('T')[0]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('simple');
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Validate on change
  useEffect(() => {
    const validation = validateCoverPage({
      title,
      author,
      date,
      style: coverPage?.style || 'simple',
    });
    setValidationErrors(validation.errors);
  }, [title, author, date, coverPage?.style]);

  const handleFieldChange = (field: keyof CoverPageData, value: string) => {
    // Update local state
    switch (field) {
      case 'title':
        setTitle(value);
        break;
      case 'subtitle':
        setSubtitle(value);
        break;
      case 'author':
        setAuthor(value);
        break;
      case 'institution':
        setInstitution(value);
        break;
      case 'date':
        setDate(value);
        break;
    }

    // Update attributes
    const updatedCoverPage: CoverPageData = {
      title: field === 'title' ? value : title,
      subtitle: field === 'subtitle' ? value : subtitle,
      author: field === 'author' ? value : author,
      institution: field === 'institution' ? value : institution,
      date: field === 'date' ? value : date,
      style: coverPage?.style || 'simple',
    };

    updateAttributes({ coverPage: updatedCoverPage });
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = FRONT_MATTER_TEMPLATES.find((t) => t.id === templateId);
    
    if (template) {
      // Apply template with current data
      const appliedTemplate = applyTemplate(template, {
        title: title || undefined,
        subtitle: subtitle || undefined,
        author: author || undefined,
        institution: institution || undefined,
        date,
      });

      // Update state
      setTitle(appliedTemplate.title);
      setSubtitle(appliedTemplate.subtitle || '');
      setAuthor(appliedTemplate.author);
      setInstitution(appliedTemplate.institution || '');
      setDate(appliedTemplate.date);

      // Update attributes
      updateAttributes({ coverPage: appliedTemplate });
    }
  };

  const currentTemplate = FRONT_MATTER_TEMPLATES.find((t) => t.id === selectedTemplate);
  const isValid = validationErrors.length === 0;

  return (
    <NodeViewWrapper>
      <div className="space-y-6 p-6 border-2 border-blue-200 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
              Front Matter
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {isValid ? (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Valid</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{validationErrors.length} error(s)</span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Edit' : 'Preview'}
            </Button>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
            <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
              {validationErrors.map((error, idx) => (
                <li key={idx}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Preview Mode */}
        {showPreview && currentTemplate ? (
          <div className={`p-8 bg-white dark:bg-gray-900 border rounded-lg ${currentTemplate.preview.spacing}`}>
            <div className={`text-${currentTemplate.preview.alignment}`}>
              <h1 className={`${currentTemplate.preview.titleSize} font-bold text-gray-900 dark:text-white`}>
                {title || currentTemplate.placeholders.title}
              </h1>
              {subtitle && (
                <h2 className={`${currentTemplate.preview.subtitleSize} text-gray-600 dark:text-gray-300 mt-2`}>
                  {subtitle}
                </h2>
              )}
              <p className="text-lg text-gray-700 dark:text-gray-200 mt-4">
                {author || currentTemplate.placeholders.author}
              </p>
              {institution && (
                <p className="text-base text-gray-600 dark:text-gray-400 mt-2">
                  {institution}
                </p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
                {date}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Template Selector */}
            <div className="space-y-2">
              <Label>Document Template</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {FRONT_MATTER_TEMPLATES.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{template.name}</span>
                        <span className="text-xs text-gray-500">{template.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  placeholder={currentTemplate?.placeholders.title || 'Document Title'}
                  className={!title ? 'border-red-300' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={subtitle}
                  onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                  placeholder={currentTemplate?.placeholders.subtitle || 'Optional subtitle'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="author">
                  Author <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="author"
                  value={author}
                  onChange={(e) => handleFieldChange('author', e.target.value)}
                  placeholder={currentTemplate?.placeholders.author || 'Author Name'}
                  className={!author ? 'border-red-300' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="institution">Organization / Institution</Label>
                <Input
                  id="institution"
                  value={institution}
                  onChange={(e) => handleFieldChange('institution', e.target.value)}
                  placeholder={currentTemplate?.placeholders.institution || 'Organization Name'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => handleFieldChange('date', e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        {/* Help Text */}
        <p className="text-xs text-gray-500 dark:text-gray-400">
          This information will appear on the cover page of your document.
        </p>
      </div>
    </NodeViewWrapper>
  );
};

export default FrontMatterView;
