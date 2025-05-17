import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import Index from "./pages/Index";
import Character from "./pages/Character";
import NotFound from "./pages/NotFound";
import Quests from "./pages/Quests";
import Shop from "./pages/Shop";
import Milestones from "./pages/Milestones";
import Missions from "./pages/Missions";
import Planner from "./pages/Planner";
import LandingPage from "./pages/LandingPage";
import { useEffect, useState } from "react";
import { useSoloLevelingStore } from "./lib/store";
import ErrorBoundary from "./components/ErrorBoundary";
import { LoadingScreen, LoadingError } from "./components/ui/loading-screen";
import { AuthProvider } from "@/hooks/use-auth-context";
import { MongoDBService } from './lib/services/mongodb-service';
import { getDB } from './lib/db';
import { toast } from "@/components/ui/use-toast";
import { auth } from './lib/auth';
import CharacterCreationDialog from "@/components/CharacterCreationDialog";

// Import UserSetup component dynamically if it exists
// Note: Remove this dynamic import approach once UserSetup component is properly created
const UserSetup = () => {
  // State for user name
  const [userName, setUserName] = useState("Hunter");
  const [isCreating, setIsCreating] = useState(false);

  // Function to handle setup completion with proper React patterns
  const handleStartJourney = () => {
    setIsCreating(true);
    
    try {
      // Use the store in a safer way
      const store = useSoloLevelingStore.getState();
      
      // Update the user properly
      store.user = { 
        ...store.user, 
        name: userName 
      };
      
      // Set localStorage flag to indicate setup completed
      localStorage.setItem('setup-completed', 'true');
      
      // Update UI state instead of hard reload
      setIsCreating(false);
      
      // Force a rerender of the App component
      useSoloLevelingStore.setState({});
    } catch (error) {
      console.error("Error setting up user:", error);
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center p-8 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-white mb-4">Welcome to Solo Leveling</h1>
        <p className="text-gray-300 mb-6">
          Let's set up your character to begin your journey
        </p>
        <div className="mb-4">
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4 w-full"
            placeholder="Enter your hunter name"
          />
        </div>
        <button 
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          onClick={handleStartJourney}
          disabled={isCreating || !userName.trim()}
        >
          {isCreating ? "Creating..." : "Start Journey"}
        </button>
      </div>
    </div>
  );
};

const queryClient = new QueryClient();

// Component to check for curse status and missed deadlines
function CurseChecker(): React.ReactNode {
  const checkCurseStatus = useSoloLevelingStore(state => state.checkCurseStatus);
  
  useEffect(() => {
    // Check curse status on initial load
    checkCurseStatus();
    
    // Set up interval to check curse status every 5 minutes
    const interval = setInterval(() => {
      checkCurseStatus();
    }, 5 * 60 * 1000); // every 5 minutes
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [checkCurseStatus]);
  
  return null;
}

// Character creation guard component - checks if character creation is completed
const CharacterCreationGuard = () => {
  const user = useSoloLevelingStore(state => state.user);
  const [showCharacterCreation, setShowCharacterCreation] = useState(false);
  
  useEffect(() => {
    // Check if character creation is needed for any page except landing
    if (user && !user.completedCharacterCreation) {
      setShowCharacterCreation(true);
    }
  }, [user]);
  
  if (showCharacterCreation) {
    return (
      <CharacterCreationDialog
        open={true}
        onOpenChange={() => {}}
        onComplete={() => {
          setShowCharacterCreation(false);
          window.location.href = '/home';
        }}
      />
    );
  }
  
  // If character creation is completed or not needed, render the layout which has its own Outlet
  return <Layout />;
};

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const store = useSoloLevelingStore();
  const dbService = MongoDBService.getInstance();
  
  // Add effect to handle initial loading state and migration
  useEffect(() => {
    const loadApp = async () => {
      try {
        console.log('Initializing app and loading user data...');
        
        // Initialize MongoDB connection
        await dbService.initialize();

        // Get current authenticated user if any
        const currentAuthUser = auth.getCurrentUser();

        // Check if we need to migrate data from IndexedDB
        const db = await getDB();
        const storeData = await db.get('store', 'soloist-store');
        
        if (storeData) {
          // Parse the data
          const data = JSON.parse(storeData);
          
          // Migrate data to MongoDB
          const success = await dbService.migrateFromLocalStorage(data.state);
          
          if (success) {
            // Clear IndexedDB after successful migration
            await db.delete('store', 'soloist-store');
            localStorage.clear(); // Clear localStorage as well
            
            toast({
              title: "Migration Complete",
              description: "Your data has been successfully migrated to MongoDB.",
            });
          }
        }

        // Load all necessary data in parallel
        await Promise.all([
          store.loadQuests(),
          store.loadUser(), // This should load the user data from MongoDB
          store.loadMissions(),
        ]);

        // If there's an authenticated user, try to load their specific character data
        if (currentAuthUser) {
          console.log('Authenticated user found, loading character data for:', currentAuthUser.uid);
          
          // Try to find character data linked to this auth user
          const linkedUser = await dbService.getUserByAuthId(currentAuthUser.uid);
          
          if (linkedUser) {
            console.log('Found character data for authenticated user');
            // Set the user data in the store - this will override the default user
            store.setUser(linkedUser);
          } else {
            console.log('No character data found for authenticated user');
          }
        }

        // Update the last login date
        if (store.user && store.user.id) {
          await store.updateUser({
            lastLogin: new Date()
          });
          
          // Update streak if appropriate
          store.updateStreak();
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing app:', error);
        setLoadError('Failed to load game data. Please check your database connection or try again.');
        setIsLoading(false);
      }
    };
    
    loadApp();
  }, []);
  
  // Handle loading states
  if (isLoading) {
    return <LoadingScreen message="Loading your adventure..." />;
  }
  
  if (loadError) {
    return <LoadingError 
      message={loadError} 
      retry={() => window.location.reload()} 
    />;
  }
  
  // Safely handle potential undefined user with better type checking
  const user = store.user || { name: "" };
  
  // Check if user needs setup (either no user or no name)
  if (!user || !user.name) {
    return (
      <ErrorBoundary>
        <UserSetup />
      </ErrorBoundary>
    );
  }
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <CurseChecker />
              <Routes>
                {/* Landing page is always accessible */}
                <Route path="/" element={<LandingPage />} />
                
                {/* Protected routes with character creation guard */}
                <Route element={<CharacterCreationGuard />}>
                  <Route path="/home" element={
                    <ErrorBoundary>
                      <Index />
                    </ErrorBoundary>
                  } />
                  <Route path="/character" element={
                    <ErrorBoundary>
                      <Character />
                    </ErrorBoundary>
                  } />
                  <Route path="/planner" element={
                    <ErrorBoundary>
                      <Planner />
                    </ErrorBoundary>
                  } />
                  <Route path="/quests" element={
                    <ErrorBoundary>
                      <Quests />
                    </ErrorBoundary>
                  } />
                  <Route path="/missions" element={
                    <ErrorBoundary>
                      <Missions />
                    </ErrorBoundary>
                  } />
                  <Route path="/shop" element={
                    <ErrorBoundary>
                      <Shop />
                    </ErrorBoundary>
                  } />
                  <Route path="/milestones" element={
                    <ErrorBoundary>
                      <Milestones />
                    </ErrorBoundary>
                  } />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
