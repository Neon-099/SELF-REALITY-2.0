import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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

export default App;
