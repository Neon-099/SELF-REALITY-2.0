import axios from 'axios';
import { connectToDatabase, getModels, apiClient } from '../mongodb-browser';
import type { Quest } from '../types';

// Add missing type interfaces to fix type errors
interface IMongooseDocument {
  set?: (key: string, value: any) => void;
  get?: (key: string) => any;
  save?: () => Promise<any>;
}

interface IUser extends IMongooseDocument {
  id?: string;
  _id?: string;
  [key: string]: any;
}

// Helper function to safely use lean() method when it exists
const safelyUseLean = async (findPromise: any) => {
  const result = await findPromise;
  if (result && typeof result.lean === 'function') {
    return result.lean();
  }
  return result;
};

// Fallback local storage keys for offline support
const LOCAL_STORAGE_KEYS = {
  QUESTS: 'solo-leveling-quests',
  USER: 'solo-leveling-user',
  MISSIONS: 'solo-leveling-missions'
};

/**
 * Service for MongoDB operations with local storage fallback
 */
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

  /**
   * Check if the service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Check if the service is using localStorage fallback
   */
  isUsingLocalStorage(): boolean {
    return this.useLocalStorage;
  }

  /**
   * Initialize the database connection
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    try {
      console.log('Attempting to connect to MongoDB...');

      // Attempt to connect to MongoDB
      const db = await connectToDatabase();

      if (!db) {
        console.warn('Connection returned invalid result, using local storage fallback');
        this.useLocalStorage = true;
        this.initialized = true;
        return true;
      }

      // If we reach here, connection was successful
      this.initialized = true;
      this.useLocalStorage = false;
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
      lastLogin: user.lastLogin ? new Date(user.lastLogin) : new Date(),

      // Character creation data
      completedCharacterCreation: user.completedCharacterCreation || false,
      characterClass: user.characterClass || '',
      surveyResults: user.surveyResults || {},
      surveyAnswers: user.surveyAnswers || {},
      strengths: Array.isArray(user.strengths) ? user.strengths : [],
      weaknesses: Array.isArray(user.weaknesses) ? user.weaknesses : [],

      // Auth connection
      authUserId: user.authUserId || null,
      email: user.email || null,

      // Daily wins
      dailyWins: user.dailyWins || {}
    };
  }

  // Helper method to transform quest data
  private transformQuestData(quest: any) {
    // Log the incoming quest data for debugging
    console.log('Transforming quest data:', quest);
    console.log('Quest tasks before transform:', quest.tasks);

    const transformedQuest = {
      id: quest._id?.toString() || quest.id || '',
      isMainQuest: Boolean(quest.isMainQuest),
      isDaily: Boolean(quest.isDaily),
      title: quest.title || '',
      description: quest.description || '',
      completed: Boolean(quest.completed),
      expReward: Number(quest.expReward) || 0,
      tasks: Array.isArray(quest.tasks) ? quest.tasks.map((task: any) => {
        // Log each task for debugging
        console.log('Processing task:', task);

        return {
          id: task._id?.toString() || task.id || crypto.randomUUID(),
          title: task.title || task.description || '',
          description: task.description || '',
          completed: Boolean(task.completed),
          category: task.category || 'mental', // Default category
          difficulty: task.difficulty || 'normal', // Default difficulty
          expReward: Number(task.expReward) || 0
        };
      }) : [],
      started: Boolean(quest.started),
      createdAt: quest.createdAt ? new Date(quest.createdAt) : new Date(),
      deadline: quest.deadline ? new Date(quest.deadline) : null,
      completedAt: quest.completedAt ? new Date(quest.completedAt) : null,
      missed: Boolean(quest.missed),
      isRecoveryQuest: Boolean(quest.isRecoveryQuest),
      // Add missing required fields
      difficulty: quest.difficulty || 'normal',
      category: quest.category || ''
    };

    // Log the transformed quest data for debugging
    console.log('Transformed quest tasks:', transformedQuest.tasks);

    return transformedQuest;
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

  // Mission methods
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
      const missions = await safelyUseLean(Mission.find());
      return missions ? missions.map((mission: any) => this.transformMissionData(mission)) : [];
    } catch (error) {
      console.error('Failed to get all missions:', error);
      return [];
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
      // Cast to any to avoid TypeScript errors about save method
      const mission = new (Mission as any)(missionData);
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

  // New method to get user by authentication ID
  async getUserByAuthId(authUserId: string) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (this.useLocalStorage) {
        const users = this.getFromLocalStorage<any[]>(LOCAL_STORAGE_KEYS.USER, []);
        const user = users.find(u => u.authUserId === authUserId);
        return user ? this.transformUserData(user) : null;
      }

      const { User } = getModels();

      // Find user by authUserId field
      const user = await User.findOne({ authUserId });
      if (!user) {
        console.log('No user found with authUserId:', authUserId);
        return null;
      }

      return this.transformUserData(user);
    } catch (error) {
      console.error('Failed to get user by auth ID:', error);

      // Fallback to localStorage
      try {
        const users = this.getFromLocalStorage<any[]>(LOCAL_STORAGE_KEYS.USER, []);
        const user = users.find(u => u.authUserId === authUserId);
        return user ? this.transformUserData(user) : null;
      } catch (fallbackError) {
        console.error('Failed to get user from local storage:', fallbackError);
        return null;
      }
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
      // Cast to any to avoid TypeScript errors
      const user = new (User as any)(userData);
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

  async updateUser(userId: string, userData: any) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (this.useLocalStorage) {
        // Handle local storage update
        const users = this.getFromLocalStorage<any[]>(LOCAL_STORAGE_KEYS.USER, []);
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex >= 0) {
          // Update existing user
          users[userIndex] = {
            ...users[userIndex],
            ...userData,
            lastUpdated: new Date()
          };
        } else {
          // Create new user if doesn't exist
          users.push({
            ...userData,
            id: userId || crypto.randomUUID(),
            lastUpdated: new Date()
          });
        }

        this.saveToLocalStorage(LOCAL_STORAGE_KEYS.USER, users);
        return this.transformUserData(users.find(u => u.id === userId));
      }

      // MongoDB update logic
      const { User } = getModels();

      // Handle the case when user doesn't exist yet
      const existingUser = await User.findById(userId) as IUser & IMongooseDocument;

      if (!existingUser) {
        // Create a new user if one doesn't exist
        console.log('User not found, creating a new one in MongoDB');
        const newUser = new (User as any)({
          ...userData,
          _id: userId
        });
        const savedUser = await newUser.save();
        return this.transformUserData(savedUser);
      }

      // Update existing user - handle special fields that need custom merging
      if (userData.surveyResults) {
        existingUser.set('surveyResults', {
          ...(existingUser.get('surveyResults') || {}),
          ...userData.surveyResults
        });
      }

      if (userData.surveyAnswers) {
        existingUser.set('surveyAnswers', {
          ...(existingUser.get('surveyAnswers') || {}),
          ...userData.surveyAnswers
        });
      }

      // Update other fields directly
      Object.keys(userData).forEach(key => {
        if (key !== 'surveyResults' && key !== 'surveyAnswers') {
          existingUser.set(key, userData[key]);
        }
      });

      existingUser.set('lastUpdated', new Date());

      const updatedUser = await existingUser.save();
      return this.transformUserData(updatedUser);
    } catch (error) {
      console.error('Failed to update user in MongoDB:', error);

      // Fallback to local storage
      try {
        const users = this.getFromLocalStorage<any[]>(LOCAL_STORAGE_KEYS.USER, []);
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex >= 0) {
          users[userIndex] = {
            ...users[userIndex],
            ...userData,
            lastUpdated: new Date()
          };
        } else {
          users.push({
            ...userData,
            id: userId || crypto.randomUUID(),
            lastUpdated: new Date()
          });
        }

        this.saveToLocalStorage(LOCAL_STORAGE_KEYS.USER, users);
        return this.transformUserData(users.find(u => u.id === userId));
      } catch (fallbackError) {
        console.error('Failed to update user in local storage:', fallbackError);
        throw error;
      }
    }
  }

  // Quest methods
  async getAllQuests(): Promise<Quest[]> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (this.useLocalStorage) {
        const quests = this.getFromLocalStorage<any[]>(LOCAL_STORAGE_KEYS.QUESTS, []);
        return quests.map(quest => this.transformQuestData(quest));
      }

      const { Quest } = getModels();
      const questDocs = await safelyUseLean(Quest.find());

      if (!questDocs || !Array.isArray(questDocs)) {
        console.warn('No quests found or invalid response format');
        return [];
      }

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
      const quest = new (Quest as any)(questData);
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

  // For backward compatibility with the old interface
  async getQuests() {
    return this.getAllQuests();
  }

  // Update a quest by ID
  async updateQuest(id: string, updates: any) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Log the update operation for debugging
      console.log('Updating quest:', id);
      console.log('Updates to apply:', updates);

      if (this.useLocalStorage) {
        const quests = this.getFromLocalStorage<any[]>(LOCAL_STORAGE_KEYS.QUESTS, []);
        const questIndex = quests.findIndex(q => q.id === id);

        if (questIndex === -1) {
          console.error('Quest not found in localStorage:', id);
          throw new Error('Quest not found');
        }

        // Special handling for tasks array
        if (updates.tasks) {
          console.log('Updating tasks in localStorage:', updates.tasks);

          // Ensure each task has all required fields
          updates.tasks = updates.tasks.map((task: any) => ({
            id: task.id || crypto.randomUUID(),
            title: task.title || task.description || '',
            description: task.description || '',
            completed: Boolean(task.completed),
            category: task.category || 'mental',
            difficulty: task.difficulty || 'normal',
            expReward: Number(task.expReward) || 0
          }));
        }

        quests[questIndex] = { ...quests[questIndex], ...updates };
        this.saveToLocalStorage(LOCAL_STORAGE_KEYS.QUESTS, quests);

        const updatedQuest = this.transformQuestData(quests[questIndex]);
        console.log('Updated quest in localStorage:', updatedQuest);
        return updatedQuest;
      }

      const { Quest } = getModels();

      // Special handling for tasks array
      if (updates.tasks) {
        console.log('Updating tasks in MongoDB:', updates.tasks);

        // Ensure each task has all required fields
        updates.tasks = updates.tasks.map((task: any) => ({
          id: task.id || crypto.randomUUID(),
          title: task.title || task.description || '',
          description: task.description || '',
          completed: Boolean(task.completed),
          category: task.category || 'mental',
          difficulty: task.difficulty || 'normal',
          expReward: Number(task.expReward) || 0
        }));
      }

      const updatedQuest = await Quest.findByIdAndUpdate(id, updates, { new: true });
      if (!updatedQuest) {
        console.error('Quest not found in MongoDB:', id);
        throw new Error('Quest not found');
      }

      const transformedQuest = this.transformQuestData(updatedQuest);
      console.log('Updated quest in MongoDB:', transformedQuest);
      return transformedQuest;
    } catch (error) {
      console.error('Failed to update quest:', error);
      throw error;
    }
  }

  // Get a single quest by ID
  async getQuest(id: string) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (this.useLocalStorage) {
        const quests = this.getFromLocalStorage<any[]>(LOCAL_STORAGE_KEYS.QUESTS, []);
        const quest = quests.find(q => q.id === id);
        return quest ? this.transformQuestData(quest) : null;
      }

      const { Quest } = getModels();
      const quest = await Quest.findById(id);
      if (!quest) {
        console.warn('Quest not found with ID:', id);
        return null;
      }

      return this.transformQuestData(quest);
    } catch (error) {
      console.error('Failed to get quest:', error);
      return null;
    }
  }

  // Add a method to migrate data from local storage to MongoDB
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