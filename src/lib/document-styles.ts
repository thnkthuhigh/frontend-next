export type DocumentStyleId =
    | "professional"
    | "academic"
    | "modern"
    | "minimal"
    | "elegant"
    | "corporate"
    | "creative"
    | "newsletter"
    | "resume"
    | "technical";

export interface StyleOption {
    id: DocumentStyleId;
    name: string;
    desc: string;
    color: string;
}

export interface StyleConfig {
    fontFamily: string;
    headingColor: string;
    accentColor: string;
    fontSize?: number;
    lineHeight?: number;
}

export const STYLE_OPTIONS: StyleOption[] = [
    { id: "professional", name: "Professional", desc: "Business reports", color: "bg-blue-500" },
    { id: "academic", name: "Academic", desc: "Thesis, papers", color: "bg-slate-900" },
    { id: "modern", name: "Modern", desc: "Creative, colorful", color: "bg-purple-500" },
    { id: "minimal", name: "Minimal", desc: "Clean, simple", color: "bg-gray-400" },
    { id: "elegant", name: "Elegant", desc: "Formal, sophisticated", color: "bg-amber-600" },
    { id: "corporate", name: "Corporate", desc: "Business presentations", color: "bg-indigo-600" },
    { id: "creative", name: "Creative", desc: "Bold, artistic", color: "bg-pink-500" },
    { id: "newsletter", name: "Newsletter", desc: "Magazine style", color: "bg-teal-500" },
    { id: "resume", name: "Resume/CV", desc: "Job applications", color: "bg-emerald-600" },
    { id: "technical", name: "Technical", desc: "Documentation", color: "bg-orange-500" },
];

export const STYLE_CONFIGS: Record<DocumentStyleId, StyleConfig> = {
    professional: {
        fontFamily: "'Times New Roman', serif",
        headingColor: "#0f172a",
        accentColor: "#1e3a8a",
        fontSize: 12,
        lineHeight: 1.6,
    },
    academic: {
        fontFamily: "'Times New Roman', serif",
        headingColor: "#000000",
        accentColor: "#000000",
        fontSize: 12,
        lineHeight: 2.0,
    },
    modern: {
        fontFamily: "Arial, sans-serif",
        headingColor: "#2563eb",
        accentColor: "#0ea5e9",
        fontSize: 11,
        lineHeight: 1.5,
    },
    minimal: {
        fontFamily: "Calibri, sans-serif",
        headingColor: "#171717",
        accentColor: "#737373",
        fontSize: 11,
        lineHeight: 1.5,
    },
    elegant: {
        fontFamily: "'Georgia', serif",
        headingColor: "#78350f",
        accentColor: "#b45309",
        fontSize: 12,
        lineHeight: 1.7,
    },
    corporate: {
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        headingColor: "#312e81",
        accentColor: "#4338ca",
        fontSize: 11,
        lineHeight: 1.5,
    },
    creative: {
        fontFamily: "'Poppins', sans-serif",
        headingColor: "#be185d",
        accentColor: "#ec4899",
        fontSize: 11,
        lineHeight: 1.6,
    },
    newsletter: {
        fontFamily: "'Merriweather', Georgia, serif",
        headingColor: "#0d9488",
        accentColor: "#14b8a6",
        fontSize: 11,
        lineHeight: 1.6,
    },
    resume: {
        fontFamily: "'Roboto', Arial, sans-serif",
        headingColor: "#047857",
        accentColor: "#059669",
        fontSize: 10,
        lineHeight: 1.4,
    },
    technical: {
        fontFamily: "'Consolas', 'Monaco', monospace",
        headingColor: "#c2410c",
        accentColor: "#ea580c",
        fontSize: 11,
        lineHeight: 1.5,
    },
};

export function getStyleConfig(styleId: string): StyleConfig {
    return STYLE_CONFIGS[styleId as DocumentStyleId] || STYLE_CONFIGS.professional;
}
