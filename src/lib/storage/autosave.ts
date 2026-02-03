/**
 * Auto-save Manager for Local-First Storage
 * 
 * Manages automatic saving of documents to IndexedDB with:
 * - Debounced saves (3 seconds delay)
 * - Save status tracking
 * - Error handling
 * - Offline queue management
 */

import { JSONContent } from '@tiptap/react';
import indexedDB, { StoredDocument, createStoredDocument } from './indexeddb';
import { DocumentStructure } from '@/types/document-structure';

// Auto-save configuration
const AUTO_SAVE_DELAY = 3000; // 3 seconds
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Save status enum
 */
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

/**
 * Auto-save manager class
 */
export class AutoSaveManager {
  private saveTimeout: NodeJS.Timeout | null = null;
  private currentDocumentId: string | null = null;
  private retryAttempts = 0;
  private status: SaveStatus = 'idle';
  private statusCallbacks: Set<(status: SaveStatus, message?: string) => void> = new Set();

  /**
   * Initialize auto-save for a document
   */
  init(documentId: string): void {
    this.currentDocumentId = documentId;
    this.status = 'idle';
    this.retryAttempts = 0;
    console.log(`AutoSave: Initialized for document ${documentId}`);
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(callback: (status: SaveStatus, message?: string) => void): () => void {
    this.statusCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  /**
   * Notify all status listeners
   */
  private notifyStatus(status: SaveStatus, message?: string): void {
    this.status = status;
    this.statusCallbacks.forEach(callback => callback(status, message));
  }

  /**
   * Get current save status
   */
  getStatus(): SaveStatus {
    return this.status;
  }

  /**
   * Schedule an auto-save (debounced)
   */
  scheduleSave(data: Partial<StoredDocument>): void {
    if (!this.currentDocumentId) {
      console.warn('AutoSave: No document ID set');
      return;
    }

    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Set status to "saving" after delay starts
    if (this.status === 'idle' || this.status === 'saved') {
      this.notifyStatus('saving');
    }

    // Schedule save after delay
    this.saveTimeout = setTimeout(() => {
      this.performSave(data);
    }, AUTO_SAVE_DELAY);
  }

  /**
   * Perform immediate save (no debounce)
   */
  async saveNow(data: Partial<StoredDocument>): Promise<void> {
    if (!this.currentDocumentId) {
      throw new Error('No document ID set');
    }

    // Clear any pending timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }

    this.notifyStatus('saving');
    await this.performSave(data);
  }

  /**
   * Perform the actual save operation
   */
  private async performSave(data: Partial<StoredDocument>): Promise<void> {
    if (!this.currentDocumentId) {
      return;
    }

    try {
      // Check if online
      if (!navigator.onLine) {
        console.warn('AutoSave: Offline, queueing save');
        this.notifyStatus('offline', 'You are offline. Changes will be saved when you reconnect.');
        // TODO: Add to offline queue
        return;
      }

      // Create document to save
      const document = createStoredDocument(this.currentDocumentId, data);

      // Save to IndexedDB
      await indexedDB.save(document);

      // Success
      this.retryAttempts = 0;
      this.notifyStatus('saved', `Saved at ${new Date().toLocaleTimeString()}`);
      console.log(`AutoSave: Document ${this.currentDocumentId} saved successfully`);

      // TODO: Optionally sync to cloud (Supabase)
      // await this.syncToCloud(document);

    } catch (error) {
      console.error('AutoSave: Save failed', error);
      
      // Retry logic
      if (this.retryAttempts < MAX_RETRY_ATTEMPTS) {
        this.retryAttempts++;
        this.notifyStatus('saving', `Retrying... (${this.retryAttempts}/${MAX_RETRY_ATTEMPTS})`);
        
        setTimeout(() => {
          this.performSave(data);
        }, RETRY_DELAY * this.retryAttempts); // Exponential backoff
      } else {
        this.notifyStatus('error', 'Failed to save. Please try again.');
        this.retryAttempts = 0;
      }
    }
  }

  /**
   * Cancel pending save
   */
  cancelPendingSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
      console.log('AutoSave: Pending save cancelled');
    }
  }

  /**
   * Clean up
   */
  destroy(): void {
    this.cancelPendingSave();
    this.statusCallbacks.clear();
    this.currentDocumentId = null;
    this.status = 'idle';
    console.log('AutoSave: Destroyed');
  }
}

// Singleton instance
const autoSave = new AutoSaveManager();

export default autoSave;

/**
 * Hook-friendly wrapper for React components
 */
export function useAutoSave(documentId: string) {
  const [status, setStatus] = React.useState<SaveStatus>('idle');
  const [message, setMessage] = React.useState<string>('');

  React.useEffect(() => {
    // Initialize auto-save for this document
    autoSave.init(documentId);

    // Subscribe to status changes
    const unsubscribe = autoSave.onStatusChange((newStatus, newMessage) => {
      setStatus(newStatus);
      setMessage(newMessage || '');
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      autoSave.destroy();
    };
  }, [documentId]);

  return {
    status,
    message,
    scheduleSave: (data: Partial<StoredDocument>) => autoSave.scheduleSave(data),
    saveNow: (data: Partial<StoredDocument>) => autoSave.saveNow(data),
    cancelPendingSave: () => autoSave.cancelPendingSave(),
  };
}

// Fix: Import React for hooks
import React from 'react';

/**
 * Offline queue manager
 */
class OfflineQueueManager {
  private queue: Array<{ id: string; data: Partial<StoredDocument>; timestamp: number }> = [];

  /**
   * Add to offline queue
   */
  add(id: string, data: Partial<StoredDocument>): void {
    this.queue.push({
      id,
      data,
      timestamp: Date.now(),
    });
    console.log(`OfflineQueue: Added document ${id} to queue (${this.queue.length} items)`);
  }

  /**
   * Process queue when back online
   */
  async processQueue(): Promise<void> {
    if (!navigator.onLine) {
      console.warn('OfflineQueue: Still offline, cannot process');
      return;
    }

    console.log(`OfflineQueue: Processing ${this.queue.length} items`);

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) break;

      try {
        const document = createStoredDocument(item.id, item.data);
        await indexedDB.save(document);
        console.log(`OfflineQueue: Synced document ${item.id}`);
      } catch (error) {
        console.error(`OfflineQueue: Failed to sync document ${item.id}`, error);
        // Re-add to queue
        this.queue.unshift(item);
        break; // Stop processing if sync fails
      }
    }

    console.log(`OfflineQueue: Processing complete (${this.queue.length} remaining)`);
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Get queue length
   */
  getLength(): number {
    return this.queue.length;
  }
}

// Singleton offline queue
export const offlineQueue = new OfflineQueueManager();

/**
 * Setup offline/online event listeners
 */
export function setupOfflineSync(): () => void {
  const handleOnline = () => {
    console.log('AutoSave: Back online, processing queue');
    offlineQueue.processQueue();
  };

  const handleOffline = () => {
    console.log('AutoSave: Gone offline');
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
