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
  outputFormat: string
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
