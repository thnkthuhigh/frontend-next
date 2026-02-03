/**
 * IndexedDB Wrapper for Local-First Storage
 * 
 * Provides a robust interface for storing documents locally with:
 * - Offline support
 * - Fast reads/writes
 * - Version management
 * - Conflict detection
 */

import { JSONContent } from '@tiptap/react';
import { DocumentStructure } from '@/types/document-structure';

// Database configuration
const DB_NAME = 'ai-doc-formatter';
const DB_VERSION = 1;
const STORE_NAME = 'documents';

// Document schema
export interface StoredDocument {
  id: string;
  title: string;
  subtitle?: string;
  author?: string;
  date?: string;
  jsonContent: JSONContent | null;
  htmlContent?: string;
  structure?: DocumentStructure;
  
  // Metadata
  createdAt: number;
  updatedAt: number;
  lastSavedAt: number;
  version: number;
  
  // Sync status
  syncedAt?: number;
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
  cloudVersion?: number;
}

/**
 * IndexedDB Database Manager
 */
class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  /**
   * Initialize the database
   */
  async init(): Promise<IDBDatabase> {
    // Return existing promise if already initializing
    if (this.initPromise) {
      return this.initPromise;
    }

    // Return existing connection if already initialized
    if (this.db) {
      return Promise.resolve(this.db);
    }

    // Create initialization promise
    this.initPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB: Failed to open database', request.error);
        this.initPromise = null;
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.initPromise = null;
        console.log('IndexedDB: Database opened successfully');
        resolve(this.db!); // Non-null assertion as we just set it
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });

          // Create indexes
          objectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          objectStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          objectStore.createIndex('title', 'title', { unique: false });

          console.log('IndexedDB: Object store created');
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Save a document
   */
  async save(document: StoredDocument): Promise<void> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.put(document);

      request.onsuccess = () => {
        console.log('IndexedDB: Document saved', document.id);
        resolve();
      };

      request.onerror = () => {
        console.error('IndexedDB: Failed to save document', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get a document by ID
   */
  async get(id: string): Promise<StoredDocument | null> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        console.error('IndexedDB: Failed to get document', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all documents
   */
  async getAll(): Promise<StoredDocument[]> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error('IndexedDB: Failed to get all documents', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete a document by ID
   */
  async delete(id: string): Promise<void> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('IndexedDB: Document deleted', id);
        resolve();
      };

      request.onerror = () => {
        console.error('IndexedDB: Failed to delete document', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get documents by sync status
   */
  async getBySyncStatus(status: StoredDocument['syncStatus']): Promise<StoredDocument[]> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('syncStatus');
      
      const request = index.getAll(status);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error('IndexedDB: Failed to get documents by sync status', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Clear all documents (for testing/reset)
   */
  async clear(): Promise<void> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.clear();

      request.onsuccess = () => {
        console.log('IndexedDB: All documents cleared');
        resolve();
      };

      request.onerror = () => {
        console.error('IndexedDB: Failed to clear documents', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('IndexedDB: Database connection closed');
    }
  }
}

// Singleton instance
const indexedDB = new IndexedDBManager();

export default indexedDB;

/**
 * Helper: Create a new stored document
 */
export function createStoredDocument(
  id: string,
  data: Partial<StoredDocument>
): StoredDocument {
  const now = Date.now();

  return {
    id,
    title: data.title || 'Untitled Document',
    subtitle: data.subtitle,
    author: data.author,
    date: data.date,
    jsonContent: data.jsonContent || null,
    htmlContent: data.htmlContent,
    structure: data.structure,
    createdAt: data.createdAt || now,
    updatedAt: now,
    lastSavedAt: now,
    version: (data.version || 0) + 1,
    syncedAt: data.syncedAt,
    syncStatus: 'pending',
    cloudVersion: data.cloudVersion,
  };
}

/**
 * Helper: Check if document has conflicts
 */
export function hasConflict(localDoc: StoredDocument, cloudDoc: StoredDocument): boolean {
  // Conflict if both have been updated since last sync
  if (!localDoc.syncedAt || !cloudDoc.syncedAt) {
    return false;
  }

  const localUpdatedAfterSync = localDoc.updatedAt > localDoc.syncedAt;
  const cloudUpdatedAfterSync = cloudDoc.updatedAt > cloudDoc.syncedAt;

  return localUpdatedAfterSync && cloudUpdatedAfterSync;
}

/**
 * Helper: Migrate from localStorage to IndexedDB
 */
export async function migrateFromLocalStorage(): Promise<number> {
  try {
    const keys = Object.keys(localStorage);
    let migrated = 0;

    for (const key of keys) {
      if (key.startsWith('document-')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          const id = key.replace('document-', '');

          const doc = createStoredDocument(id, data);
          await indexedDB.save(doc);

          migrated++;
          console.log(`Migrated document: ${id}`);
        } catch (error) {
          console.error(`Failed to migrate document: ${key}`, error);
        }
      }
    }

    console.log(`IndexedDB: Migrated ${migrated} documents from localStorage`);
    return migrated;
  } catch (error) {
    console.error('IndexedDB: Migration failed', error);
    return 0;
  }
}
