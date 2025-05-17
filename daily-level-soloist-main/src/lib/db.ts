import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Keeping the interface definitions for type checking purposes
// but operations will be handled by the Zustand store
interface Mission {
  id: string;
  title: string;
  description: string;
  expReward: number;
  rank: string;
  day: number;
  releaseDate: Date;
}

interface Quest {
  id: string;
  title: string;
  description: string;
  expReward: number;
  completed: boolean;
  completedAt?: Date;
}

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  category: string;
  difficulty: string;
  expReward: number;
  scheduledFor?: Date;
  completedAt?: Date;
  createdAt: Date;
}

interface ShopItem {
  id: string;
  name: string;
  price: number;
  description: string;
  purchased: boolean;
}

interface CompletedMission {
  id: string;
  title: string;
  description: string;
  expReward: number;
  rank: string;
  day: number;
  completedAt: Date;
  expEarned: number;
}

// Define a more flexible schema for DB migration purposes
interface MigrationDB extends DBSchema {
  missions: {
    key: string;
    value: Mission;
  };
  completedMissions: {
    key: string;
    value: CompletedMission;
  };
  quests: {
    key: string;
    value: Quest;
  };
  tasks: {
    key: string;
    value: Task;
  };
  shop: {
    key: string;
    value: ShopItem;
  };
  store: {
    key: string;
    value: any;
  };
}

// Final schema without the mission stores
interface SoloistDB extends DBSchema {
  quests: {
    key: string;
    value: Quest;
  };
  tasks: {
    key: string;
    value: Task;
  };
  shop: {
    key: string;
    value: ShopItem;
  };
  store: {
    key: string;
    value: any;
  };
}

