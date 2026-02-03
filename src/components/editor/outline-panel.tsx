import React, { useMemo } from 'react';
import { DocumentSection } from '@/types/document-structure';
import { DocumentState } from '@/store/document-store';
import { JSONContent } from '@tiptap/core';
import { useDocumentStore } from '@/store/document-store';
import { FileText, List, BookOpen, Plus, LucideIcon } from 'lucide-react';

// Define proper heading type
interface Heading {
  id: string;
  text: string;
}

interface OutlinePanelProps {
  onScrollToBlock: (blockId: string) => void;
  onScrollToHeading: (headingId: string) => void;
  jsonContent: JSONContent;
}

interface OutlineSection {
  type: DocumentSection;
  label: string;
  headings: Heading[];
  icon: LucideIcon;
}

function extractHeadings(content: JSONContent): Heading[] {
  if (!content || !content.content) return [];
  
  const headings: Heading[] = [];
  let headingIndex = 0;
  
  const traverse = (nodes: JSONContent[]) => {
    for (const node of nodes) {
      if (node.type === "heading" && node.attrs?.level) {
        const text = extractTextFromNode(node);
        if (text.trim()) {
          headings.push({
            id: `heading-${headingIndex++}`,
            text: text.trim(),
          });
        }
      }
      if (node.content) {
        traverse(node.content);
      }
    }
  };
  
  traverse(content.content);
  return headings;
}

function extractTextFromNode(node: JSONContent): string {
  if (node.type === "text" && node.text) {
    return node.text;
  }
  if (node.content) {
    return node.content.map(extractTextFromNode).join("");
  }
  return "";
}

function extractFrontMatterHeadings(frontMatter: any): Heading[] {
  return [];
}

function extractBackMatterHeadings(backMatter: any): Heading[] {
  return [];
}

export function OutlinePanel({ onScrollToBlock, onScrollToHeading, jsonContent }: OutlinePanelProps) {
  const { structure } = useDocumentStore();
  
  const sections = useMemo(() => {
    const allHeadings = extractHeadings(structure?.mainContent || jsonContent);
    
    return [
      {
        type: 'front' as const,
        label: 'Front Matter',
        icon: FileText,
        headings: extractFrontMatterHeadings(structure?.frontMatter),
      },
      {
        type: 'main' as const,
        label: 'Content',
        icon: List,
        headings: allHeadings,
      },
      {
        type: 'back' as const,
        label: 'Back Matter',
        icon: BookOpen,
        headings: extractBackMatterHeadings(structure?.backMatter),
      },
    ].filter(s => s.headings.length > 0);
  }, [structure, jsonContent]);
  
  return (
    <div className="outline-panel">
      <div className="outline-header">
        <h3>Document Outline</h3>
      </div>
      
      {sections.map((section, idx) => (
        <React.Fragment key={section.type}>
          <OutlineSection
            section={section}
            onScrollToHeading={onScrollToHeading}
            activeIndex={0}
          />
          {idx < sections.length - 1 && <SectionDivider />}
        </React.Fragment>
      ))}
      
      <button className="add-section-btn">
        <Plus size={16} />
        Add Section
      </button>
    </div>
  );
}

function OutlineSection({ section, onScrollToHeading, activeIndex }: {
  section: OutlineSection;
  onScrollToHeading: (headingId: string) => void;
  activeIndex: number;
}) {
  return (
    <div className="outline-section">
      <div className="section-header">
        <section.icon size={14} />
        <span>{section.label}</span>
        <span className="count">({section.headings.length})</span>
      </div>
      
      <div className="section-headings">
        {section.headings.map((heading: Heading, idx: number) => (
          <div key={heading.id} onClick={() => onScrollToHeading(heading.id)}>
            {heading.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionDivider() {
  return (
    <div className="section-divider">
      <div className="divider-line" />
    </div>
  );
}

const sectionStyles = {
  front: {
    background: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-200 dark:border-blue-800',
  },
  main: {
    background: 'bg-zinc-50 dark:bg-zinc-900/20',
    border: 'border-zinc-200 dark:border-zinc-700',
  },
  back: {
    background: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-800',
  },
};
