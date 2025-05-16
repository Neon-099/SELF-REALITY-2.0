import { v4 as uuidv4 } from 'uuid';
import { getDB } from './db';

export interface AuthUser {
  uid: string;
  email: string;
  username?: string;
  createdAt: Date;
}

export interface AuthError {
  code: string;
  message: string;
}

// Simulating Firebase-like auth for local demo
// In a real app, this would use Firebase, Auth0, or a backend service
class AuthService {
  private currentUser: AuthUser | null = null;
  private listeners: ((user: AuthUser | null) => void)[] = [];

  constructor() {
    // Initialize auth state from localStorage
    this.initFromStorage();
  }

  private initFromStorage() {
    try {
      const userJson = localStorage.getItem('auth_user');
      if (userJson) {
        const userData = JSON.parse(userJson);
        // Convert string dates back to Date objects
        userData.createdAt = new Date(userData.createdAt);
        this.currentUser = userData;
      }
    } catch (error) {
      console.error('Failed to load auth state from storage:', error);
    }
  }

  private saveToStorage() {
    try {
      if (this.currentUser) {
        localStorage.setItem('auth_user', JSON.stringify(this.currentUser));
      } else {
        localStorage.removeItem('auth_user');
      }
    } catch (error) {
      console.error('Failed to save auth state to storage:', error);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser));
  }

  // Get currently logged in user
  public getUser(): AuthUser | null {
    return this.currentUser;
  }

  // Add auth state change listener
  public onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    this.listeners.push(callback);
    
    // Call immediately with current state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
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

      return newUser;
    } catch (error) {
      throw error;
    }
  }

  // Sign in with email and password
  public async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      // Find user with matching email
      const existingUsers = await this.getUsers();
      const user = existingUsers.find(user => user.email === email);

      if (!user) {
        throw { code: 'auth/user-not-found', message: 'No user found with this email' };
      }

      // In a real app, we would check the password hash
      // For this demo, we're just simulating successful login

      // Update current user
      this.currentUser = user;
      this.saveToStorage();
      this.notifyListeners();

      return user;
    } catch (error) {
      throw error;
    }
  }

  // Sign out current user
  public async signOut(): Promise<void> {
    this.currentUser = null;
    this.saveToStorage();
    this.notifyListeners();
  }

  // Helper method to validate email format
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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

// Export a singleton instance
export const auth = new AuthService();

// Create a hook to use auth in components
export function useAuth() {
  return auth;
} 