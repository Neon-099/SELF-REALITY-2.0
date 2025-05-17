/**
 * API Client for MongoDB operations
 * This replaces direct Mongoose usage in the browser with API calls to the server
 */

import axios from 'axios';

const API_BASE_URL = '/api'; // This should match the server endpoint in vite.config.ts

// Model interfaces for type safety
interface IUser {
  id?: string;
  _id?: string;
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
  _id?: string;
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
  _id?: string;
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
  _id?: string;
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  imageUrl?: string;
  effects?: Record<string, number>;
  createdAt?: Date;
}

/**
 * API Client class to handle MongoDB operations via API calls
 */
export class ApiClient {
  private apiBaseUrl: string;
  private online: boolean = true;
  private initialized: boolean = false;
  
  constructor(baseUrl = API_BASE_URL) {
    this.apiBaseUrl = baseUrl;
  }

  /**
   * Initialize the API client and check connectivity
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) {
      return this.online;
    }
    
    try {
      await this.checkHealth();
      this.initialized = true;
      return this.online;
    } catch (error) {
      console.error('Failed to initialize API client:', error);
      this.online = false;
      this.initialized = true;
      return false;
    }
  }
  
  /**
   * Check if the API server is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      console.log('Checking API health...');
      console.log(`API endpoint: ${this.apiBaseUrl}/health`);
      
      const response = await axios.get(`${this.apiBaseUrl}/health`);
      
      console.log('API health response:', response.status, response.data);
      this.online = response.data.status === 'ok';
      console.log(`API health check: ${this.online ? 'ONLINE' : 'OFFLINE'}`);
      return this.online;
    } catch (error) {
      console.error('API health check failed:', error);
      
      // More detailed error information
      if (axios.isAxiosError(error)) {
        console.error('API health request failed with status:', error.response?.status);
        console.error('API health error details:', error.message);
      }
      
      this.online = false;
      return false;
    }
  }
  
  /**
   * Check if we're online and can use the API
   */
  isOnline(): boolean {
    return this.online;
  }

  // === USER OPERATIONS ===
  
  /**
   * Get a user by ID
   */
  async getUser(id: string): Promise<IUser | null> {
    if (!this.online) return null;
    
    try {
      const response = await axios.get(`${this.apiBaseUrl}/users/${id}`);
      return this.normalizeId(response.data);
    } catch (error) {
      console.error('Failed to get user:', error);
      return null;
    }
  }

  /**
   * Get a user by auth ID
   */
  async getUserByAuthId(authId: string): Promise<IUser | null> {
    if (!this.online) return null;
    
    try {
      const response = await axios.get(`${this.apiBaseUrl}/users/auth/${authId}`);
      return this.normalizeId(response.data);
    } catch (error) {
      console.error('Failed to get user by auth ID:', error);
      return null;
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData: IUser): Promise<IUser | null> {
    if (!this.online) return null;
    
    try {
      const response = await axios.post(`${this.apiBaseUrl}/users`, userData);
      return this.normalizeId(response.data);
    } catch (error) {
      console.error('Failed to create user:', error);
      return null;
    }
  }

  /**
   * Update an existing user
   */
  async updateUser(id: string, userData: Partial<IUser>): Promise<IUser | null> {
    if (!this.online) return null;
    
    try {
      const response = await axios.put(`${this.apiBaseUrl}/users/${id}`, userData);
      return this.normalizeId(response.data);
    } catch (error) {
      console.error('Failed to update user:', error);
      return null;
    }
  }

  /**
   * Get all users
   */
  async getUsers(): Promise<IUser[]> {
    if (!this.online) return [];
    
    try {
      const response = await axios.get(`${this.apiBaseUrl}/users`);
      return response.data.map(this.normalizeId);
    } catch (error) {
      console.error('Failed to get users:', error);
      return [];
    }
  }

  // === QUEST OPERATIONS ===
  
  /**
   * Get all quests
   */
  async getQuests(): Promise<IQuest[]> {
    if (!this.online) return [];
    
    try {
      const response = await axios.get(`${this.apiBaseUrl}/quests`);
      return response.data.map(this.normalizeId);
    } catch (error) {
      console.error('Failed to get quests:', error);
      return [];
    }
  }

  /**
   * Create a new quest
   */
  async createQuest(questData: IQuest): Promise<IQuest | null> {
    if (!this.online) return null;
    
    try {
      const response = await axios.post(`${this.apiBaseUrl}/quests`, questData);
      return this.normalizeId(response.data);
    } catch (error) {
      console.error('Failed to create quest:', error);
      return null;
    }
  }

  /**
   * Update an existing quest
   */
  async updateQuest(id: string, questData: Partial<IQuest>): Promise<IQuest | null> {
    if (!this.online) return null;
    
    try {
      const response = await axios.put(`${this.apiBaseUrl}/quests/${id}`, questData);
      return this.normalizeId(response.data);
    } catch (error) {
      console.error('Failed to update quest:', error);
      return null;
    }
  }

  // === MISSION OPERATIONS ===
  
  /**
   * Get all missions
   */
  async getMissions(): Promise<IMission[]> {
    if (!this.online) return [];
    
    try {
      const response = await axios.get(`${this.apiBaseUrl}/missions`);
      return response.data.map(this.normalizeId);
    } catch (error) {
      console.error('Failed to get missions:', error);
      return [];
    }
  }

  /**
   * Create a new mission
   */
  async createMission(missionData: IMission): Promise<IMission | null> {
    if (!this.online) return null;
    
    try {
      const response = await axios.post(`${this.apiBaseUrl}/missions`, missionData);
      return this.normalizeId(response.data);
    } catch (error) {
      console.error('Failed to create mission:', error);
      return null;
    }
  }

  /**
   * Update an existing mission
   */
  async updateMission(id: string, missionData: Partial<IMission>): Promise<IMission | null> {
    if (!this.online) return null;
    
    try {
      const response = await axios.put(`${this.apiBaseUrl}/missions/${id}`, missionData);
      return this.normalizeId(response.data);
    } catch (error) {
      console.error('Failed to update mission:', error);
      return null;
    }
  }

  // === SHOP OPERATIONS ===
  
  /**
   * Get all shop items
   */
  async getShopItems(): Promise<IShopItem[]> {
    if (!this.online) return [];
    
    try {
      const response = await axios.get(`${this.apiBaseUrl}/shop`);
      return response.data.map(this.normalizeId);
    } catch (error) {
      console.error('Failed to get shop items:', error);
      return [];
    }
  }

  // === UTILITY METHODS ===
  
  /**
   * Normalize MongoDB _id to id for consistent usage
   */
  private normalizeId<T extends { _id?: string, id?: string }>(item: T): T {
    if (item && item._id && !item.id) {
      return {
        ...item,
        id: item._id
      };
    }
    return item;
  }
} 