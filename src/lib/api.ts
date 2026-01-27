const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface FormatRequest {
  content: string;
  style: string;
  output_format: string;
}

export interface AnalyzeResponse {
  title: string;
  subtitle?: string;
  author?: string;
  date?: string;
  elements: Array<{
    type: string;
    content?: string;
    items?: string[];
    style?: string;
    language?: string;
    headers?: string[];
    rows?: string[][];
    caption?: string;
    author?: string;
  }>;
}

export async function analyzeContent(content: string): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error("Failed to analyze content");
  }

  return response.json();
}

// Tiptap JSON response interface
export interface TiptapAnalyzeResponse {
  title: string;
  subtitle?: string;
  author?: string;
  date?: string;
  tiptap_json: {
    type: "doc";
    content: Array<Record<string, unknown>>;
  };
}

// NEW: Analyze content and return Tiptap JSON structure
export async function analyzeTiptapContent(content: string): Promise<TiptapAnalyzeResponse> {
  const response = await fetch(`${API_URL}/analyze-tiptap`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("API Error:", response.status, errorText);
    throw new Error(`Failed to analyze content: ${response.status}`);
  }

  return response.json();
}

export async function formatDocument(
  content: string,
  style: string,
  outputFormat: string
): Promise<Blob> {
  const response = await fetch(`${API_URL}/format`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content,
      style,
      output_format: outputFormat,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to format document");
  }

  return response.blob();
}

export async function formatStructure(
  structure: AnalyzeResponse,
  style: string,
  outputFormat: string,
  htmlContent?: string
): Promise<Blob> {
  const response = await fetch(`${API_URL}/format-structure`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      structure,
      style,
      output_format: outputFormat,
      html: htmlContent,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("API Error:", response.status, errorText);
    throw new Error(`Failed to format document: ${response.status} - ${errorText}`);
  }

  return response.blob();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
}

// ============================================
// AI TEXT EDITING APIs (Premium Features)
// ============================================

export type RewriteStyle = "professional" | "casual" | "formal" | "concise" | "detailed";
export type TranslateLanguage = "en" | "vi" | "zh" | "ja" | "ko" | "fr" | "de" | "es";

export interface AITextResponse {
  result: string;
}

export async function aiRewrite(text: string, style: RewriteStyle = "professional"): Promise<string> {
  const response = await fetch(`${API_URL}/ai/rewrite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, style }),
  });
  if (!response.ok) throw new Error("Failed to rewrite text");
  const data: AITextResponse = await response.json();
  return data.result;
}

export async function aiTranslate(text: string, targetLanguage: TranslateLanguage = "en"): Promise<string> {
  const response = await fetch(`${API_URL}/ai/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, target_language: targetLanguage }),
  });
  if (!response.ok) throw new Error("Failed to translate text");
  const data: AITextResponse = await response.json();
  return data.result;
}

export async function aiSummarize(text: string): Promise<string> {
  const response = await fetch(`${API_URL}/ai/summarize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error("Failed to summarize text");
  const data: AITextResponse = await response.json();
  return data.result;
}

export async function aiExpand(text: string): Promise<string> {
  const response = await fetch(`${API_URL}/ai/expand`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error("Failed to expand text");
  const data: AITextResponse = await response.json();
  return data.result;
}

export async function aiFixGrammar(text: string): Promise<string> {
  const response = await fetch(`${API_URL}/ai/fix-grammar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error("Failed to fix grammar");
  const data: AITextResponse = await response.json();
  return data.result;
}
