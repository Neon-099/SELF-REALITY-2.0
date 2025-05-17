import { create } from 'zustand';
import { createTaskSlice } from './slices/task-slice';
import { createQuestSlice } from './slices/quest-slice';
import { createMissionSlice } from './slices/mission-slice';
import { createUserSlice } from './slices/user-slice';
import { createShopSlice } from './slices/shop-slice';
import { createPunishmentSlice } from './slices/punishment-slice';
import { StoreState } from './types';
import { MongoDBService } from '../services/mongodb-service';

// Initialize MongoDB service
const dbService = MongoDBService.getInstance();

// Initialize MongoDB connection
const initializeDB = async () => {
  try {
    const initialized = await dbService.initialize();
    if (!initialized) {
      console.error('Failed to initialize MongoDB service');
    }
    return initialized;
  } catch (error) {
    console.error('Error initializing MongoDB service:', error);
    return false;
  }
};

// Create store with MongoDB persistence
export const useSoloLevelingStore = create<StoreState>()((set, get) => {
  // Create slices with proper typing
  const questSlice = createQuestSlice(dbService)(set, get, StoreState);
  const missionSlice = createMissionSlice(dbService)(set, get, StoreState);
  const userSlice = createUserSlice(dbService)(set, get, StoreState);
  const shopSlice = createShopSlice(dbService)(set, get, StoreState);
  const taskSlice = createTaskSlice(set, get, StoreState);
  const punishmentSlice = createPunishmentSlice(set, get, StoreState);

  // Initialize store with default values
  const store = {
    tasks: [],
    quests: [],
    missions: [],
    shopItems: [],
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
        ]);
      } else {
        console.error('Failed to initialize database, using default values');
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  })();

  return store;
}); 