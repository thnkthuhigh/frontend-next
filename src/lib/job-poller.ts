/**
 * Job Polling Utilities
 * Polls backend for async job status
 */

import { API_URL, getAuthHeaders } from './api';

export interface JobStatus {
  task_id: string;
  state: 'PENDING' | 'PROGRESS' | 'SUCCESS' | 'FAILURE' | 'REVOKED';
  progress?: number;
  status?: string;
  result?: any;
  error?: string;
}

export interface JobResult {
  status: string;
  file_url?: string;
  file_path?: string;
  filename?: string;
  metadata?: any;
}

export interface PollOptions {
  interval?: number; // Polling interval in ms (default: 1000)
  maxAttempts?: number; // Max polling attempts (default: 60)
  onProgress?: (status: JobStatus) => void;
  onComplete?: (result: JobResult) => void;
  onError?: (error: string) => void;
}

/**
 * Poll job status until completion
 */
export async function pollJobStatus(
  taskId: string,
  options: PollOptions = {}
): Promise<JobResult> {
  const {
    interval = 1000,
    maxAttempts = 60,
    onProgress,
    onComplete,
    onError,
  } = options;

  let attempts = 0;

  return new Promise((resolve, reject) => {
    const poll = async () => {
      attempts++;

      try {
        // Check status
        const status = await getJobStatus(taskId);

        // Call progress callback
        if (onProgress) {
          onProgress(status);
        }

        // Check if completed
        if (status.state === 'SUCCESS') {
          // Get result
          const result = await getJobResult(taskId);
          
          if (onComplete) {
            onComplete(result);
          }
          
          resolve(result);
          return;
        }

        // Check if failed
        if (status.state === 'FAILURE') {
          const error = status.error || 'Job failed';
          
          if (onError) {
            onError(error);
          }
          
          reject(new Error(error));
          return;
        }

        // Check if revoked/cancelled
        if (status.state === 'REVOKED') {
          const error = 'Job was cancelled';
          
          if (onError) {
            onError(error);
          }
          
          reject(new Error(error));
          return;
        }

        // Check if max attempts reached
        if (attempts >= maxAttempts) {
          const error = 'Polling timeout - job took too long';
          
          if (onError) {
            onError(error);
          }
          
          reject(new Error(error));
          return;
        }

        // Continue polling
        setTimeout(poll, interval);

      } catch (error: any) {
        const errorMessage = error.message || 'Failed to check job status';
        
        if (onError) {
          onError(errorMessage);
        }
        
        reject(error);
      }
    };

    // Start polling
    poll();
  });
}

/**
 * Get job status
 */
export async function getJobStatus(taskId: string): Promise<JobStatus> {
  const response = await fetch(`${API_URL}/jobs/${taskId}/status`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to get job status: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get job result
 */
export async function getJobResult(taskId: string): Promise<JobResult> {
  const response = await fetch(`${API_URL}/jobs/${taskId}/result`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to get job result: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Cancel job
 */
export async function cancelJob(taskId: string): Promise<void> {
  const response = await fetch(`${API_URL}/jobs/${taskId}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to cancel job: ${response.statusText}`);
  }
}

/**
 * Submit PDF export job
 */
export async function submitPdfExport(
  htmlContent: string,
  metadata: {
    title?: string;
    subtitle?: string;
    author?: string;
    date?: string;
  }
): Promise<{ task_id: string; status: string; message: string }> {
  const formData = new FormData();
  formData.append('html_content', htmlContent);
  
  if (metadata.title) formData.append('title', metadata.title);
  if (metadata.subtitle) formData.append('subtitle', metadata.subtitle);
  if (metadata.author) formData.append('author', metadata.author);
  if (metadata.date) formData.append('date', metadata.date);

  const response = await fetch(`${API_URL}/export/pdf/async`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to submit PDF export: ${error}`);
  }

  return response.json();
}

/**
 * Submit DOCX export job
 */
export async function submitDocxExport(
  htmlContent: string,
  metadata: {
    title?: string;
    subtitle?: string;
    author?: string;
    date?: string;
  },
  style: string = 'professional'
): Promise<{ task_id: string; status: string; message: string }> {
  const formData = new FormData();
  formData.append('html_content', htmlContent);
  formData.append('style', style);
  
  if (metadata.title) formData.append('title', metadata.title);
  if (metadata.subtitle) formData.append('subtitle', metadata.subtitle);
  if (metadata.author) formData.append('author', metadata.author);
  if (metadata.date) formData.append('date', metadata.date);

  const response = await fetch(`${API_URL}/export/docx/async`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to submit DOCX export: ${error}`);
  }

  return response.json();
}

/**
 * Export PDF with polling (one-shot function)
 */
export async function exportPdfAsync(
  htmlContent: string,
  metadata: {
    title?: string;
    subtitle?: string;
    author?: string;
    date?: string;
  },
  options: PollOptions = {}
): Promise<JobResult> {
  // Submit job
  const { task_id } = await submitPdfExport(htmlContent, metadata);
  
  // Poll for completion
  return pollJobStatus(task_id, options);
}

/**
 * Export DOCX with polling (one-shot function)
 */
export async function exportDocxAsync(
  htmlContent: string,
  metadata: {
    title?: string;
    subtitle?: string;
    author?: string;
    date?: string;
  },
  style: string = 'professional',
  options: PollOptions = {}
): Promise<JobResult> {
  // Submit job
  const { task_id } = await submitDocxExport(htmlContent, metadata, style);
  
  // Poll for completion
  return pollJobStatus(task_id, options);
}
