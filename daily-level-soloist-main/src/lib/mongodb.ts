// This file now serves as a proxy to the MongoDB API instead of direct connection
// Browser environments can't use Mongoose directly, so we'll use a REST API approach

import axios from 'axios';

const API_BASE_URL = '/api'; // This should match the server endpoint setup in vite.config.ts

// Model interfaces - maintain type safety
interface IUser {
  id?: string;
  username?: string;
  name?: string;
  level?: number;
  exp?: number;
  expToNextLevel?: number;
  gold?: number;
  rank?: string;
  streakDays?: number;
  longestStreak?: number;
  stats?: {
    physical?: number;
    cognitive?: number;
    emotional?: number;
    spiritual?: number;
    social?: number;
    // ... other stats
  };
  completedCharacterCreation?: boolean;
  characterClass?: string;
  surveyResults?: Record<string, number>;
  surveyAnswers?: Record<string, number[]>;
  strengths?: string[];
  weaknesses?: string[];
  authUserId?: string;
  email?: string;
  dailyWins?: any;
  createdAt?: Date;
  updatedAt?: Date;
  lastActive?: Date;
  lastLogin?: Date;
  lastUpdated?: Date;
}

interface IQuest {
  id?: string;
  title?: string;
  description?: string;
  expReward?: number;
  completed?: boolean;
  completedAt?: Date;
  createdAt?: Date;
  isMainQuest?: boolean;
  isDaily?: boolean;
  tasks?: any[];
  started?: boolean;
  deadline?: Date;
  missed?: boolean;
  isRecoveryQuest?: boolean;
  difficulty?: string;
  category?: string;
}

interface IMission {
  id?: string;
  title?: string;
  description?: string;
  expReward?: number;
  rank?: string;
  day?: number;
  releaseDate?: Date;
  createdAt?: Date;
  completed?: boolean;
  started?: boolean;
  difficulty?: string;
  count?: number;
  taskNames?: string[];
  completedTaskIndices?: number[];
  completedAt?: Date | null;
}

interface IShopItem {
  id?: string;
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  imageUrl?: string;
  effects?: Record<string, number>;
  createdAt?: Date;
}

// Mock API client for seamless integration
class ApiClient {
  // Health check to see if the server is available
  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      return response.data.status === 'ok';
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }

  // User operations
  async getUser(id: string): Promise<IUser | null> {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get user:', error);
      return null;
    }
  }

  async createUser(userData: IUser): Promise<IUser | null> {
    try {
      const response = await axios.post(`${API_BASE_URL}/users`, userData);
      return response.data;
    } catch (error) {
      console.error('Failed to create user:', error);
      return null;
    }
  }

  async updateUser(id: string, userData: Partial<IUser>): Promise<IUser | null> {
    try {
      const response = await axios.put(`${API_BASE_URL}/users/${id}`, userData);
      return response.data;
    } catch (error) {
      console.error('Failed to update user:', error);
      return null;
    }
  }

  // Quest operations
  async getQuests(): Promise<IQuest[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/quests`);
      return response.data;
    } catch (error) {
      console.error('Failed to get quests:', error);
      return [];
    }
  }

  async createQuest(questData: IQuest): Promise<IQuest | null> {
    try {
      const response = await axios.post(`${API_BASE_URL}/quests`, questData);
      return response.data;
    } catch (error) {
      console.error('Failed to create quest:', error);
      return null;
    }
  }

  async updateQuest(id: string, questData: Partial<IQuest>): Promise<IQuest | null> {
    try {
      const response = await axios.put(`${API_BASE_URL}/quests/${id}`, questData);
      return response.data;
    } catch (error) {
      console.error('Failed to update quest:', error);
      return null;
    }
  }

  // Mission operations
  async getMissions(): Promise<IMission[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/missions`);
      return response.data;
    } catch (error) {
      console.error('Failed to get missions:', error);
      return [];
    }
  }

  async createMission(missionData: IMission): Promise<IMission | null> {
    try {
      const response = await axios.post(`${API_BASE_URL}/missions`, missionData);
      return response.data;
    } catch (error) {
      console.error('Failed to create mission:', error);
      return null;
    }
  }

  async updateMission(id: string, missionData: Partial<IMission>): Promise<IMission | null> {
    try {
      const response = await axios.put(`${API_BASE_URL}/missions/${id}`, missionData);
      return response.data;
    } catch (error) {
      console.error('Failed to update mission:', error);
      return null;
    }
  }

  // Shop operations
  async getShopItems(): Promise<IShopItem[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/shop`);
      return response.data;
    } catch (error) {
      console.error('Failed to get shop items:', error);
      return [];
    }
  }
}

// Create an instance of the API client
const apiClient = new ApiClient();

// Create mock model objects that mimic Mongoose models
// These are placeholders for type safety and will be replaced by API calls
const User = {
  // We won't implement these directly - they should be handled by the api client
};

const Quest = {
  // We won't implement these directly - they should be handled by the api client
};

const Mission = {
  // We won't implement these directly - they should be handled by the api client
};

const ShopItem = {
  // We won't implement these directly - they should be handled by the api client
};

// Mock connectToDatabase function for compatibility with existing code
async function connectToDatabase() {
  try {
    // Check API health to see if the server is available
    const isHealthy = await apiClient.checkHealth();
    if (isHealthy) {
      console.log('✅ API connection successful');
      return true;
    } else {
      console.error('❌ API connection failed');
      return false;
    }
  } catch (error) {
    console.error('❌ API connection error:', error);
    return false;
  }
}

// Mock getModels function for compatibility with existing code
function getModels() {
  return { User, Quest, Mission, ShopItem };
}

// Export everything needed for compatibility
export { connectToDatabase, getModels, User, Quest, Mission, ShopItem, apiClient }; 