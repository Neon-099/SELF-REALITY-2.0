import { StateCreator } from 'zustand';
import { MongoDBService } from '../../services/mongodb-service';

export interface UserStat {
  physical: number;
  cognitive: number;
  emotional: number;
  spiritual: number;
  social: number;
}

export interface User {
  id: string;
  name: string;
  level: number;
  exp: number;
  expToNextLevel: number;
  gold: number;
  rank: string;
  streakDays: number;
  longestStreak: number;
  stats: UserStat;
  createdAt: Date;
  lastLogin: Date;
}

export interface UserSlice {
  user: User;
  loadUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

// Default initial user state
const defaultUser: User = {
  id: '',
  name: 'Hunter',
  level: 1,
  exp: 0,
  expToNextLevel: 100,
  gold: 0,
  rank: 'F',
  streakDays: 0,
  longestStreak: 0,
  stats: {
    physical: 1,
    cognitive: 1,
    emotional: 1,
    spiritual: 1,
    social: 1
  },
  createdAt: new Date(),
  lastLogin: new Date()
};

export const createUserSlice = (
  dbService: MongoDBService
): StateCreator<UserSlice, [], [], UserSlice> => 
  (set) => ({
    user: defaultUser,
    
    loadUser: async () => {
      try {
        // First, try to get users from MongoDB
        const users = await dbService.getAllUsers();
        
        if (users && users.length > 0) {
          // Use the first user if available
          set({ user: users[0] });
          return;
        }
        
        // If no users exist, create a default user
        const newUser = await dbService.createUser(defaultUser);
        set({ user: newUser });
      } catch (error) {
        console.error('Failed to load user:', error);
        // Set default user as fallback
        set({ user: defaultUser });
      }
    },
    
    updateUser: async (updates) => {
      try {
        const { user } = set.getState();
        
        if (!user.id) {
          console.error('Cannot update user: No user ID');
          return;
        }
        
        const updatedUser = await dbService.updateUser(user.id, updates);
        set({ user: updatedUser });
      } catch (error) {
        console.error('Failed to update user:', error);
      }
    }
  }); 