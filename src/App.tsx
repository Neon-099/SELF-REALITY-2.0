import React, { useState, useEffect } from 'react';
import LoadingScreen from './LoadingScreen';
import LoadingError from './LoadingError';
import { useSoloLevelingStore } from './store';
import { MongoDBService } from './lib/services/mongodb-service';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const store = useSoloLevelingStore();
  const dbService = MongoDBService.getInstance();
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);
        
        // Initialize MongoDB connection
        const initialized = await dbService.initialize();
        if (!initialized) {
          throw new Error('Failed to initialize MongoDB service');
        }

        // Load initial data
        await store.loadQuests();
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing app:', error);
        setLoadError(error instanceof Error ? error.message : 'Failed to initialize application');
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return <LoadingScreen message="Initializing application..." />;
  }

  if (loadError) {
    return <LoadingError 
      message={loadError}
      retry={() => window.location.reload()}
    />;
  }

  // Rest of your component code...
// ... existing code ...
};

export default App;