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
interface CustomPersistOptions<T> extends PersistOptions<T> {
  onError?: (error: Error) => void;
}

// Custom async storage for IndexedDB (store and retrieve strings only) with improved error handling
const indexedDBStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const db = await getDB();
      return await db.get('store', name);
    } catch (error) {
      console.error(`Failed to get item "${name}" from IndexedDB:`, error);
      // Return null on error so the app can continue with default state
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
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
    try {
      const db = await getDB();
      await db.delete('store', name);
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
