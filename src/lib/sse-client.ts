/**
 * SSE (Server-Sent Events) Client for AI Streaming
 * Handles real-time token-by-token responses from AI
 */

export interface SSEMessage {
  type: 'token' | 'done' | 'error' | 'cancelled';
  content?: string;
  error?: string;
  message?: string;
}

export interface SSEOptions {
  onToken?: (content: string) => void;
  onDone?: () => void;
  onError?: (error: string) => void;
  onCancelled?: () => void;
}

export class SSEClient {
  private eventSource: EventSource | null = null;
  private streamId: string;
  private aborted: boolean = false;

  constructor() {
    this.streamId = this.generateStreamId();
  }

  /**
   * Start streaming from an SSE endpoint
   */
  async stream(
    url: string,
    options: SSEOptions = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create EventSource connection
        this.eventSource = new EventSource(url);
        this.aborted = false;

        // Handle incoming messages
        this.eventSource.onmessage = (event) => {
          try {
            const data: SSEMessage = JSON.parse(event.data);

            switch (data.type) {
              case 'token':
                if (data.content && options.onToken) {
                  options.onToken(data.content);
                }
                break;

              case 'done':
                if (options.onDone) {
                  options.onDone();
                }
                this.close();
                resolve();
                break;

              case 'error':
                if (options.onError) {
                  options.onError(data.error || 'Unknown error');
                }
                this.close();
                reject(new Error(data.error || 'Stream error'));
                break;

              case 'cancelled':
                if (options.onCancelled) {
                  options.onCancelled();
                }
                this.close();
                resolve();
                break;
            }
          } catch (parseError) {
            console.error('Failed to parse SSE message:', parseError);
          }
        };

        // Handle connection errors
        this.eventSource.onerror = (error) => {
          console.error('SSE connection error:', error);
          if (options.onError) {
            options.onError('Connection error');
          }
          this.close();
          reject(new Error('SSE connection failed'));
        };

      } catch (error) {
        console.error('Failed to start SSE stream:', error);
        reject(error);
      }
    });
  }

  /**
   * Cancel the current stream
   */
  async cancel(): Promise<void> {
    this.aborted = true;
    
    // Send cancellation request to server
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/stream/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stream_id: this.streamId }),
      });
    } catch (error) {
      console.error('Failed to cancel stream:', error);
    }

    this.close();
  }

  /**
   * Close the SSE connection
   */
  close(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * Check if stream is active
   */
  isActive(): boolean {
    return this.eventSource !== null && !this.aborted;
  }

  /**
   * Generate unique stream ID
   */
  private generateStreamId(): string {
    return `stream_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Get current stream ID
   */
  getStreamId(): string {
    return this.streamId;
  }
}

/**
 * Helper function for streaming AI responses
 */
export async function streamAIResponse(
  endpoint: string,
  payload: {
    text: string;
    action: string;
    context?: Record<string, any>;
  },
  callbacks: SSEOptions
): Promise<string> {
  const client = new SSEClient();
  let fullResponse = '';

  try {
    // Build SSE URL with query params
    const params = new URLSearchParams({
      stream_id: client.getStreamId(),
      action: payload.action,
    });

    const url = `${endpoint}?${params.toString()}`;

    // Start streaming with accumulation
    await client.stream(url, {
      onToken: (content) => {
        fullResponse += content;
        callbacks.onToken?.(content);
      },
      onDone: callbacks.onDone,
      onError: callbacks.onError,
      onCancelled: callbacks.onCancelled,
    });

    return fullResponse;

  } catch (error) {
    console.error('Stream error:', error);
    throw error;
  } finally {
    client.close();
  }
}

/**
 * React Hook for SSE streaming
 */
export function useSSEStream() {
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [streamedContent, setStreamedContent] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const clientRef = React.useRef<SSEClient | null>(null);

  const startStream = React.useCallback(
    async (
      endpoint: string,
      payload: {
        text: string;
        action: string;
        context?: Record<string, any>;
      }
    ) => {
      setIsStreaming(true);
      setStreamedContent('');
      setError(null);

      clientRef.current = new SSEClient();

      try {
        await streamAIResponse(endpoint, payload, {
          onToken: (content) => {
            setStreamedContent((prev) => prev + content);
          },
          onDone: () => {
            setIsStreaming(false);
          },
          onError: (err) => {
            setError(err);
            setIsStreaming(false);
          },
          onCancelled: () => {
            setIsStreaming(false);
          },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Stream failed');
        setIsStreaming(false);
      }
    },
    []
  );

  const cancelStream = React.useCallback(async () => {
    if (clientRef.current) {
      await clientRef.current.cancel();
      setIsStreaming(false);
    }
  }, []);

  return {
    isStreaming,
    streamedContent,
    error,
    startStream,
    cancelStream,
  };
}

// Import React for the hook
import React from 'react';
