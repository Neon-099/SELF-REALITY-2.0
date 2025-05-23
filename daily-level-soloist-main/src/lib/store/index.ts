import { create } from 'zustand';
import { persist, createJSONStorage, PersistOptions } from 'zustand/middleware';
import { initialUser } from './initial-state';
import { createTaskSlice, TaskSlice } from './slices/task-slice';
import { createQuestSlice, QuestSlice } from './slices/quest-slice';
import { createMissionSlice, MissionSlice } from './slices/mission-slice';
import { createUserSlice, UserSlice } from './slices/user-slice';
import { createShopSlice, ShopSlice } from './slices/shop-slice';
import { createPunishmentSlice, PunishmentSlice } from './slices/punishment-slice';
import { getDB } from '../db';

export type StoreState = TaskSlice & QuestSlice & MissionSlice & UserSlice & ShopSlice & PunishmentSlice;

// Define a custom type that extends PersistOptions and adds onError
interface CustomPersistOptions<T> extends PersistOptions<T, T> {
  onError?: (error: Error) => void;
}

// Cache for frequently accessed data
const dataCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Custom async storage for IndexedDB with caching and improved error handling
const indexedDBStorage = {
  getItem: async (name: string): Promise<string | null> => {
    // Check cache first
    const cached = dataCache.get(name);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    try {
      const db = await getDB();
      const result = await db.get('store', name);

      // Cache the result
      if (result) {
        dataCache.set(name, { data: result, timestamp: Date.now(), ttl: CACHE_TTL });
      }

      return result;
    } catch (error) {
      console.error(`Failed to get item "${name}" from IndexedDB:`, error);

      // Try fallback from localStorage
      try {
        const fallback = localStorage.getItem(`fallback_${name}`);
        if (fallback) {
          console.log(`Retrieved fallback data for "${name}" from localStorage`);
          return fallback;
        }
      } catch (localStorageError) {
        console.error('Failed to retrieve fallback from localStorage:', localStorageError);
      }

      // Return null on error so the app can continue with default state
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    // Update cache immediately
    dataCache.set(name, { data: value, timestamp: Date.now(), ttl: CACHE_TTL });

    try {
      const db = await getDB();
      await db.put('store', value, name);
    } catch (error) {
      console.error(`Failed to save item "${name}" to IndexedDB:`, error);

      // Optional: try to save to localStorage as fallback
      try {
        localStorage.setItem(`fallback_${name}`, value);
        console.log(`Saved to localStorage as fallback for "${name}"`);
      } catch (localStorageError) {
        console.error('Fallback to localStorage also failed:', localStorageError);
      }
    }
  },
  removeItem: async (name: string): Promise<void> => {
    // Remove from cache
    dataCache.delete(name);

    try {
      const db = await getDB();
      await db.delete('store', name);

      // Also remove fallback
      localStorage.removeItem(`fallback_${name}`);
    } catch (error) {
      console.error(`Failed to remove item "${name}" from IndexedDB:`, error);
    }
  },
};

// Create store with IndexedDB persistence using createJSONStorage
export const useSoloLevelingStore = create<StoreState>()(
  persist(
    (...a) => ({
      user: initialUser,
      ...createTaskSlice(...a),
      ...createQuestSlice(...a),
      ...createMissionSlice(...a),
      ...createUserSlice(...a),
      ...createShopSlice(...a),
      ...createPunishmentSlice(...a),
    }),
    {
      name: 'soloist-store',
      storage: createJSONStorage(() => indexedDBStorage),
      // Add an onError handler to handle persistence failures
      onError: (error) => {
        console.error('An error occurred during state persistence:', error);
      }
    } as CustomPersistOptions<StoreState>
  )
);

// Re-export types and functions that might be needed elsewhere
export * from './slices/task-slice';
export * from './slices/quest-slice';
export * from './slices/mission-slice';
export * from './slices/user-slice';
export * from './slices/shop-slice';
