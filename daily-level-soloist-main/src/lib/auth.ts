import { v4 as uuidv4 } from 'uuid';
import { getDB } from './db';
import { MongoDBService } from './services/mongodb-service';
import { useSoloLevelingStore } from './store';

export interface AuthUser {
  uid: string;
  email: string;
  username?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface AuthError {
  code: string;
  message: string;
}

type AuthStateChangeHandler = (user: AuthUser | null) => void;

class AuthService {
  private currentUser: AuthUser | null = null;
  private listeners: AuthStateChangeHandler[] = [];
  private dbService = MongoDBService.getInstance();

  constructor() {
    // Try to load auth state from localStorage
    this.loadFromStorage();
  }

  // Load auth state from storage
  private loadFromStorage(): void {
    try {
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        this.currentUser = {
          ...userData,
          createdAt: new Date(userData.createdAt),
          lastLogin: userData.lastLogin ? new Date(userData.lastLogin) : new Date()
        };
        
        console.log('Loaded authenticated user from storage:', this.currentUser.email);
      }
    } catch (error) {
      console.error('Failed to load auth state from storage:', error);
    }
  }

  // Save auth state to storage
  private saveToStorage(): void {
    try {
      if (this.currentUser) {
        // Update last login time
        this.currentUser.lastLogin = new Date();
        localStorage.setItem('auth_user', JSON.stringify(this.currentUser));
      } else {
        localStorage.removeItem('auth_user');
      }
    } catch (error) {
      console.error('Failed to save auth state to storage:', error);
    }
  }

  // Notify listeners of state change
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentUser));
  }

  // Email validation helper
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Password validation helper
  private isValidPassword(password: string): boolean {
    return password.length >= 6;
  }

  // Sign in with email and password
  public async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      // Validate email format
      if (!this.isValidEmail(email)) {
        throw { code: 'auth/invalid-email', message: 'Invalid email format' };
      }

      // Validate password format
      if (!this.isValidPassword(password)) {
        throw { code: 'auth/invalid-password', message: 'Password must be at least 6 characters' };
      }

      // Get users from storage
      const users = await this.getUsers();

      // Find user with matching email
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        throw { code: 'auth/user-not-found', message: 'No user found with this email' };
      }

      // In a real app, we would verify the password here
      // For this simplified version, we're skipping password verification

      // Update current user
      this.currentUser = user;
      this.saveToStorage();
      this.notifyListeners();

      // Link the authenticated user with character data in MongoDB
      await this.linkUserToCharacterData(user);

      return user;
    } catch (error) {
      throw error;
    }
  }

  // Sign up with email and password
  public async signUp(email: string, password: string, username?: string): Promise<AuthUser> {
    try {
      // Validate email format
      if (!this.isValidEmail(email)) {
        throw { code: 'auth/invalid-email', message: 'Invalid email format' };
      }

      // Check if email already exists
      const existingUsers = await this.getUsers();
      if (existingUsers.some(user => user.email === email)) {
        throw { code: 'auth/email-already-in-use', message: 'This email is already registered' };
      }

      // Create new user object
      const newUser: AuthUser = {
        uid: uuidv4(),
        email,
        username: username || email.split('@')[0],
        createdAt: new Date()
      };

      // Save to users collection
      await this.saveUser(newUser);

      // Update current user
      this.currentUser = newUser;
      this.saveToStorage();
      this.notifyListeners();

      // Link the newly created user with character data in MongoDB
      await this.linkUserToCharacterData(newUser);

      return newUser;
    } catch (error) {
      throw error;
    }
  }

  // Link authenticated user with character data in MongoDB
  private async linkUserToCharacterData(authUser: AuthUser): Promise<void> {
    try {
      // Load the store
      const store = useSoloLevelingStore.getState();
      
      if (!store.user || !store.user.id) {
        console.warn('No character data found to link with authenticated user');
        return;
      }
      
      // Update user data in MongoDB to include authentication info
      await store.updateUser({
        authUserId: authUser.uid,
        email: authUser.email,
        username: authUser.username || authUser.email.split('@')[0]
      });
      
      console.log('Successfully linked auth user to character data');

      // Check if we need to load this user's data
      // This is important for returning players who already have character data
      const linkedCharacter = await this.dbService.getUserByAuthId(authUser.uid);
      if (linkedCharacter && linkedCharacter.id !== store.user.id) {
        // This user has a different character data than the currently loaded one
        // Update the store with this user's character data
        store.setUser(linkedCharacter);
        console.log('Loaded existing character data for authenticated user:', linkedCharacter.name);
      }
    } catch (error) {
      console.error('Failed to link auth user with character data:', error);
    }
  }

  // Sign out current user
  public signOut(): void {
    this.currentUser = null;
    this.saveToStorage();
    this.notifyListeners();
  }

  // Get current user
  public getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  // Add auth state change listener
  public onAuthStateChanged(callback: AuthStateChangeHandler): () => void {
    this.listeners.push(callback);

    // Call with current state immediately
    callback(this.currentUser);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Helper method to get all users from IndexedDB
  private async getUsers(): Promise<AuthUser[]> {
    try {
      const db = await getDB();
      const userData = await db.get('store', 'auth_users');
      return userData ? JSON.parse(userData) : [];
    } catch (error) {
      console.error('Failed to get users from DB:', error);
      return [];
    }
  }

  // Helper method to save a user to IndexedDB
  private async saveUser(user: AuthUser): Promise<void> {
    try {
      const db = await getDB();
      const existingUsers = await this.getUsers();
      const updatedUsers = [...existingUsers, user];
      await db.put('store', JSON.stringify(updatedUsers), 'auth_users');
    } catch (error) {
      console.error('Failed to save user to DB:', error);
      throw { code: 'auth/operation-failed', message: 'Failed to create account' };
    }
  }
}

// Create and export auth service instance
export const auth = new AuthService();

// Create a hook to use auth in components
export function useAuth() {
  return auth;
} 