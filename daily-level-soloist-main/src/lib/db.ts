import { openDB, DBSchema, IDBPDatabase } from 'idb';

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

interface SoloistDB extends DBSchema {
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

let dbPromise: Promise<IDBPDatabase<SoloistDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<SoloistDB>('soloist-db', 3, {
      upgrade(db, oldVersion, newVersion) {
        if (!db.objectStoreNames.contains('missions')) {
          db.createObjectStore('missions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('completedMissions')) {
          db.createObjectStore('completedMissions', { keyPath: 'id' });
        }
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

// --- Missions ---
export async function getAllMissions() {
  const db = await getDB();
  return db.getAll('missions');
}

export async function getCompletedMissions() {
  const db = await getDB();
  return db.getAll('completedMissions');
}

export async function addMission(mission: Mission) {
  const db = await getDB();
  await db.put('missions', mission);
}

export async function addCompletedMission(mission: CompletedMission) {
  const db = await getDB();
  await db.put('completedMissions', mission);
}

export async function deleteMission(id: string) {
  const db = await getDB();
  await db.delete('missions', id);
}

export async function updateMission(mission: Mission) {
  const db = await getDB();
  await db.put('missions', mission);
}

export async function getMissionsByDay(date: Date) {
  const db = await getDB();
  const completedMissions = await db.getAll('completedMissions');
  return completedMissions.filter((mission) => {
    const missionDate = new Date(mission.completedAt);
    return (
      missionDate.getDate() === date.getDate() &&
      missionDate.getMonth() === date.getMonth() &&
      missionDate.getFullYear() === date.getFullYear()
    );
  });
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