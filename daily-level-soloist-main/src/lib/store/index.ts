import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { initialUser } from './initial-state';
import { createTaskSlice, TaskSlice } from './slices/task-slice';
import { createQuestSlice, QuestSlice } from './slices/quest-slice';
import { createMissionSlice, MissionSlice } from './slices/mission-slice';
import { createUserSlice, UserSlice } from './slices/user-slice';
import { createShopSlice, ShopSlice } from './slices/shop-slice';
import { createPunishmentSlice, PunishmentSlice } from './slices/punishment-slice';
import { getDB } from '../db';

export type StoreState = TaskSlice & QuestSlice & MissionSlice & UserSlice & ShopSlice & PunishmentSlice;

// Custom async storage for IndexedDB (store and retrieve strings only)
const indexedDBStorage = {
  getItem: async (name: string) => {
    const db = await getDB();
    return await db.get('store', name);
  },
  setItem: async (name: string, value: string) => {
    const db = await getDB();
    await db.put('store', value, name);
  },
  removeItem: async (name: string) => {
    const db = await getDB();
    await db.delete('store', name);
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
    }
  )
);

// Re-export types and functions that might be needed elsewhere
export * from './slices/task-slice';
export * from './slices/quest-slice';
export * from './slices/mission-slice';
export * from './slices/user-slice';
export * from './slices/shop-slice';
