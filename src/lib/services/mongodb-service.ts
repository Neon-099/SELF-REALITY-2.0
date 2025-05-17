import axios from 'axios';
import { connectToDatabase, getModels } from '../mongodb';
import { Quest } from '../store/slices/quest-slice';

const API_BASE_URL = '/api';

// Fallback local storage keys
const LOCAL_STORAGE_KEYS = {
  QUESTS: 'solo-leveling-quests',
  USER: 'solo-leveling-user',
  MISSIONS: 'solo-leveling-missions'
};

export class MongoDBService {
  private static instance: MongoDBService;
  private initialized: boolean = false;
  private useLocalStorage: boolean = false;

  private constructor() {}

  static getInstance(): MongoDBService {
    if (!MongoDBService.instance) {
      MongoDBService.instance = new MongoDBService();
    }
    return MongoDBService.instance;
  }

  async initialize() {
    if (this.initialized) {
      return true;
    }

    try {
      // Initialize MongoDB connection
      const db = await connectToDatabase();
      if (!db) {
        console.warn('Failed to connect to MongoDB, using local storage fallback');
        this.useLocalStorage = true;
        this.initialized = true;
        return true;
      }

      this.initialized = true;
      console.log('MongoDB service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize MongoDB service:', error);
      console.warn('Using local storage fallback instead');
      this.useLocalStorage = true;
      this.initialized = true;
      return true; // Return true to indicate we're "initialized" with fallback
    }
  }

