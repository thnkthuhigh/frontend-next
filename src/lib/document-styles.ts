export type DocumentStyleId = "professional" | "academic" | "modern" | "minimal";

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
}

export const STYLE_OPTIONS: StyleOption[] = [
    { id: "professional", name: "Professional", desc: "Business reports", color: "bg-blue-500" },
    { id: "academic", name: "Academic", desc: "Thesis, papers", color: "bg-slate-900" },
    { id: "modern", name: "Modern", desc: "Creative, colorful", color: "bg-purple-500" },
    { id: "minimal", name: "Minimal", desc: "Clean, simple", color: "bg-gray-400" },
];

export const STYLE_CONFIGS: Record<DocumentStyleId, StyleConfig> = {
    professional: {
        fontFamily: "'Times New Roman', serif",
        headingColor: "#0f172a",
        accentColor: "#1e3a8a",
    },
    academic: {
        fontFamily: "'Times New Roman', serif",
        headingColor: "#000000",
        accentColor: "#000000",
    },
    modern: {
        fontFamily: "Arial, sans-serif",
        headingColor: "#2563eb",
        accentColor: "#0ea5e9",
    },
    minimal: {
        fontFamily: "Calibri, sans-serif",
        headingColor: "#171717",
        accentColor: "#737373",
    },
};

export function getStyleConfig(styleId: string): StyleConfig {
    return STYLE_CONFIGS[styleId as DocumentStyleId] || STYLE_CONFIGS.professional;
}
