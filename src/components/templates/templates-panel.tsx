"use client";

import { FileText, GraduationCap, Sparkles, Minimize2 } from "lucide-react";
import { useDocumentStore } from "@/store/document-store";
import { cn } from "@/lib/utils";

const templates = [
  {
    id: "report",
    name: "Business Report",
    description: "Professional report with executive summary",
    icon: FileText,
    content: `Annual Business Report 2024

Executive Summary

This report provides a comprehensive overview of our company's performance throughout the fiscal year 2024. Key highlights include significant revenue growth, market expansion, and strategic initiatives that have positioned us for continued success.

Key Achievements

1. Revenue Growth: Achieved 25% year-over-year revenue increase
2. Market Expansion: Entered 5 new international markets
3. Product Innovation: Launched 3 new product lines
4. Team Growth: Expanded workforce by 40%

Financial Overview

The company's financial performance exceeded expectations in all key metrics. Operating margins improved by 3.5 percentage points, while maintaining strong cash flow generation.

"Our success this year is a testament to the dedication of our team and the trust of our customers." - CEO Statement

Conclusion

Looking ahead to 2025, we remain committed to innovation, customer satisfaction, and sustainable growth. Our strategic roadmap includes continued investment in technology and talent acquisition.`,
    style: "professional" as const,
  },
  {
    id: "thesis",
    name: "Academic Thesis",
    description: "Formal academic paper format",
    icon: GraduationCap,
    content: `Research on Artificial Intelligence in Modern Education

Abstract

This thesis examines the integration of artificial intelligence technologies in educational settings. Through comprehensive literature review and empirical research, we analyze the effectiveness of AI-powered learning tools and their impact on student outcomes.

Introduction

The rapid advancement of artificial intelligence has transformed numerous sectors, with education being one of the most promising areas for AI application. This research investigates how AI technologies can enhance the learning experience and improve educational outcomes.

Literature Review

Previous studies have demonstrated various applications of AI in education:
- Personalized learning pathways
- Automated assessment systems
- Intelligent tutoring systems
- Predictive analytics for student success

Methodology

This study employs a mixed-methods approach, combining quantitative analysis of student performance data with qualitative interviews of educators and students.

Conclusion

The findings suggest that AI integration in education, when implemented thoughtfully, can significantly enhance learning outcomes while maintaining the essential human elements of teaching.`,
    style: "academic" as const,
  },
  {
    id: "creative",
    name: "Creative Proposal",
    description: "Modern and engaging format",
    icon: Sparkles,
    content: `Innovation Lab: Creative Technology Initiative

The Vision

Imagine a workspace where creativity meets technology. Where ideas flow freely and innovation happens naturally. This is the future we're building.

Our Approach

We believe in the power of creative technology to transform how people work, learn, and connect. Our approach combines:

- Human-centered design thinking
- Cutting-edge technology solutions
- Sustainable innovation practices
- Collaborative development processes

Key Features

The Innovation Lab will serve as a hub for experimentation and discovery. Features include:

1. Open collaboration spaces
2. Prototype development facilities
3. Digital creation studios
4. Community engagement areas

"Innovation is not about ideas. It's about making ideas happen." - Inspired by Scott Belsky

Impact Goals

By 2025, we aim to:
- Launch 10 community innovation projects
- Train 500 creative technologists
- Partner with 20 educational institutions
- Create 50 sustainable solutions

Join the Movement

Together, we can build a more creative and innovative future. Let's make it happen.`,
    style: "modern" as const,
  },
  {
    id: "notes",
    name: "Meeting Notes",
    description: "Clean and minimal format",
    icon: Minimize2,
    content: `Team Meeting Notes - Q4 Planning

Date: December 15, 2024
Attendees: Project Team

Agenda Items

1. Q3 Review and Learnings
2. Q4 Goals and Objectives
3. Resource Allocation
4. Timeline Discussion

Discussion Summary

The team reviewed Q3 performance metrics and identified key areas for improvement. Overall project delivery was on track, with some delays in the documentation phase.

Action Items

- Complete project documentation by Dec 31
- Schedule stakeholder review meeting
- Finalize Q4 budget allocation
- Set up weekly sync meetings

Decisions Made

The team agreed to:
- Prioritize customer feedback integration
- Allocate additional resources to testing
- Implement new project management tools

Next Steps

Follow-up meeting scheduled for December 22nd to review progress on action items.`,
    style: "minimal" as const,
  },
];

interface TemplatesPanelProps {
  onSelect: (content: string, style: typeof templates[0]["style"]) => void;
}

export function TemplatesPanel({ onSelect }: TemplatesPanelProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {templates.map((template) => (
        <button
          key={template.id}
          onClick={() => onSelect(template.content, template.style)}
          className={cn(
            "flex items-start gap-4 p-4 rounded-xl border border-border bg-card",
            "hover:border-primary hover:bg-primary/5 transition-all text-left",
            "group"
          )}
        >
          <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <template.icon size={24} />
          </div>
          <div>
            <h3 className="font-semibold mb-1">{template.name}</h3>
            <p className="text-sm text-muted-foreground">
              {template.description}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

export { templates };
