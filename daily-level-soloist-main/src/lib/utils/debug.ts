import { useSoloLevelingStore } from '../store';
import { MongoDBService } from '../services/mongodb-service';
import { auth } from '../auth';

/**
 * Debug utility to check character data loading status
 * Can be called from browser console by importing from anywhere in the app
 */
export async function debugCharacterLoading() {
  try {
    console.group('Character Data Loading Debug');
    
    // Check MongoDB connection
    const dbService = MongoDBService.getInstance();
    const isInitialized = dbService.isInitialized();
    console.log(`MongoDB initialized: ${isInitialized}`);
    console.log(`Using localStorage fallback: ${dbService.isUsingLocalStorage()}`);
    
    // Check authentication status
    const currentAuthUser = auth.getCurrentUser();
    console.log('Current authenticated user:', currentAuthUser ? {
      uid: currentAuthUser.uid,
      email: currentAuthUser.email,
      username: currentAuthUser.username,
      lastLogin: currentAuthUser.lastLogin
    } : 'Not authenticated');
    
    // Check current character data in store
    const store = useSoloLevelingStore.getState();
    const { user } = store;
    
    if (user) {
      console.log('Current character in store:', {
        id: user.id,
        name: user.name,
        level: user.level,
        completedCharacterCreation: user.completedCharacterCreation,
        authUserId: user.authUserId,
        email: user.email
      });
    } else {
      console.log('No character data in store');
    }
    
    // If authenticated, check for linked character data
    if (currentAuthUser) {
      const linkedUser = await dbService.getUserByAuthId(currentAuthUser.uid);
      console.log('Character linked to auth user:', linkedUser ? {
        id: linkedUser.id,
        name: linkedUser.name,
        level: linkedUser.level
      } : 'No linked character found');
    }
    
    // Check local storage
    try {
      const localUser = localStorage.getItem('solo-leveling-user');
      console.log('User data in localStorage:', localUser ? 'Found' : 'Not found');
      if (localUser) {
        const parsedUser = JSON.parse(localUser);
        console.log('Local user preview:', {
          name: parsedUser[0]?.name || 'N/A',
          level: parsedUser[0]?.level || 'N/A'
        });
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
    
    console.groupEnd();
    
    return 'Debug info logged to console';
  } catch (error) {
    console.error('Error during character loading debug:', error);
    return 'Error during debug - check console';
  }
} 