import { openDB } from 'idb';

export async function clearDatabase() {
  try {
    // Delete the main database
    await deleteDatabase('soloist-db');
    
    console.log('Successfully deleted soloist-db');
    return true;
  } catch (error) {
    console.error('Error deleting database:', error);
    return false;
  }
}

async function deleteDatabase(dbName: string) {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(dbName);
    
    request.onerror = () => {
      reject(new Error(`Error deleting database ${dbName}`));
    };
    
    request.onsuccess = () => {
      resolve();
    };
  });
} 