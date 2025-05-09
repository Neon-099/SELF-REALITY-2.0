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
import { useEffect } from "react";
import { useSoloLevelingStore } from "./lib/store";

// Import UserSetup component dynamically if it exists
// Note: Remove this dynamic import approach once UserSetup component is properly created
const UserSetup = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-900">
    <div className="text-center p-8 bg-gray-800 rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-white mb-4">Welcome to Solo Leveling</h1>
      <p className="text-gray-300 mb-6">
        Let's set up your character to begin your journey
      </p>
      <button 
        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        onClick={() => {
          // Create a temporary user
          const store = useSoloLevelingStore.getState();
          if (store && typeof store.addExp === 'function') {
            // The store exists, let's create a user
            store.user = { 
              ...store.user, 
              name: "Hunter" 
            };
          }
          window.location.reload();
        }}
      >
        Start Journey
      </button>
    </div>
  </div>
);

const queryClient = new QueryClient();

// Component to check for curse status and missed deadlines
function CurseChecker() {
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
  const store = useSoloLevelingStore();
  
  // Safely handle potential undefined user with better type checking
  const user = store.user || { name: "" };
  
  // Check if user needs setup (either no user or no name)
  if (!user || !user.name) {
    return <UserSetup />;
  }
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <CurseChecker />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route element={<Layout />}>
              <Route path="/home" element={<Index />} />
              <Route path="/character" element={<Character />} />
              <Route path="/planner" element={<Planner />} />
              <Route path="/quests" element={<Quests />} />
              <Route path="/missions" element={<Missions />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/milestones" element={<Milestones />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
