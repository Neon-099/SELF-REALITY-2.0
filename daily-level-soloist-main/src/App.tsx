import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const store = useSoloLevelingStore();
  
  // Add effect to handle initial loading state
  useEffect(() => {
    const loadApp = async () => {
      try {
        // Simulate checking if store is ready by waiting briefly
        // This gives time for the persist middleware to hydrate
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Check if there was a fallback to localStorage (indicating IndexedDB failed)
        const fallbackExists = Object.keys(localStorage).some(key => key.startsWith('fallback_'));
        if (fallbackExists) {
          console.warn('Using localStorage fallback - IndexedDB may have failed');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing app:', error);
        setLoadError('Failed to load game data. Please check your browser settings or try again.');
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
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <CurseChecker />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route element={<Layout />}>
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
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
