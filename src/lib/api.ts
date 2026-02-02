export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getAuthHeaders(): Promise<Record<string, string>> {
  if (typeof window === "undefined") return {};
  try {
    const { getCurrentSession } = await import("@/lib/supabase/client");
    const session = await getCurrentSession();
    if (!session?.access_token) return {};
    return { Authorization: `Bearer ${session.access_token}` };
  } catch {
    return {};
  }
}

export interface FormatRequest {
  content: string;
  style: string;
  output_format: string;
}

export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
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
      ...(await getAuthHeaders()),
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
      ...(await getAuthHeaders()),
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

// Note: Enhanced analyzeContentStream with AbortSignal support is defined below (line ~364)

export async function formatDocument(
  content: string,
  style: string,
  outputFormat: string
): Promise<Blob> {
  const response = await fetch(`${API_URL}/format`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await getAuthHeaders()),
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
  htmlContent?: string,
  margins?: PageMargins
): Promise<Blob> {
  const response = await fetch(`${API_URL}/format-structure`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await getAuthHeaders()),
    },
    body: JSON.stringify({
      structure,
      style,
      output_format: outputFormat,
      html: htmlContent,
      margins: margins,
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

export interface AIContext {
  format: "list" | "paragraph" | "mixed";
  itemCount?: number;
  hasNested?: boolean;
  structure?: "flat" | "nested";
}

export async function aiRewrite(text: string, style: RewriteStyle = "professional", context?: AIContext): Promise<string> {
  const response = await fetch(`${API_URL}/ai/rewrite`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
    body: JSON.stringify({ text, style, context }),
  });
  if (!response.ok) throw new Error("Failed to rewrite text");
  const data: AITextResponse = await response.json();
  return data.result;
}

export async function aiTranslate(text: string, targetLanguage: TranslateLanguage = "en", context?: AIContext): Promise<string> {
  const response = await fetch(`${API_URL}/ai/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
    body: JSON.stringify({ text, target_language: targetLanguage, context }),
  });
  if (!response.ok) throw new Error("Failed to translate text");
  const data: AITextResponse = await response.json();
  return data.result;
}

export async function aiSummarize(text: string, context?: AIContext): Promise<string> {
  const response = await fetch(`${API_URL}/ai/summarize`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
    body: JSON.stringify({ text, context }),
  });
  if (!response.ok) throw new Error("Failed to summarize text");
  const data: AITextResponse = await response.json();
  return data.result;
}

// ============================================
// PDF V3 - HTML Injection Strategy (2026 Standard)
// ============================================

export interface PdfV3Request {
  html: string;
  style: string;
  title?: string;
  subtitle?: string;
  author?: string;
  date?: string;
  margins?: PageMargins;
}

export async function exportPdfV3(request: PdfV3Request): Promise<Blob> {
  const response = await fetch(`${API_URL}/export/pdf-v3`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await getAuthHeaders()),
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("PDF V3 API Error:", response.status, errorText);
    throw new Error(`Failed to export PDF: ${response.status} - ${errorText}`);
  }

  return response.blob();
}

export async function aiExpand(text: string, context?: AIContext): Promise<string> {
  const response = await fetch(`${API_URL}/ai/expand`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
    body: JSON.stringify({ text, context }),
  });
  if (!response.ok) throw new Error("Failed to expand text");
  const data: AITextResponse = await response.json();
  return data.result;
}

export async function aiFixGrammar(text: string, context?: AIContext): Promise<string> {
  const response = await fetch(`${API_URL}/ai/fix-grammar`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
    body: JSON.stringify({ text, context }),
  });
  if (!response.ok) throw new Error("Failed to fix grammar");
  const data: AITextResponse = await response.json();
  return data.result;
}

// ============================================
// Custom AI Prompt
// ============================================

export interface CustomPromptRequest {
  text: string;
  prompt: string;
  context?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface CustomPromptResponse {
  success: boolean;
  result: string;
  tokens_used?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  warning?: string;
}

export async function customPrompt(request: CustomPromptRequest): Promise<CustomPromptResponse> {
  const response = await fetch(`${API_URL}/ai/custom-prompt`, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      ...(await getAuthHeaders())
    },
    body: JSON.stringify({
      text: request.text,
      prompt: request.prompt,
      context: request.context
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Custom prompt failed' }));
    throw new Error(error.detail || 'Custom prompt failed');
  }

  return response.json();
}

// ============================================
// Stream Manager Integration
// ============================================

export async function analyzeContentStream(
  content: string,
  onChunk: (chunk: any) => void,
  onComplete?: () => void,
  onError?: (error: Error) => void,
  signal?: AbortSignal
): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/analyze-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await getAuthHeaders())
      },
      body: JSON.stringify({ content }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      // Decode chunk and pass directly (raw JSON text streaming)
      const chunk = decoder.decode(value, { stream: true });
      if (chunk) {
        onChunk(chunk);
      }
    }

    onComplete?.();

  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log('Stream cancelled by user');
      throw new Error('CANCELLED');
    }
    onError?.(error);
    throw error;
  }
}
