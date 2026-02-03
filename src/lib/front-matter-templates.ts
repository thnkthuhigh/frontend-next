import type { CoverPageData } from '@/types/document-structure';

/**
 * Front Matter Templates
 * Professional document templates with pre-configured styles
 */

export interface FrontMatterTemplate {
  id: string;
  name: string;
  description: string;
  style: CoverPageData['style'];
  placeholders: {
    title: string;
    subtitle?: string;
    author: string;
    institution?: string;
  };
  preview: {
    titleSize: string;
    subtitleSize: string;
    alignment: 'left' | 'center' | 'right';
    spacing: string;
  };
}

export const FRONT_MATTER_TEMPLATES: FrontMatterTemplate[] = [
  {
    id: 'simple',
    name: 'Simple',
    description: 'Clean and minimal design for general documents',
    style: 'simple',
    placeholders: {
      title: 'Document Title',
      subtitle: 'Optional Subtitle',
      author: 'Author Name',
      institution: 'Organization Name',
    },
    preview: {
      titleSize: 'text-3xl',
      subtitleSize: 'text-xl',
      alignment: 'left',
      spacing: 'space-y-2',
    },
  },
  {
    id: 'formal',
    name: 'Formal',
    description: 'Traditional academic style with centered layout',
    style: 'formal',
    placeholders: {
      title: 'Thesis Title',
      subtitle: 'A Dissertation Submitted to the Faculty',
      author: 'Full Name',
      institution: 'University Name',
    },
    preview: {
      titleSize: 'text-4xl',
      subtitleSize: 'text-2xl',
      alignment: 'center',
      spacing: 'space-y-6',
    },
  },
  {
    id: 'academic',
    name: 'Academic',
    description: 'Professional research paper format',
    style: 'formal',
    placeholders: {
      title: 'Research Paper Title',
      subtitle: 'Subtitle or Research Focus',
      author: 'Author Name, PhD',
      institution: 'Research Institution',
    },
    preview: {
      titleSize: 'text-3xl',
      subtitleSize: 'text-lg',
      alignment: 'center',
      spacing: 'space-y-4',
    },
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Corporate document style',
    style: 'simple',
    placeholders: {
      title: 'Business Report',
      subtitle: 'Quarterly Analysis',
      author: 'Prepared by',
      institution: 'Company Name',
    },
    preview: {
      titleSize: 'text-4xl',
      subtitleSize: 'text-xl',
      alignment: 'left',
      spacing: 'space-y-3',
    },
  },
];

export function getTemplateById(id: string): FrontMatterTemplate | undefined {
  return FRONT_MATTER_TEMPLATES.find((template) => template.id === id);
}

export function getDefaultTemplate(): FrontMatterTemplate {
  return FRONT_MATTER_TEMPLATES[0]; // Simple template
}

export function applyTemplate(
  template: FrontMatterTemplate,
  currentData?: Partial<CoverPageData>
): CoverPageData {
  return {
    title: currentData?.title || template.placeholders.title,
    subtitle: currentData?.subtitle || template.placeholders.subtitle,
    author: currentData?.author || template.placeholders.author,
    institution: currentData?.institution || template.placeholders.institution,
    date: currentData?.date || new Date().toISOString().split('T')[0],
    style: template.style,
  };
}

// Validation helpers
export function validateCoverPage(data: Partial<CoverPageData>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.title || data.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (data.title && data.title.length > 200) {
    errors.push('Title must be less than 200 characters');
  }

  if (!data.author || data.author.trim().length === 0) {
    errors.push('Author is required');
  }

  if (data.author && data.author.length > 100) {
    errors.push('Author name must be less than 100 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
