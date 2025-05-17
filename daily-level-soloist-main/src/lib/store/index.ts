import { create } from 'zustand';
import { createTaskSlice, TaskSlice } from './slices/task-slice';
import { createQuestSlice, QuestSlice } from './slices/quest-slice';
import { createMissionSlice, MissionSlice } from './slices/mission-slice';
import { createUserSlice, UserSlice } from './slices/user-slice';
import { createShopSlice, ShopSlice } from './slices/shop-slice';
import { createPunishmentSlice, PunishmentSlice } from './slices/punishment-slice';
import { initialUser } from './initial-state';
import { MongoDBService } from '../services/mongodb-service';

// Define the global store state by intersecting all slice states
export type StoreState = TaskSlice &
  QuestSlice &
  MissionSlice &
  UserSlice &
  ShopSlice &
  PunishmentSlice;

const dbService = MongoDBService.getInstance();

// Ensure MongoDB service is initialized before use
const initializeDB = async () => {
  try {
    return await dbService.initialize();
  } catch (error) {
    console.error('Error initializing MongoDB service:', error);
    return false;
  }
};

// Create store with MongoDB persistence
export const useSoloLevelingStore = create<StoreState>()((set, get) => {
  // Create slices with proper typing
  const taskSlice = createTaskSlice(set, get);
  const questSlice = createQuestSlice(dbService)(set, get);
  const missionSlice = createMissionSlice(dbService)(set, get);
  const userSlice = createUserSlice(dbService)(set, get);
  const shopSlice = createShopSlice(dbService)(set, get);
  const punishmentSlice = createPunishmentSlice(set, get);

  // Initialize store with default values
  const store = {
    user: initialUser,
    ...taskSlice,
    ...questSlice,
    ...missionSlice,
    ...userSlice,
    ...shopSlice,
    ...punishmentSlice,
  };

  // Initialize the database connection and load initial data
  (async () => {
    try {
      const initialized = await initializeDB();
      
      if (initialized) {
        // Load data in parallel
        await Promise.all([
          store.loadQuests(),
          store.loadUser(),
          store.loadMissions(),
        ]).catch(error => {
          console.error('Failed to load data:', error);
        });
      } else {
        console.error('Failed to initialize database, using default values');
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  })();

  return store;
});

// Re-export types and functions that might be needed elsewhere
export * from './slices/task-slice';
export * from './slices/quest-slice';
export * from './slices/mission-slice';
export * from './slices/user-slice';
export * from './slices/shop-slice';
