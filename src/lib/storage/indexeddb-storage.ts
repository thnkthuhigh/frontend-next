/**
 * IndexedDB Storage Adapter for Zustand Persist
 * 
 * Custom storage implementation to use IndexedDB instead of localStorage
 * for Zustand persist middleware
 */

import { StateStorage } from 'zustand/middleware';
import indexedDB from './indexeddb';

/**
 * Create IndexedDB storage adapter for Zustand
 */
export function createIndexedDBStorage(): StateStorage {
  return {
    getItem: async (name: string): Promise<string | null> => {
      try {
        const doc = await indexedDB.get(name);
        if (!doc) return null;
        
        // Return serialized state
        return JSON.stringify(doc);
      } catch (error) {
        console.error('IndexedDB Storage: Failed to get item', error);
        return null;
      }
    },

    setItem: async (name: string, value: string): Promise<void> => {
      try {
        const data = JSON.parse(value);
        await indexedDB.save({
          id: name,
          ...data,
          updatedAt: Date.now(),
          lastSavedAt: Date.now(),
        });
      } catch (error) {
        console.error('IndexedDB Storage: Failed to set item', error);
      }
    },

    removeItem: async (name: string): Promise<void> => {
      try {
        await indexedDB.delete(name);
      } catch (error) {
        console.error('IndexedDB Storage: Failed to remove item', error);
      }
    },
  };
}