  // Helper method to get data from local storage
  private getFromLocalStorage<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error getting ${key} from localStorage:`, error);
      return defaultValue;
    }
  }

  // Helper method to save data to local storage
  private saveToLocalStorage<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }

  // User methods
  async getUser(userId: string) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (this.useLocalStorage) {
        const users = this.getFromLocalStorage<any[]>(LOCAL_STORAGE_KEYS.USER, []);
        const user = users.find(u => u.id === userId);
        return user ? this.transformUserData(user) : null;
      }

      const { User } = getModels();
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      return this.transformUserData(user);
    } catch (error) {
      console.error('Failed to get user:', error);
      // Fallback to localStorage/indexedDB here if needed
      return null;
    }
  }

  async getAllUsers() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (this.useLocalStorage) {
        const users = this.getFromLocalStorage<any[]>(LOCAL_STORAGE_KEYS.USER, []);
        return users.map(user => this.transformUserData(user));
      }

      const { User } = getModels();
      const users = await User.find().lean();
      return users ? users.map(user => this.transformUserData(user)) : [];
    } catch (error) {
      console.error('Failed to get all users:', error);
      // Return empty array as fallback
      return [];
    }
  }

  async createUser(userData: any) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (this.useLocalStorage) {
        const users = this.getFromLocalStorage<any[]>(LOCAL_STORAGE_KEYS.USER, []);
        const newUser = { ...userData, id: crypto.randomUUID() };
        users.push(newUser);
        this.saveToLocalStorage(LOCAL_STORAGE_KEYS.USER, users);
        return this.transformUserData(newUser);
      }

      const { User } = getModels();
      const user = new User(userData);
      const savedUser = await user.save();
      
      return this.transformUserData(savedUser);
    } catch (error) {
      console.error('Failed to create user:', error);
      
      // Fallback to local storage
      try {
        const users = this.getFromLocalStorage<any[]>(LOCAL_STORAGE_KEYS.USER, []);
        const newUser = { ...userData, id: crypto.randomUUID() };
        users.push(newUser);
        this.saveToLocalStorage(LOCAL_STORAGE_KEYS.USER, users);
        return this.transformUserData(newUser);
      } catch (fallbackError) {
        console.error('Failed to create user in local storage:', fallbackError);
        throw error;
      }
    }
  }

  async updateUser(userId: string, updates: any) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (this.useLocalStorage) {
        const users = this.getFromLocalStorage<any[]>(LOCAL_STORAGE_KEYS.USER, []);
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
          throw new Error('User not found');
        }
        
        users[userIndex] = { ...users[userIndex], ...updates };
        this.saveToLocalStorage(LOCAL_STORAGE_KEYS.USER, users);
        return this.transformUserData(users[userIndex]);
      }

      const { User } = getModels();
      const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true });
      if (!updatedUser) {
        throw new Error('User not found');
      }
      
      return this.transformUserData(updatedUser);
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  }

  // Helper method to transform user data
  private transformUserData(user: any) {
    return {
      id: user._id?.toString() || user.id || '',
      name: user.name || '',
      level: user.level || 1,
      exp: user.exp || 0,
      expToNextLevel: user.expToNextLevel || 100,
      gold: user.gold || 0,
      rank: user.rank || 'F',
      streakDays: user.streakDays || 0,
      longestStreak: user.longestStreak || 0,
      stats: {
        physical: user.stats?.physical || 0,
        cognitive: user.stats?.cognitive || 0,
        emotional: user.stats?.emotional || 0,
        spiritual: user.stats?.spiritual || 0,
        social: user.stats?.social || 0
      },
      createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
      lastLogin: user.lastLogin ? new Date(user.lastLogin) : new Date()
    };
  }

  async getAllQuests(): Promise<Quest[]> {
    try {
      // Ensure MongoDB is initialized
      if (!this.initialized) {
        await this.initialize();
      }

      if (this.useLocalStorage) {
        const quests = this.getFromLocalStorage<any[]>(LOCAL_STORAGE_KEYS.QUESTS, []);
        return quests.map(quest => this.transformQuestData(quest));
      }

      // Use MongoDB model directly
      const { Quest } = getModels();
      const questDocs = await Quest.find().lean().exec();
      
      if (!questDocs || !Array.isArray(questDocs)) {
        console.warn('No quests found or invalid response format');
        return [];
      }

      // Transform the data to match the expected format
      return questDocs.map(quest => this.transformQuestData(quest));
    } catch (error) {
      console.error('Failed to fetch quests:', error);
      
      // Fallback to local storage if MongoDB fails
      const quests = this.getFromLocalStorage<any[]>(LOCAL_STORAGE_KEYS.QUESTS, []);
      return quests.map(quest => this.transformQuestData(quest));
    }
  }

  async createQuest(questData: any) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (this.useLocalStorage) {
        const quests = this.getFromLocalStorage<any[]>(LOCAL_STORAGE_KEYS.QUESTS, []);
        const newQuest = { 
          ...questData, 
          id: questData.id || crypto.randomUUID(),
          createdAt: new Date()
        };
        quests.push(newQuest);
        this.saveToLocalStorage(LOCAL_STORAGE_KEYS.QUESTS, quests);
        return this.transformQuestData(newQuest);
      }

      const { Quest } = getModels();
      const quest = new Quest(questData);
      const savedQuest = await quest.save();
      
      return this.transformQuestData(savedQuest);
    } catch (error) {
      console.error('Failed to create quest:', error);
      
      // Fallback to local storage
      try {
        const quests = this.getFromLocalStorage<any[]>(LOCAL_STORAGE_KEYS.QUESTS, []);
        const newQuest = { 
          ...questData, 
          id: questData.id || crypto.randomUUID(),
          createdAt: new Date()
        };
        quests.push(newQuest);
        this.saveToLocalStorage(LOCAL_STORAGE_KEYS.QUESTS, quests);
        return this.transformQuestData(newQuest);
      } catch (fallbackError) {
        console.error('Failed to create quest in local storage:', fallbackError);
        throw error;
      }
    }
  }

  async updateQuest(id: string, updates: any) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (this.useLocalStorage) {
        const quests = this.getFromLocalStorage<any[]>(LOCAL_STORAGE_KEYS.QUESTS, []);
        const questIndex = quests.findIndex(q => q.id === id);
        
        if (questIndex === -1) {
          throw new Error('Quest not found');
        }
        
        quests[questIndex] = { ...quests[questIndex], ...updates };
        this.saveToLocalStorage(LOCAL_STORAGE_KEYS.QUESTS, quests);
        return this.transformQuestData(quests[questIndex]);
      }

      const { Quest } = getModels();
      const updatedQuest = await Quest.findByIdAndUpdate(id, updates, { new: true });
      if (!updatedQuest) {
        throw new Error('Quest not found');
      }

      return this.transformQuestData(updatedQuest);
    } catch (error) {
      console.error('Failed to update quest:', error);
      throw error;
    }
  }

  async deleteQuest(id: string) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (this.useLocalStorage) {
        const quests = this.getFromLocalStorage<any[]>(LOCAL_STORAGE_KEYS.QUESTS, []);
        const filteredQuests = quests.filter(q => q.id !== id);
        this.saveToLocalStorage(LOCAL_STORAGE_KEYS.QUESTS, filteredQuests);
        return;
      }

      const { Quest } = getModels();
      await Quest.findByIdAndDelete(id);
    } catch (error) {
      console.error('Failed to delete quest:', error);
      throw error;
    }
  }

  // Helper method to transform quest data
  private transformQuestData(quest: any) {
    return {
      id: quest._id?.toString() || quest.id || '',
      isMainQuest: Boolean(quest.isMainQuest),
      isDaily: Boolean(quest.isDaily),
      title: quest.title || '',
      description: quest.description || '',
      completed: Boolean(quest.completed),
      expReward: Number(quest.expReward) || 0,
      tasks: Array.isArray(quest.tasks) ? quest.tasks.map((task: any) => ({
        id: task._id?.toString() || task.id || crypto.randomUUID(),
        title: task.title || task.description || '',
        description: task.description || '',
        completed: Boolean(task.completed)
      })) : [],
      started: Boolean(quest.started),
      createdAt: quest.createdAt ? new Date(quest.createdAt) : new Date(),
      deadline: quest.deadline ? new Date(quest.deadline) : null,
      completedAt: quest.completedAt ? new Date(quest.completedAt) : null,
      missed: Boolean(quest.missed),
      isRecoveryQuest: Boolean(quest.isRecoveryQuest)
    };
  }

  async getAllMissions() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (this.useLocalStorage) {
        const missions = this.getFromLocalStorage<any[]>(LOCAL_STORAGE_KEYS.MISSIONS, []);
        return missions.map(mission => this.transformMissionData(mission));
      }

      const { Mission } = getModels();
      const missions = await Mission.find().lean();
      return missions ? missions.map(mission => this.transformMissionData(mission)) : [];
    } catch (error) {
      console.error('Failed to get all missions:', error);
      return [];
    }
  }

  async getMission(missionId: string) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (this.useLocalStorage) {
        const missions = this.getFromLocalStorage<any[]>(LOCAL_STORAGE_KEYS.MISSIONS, []);
        const mission = missions.find(m => m.id === missionId);
        return mission ? this.transformMissionData(mission) : null;
      }

      const { Mission } = getModels();
      const mission = await Mission.findById(missionId);
      if (!mission) {
        throw new Error('Mission not found');
      }
      
      return this.transformMissionData(mission);
    } catch (error) {
      console.error('Failed to get mission:', error);
      return null;
    }
  }

  async createMission(missionData: any) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (this.useLocalStorage) {
        const missions = this.getFromLocalStorage<any[]>(LOCAL_STORAGE_KEYS.MISSIONS, []);
        const newMission = { ...missionData, id: crypto.randomUUID() };
        missions.push(newMission);
        this.saveToLocalStorage(LOCAL_STORAGE_KEYS.MISSIONS, missions);
        return this.transformMissionData(newMission);
      }

      const { Mission } = getModels();
      const mission = new Mission(missionData);
      const savedMission = await mission.save();
      
      return this.transformMissionData(savedMission);
    } catch (error) {
      console.error('Failed to create mission:', error);
      throw error;
    }
  }

  async updateMission(missionId: string, updates: any) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (this.useLocalStorage) {
        const missions = this.getFromLocalStorage<any[]>(LOCAL_STORAGE_KEYS.MISSIONS, []);
        const missionIndex = missions.findIndex(m => m.id === missionId);
        
        if (missionIndex === -1) {
          throw new Error('Mission not found');
        }
        
        missions[missionIndex] = { ...missions[missionIndex], ...updates };
        this.saveToLocalStorage(LOCAL_STORAGE_KEYS.MISSIONS, missions);
        return this.transformMissionData(missions[missionIndex]);
      }

      const { Mission } = getModels();
      const updatedMission = await Mission.findByIdAndUpdate(missionId, updates, { new: true });
      if (!updatedMission) {
        throw new Error('Mission not found');
      }
      
      return this.transformMissionData(updatedMission);
    } catch (error) {
      console.error('Failed to update mission:', error);
      throw error;
    }
  }

  async deleteMission(missionId: string) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (this.useLocalStorage) {
        const missions = this.getFromLocalStorage<any[]>(LOCAL_STORAGE_KEYS.MISSIONS, []);
        const filteredMissions = missions.filter(m => m.id !== missionId);
        this.saveToLocalStorage(LOCAL_STORAGE_KEYS.MISSIONS, filteredMissions);
        return;
      }

      const { Mission } = getModels();
      await Mission.findByIdAndDelete(missionId);
    } catch (error) {
      console.error('Failed to delete mission:', error);
      throw error;
    }
  }

  // Helper method to transform mission data
  private transformMissionData(mission: any) {
    return {
      id: mission._id?.toString() || mission.id || '',
      title: mission.title || '',
      description: mission.description || '',
      completed: Boolean(mission.completed),
      started: Boolean(mission.started),
      expReward: mission.expReward || 0,
      createdAt: mission.createdAt ? new Date(mission.createdAt) : new Date(),
      rank: mission.rank || 'F',
      day: mission.day || 1,
      difficulty: mission.difficulty || 'normal',
      count: mission.count || 1,
      taskNames: mission.taskNames || [],
      completedTaskIndices: mission.completedTaskIndices || [],
      completedAt: mission.completedAt ? new Date(mission.completedAt) : null
    };
  }

  // Optional: Add a method to migrate data from local storage to MongoDB
  async migrateFromLocalStorage(data: any) {
    try {
      if (!data) return false;
      
      await this.initialize();
      
      // Don't migrate if we're still using localStorage as fallback
      if (this.useLocalStorage) return false;
      
      // Migrate users
      if (data.user) {
        const { User } = getModels();
        await User.create(data.user);
      }
      
      // Migrate quests
      if (Array.isArray(data.quests) && data.quests.length > 0) {
        const { Quest } = getModels();
        await Quest.insertMany(data.quests);
      }
      
      // Migrate missions
      if (Array.isArray(data.missions) && data.missions.length > 0) {
        const { Mission } = getModels();
        await Mission.insertMany(data.missions);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to migrate data from localStorage:', error);
      return false;
    }
  }
} 