let dbPromise: Promise<IDBPDatabase<SoloistDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<SoloistDB>('soloist-db', 4, {
      upgrade(db, oldVersion, newVersion) {
        // We're not creating mission stores anymore but keeping legacy code
        // for data migration purposes
        
        // If old version had these stores, we need to migrate the data to the main store
        if (oldVersion < 4) {
          // For migration purposes, we need to cast to a different interface that includes
          // the stores we're removing
          const migrationDb = db as unknown as IDBPDatabase<MigrationDB>;
          
          // Check if these object stores exist before trying to delete them
          if (migrationDb.objectStoreNames.contains('missions')) {
            // In a real migration we would get all missions and add them to the store
            // Since we're using Zustand's persist middleware, we'll handle this in the mission slice
            migrationDb.deleteObjectStore('missions');
          }
          if (migrationDb.objectStoreNames.contains('completedMissions')) {
            // Same for completed missions
            migrationDb.deleteObjectStore('completedMissions');
          }
        }

        // Ensure the other stores still exist
        if (!db.objectStoreNames.contains('quests')) {
          db.createObjectStore('quests', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('tasks')) {
          db.createObjectStore('tasks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('shop')) {
          db.createObjectStore('shop', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('store')) {
          db.createObjectStore('store');
        }
      },
    });
  }
  return dbPromise;
}

// --- Legacy Mission functions (for backward compatibility) ---
// All of these now work with the store state instead of direct IndexedDB access

export async function getAllMissions() {
  // This now retrieves missions from the Zustand store through the 'store' object store
  try {
  const db = await getDB();
    const storeData = await db.get('store', 'soloist-store');
    if (storeData) {
      const parsedStore = JSON.parse(storeData);
      return parsedStore.state?.missions || [];
    }
    return [];
  } catch (error) {
    console.error("Error fetching missions from store:", error);
    return [];
  }
}

export async function getCompletedMissions() {
  // This now retrieves completed missions from the Zustand store through the 'store' object store
  try {
  const db = await getDB();
    const storeData = await db.get('store', 'soloist-store');
    if (storeData) {
      const parsedStore = JSON.parse(storeData);
      return parsedStore.state?.completedMissionHistory || [];
    }
    return [];
  } catch (error) {
    console.error("Error fetching completed missions from store:", error);
    return [];
  }
}

export async function addMission(mission: Mission) {
  // We'll now let the Zustand store handle this
  // This function remains for backward compatibility
  console.warn("Direct IndexedDB mission operations are deprecated. Use the Zustand store instead.");
  
  // Try to update the store directly
  try {
  const db = await getDB();
    const storeData = await db.get('store', 'soloist-store');
    if (storeData) {
      const parsedStore = JSON.parse(storeData);
      if (parsedStore.state && Array.isArray(parsedStore.state.missions)) {
        parsedStore.state.missions.push(mission);
        await db.put('store', JSON.stringify(parsedStore), 'soloist-store');
      }
    }
  } catch (error) {
    console.error("Error adding mission to store:", error);
  }
}

export async function addCompletedMission(mission: CompletedMission) {
  // We'll now let the Zustand store handle this
  // This function remains for backward compatibility
  console.warn("Direct IndexedDB completed mission operations are deprecated. Use the Zustand store instead.");
  
  // Try to update the store directly
  try {
  const db = await getDB();
    const storeData = await db.get('store', 'soloist-store');
    if (storeData) {
      const parsedStore = JSON.parse(storeData);
      if (parsedStore.state && Array.isArray(parsedStore.state.completedMissionHistory)) {
        parsedStore.state.completedMissionHistory.push(mission);
        await db.put('store', JSON.stringify(parsedStore), 'soloist-store');
      }
    }
  } catch (error) {
    console.error("Error adding completed mission to store:", error);
  }
}

export async function deleteMission(id: string) {
  // We'll now let the Zustand store handle this
  // This function remains for backward compatibility
  console.warn("Direct IndexedDB mission operations are deprecated. Use the Zustand store instead.");
  
  // Try to update the store directly
  try {
  const db = await getDB();
    const storeData = await db.get('store', 'soloist-store');
    if (storeData) {
      const parsedStore = JSON.parse(storeData);
      if (parsedStore.state && Array.isArray(parsedStore.state.missions)) {
        parsedStore.state.missions = parsedStore.state.missions.filter((m: Mission) => m.id !== id);
        await db.put('store', JSON.stringify(parsedStore), 'soloist-store');
      }
    }
  } catch (error) {
    console.error("Error deleting mission from store:", error);
  }
}

export async function updateMission(mission: Mission) {
  // We'll now let the Zustand store handle this
  // This function remains for backward compatibility
  console.warn("Direct IndexedDB mission operations are deprecated. Use the Zustand store instead.");
  
  // Try to update the store directly
  try {
  const db = await getDB();
    const storeData = await db.get('store', 'soloist-store');
    if (storeData) {
      const parsedStore = JSON.parse(storeData);
      if (parsedStore.state && Array.isArray(parsedStore.state.missions)) {
        parsedStore.state.missions = parsedStore.state.missions.map((m: Mission) => 
          m.id === mission.id ? mission : m
        );
        await db.put('store', JSON.stringify(parsedStore), 'soloist-store');
      }
    }
  } catch (error) {
    console.error("Error updating mission in store:", error);
  }
}

export async function getMissionsByDay(date: Date): Promise<Mission[]> {
  try {
    const completedMissions = await getCompletedMissions();
    return completedMissions.filter((mission: any) => {
      // In case we get missions from other sources, ensure we have a completedAt date
      if (!mission.completedAt) return false;
      
      const missionDate = new Date(mission.completedAt);
      return (
        missionDate.getDate() === date.getDate() &&
        missionDate.getMonth() === date.getMonth() &&
        missionDate.getFullYear() === date.getFullYear()
      );
    });
  } catch (error) {
    console.error('Error fetching missions by day:', error);
    return [];
  }
}

// --- Quests ---
export async function getAllQuests() {
  const db = await getDB();
  return db.getAll('quests');
}
export async function addQuest(quest: Quest) {
  const db = await getDB();
  await db.put('quests', quest);
}
export async function deleteQuest(id: string) {
  const db = await getDB();
  await db.delete('quests', id);
}
export async function updateQuest(quest: Quest) {
  const db = await getDB();
  await db.put('quests', quest);
}

// --- Tasks ---
export async function getAllTasks() {
  const db = await getDB();
  return db.getAll('tasks');
}
export async function addTask(task: Task) {
  const db = await getDB();
  await db.put('tasks', task);
}
export async function deleteTask(id: string) {
  const db = await getDB();
  await db.delete('tasks', id);
}
export async function updateTask(task: Task) {
  const db = await getDB();
  await db.put('tasks', task);
}

// --- Shop Items ---
export async function getAllShopItems() {
  const db = await getDB();
  return db.getAll('shop');
}
export async function addShopItem(item: ShopItem) {
  const db = await getDB();
  await db.put('shop', item);
}
export async function deleteShopItem(id: string) {
  const db = await getDB();
  await db.delete('shop', id);
}
export async function updateShopItem(item: ShopItem) {
  const db = await getDB();
  await db.put('shop', item);
} 