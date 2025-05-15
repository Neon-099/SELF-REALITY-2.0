import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, CheckCircle, Lock, Trophy, Calendar, Activity, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSoloLevelingStore } from '@/lib/store';
import { getAvailableMissions } from '@/data/predefined-missions';
import { updateMission } from '@/lib/db';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Rank, Mission } from '@/lib/types';
import { PredefinedMission } from '@/data/predefined-missions';
import { motion } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';

interface RankMissionProgressProps {
  missions: PredefinedMission[];
  rankName: string;
  totalDays: number;
  rank: Rank;
  isLocked?: boolean;
}

export default function RankMissionProgress({ missions, rankName, totalDays, rank, isLocked = false }: RankMissionProgressProps) {
  const { toast } = useToast();
  const [currentDay, setCurrentDay] = useState(1);
  const completeMission = useSoloLevelingStore(state => state.completeMission);
  const startMission = useSoloLevelingStore(state => state.startMission);
  const updateMissionTasks = useSoloLevelingStore(state => state.updateMissionTasks);
  const completedMissionHistory = useSoloLevelingStore(state => state.completedMissionHistory);
  const [isLoading, setIsLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [currentMission, setCurrentMission] = useState<PredefinedMission | null>(null);
  const [completedTaskIndices, setCompletedTaskIndices] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Ensure missions is always an array
  const safeMissions = Array.isArray(missions) ? missions : [];
  
  // Filter missions for the current rank and day
  const dayMissions = safeMissions.filter(m => m.rank === rank && m.day === currentDay);
  
  const handlePrevDay = () => {
    if (currentDay > 1) {
      setCurrentDay(prev => Math.max(1, prev - 1));
    }
  };
  
  const handleNextDay = () => {
    if (currentDay < totalDays) {
      setCurrentDay(prev => Math.min(totalDays, prev + 1));
    }
  };
  
  const handleViewMission = (mission: PredefinedMission) => {
    if (!mission.id) {
      console.error("Mission ID is undefined!", mission);
      toast({
        title: "Error",
        description: "This mission cannot be viewed (missing ID).",
        variant: "destructive",
      });
      return;
    }
    
    // Check if mission is already completed
    if (completedMissionHistory.some(m => m.id === mission.id)) {
      toast({
        title: "Mission Already Completed",
        description: `You have already completed "${mission.title}"`,
        variant: "destructive",
      });
      return;
    }
    
    // Check if mission is already started
    if (mission.started) {
      openTaskTrackingDialog(mission);
      return;
    }
    
    // Open the preview dialog
    setCurrentMission(mission);
    setPreviewDialogOpen(true);
  };

  const handleStartMission = async () => {
    if (!currentMission || !currentMission.id) return;
    
    try {
      await startMission(currentMission.id);
      setPreviewDialogOpen(false);
      
      // Open task tracking dialog
      openTaskTrackingDialog(currentMission);
    } catch (error) {
      console.error("Error starting mission:", error);
      toast({
        title: "Error",
        description: "Failed to start mission",
        variant: "destructive",
      });
    }
  };
  
  const openTaskTrackingDialog = (mission: PredefinedMission) => {
    setCurrentMission(mission);
    // Initialize with any already completed tasks
    setCompletedTaskIndices(mission.completedTaskIndices || []);
    setTaskDialogOpen(true);
  };
  
  const handleTaskToggle = (index: number) => {
    setCompletedTaskIndices(prev => {
      const isCompleted = prev.includes(index);
      let updated: number[];
      
      if (isCompleted) {
        // Remove from completed tasks
        updated = prev.filter(i => i !== index);
      } else {
        // Add to completed tasks
        updated = [...prev, index];
      }
      
      // Sort the indices for better display
      updated.sort((a, b) => a - b);
      
      // Always save progress automatically
      if (currentMission) {
        saveTaskProgress(updated);
      }
      
      return updated;
    });
  };
  
  const saveTaskProgress = async (indices: number[] = completedTaskIndices) => {
    if (!currentMission) return;
    
    setIsSaving(true);
    
    try {
      await updateMissionTasks(currentMission.id, indices);
      
      // Remove automatic mission completion
      // Instead, we'll show a "Complete Mission" button when all tasks are completed
    } catch (error) {
      console.error("Error updating mission tasks:", error);
      toast({
        title: "Error",
        description: "Failed to save task progress",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCompleteMission = async () => {
    if (!currentMission) return;
    
    setIsSaving(true);
    
    try {
      await completeMission(currentMission.id);
      setTaskDialogOpen(false);
      
      toast({
        title: "Mission Completed!",
        description: `Great job completing "${currentMission.title}"!`,
      });
    } catch (error) {
      console.error("Error completing mission:", error);
      toast({
        title: "Error",
        description: "Failed to complete mission",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Get total completed missions for this rank
  const completedCount = missions.filter(m => completedMissionHistory.some(cm => cm.id === m.id)).length;
  const completionPercentage = Math.round((completedCount / missions.length) * 100);
  
  // Group missions by day
  const missionsByDay = missions.reduce((acc, mission) => {
    const dayKey = mission.day;
    if (!acc[dayKey]) {
      acc[dayKey] = [];
    }
    acc[dayKey].push(mission);
    return acc;
  }, {} as Record<number, PredefinedMission[]>);
  
  // Determine days to show
  const days = Object.keys(missionsByDay).map(Number).sort((a, b) => a - b);
  const visibleDays = showAll ? days : days.slice(0, Math.min(7, days.length));
  
  // Helper to get rank color classes
  const getRankColor = (rank: Rank) => {
    switch (rank) {
      case 'F': return 'from-gray-400 to-gray-600 border-gray-400';
      case 'E': return 'from-orange-400 to-orange-600 border-orange-400';
      case 'D': return 'from-blue-400 to-blue-600 border-blue-400';
      case 'C': return 'from-green-400 to-green-600 border-green-400';
      case 'B': return 'from-purple-400 to-purple-600 border-purple-400';
      case 'A': return 'from-red-400 to-red-600 border-red-400';
      case 'S': return 'from-yellow-400 to-yellow-600 border-yellow-400';
      case 'SS': return 'from-emerald-400 to-emerald-600 border-emerald-400';
      case 'SSS': return 'from-indigo-400 to-indigo-600 border-indigo-400';
      default: return 'from-gray-400 to-gray-600 border-gray-400';
    }
  };
  
  // Helper to get solid rank colors
  const getRankSolidColor = (rank: Rank) => {
    switch (rank) {
      case 'F': return 'bg-gray-500 text-white';
      case 'E': return 'bg-orange-500 text-white';
      case 'D': return 'bg-blue-500 text-white';
      case 'C': return 'bg-green-500 text-white';
      case 'B': return 'bg-purple-500 text-white';
      case 'A': return 'bg-red-500 text-white';
      case 'S': return 'bg-yellow-500 text-gray-900';
      case 'SS': return 'bg-emerald-500 text-white';
      case 'SSS': return 'bg-indigo-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // Helper to get badge rank colors
  const getRankBadgeColor = (rank: Rank) => {
    switch (rank) {
      case 'F': return 'border-gray-400 text-gray-500';
      case 'E': return 'border-orange-400 text-orange-500';
      case 'D': return 'border-blue-400 text-blue-500';
      case 'C': return 'border-green-400 text-green-500';
      case 'B': return 'border-purple-400 text-purple-500';
      case 'A': return 'border-red-400 text-red-500';
      case 'S': return 'border-yellow-400 text-yellow-500';
      case 'SS': return 'border-emerald-400 text-emerald-500';
      case 'SSS': return 'border-indigo-400 text-indigo-500';
      default: return 'border-gray-400 text-gray-500';
    }
  };

  // Helper to get rank glow colors
  const getRankGlowColor = (rank: Rank) => {
    switch (rank) {
      case 'F': return 'ring-gray-400/50';
      case 'E': return 'ring-orange-400/50';
      case 'D': return 'ring-blue-400/50';
      case 'C': return 'ring-green-400/50';
      case 'B': return 'ring-purple-400/50';
      case 'A': return 'ring-red-400/50';
      case 'S': return 'ring-yellow-400/50';
      case 'SS': return 'ring-emerald-400/50';
      case 'SSS': return 'ring-indigo-400/50';
      default: return 'ring-gray-400/50';
    }
  };
  
  // Helper to get progress colors
  const getProgressColor = (rank: Rank) => {
    switch (rank) {
      case 'F': return 'bg-gray-500';
      case 'E': return 'bg-orange-500';
      case 'D': return 'bg-blue-500';
      case 'C': return 'bg-green-500';
      case 'B': return 'bg-purple-500';
      case 'A': return 'bg-red-500';
      case 'S': return 'bg-yellow-500';
      case 'SS': return 'bg-emerald-500';
      case 'SSS': return 'bg-indigo-500';
      default: return 'bg-gray-500';
    }
  };
  
  // Helper to get rank text style classes
  const getRankTextStyle = (rank: Rank) => {
    switch (rank) {
      case 'F': return 'font-medium tracking-wide text-gray-300';
      case 'E': return 'font-medium tracking-wide text-orange-300';
      case 'D': return 'font-medium tracking-wide text-blue-300';
      case 'C': return 'font-medium tracking-wide text-green-300';
      case 'B': return 'font-medium tracking-wide text-purple-300';
      case 'A': return 'font-medium tracking-wide text-red-300';
      case 'S': return 'font-bold tracking-wide text-yellow-300';
      case 'SS': return 'font-bold tracking-wide text-emerald-300';
      case 'SSS': return 'font-extrabold tracking-wide text-indigo-300';
      default: return 'font-medium tracking-wide text-gray-300';
    }
  };

  // Helper to get rank text shadow
  const getRankTextShadow = (rank: Rank) => {
    switch (rank) {
      case 'F': return 'text-shadow-sm';
      case 'E': return 'text-shadow-sm';
      case 'D': return 'text-shadow-sm';
      case 'C': return 'text-shadow-sm';
      case 'B': return 'text-shadow-sm';
      case 'A': return 'text-shadow-sm';
      case 'S': return 'text-shadow-md';
      case 'SS': return 'text-shadow-md';
      case 'SSS': return 'text-shadow-lg';
      default: return 'text-shadow-sm';
    }
  };

  // Helper to get rank trophy colors
  const getRankTrophyColor = (rank: Rank) => {
    switch (rank) {
      case 'F': return 'text-gray-400 drop-shadow-sm';
      case 'E': return 'text-orange-400 drop-shadow-sm';
      case 'D': return 'text-blue-400 drop-shadow-sm';
      case 'C': return 'text-green-400 drop-shadow-sm';
      case 'B': return 'text-purple-400 drop-shadow-sm';
      case 'A': return 'text-red-400 drop-shadow-sm';
      case 'S': return 'text-yellow-400 drop-shadow-md';
      case 'SS': return 'text-emerald-400 drop-shadow-md';
      case 'SSS': return 'text-indigo-400 drop-shadow-lg';
      default: return 'text-gray-400 drop-shadow-sm';
    }
  };

  // Helper to get EXP text colors
  const getExpTextColor = (rank: Rank) => {
    switch (rank) {
      case 'F': return 'from-gray-200 to-gray-400';
      case 'E': return 'from-orange-200 to-orange-400';
      case 'D': return 'from-blue-200 to-blue-400';
      case 'C': return 'from-green-200 to-green-400';
      case 'B': return 'from-purple-200 to-purple-400';
      case 'A': return 'from-red-200 to-red-400';
      case 'S': return 'from-yellow-200 to-yellow-400';
      case 'SS': return 'from-emerald-200 to-emerald-400';
      case 'SSS': return 'from-indigo-200 to-indigo-400';
      default: return 'from-gray-200 to-gray-400';
    }
  };
  
  // Render mission cards safely
  const renderMissionCards = () => {
    if (isLoading) {
      return (
        <div className="col-span-full flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }
    
    if (!dayMissions || !Array.isArray(dayMissions) || dayMissions.length === 0) {
      return (
        <div className="col-span-full text-center py-16 my-8 bg-muted/10 rounded-2xl border border-border flex flex-col items-center justify-center gap-4">
          <div className="p-4 rounded-full bg-muted/20">
            <Calendar className="h-10 w-10 text-muted-foreground opacity-70" />
          </div>
          <div>
            <p className="text-xl font-semibold text-muted-foreground">No missions available for Day {currentDay}</p>
            <p className="text-sm text-muted-foreground/70 mt-2">Try another day or check back later</p>
          </div>
        </div>
      );
    }
    
    return dayMissions.map((mission, index) => {
      const isCompleted = mission.completed || completedMissionHistory.some(cm => cm.id === mission.id);
      const isStarted = mission.started && !isCompleted;
      // Try to find the completed mission in history to get actual EXP earned
      const completedMission = completedMissionHistory.find(cm => cm.id === mission.id);
      const isBoss = mission.difficulty === 'boss';
      
      // Get task completion progress
      const completedTaskCount = mission.completedTaskIndices?.length || 0;
      const totalTaskCount = mission.count || 1;
      const taskProgress = isStarted ? Math.round((completedTaskCount / totalTaskCount) * 100) : 0;
      
      // Check if all tasks are completed but mission is not marked as complete
      const allTasksCompleted = mission.count && completedTaskCount >= mission.count && !isCompleted;
      
      // Get the rank colors
      const rankGradient = getRankColor(mission.rank as Rank);
      const rankSolid = getRankSolidColor(mission.rank as Rank);
      const rankBadge = getRankBadgeColor(mission.rank as Rank);
      const rankGlow = getRankGlowColor(mission.rank as Rank);
      
      // Glassmorphism and border classes
      const glassClasses = 'backdrop-blur-lg bg-card dark:bg-background/80';
      
      // Special styling for boss missions
      const borderClasses = isBoss 
        ? isCompleted
          ? `border-2 border-amber-500/40`
          : `border-2 border-amber-500/60 ${isLocked ? 'border-opacity-30' : 'border-opacity-80'}`
        : `border-2 ${isLocked ? 'border-gray-300/40' : `border-${mission.rank.toLowerCase()}-400/60`}`;
      
      // Shadow and hover effects
      const shadowClasses = isCompleted
        ? isBoss 
          ? 'shadow-md shadow-amber-500/10' 
          : `shadow-md shadow-${mission.rank.toLowerCase()}-500/10`
        : isBoss 
          ? 'shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 shadow-amber-500/20'
          : 'shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300';
      
      // Glow effect for non-completed missions
      const glowClasses = !isCompleted && !isLocked 
        ? isBoss 
          ? 'ring-2 ring-offset-1 ring-amber-400/70' 
          : `ring-2 ring-offset-1 ${rankGlow}` 
        : '';
      
      // Background gradient based on rank
      const rankBg = isBoss 
        ? isCompleted 
          ? 'bg-gradient-to-br from-amber-500/5 to-amber-800/10' 
          : 'bg-gradient-to-br from-amber-500/10 to-amber-800/20' 
        : isCompleted
          ? `bg-gradient-to-br from-${mission.rank.toLowerCase()}-400/3 to-${mission.rank.toLowerCase()}-600/5` 
        : `bg-gradient-to-br from-${mission.rank.toLowerCase()}-400/5 to-${mission.rank.toLowerCase()}-600/10`;
      
      // Completion styles - updated for rank-specific styling
      const completedClasses = isCompleted 
        ? isBoss 
          ? 'opacity-85 dark:opacity-75 bg-amber-950/5' 
          : `opacity-85 dark:opacity-75 bg-${mission.rank.toLowerCase()}-950/5` 
        : '';
      
      return (
        <motion.div
          key={mission.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
        >
          <Card 
            className={`relative overflow-hidden rounded-xl ${borderClasses} ${glassClasses} ${shadowClasses} ${glowClasses} ${completedClasses} group`}
          >
            {/* X pattern overlay for completed missions */}
            {isCompleted && (
              <div className="absolute inset-0 z-10 pointer-events-none">
                <div className={`absolute inset-0 ${isBoss ? 'bg-amber-500/5' : `bg-${mission.rank.toLowerCase()}-500/5`}`}>
                  <div className="absolute inset-0 opacity-20 overflow-hidden">
                    {/* Diagonal lines in both directions */}
                    <div className={`absolute top-0 left-0 w-full h-full border-b-2 ${isBoss ? 'border-amber-600/40' : `border-${mission.rank.toLowerCase()}-600/40`} border-dashed transform -rotate-45 origin-top-left`}></div>
                    <div className={`absolute top-0 right-0 w-full h-full border-b-2 ${isBoss ? 'border-amber-600/40' : `border-${mission.rank.toLowerCase()}-600/40`} border-dashed transform rotate-45 origin-top-right`}></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Rank indicator strip */}
            <div className={`absolute top-0 left-0 w-2 h-full ${isBoss ? 'bg-amber-500/80' : rankSolid.split(' ')[0]} group-hover:w-3 transition-all duration-300`}></div>

            {/* Completed corner banner */}
            {isCompleted && !isBoss && (
              <div className="absolute top-0 right-0 z-20">
                <div className="w-20 h-20 overflow-hidden">
                  <div className={`absolute transform rotate-45 bg-gradient-to-r from-${mission.rank.toLowerCase()}-400 to-${mission.rank.toLowerCase()}-600 text-xs font-bold py-1 right-[-40px] top-[15px] w-[140px] text-center text-gray-900 shadow-md`}>
                    COMPLETED
                  </div>
                </div>
              </div>
            )}
            
            {/* Completed banner for boss missions */}
            {isCompleted && isBoss && (
              <div className="absolute top-0 left-0 z-20">
                <div className="w-20 h-20 overflow-hidden">
                  <div className="absolute transform -rotate-45 bg-gradient-to-r from-amber-400 to-amber-600 text-xs font-bold py-1 left-[-40px] top-[15px] w-[140px] text-center text-gray-900 shadow-md">
                    COMPLETED
                  </div>
                </div>
              </div>
            )}

            {/* Boss indicator - show only if not completed */}
            {isBoss && !isCompleted && (
              <div className="absolute top-0 right-0 z-10">
                <div className="w-16 h-16 overflow-hidden">
                  <div className="absolute transform rotate-45 bg-gradient-to-r from-amber-400 to-amber-600 text-xs font-bold py-1 right-[-35px] top-[12px] w-[120px] text-center text-gray-900 shadow-md group-hover:from-amber-500 group-hover:to-amber-700 transition-colors duration-300">
                    BOSS
                  </div>
                </div>
              </div>
            )}

            {/* Started indicator */}
            {isStarted && (
              <div className="absolute top-2 right-2">
                <Badge variant="outline" className="bg-blue-500/20 border-blue-400 text-blue-400">
                  In Progress
                </Badge>
              </div>
            )}

            <CardContent className="p-0">
              {/* Mission header with rank-colored background */}
              <div className={`p-5 border-b ${rankBg} relative overflow-hidden`}>
                {/* Subtle background pattern for boss missions - only shown when not completed */}
                {isBoss && !isCompleted && (
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-repeat bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMiIgZmlsbD0iI2ZmZmZmZiIgZmlsbC1vcGFjaXR5PSIwLjQiLz48L3N2Zz4=')] animate-pulse"></div>
                  </div>
                )}
              
                {/* Rank badge */}
                <div className="flex justify-between items-center mb-3 relative z-10">
                  <Badge 
                    className={`px-3 py-1.5 ${isBoss ? 'border-amber-400 text-amber-500 font-bold' : rankBadge} bg-transparent font-semibold backdrop-blur-sm border-2 dark:shadow-inner`}
                  >
                    {mission.rank} Rank {isBoss && '• BOSS'}
                  </Badge>
                </div>
                
                {/* Mission title with rank gradient */}
                <div className="flex items-center gap-2 mt-3 relative z-10">
                  <h3 
                    className={`font-extrabold text-2xl ${isBoss 
                      ? isCompleted 
                        ? 'bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent drop-shadow-sm' 
                        : 'bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent drop-shadow-glow animate-pulse-slow'
                      : `bg-gradient-to-r ${rankGradient} bg-clip-text text-transparent ${getRankTextShadow(mission.rank as Rank)}`} 
                      ${isCompleted ? 'opacity-70 text-decoration-line line-through decoration-2 decoration-dotted ' 
                      + (isBoss ? 'decoration-amber-400/60' : `decoration-${mission.rank.toLowerCase()}-400/60`) : ''}
                      tracking-tight leading-tight group-hover:tracking-normal transition-all duration-300`}
                  >
                    {mission.title}
                  </h3>
                  {isCompleted && (
                    <div className="relative">
                      {/* Remove CheckCircle icon */}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Mission description */}
              <div className={`p-5 relative ${rankBg} border-t border-white/10`}>
                {/* Subtle background pattern for boss missions - only shown when not completed */}
                {isBoss && !isCompleted && (
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0 bg-repeat bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMiIgZmlsbD0iI2ZmZmZmZiIgZmlsbC1vcGFjaXR5PSIwLjQiLz48L3N2Zz4=')] animate-pulse"></div>
                  </div>
                )}
                
                {!isStarted && (
                  <p className={`${isCompleted 
                    ? isBoss 
                      ? 'text-amber-400/70' 
                      : `text-${mission.rank.toLowerCase()}-400/70` 
                    : `${getRankTextStyle(mission.rank as Rank)}`} relative z-10 leading-relaxed`}>
                  {mission.description}
                </p>
                )}

                {/* Task Progress for started missions */}
                {isStarted && mission.count && mission.count > 1 && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span>Progress: {completedTaskCount}/{totalTaskCount} tasks</span>
                      <span>{taskProgress}%</span>
                    </div>
                    <Progress 
                      value={taskProgress} 
                      className="h-2 w-full bg-secondary/20"
                      indicatorClassName={mission.difficulty === 'boss' 
                        ? 'bg-amber-500' 
                        : `bg-${mission.rank.toLowerCase()}-500`
                      }
                    />
                    <p className="text-xs text-blue-400 mt-2 flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      <span>Mission in progress</span>
                    </p>
                  </div>
                )}
              </div>
              
              {/* Mission action button */}
              {!isCompleted && !isLocked && !isStarted && (
                <Button
                  className={`w-full rounded-none h-16 text-lg font-medium ${isBoss 
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-900' 
                    : `${rankSolid} hover:brightness-110`}`}
                  onClick={() => handleViewMission(mission)}
                >
                  {isBoss ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-bounce">⚔️</div> 
                      <span>View Boss Battle</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Play className="h-5 w-5" /> 
                      <span>View Mission</span>
                    </div>
                  )}
                </Button>
              )}
              
              {/* Continue Mission button */}
              {isStarted && !allTasksCompleted && (
                <Button
                  className={`w-full rounded-none h-16 text-lg font-medium ${isBoss 
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-900' 
                    : `bg-gradient-to-r from-${mission.rank.toLowerCase()}-500 to-${mission.rank.toLowerCase()}-600 hover:from-${mission.rank.toLowerCase()}-600 hover:to-${mission.rank.toLowerCase()}-700 text-white`}`}
                  onClick={() => handleViewMission(mission)}
                >
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5" /> 
                    <span>Continue Mission</span>
                  </div>
                </Button>
              )}
              
              {/* Complete Mission button - shown when all tasks are checked but mission isn't completed */}
              {isStarted && allTasksCompleted && (
                <Button
                  className={`w-full rounded-none h-16 text-lg font-medium bg-green-600 hover:bg-green-700 text-white`}
                  onClick={() => handleViewMission(mission)}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" /> 
                    <span>Complete Mission</span>
                  </div>
                </Button>
              )}
              
              {/* Locked mission button */}
              {!isCompleted && isLocked && (
                <div className="w-full rounded-none h-16 flex items-center justify-center gap-2 text-lg font-medium bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300">
                  <Lock className="h-5 w-5" /> 
                  <span>Locked</span>
                </div>
              )}
              
              {/* Completed mission indicator */}
              {isCompleted && (
                <div className={`w-full rounded-none h-16 flex items-center justify-center gap-2 text-lg font-medium ${isBoss 
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-gray-100' 
                  : `bg-gradient-to-r from-${mission.rank.toLowerCase()}-600 to-${mission.rank.toLowerCase()}-700 text-white`}`}>
                  <span>Completed</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      );
    });
  };
  
  // Day Navigation Styles
  const dayNavButtonClass = `rounded-full w-16 h-16 flex items-center justify-center transition-all duration-300 border-2 ${isLocked ? 'hover:bg-gray-200 dark:hover:bg-gray-700' : 'hover:bg-accent hover:scale-110'} backdrop-blur-sm`;
  const dayTitleClass = `text-4xl font-bold ${isLocked ? 'text-gray-400' : 'bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent'} tracking-tight`;
  
  // Add the following CSS styles above the return statement to customize the Progress indicator color
  const getProgressIndicatorStyle = (rank: Rank, difficulty: 'normal' | 'boss' = 'normal') => {
    if (difficulty === 'boss') {
      return 'bg-amber-500';
    }
    
    switch(rank) {
      case 'F': return 'bg-gray-500';
      case 'E': return 'bg-orange-500';
      case 'D': return 'bg-blue-500';
      case 'C': return 'bg-green-500';
      case 'B': return 'bg-purple-500';
      case 'A': return 'bg-red-500';
      case 'S': return 'bg-yellow-500';
      case 'SS': return 'bg-emerald-500';
      case 'SSS': return 'bg-indigo-500';
      default: return 'bg-gray-500';
    }
  };
  
  // Add custom CSS for the Progress indicator
  const progressStyle = currentMission ? {
    '--progress-indicator-color': `var(--${currentMission.difficulty === 'boss' ? 'amber' : currentMission.rank.toLowerCase()}-500)`
  } as React.CSSProperties : {};
  
  return (
    <div className="space-y-10">
      {/* Progress bar */}
      <div className="w-full bg-muted/30 h-3 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getProgressColor(rank)} transition-all duration-500 ease-out`} 
          style={{ width: `${completionPercentage}%` }}
        />
      </div>
      
      {/* Day Navigation */}
      <div className="flex items-center justify-between py-4 px-2">
        <Button 
          variant="outline" 
          size="icon"
          onClick={handlePrevDay}
          disabled={currentDay <= 1}
          className={`${dayNavButtonClass} flex`}
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
        
        <div className="text-center">
          <div className={dayTitleClass}>Day {currentDay}</div>
          <div className="text-sm text-muted-foreground mt-2 flex items-center justify-center gap-1">
            {isLoading 
              ? 'Loading missions...' 
              : (
                <>
                  <Calendar className="h-4 w-4 mr-1" />
                  {`${dayMissions.length} mission${dayMissions.length !== 1 ? 's' : ''} available`}
                </>
              )
            }
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="icon"
          onClick={handleNextDay}
          disabled={currentDay >= totalDays}
          className={`${dayNavButtonClass} flex`}
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      </div>
      
      {/* Mission cards displayed in a grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {renderMissionCards()}
      </div>

      {/* Task completion dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent variant="compact">
          <DialogHeader>
            <DialogTitle className={`text-xl font-bold ${
              currentMission?.difficulty === 'boss'
                ? 'bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent drop-shadow-glow'
                : `bg-gradient-to-r ${currentMission ? getRankColor(currentMission.rank as Rank) : ''} bg-clip-text text-transparent drop-shadow-sm`
            }`}>
              {currentMission ? currentMission.title : 'Mission Tasks'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            {currentMission && (
              <>
                <div className="text-center">
                  <div className={`font-semibold mb-2 ${
                    currentMission.difficulty === 'boss'
                      ? 'text-amber-400'
                      : `text-${currentMission.rank.toLowerCase()}-400`
                  }`}>Task Progress</div>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Activity className={`h-5 w-5 ${
                      currentMission.difficulty === 'boss'
                        ? 'text-amber-500'
                        : `text-${currentMission.rank.toLowerCase()}-500`
                    }`} />
                    <span className={`text-xl font-bold ${
                      currentMission.difficulty === 'boss'
                        ? 'text-amber-400'
                        : `text-${currentMission.rank.toLowerCase()}-400`
                    }`}>
                      {completedTaskIndices.length} / {currentMission.count || 1}
                    </span>
                  </div>
                  <Progress 
                    value={(completedTaskIndices.length / (currentMission.count || 1)) * 100} 
                    className="h-2 w-full bg-secondary/20" 
                    indicatorClassName={currentMission.difficulty === 'boss' 
                      ? 'bg-amber-500' 
                      : `bg-${currentMission.rank.toLowerCase()}-500`
                    }
                  />
                </div>
                
                {/* Saving indicator */}
                {isSaving && (
                  <div className="flex items-center justify-center gap-2 text-sm text-blue-400 animate-pulse">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                    <span>Saving progress...</span>
                  </div>
                )}
                
                {/* Task list with checkboxes */}
                {currentMission.taskNames && currentMission.taskNames.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <h4 className={`font-semibold text-sm ${
                      currentMission.difficulty === 'boss'
                        ? 'text-amber-500'
                        : `text-${currentMission.rank.toLowerCase()}-500`
                    }`}>
                      <span className="flex items-center gap-1.5">
                        <Activity className="h-4 w-4" />
                        This mission contains {currentMission.count} tasks:
                      </span>
                    </h4>
                    <div className={`max-h-48 overflow-y-auto border rounded-md p-3 space-y-3 ${
                      currentMission.difficulty === 'boss'
                        ? 'border-amber-500/20 bg-amber-500/5'
                        : `border-${currentMission.rank.toLowerCase()}-400/20 bg-gradient-to-br from-${currentMission.rank.toLowerCase()}-400/5 to-${currentMission.rank.toLowerCase()}-600/10 backdrop-blur-sm`
                    }`}>
                      {currentMission.taskNames.map((task, idx) => (
                        <div 
                          key={idx} 
                          className={`flex items-center gap-3 p-2 rounded transition-all duration-300 ${
                            currentMission.difficulty === 'boss'
                              ? completedTaskIndices.includes(idx)
                                ? `bg-amber-100/10 border border-amber-500/30 shadow-[0_0_8px_rgba(251,191,36,0.2)]`
                                : `border-amber-400 hover:border-amber-300`
                              : completedTaskIndices.includes(idx)
                                ? `bg-${currentMission.rank.toLowerCase()}-100/10 border border-${currentMission.rank.toLowerCase()}-500/30 shadow-sm`
                                : `border-${currentMission.rank.toLowerCase()}-400 hover:border-${currentMission.rank.toLowerCase()}-300`
                          }`}
                          onClick={() => handleTaskToggle(idx)}
                        >
                          <Checkbox 
                            id={`task-${idx}`}
                            checked={completedTaskIndices.includes(idx)}
                            onCheckedChange={() => handleTaskToggle(idx)}
                            rounded={true}
                            className={`h-5 w-5 transition-transform duration-200 data-[state=checked]:scale-110 ${
                              currentMission.difficulty === 'boss'
                                ? completedTaskIndices.includes(idx)
                                  ? 'data-[state=checked]:bg-amber-500 data-[state=checked]:text-amber-50 border-amber-400'
                                  : 'border-amber-400 hover:border-amber-300'
                                : completedTaskIndices.includes(idx)
                                  ? `data-[state=checked]:bg-${currentMission.rank.toLowerCase()}-500 data-[state=checked]:text-${currentMission.rank.toLowerCase()}-50 border-${currentMission.rank.toLowerCase()}-400`
                                  : `border-${currentMission.rank.toLowerCase()}-400 hover:border-${currentMission.rank.toLowerCase()}-300`
                            }`}
                          />
                          <label 
                            htmlFor={`task-${idx}`}
                            className={`flex-1 cursor-pointer transition-all duration-300 ${
                              completedTaskIndices.includes(idx) 
                                ? 'line-through text-muted-foreground opacity-70' 
                                : ''
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-xs ${
                                currentMission.difficulty === 'boss'
                                  ? 'bg-amber-500/20 text-amber-500'
                                  : `bg-${currentMission.rank.toLowerCase()}-500/20 text-${currentMission.rank.toLowerCase()}-500`
                              } font-bold`}>
                                {idx + 1}
                              </span>
                              <span className={`${
                                !completedTaskIndices.includes(idx) && (
                                  currentMission.difficulty === 'boss'
                                    ? 'text-amber-200'
                                    : getRankTextStyle(currentMission.rank as Rank)
                                )
                              }`}>{task}</span>
                            </div>
                          </label>
                          {completedTaskIndices.includes(idx) && (
                            <span className={`scale-in-center ${
                              currentMission.difficulty === 'boss' 
                                ? 'text-amber-500' 
                                : `text-${currentMission.rank.toLowerCase()}-500`
                            }`}>
                              <CheckCircle className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          <DialogFooter className="flex items-center justify-between pt-2">
            {/* Show Complete Mission button when all tasks are completed but mission isn't marked as complete */}
            {currentMission && currentMission.count && 
             completedTaskIndices.length >= currentMission.count && 
             !completedMissionHistory.some(m => m.id === currentMission.id) ? (
              <Button
                onClick={handleCompleteMission}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                disabled={isSaving}
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Completing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Complete Mission</span>
                  </div>
                )}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setTaskDialogOpen(false)}
                className="w-full"
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mission Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent variant="compact">
          <DialogHeader>
            <DialogTitle className={`text-xl font-bold ${
              currentMission?.difficulty === 'boss'
                ? 'bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent drop-shadow-glow'
                : `bg-gradient-to-r ${currentMission ? getRankColor(currentMission.rank as Rank) : ''} bg-clip-text text-transparent drop-shadow-sm`
            }`}>
              {currentMission ? currentMission.title : 'Mission Details'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            {currentMission && (
              <>
                {/* Mission description with styled background */}
                <div className={`p-4 rounded-md ${
                  currentMission.difficulty === 'boss'
                    ? 'bg-gradient-to-br from-amber-500/10 to-amber-800/10 border-amber-500/40'
                    : `bg-gradient-to-br from-${currentMission.rank.toLowerCase()}-400/10 to-${currentMission.rank.toLowerCase()}-600/10 border-${currentMission.rank.toLowerCase()}-400/40`
                } border`}>
                  <p className={`${
                    currentMission.difficulty === 'boss'
                      ? 'text-amber-200 font-medium tracking-wide'
                      : getRankTextStyle(currentMission.rank as Rank)
                  } leading-relaxed text-xs`}>
                    {currentMission.description}
                  </p>
                </div>
                
                {/* Rank-specific badge */}
                <div className={`p-3 rounded-md flex items-center gap-3 text-xs border ${
                  currentMission.difficulty === 'boss'
                    ? 'bg-amber-800/40 border-amber-600/30 text-amber-300'
                    : `bg-${currentMission.rank.toLowerCase()}-800/40 border-${currentMission.rank.toLowerCase()}-600/30 text-${currentMission.rank.toLowerCase()}-300`
                }`}>
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center ${
                    currentMission.difficulty === 'boss'
                      ? 'bg-amber-700'
                      : `bg-${currentMission.rank.toLowerCase()}-700`
                  }`}>
                    <Star className="h-3.5 w-3.5 text-yellow-400" />
                  </div>
                  <span className="font-medium tracking-wide">
                    <span className={`font-bold ${
                      currentMission.difficulty === 'boss'
                        ? 'text-amber-400 underline decoration-amber-500/30 underline-offset-2'
                        : `text-${currentMission.rank.toLowerCase()}-400 underline decoration-${currentMission.rank.toLowerCase()}-500/30 underline-offset-2`
                    }`}>{currentMission.rank} Rank{currentMission.difficulty === 'boss' ? ' Boss' : ''}:</span> {
                      currentMission.rank === 'F' 
                        ? 'These F-rank missions are perfect for beginners. Complete them to gain experience and rank up!' 
                        : currentMission.difficulty === 'boss'
                          ? 'Boss missions offer greater challenges with higher rewards!'
                          : `${currentMission.rank}-rank missions provide challenging tasks with substantial rewards.`
                    }
                  </span>
                </div>
                
                {/* Mission tasks preview */}
                {currentMission.count && currentMission.count > 1 && (
                  <div className="space-y-2">
                    <h4 className={`font-semibold text-sm ${
                      currentMission.difficulty === 'boss'
                        ? 'text-amber-500'
                        : `text-${currentMission.rank.toLowerCase()}-500`
                    }`}>
                      <span className="flex items-center gap-1.5">
                        <Activity className="h-4 w-4" />
                        This mission contains {currentMission.count} tasks:
                      </span>
                    </h4>
                    <div className={`max-h-48 overflow-y-auto border rounded-md p-3 space-y-2 ${
                      currentMission.difficulty === 'boss'
                        ? 'border-amber-500/20 bg-amber-500/5'
                        : `border-${currentMission.rank.toLowerCase()}-400/20 bg-gradient-to-br from-${currentMission.rank.toLowerCase()}-400/5 to-${currentMission.rank.toLowerCase()}-600/10 backdrop-blur-sm`
                    }`}>
                      {currentMission.taskNames && currentMission.taskNames.map((task, idx) => (
                        <div 
                          key={idx} 
                          className={`flex items-center gap-3 p-2 text-sm border-b ${
                            currentMission.difficulty === 'boss'
                              ? 'border-amber-500/20 last:border-0'
                              : `border-${currentMission.rank.toLowerCase()}-400/20 last:border-0 hover:bg-${currentMission.rank.toLowerCase()}-500/10`
                          } transition-colors duration-200 rounded group`}
                        >
                          <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs ${
                            currentMission.difficulty === 'boss'
                              ? 'bg-amber-500/20 text-amber-500 group-hover:ring-1 group-hover:ring-amber-500/5 transition-all duration-300'
                              : `bg-gradient-to-br from-${currentMission.rank.toLowerCase()}-500/20 to-${currentMission.rank.toLowerCase()}-700/20 text-${currentMission.rank.toLowerCase()}-300 shadow-inner group-hover:ring-1 group-hover:ring-${currentMission.rank.toLowerCase()}-500/50 transition-all duration-300`
                          } font-bold`}>
                            {idx + 1}
                          </span>
                          <span className={`${
                            currentMission.difficulty === 'boss'
                              ? 'text-amber-200 group-hover:text-amber-100'
                              : getRankTextStyle(currentMission.rank as Rank)
                          } group-hover:tracking-wider transition-all duration-300`}>{task}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Mission instructions */}
                <div className={`p-4 rounded-md text-sm border ${
                  currentMission.difficulty === 'boss'
                    ? 'bg-gradient-to-br from-amber-500/5 to-amber-800/5 border-amber-500/20'
                    : `bg-gradient-to-br from-${currentMission.rank.toLowerCase()}-400/5 to-${currentMission.rank.toLowerCase()}-600/5 border-${currentMission.rank.toLowerCase()}-400/20 backdrop-blur-sm`
                }`}>
                  <h4 className={`font-semibold mb-2 ${
                    currentMission.difficulty === 'boss'
                      ? 'text-amber-400'
                      : `text-${currentMission.rank.toLowerCase()}-400`
                  }`}>Instructions:</h4>
                  <p className={`${
                    currentMission.difficulty === 'boss'
                      ? 'text-amber-200/80'
                      : `text-${currentMission.rank.toLowerCase()}-300/80`
                  } font-medium tracking-wide text-xs`}>
                    {currentMission.count && currentMission.count > 1 
                      ? `Complete all ${currentMission.count} tasks to finish this mission and earn ${currentMission.expReward} EXP.` 
                      : `Complete this mission to earn the reward`
                    }
                  </p>
                  <div className={`mt-4 rounded-md p-3 ${
                    currentMission.difficulty === 'boss'
                      ? 'bg-gradient-to-br from-amber-900/30 to-amber-800/20 border border-amber-500/30'
                      : `bg-gradient-to-br from-${currentMission.rank.toLowerCase()}-900/30 to-${currentMission.rank.toLowerCase()}-800/20 border border-${currentMission.rank.toLowerCase()}-500/30`
                  } flex items-center gap-3 text-xs`}>
                    <div className="relative">
                      <Trophy className={`h-7 w-7 ${
                        currentMission.difficulty === 'boss'
                          ? 'text-amber-400 drop-shadow-md'
                          : getRankTrophyColor(currentMission.rank as Rank)
                      }`} />
                      <div className={`absolute -inset-0.5 opacity-30 animate-pulse rounded-full ${
                        currentMission.difficulty === 'boss'
                          ? 'bg-amber-500/20'
                          : `bg-${currentMission.rank.toLowerCase()}-500/20`
                      }`}></div>
                    </div>
                    <div className="flex-1">
                      <span className="text-gray-400 block mb-0.5">Mission Reward:</span>
                      <span className={`font-extrabold text-lg bg-gradient-to-r ${
                        currentMission.difficulty === 'boss'
                          ? 'from-amber-200 to-amber-400'
                          : getExpTextColor(currentMission.rank as Rank)
                      } bg-clip-text text-transparent tracking-widest`}>
                        +{currentMission.expReward} EXP
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <DialogFooter className="flex items-center justify-between gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setPreviewDialogOpen(false)}
              className="flex-1"
            >
              Close
            </Button>
            <Button
              onClick={handleStartMission}
              className={`flex-1 gap-2 font-semibold ${
                currentMission?.difficulty === 'boss'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-900'
                  : `bg-gradient-to-r from-${currentMission?.rank.toLowerCase()}-500 to-${currentMission?.rank.toLowerCase()}-600 hover:from-${currentMission?.rank.toLowerCase()}-600 hover:to-${currentMission?.rank.toLowerCase()}-700 text-white`
              }`}
            >
              <Play className="h-4 w-4" />
              Start Mission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}