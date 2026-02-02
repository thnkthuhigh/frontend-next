/**
 * StreamManager - Manages AbortControllers for streaming requests
 * Allows cancelling individual streams or all streams at once
 */
class StreamManager {
  private controllers: Map<string, AbortController> = new Map();
  
  /**
   * Create a new AbortController for a stream.
   * Automatically cancels any existing stream with the same ID.
   */
  create(streamId: string): AbortController {
    this.cancel(streamId);
    
    const controller = new AbortController();
    this.controllers.set(streamId, controller);
    
    console.log(`[StreamManager] Stream created: ${streamId}`);
    return controller;
  }
  
  /**
   * Cancel a specific stream by ID.
   */
  cancel(streamId: string): void {
    const controller = this.controllers.get(streamId);
    if (controller) {
      controller.abort();
      this.controllers.delete(streamId);
      console.log(`[StreamManager] Stream cancelled: ${streamId}`);
    }
  }
  
  /**
   * Cancel all active streams.
   */
  cancelAll(): void {
    const count = this.controllers.size;
    if (count > 0) {
      console.log(`[StreamManager] Cancelling ${count} active stream(s)`);
      this.controllers.forEach(controller => controller.abort());
      this.controllers.clear();
    }
  }
  
  /**
   * Check if a stream is active.
   */
  isActive(streamId: string): boolean {
    return this.controllers.has(streamId);
  }
  
  /**
   * Get count of active streams.
   */
  getActiveCount(): number {
    return this.controllers.size;
  }
}

export const streamManager = new StreamManager();
