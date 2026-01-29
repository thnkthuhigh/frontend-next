"use client";

import { FileText, GraduationCap, Sparkles, Minimize2, Briefcase, Code, Mail, Award, Presentation, FileCode } from "lucide-react";
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
  {
    id: "resume",
    name: "Professional Resume",
    description: "Modern CV format for job applications",
    icon: Briefcase,
    content: `John Doe - Senior Software Engineer

Professional Summary

Results-driven software engineer with 8+ years of experience in full-stack development, cloud architecture, and team leadership. Passionate about building scalable solutions and mentoring junior developers.

Work Experience

Senior Software Engineer - TechCorp Inc. (2020-Present)
- Led development of microservices architecture serving 1M+ users
- Reduced system latency by 40% through performance optimization
- Mentored 5 junior developers, improving team productivity by 25%

Software Engineer - StartupXYZ (2016-2020)
- Developed REST APIs and frontend applications using React/Node.js
- Implemented CI/CD pipelines reducing deployment time by 70%
- Collaborated with product team to deliver features on tight deadlines

Technical Skills

Programming: JavaScript, TypeScript, Python, Java
Frameworks: React, Node.js, Express, Django, Spring Boot
Cloud: AWS (EC2, S3, Lambda, RDS), Docker, Kubernetes
Databases: PostgreSQL, MongoDB, Redis

Education

Master of Computer Science - Stanford University (2016)
Bachelor of Engineering - MIT (2014)

Certifications

- AWS Certified Solutions Architect
- Google Cloud Professional Developer
- Scrum Master Certified`,
    style: "resume" as const,
  },
  {
    id: "technical",
    name: "Technical Documentation",
    description: "Detailed API or system documentation",
    icon: Code,
    content: `API Documentation v2.1

Overview

This document describes the REST API for the Data Analytics Platform. The API follows RESTful principles and uses JSON for request/response payloads.

Authentication

All API requests require authentication using Bearer tokens. Include the token in the Authorization header:

Authorization: Bearer <your_token>

Endpoints

GET /api/v1/users
Retrieves a list of users with pagination support.

Parameters:
- page (integer): Page number (default: 1)
- limit (integer): Items per page (default: 20)
- sort (string): Sort field (created_at, name)

Response:
{
  "data": [
    {
      "id": "user_123",
      "name": "John Doe",
      "email": "john@example.com",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}

POST /api/v1/users
Creates a new user account.

Request Body:
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "secure_password_123"
}

Error Codes

400 - Bad Request: Invalid input parameters
401 - Unauthorized: Missing or invalid authentication
404 - Not Found: Resource does not exist
429 - Too Many Requests: Rate limit exceeded
500 - Internal Server Error: Server-side issue

Rate Limiting

API requests are limited to 1000 requests per hour per API key. Use the X-RateLimit headers to monitor usage.`,
    style: "technical" as const,
  },
  {
    id: "newsletter",
    name: "Monthly Newsletter",
    description: "Engaging content for subscribers",
    icon: Mail,
    content: `Tech Trends Monthly - January 2025

Welcome to the Future

Dear Readers,

As we step into 2025, the pace of technological innovation continues to accelerate. This month, we explore the latest developments in AI, quantum computing, and sustainable technology.

Featured Article: The Rise of AI Assistants

Artificial intelligence has evolved from simple chatbots to sophisticated personal assistants that can understand context, emotions, and complex tasks. Key developments:

- Multimodal AI: Systems that can process text, images, and audio simultaneously
- Personalization: AI that adapts to individual user preferences and habits
- Ethical Considerations: Addressing bias and privacy concerns in AI development

Industry Spotlight: Green Tech Innovations

Sustainable technology is no longer a niche market. Companies are investing heavily in:

1. Carbon Capture: New technologies removing CO2 from the atmosphere
2. Renewable Energy Storage: Advanced battery solutions for solar/wind
3. Circular Economy: Products designed for reuse and recycling

Upcoming Events

- AI Ethics Conference: February 15-16, 2025 (Virtual)
- Tech Sustainability Summit: March 5-7, 2025 (San Francisco)
- Developer Innovation Week: April 10-14, 2025 (Global)

Quote of the Month

"The best way to predict the future is to invent it." - Alan Kay

Stay Connected

Follow us on social media for daily updates and join our community forum to discuss these topics with fellow enthusiasts.`,
    style: "newsletter" as const,
  },
  {
    id: "elegant",
    name: "Formal Invitation",
    description: "Sophisticated event invitation",
    icon: Award,
    content: `You Are Cordially Invited

To the Annual Gala Celebration
Honoring Excellence in Innovation

Date: Saturday, March, 2025
Time: 7:00 PM - 11:00 PM
Venue: The Grand Ballroom, Metropolitan Hotel
123 Innovation Avenue, Tech City

Evening Program

7:00 PM - Cocktail Reception
Enjoy premium beverages and hors d'oeuvres while networking with industry leaders and innovators.

8:00 PM - Dinner Service
A gourmet three-course meal prepared by award-winning chefs, featuring locally sourced ingredients.

9:00 PM - Awards Ceremony
Recognizing outstanding achievements in technology, sustainability, and social impact.

10:00 PM - Entertainment & Dancing
Live music performance followed by dancing under the stars.

Dress Code

Black Tie Optional. We encourage elegant evening attire to celebrate this special occasion.

RSVP Information

Please confirm your attendance by February 15, 2025.
Contact: events@innovationfoundation.org
Phone: (555) 123-4567

We look forward to celebrating with you and honoring the visionaries shaping our future.`,
    style: "elegant" as const,
  },
  {
    id: "corporate",
    name: "Corporate Presentation",
    description: "Executive briefing deck",
    icon: Presentation,
    content: `Q4 2024 Strategic Review
Executive Presentation

Agenda

1. Market Overview
2. Financial Performance
3. Strategic Initiatives
4. 2025 Roadmap
5. Q&A Session

Market Overview

The global technology market continues to expand, with particular growth in:
- Artificial Intelligence and Machine Learning
- Cloud Computing Services
- Cybersecurity Solutions
- Sustainable Technology

Our market position remains strong, with 15% year-over-year growth outpacing industry average.

Financial Highlights

Revenue: $450M (↑ 18% YoY)
Gross Margin: 65% (↑ 3% YoY)
Operating Income: $120M (↑ 22% YoY)
Net Profit: $85M (↑ 20% YoY)

Key Performance Indicators

Customer Satisfaction: 94% (↑ 5%)
Employee Retention: 88% (↑ 3%)
Market Share: 12% (↑ 2%)
Innovation Index: 8.5/10 (↑ 1.2)

Strategic Initiatives for 2025

1. AI Integration: Deploy AI across all product lines
2. Global Expansion: Enter 3 new international markets
3. Sustainability: Achieve carbon neutrality by Q3 2025
4. Talent Development: Launch leadership academy

"Our commitment to innovation and customer success drives everything we do." - CEO Message

Next Steps

Immediate priorities for Q1 2025:
- Finalize 2025 budget allocation
- Launch beta testing for AI features
- Begin market research for expansion`,
    style: "corporate" as const,
  },
  {
    id: "creative2",
    name: "Blog Post Draft",
    description: "Engaging content for online publication",
    icon: FileCode,
    content: `The Future of Remote Work: Beyond the Home Office

Introduction

The pandemic accelerated remote work adoption, but what comes next? As we move into 2025, remote work is evolving beyond simply working from home to creating truly flexible, productive, and balanced work environments.

The Hybrid Revolution

Companies are discovering that hybrid models offer the best of both worlds:
- Flexibility for employees
- Collaboration opportunities
- Cost savings on office space
- Access to global talent pools

Key Trends Shaping Remote Work

1. Digital Nomadism: Work from anywhere with reliable internet
2. Async Communication: Reducing meeting fatigue through better tools
3. Virtual Reality Workspaces: Immersive collaboration environments
4. Results-Oriented Culture: Focusing on outcomes rather than hours

Challenges and Solutions

While remote work offers many benefits, it also presents challenges:

Challenge: Maintaining team cohesion
Solution: Regular virtual team-building activities and quarterly in-person retreats

Challenge: Work-life balance
Solution: Clear boundaries, flexible schedules, and wellness programs

Challenge: Communication gaps
Solution: Comprehensive documentation and async communication tools

The Human Element

Technology enables remote work, but human connection sustains it. Successful remote teams prioritize:
- Regular check-ins and one-on-ones
- Celebrating milestones and achievements
- Creating spaces for informal interaction
- Supporting mental health and wellbeing

Looking Ahead

The future of work isn't about where you work, but how you work. By embracing flexibility, leveraging technology, and prioritizing human connection, we can create work environments that are more productive, satisfying, and sustainable.

What's your remote work story? Share your experiences and join the conversation.`,
    style: "creative" as const,
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
