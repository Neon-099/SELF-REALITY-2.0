/**
 * Browser-compatible version of the MongoDB module
 * This uses the ApiClient instead of direct Mongoose connections
 */

import { ApiClient } from './api-client';

// Create a single instance of the API client
const apiClient = new ApiClient();

// Model interfaces (simplified)
interface IUser {
  id?: string;
  _id?: string;
  [key: string]: any; // Allow any other properties
  
  // Add methods that are expected by the service
  set?: (key: string, value: any) => void;
  get?: (key: string) => any;
  save?: () => Promise<any>;
}

interface IQuest {
  id?: string;
  _id?: string;
  [key: string]: any;
}

interface IMission {
  id?: string;
  _id?: string;
  [key: string]: any;
}

interface IShopItem {
  id?: string;
  _id?: string;
  [key: string]: any;
}

// Helper function to make objects have MongoDB-like methods
const addMongooseMethods = <T extends Record<string, any>>(obj: T): T => {
  // Add common Mongoose document methods
  obj.set = function(key: string, value: any) {
    this[key] = value;
    return this;
  };
  
  obj.get = function(key: string) {
    return this[key];
  };
  
  obj.save = async function() {
    // Depending on whether this has an ID, update or create
    if (this._id || this.id) {
      const id = this._id || this.id;
      // This is an update operation
      return await apiClient.updateUser(id, this);
    } else {
      // This is a create operation
      return await apiClient.createUser(this);
    }
  };
  
  return obj;
};

// Create mock mongoose-like model constructors
class UserModel {
  static async findById(id: string) {
    const user = await apiClient.getUser(id);
    return user ? addMongooseMethods(user) : null;
  }
  
  static async findOne(query: any) {
    if (query.authUserId) {
      const user = await apiClient.getUserByAuthId(query.authUserId);
      return user ? addMongooseMethods(user) : null;
    }
    return null;
  }
  
  static async find() {
    const users = await apiClient.getUsers();
    return {
      lean: () => users
    };
  }
  
  static async create(userData: any) {
    return await apiClient.createUser(userData);
  }
  
  static async findByIdAndUpdate(id: string, updates: any, options?: any) {
    return await apiClient.updateUser(id, updates);
  }
  
  constructor(data: any) {
    return addMongooseMethods(data);
  }
}

class QuestModel {
  static async find() {
    const quests = await apiClient.getQuests();
    return {
      lean: () => quests,
      exec: () => quests
    };
  }
  
  static async create(questData: any) {
    return await apiClient.createQuest(questData);
  }
  
  static async findByIdAndUpdate(id: string, updates: any, options?: any) {
    return await apiClient.updateQuest(id, updates);
  }
  
  static async insertMany(questsData: any[]) {
    const results = [];
    for (const questData of questsData) {
      const result = await apiClient.createQuest(questData);
      if (result) results.push(result);
    }
    return results;
  }
  
  constructor(data: any) {
    return data;
  }
}

class MissionModel {
  static async find() {
    const missions = await apiClient.getMissions();
    return {
      lean: () => missions,
      exec: () => missions
    };
  }
  
  static async create(missionData: any) {
    return await apiClient.createMission(missionData);
  }
  
  static async findByIdAndUpdate(id: string, updates: any, options?: any) {
    return await apiClient.updateMission(id, updates);
  }
  
  static async insertMany(missionsData: any[]) {
    const results = [];
    for (const missionData of missionsData) {
      const result = await apiClient.createMission(missionData);
      if (result) results.push(result);
    }
    return results;
  }
  
  constructor(data: any) {
    return data;
  }
}

class ShopItemModel {
  static async find() {
    const items = await apiClient.getShopItems();
    return {
      lean: () => items,
      exec: () => items
    };
  }
  
  constructor(data: any) {
    return data;
  }
}

// Export the models that look like Mongoose models
const User = UserModel;
const Quest = QuestModel;
const Mission = MissionModel;
const ShopItem = ShopItemModel;

/**
 * Connect to the server API
 * This mimics the original connectToDatabase but uses our API client
 */
async function connectToDatabase() {
  console.log('Connecting to MongoDB via API...');
  try {
    const isOnline = await apiClient.initialize();
    console.log(`MongoDB API initialization result: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
    
    if (isOnline) {
      console.log('✅ API connection successful');
      return true;
    } else {
      console.warn('⚠️ API connection unavailable, using local storage fallback');
      return false;
    }
  } catch (error) {
    console.error('❌ API connection error:', error);
    return false;
  }
}

/**
 * Get model objects
 * This mimics the original getModels function
 */
function getModels() {
  return { User, Quest, Mission, ShopItem };
}

// Export everything for compatibility with existing code
export { connectToDatabase, getModels, User, Quest, Mission, ShopItem, apiClient }; 