import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, CheckCircle, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSoloLevelingStore } from '@/lib/store';
import { getAvailableMissions } from '@/data/predefined-missions';
import { updateMission } from '@/lib/db';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Rank } from '@/lib/types';
import { PredefinedMission } from '@/data/predefined-missions';
import { CompletedMission } from '@/lib/store/slices/mission-slice';

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
  const completedMissionIds = useSoloLevelingStore(state => state.completedMissionIds);
  const [isLoading, setIsLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  
  // Access store state
  const { completedMissionHistory } = useSoloLevelingStore();
  
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
  
  const handleCompleteMission = async (mission: PredefinedMission) => {
    if (!mission.id) {
      console.error("Mission ID is undefined!", mission);
      toast({
        title: "Error",
        description: "This mission cannot be completed (missing ID).",
        variant: "destructive",
      });
      return;
    }
    if (completedMissionIds.includes(mission.id)) {
      toast({
        title: "Mission Already Completed",
        description: `You have already claimed the reward for "${mission.title}"`,
        variant: "destructive",
      });
      return;
    }
    // Complete the mission in the store and persist in IndexedDB
    try {
      await completeMission(mission.id);
      toast({
        title: "Mission Completed!",
        description: `You've completed: ${mission.title}`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error completing mission:", error);
      toast({
        title: "Error",
        description: "Failed to complete mission",
        variant: "destructive",
      });
    }
  };
  
  // Get total completed missions for this rank
  const completedCount = missions.filter(m => completedMissionIds.includes(m.id)).length;
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
        <div className="col-span-full text-center py-12 bg-muted/20 rounded-lg border border-border">
          <p className="text-muted-foreground">No missions available for Day {currentDay}</p>
          <p className="text-sm text-muted-foreground mt-2">Try another day or check back later</p>
        </div>
      );
    }
    
    return dayMissions.map(mission => {
      const isCompleted = mission.completed || completedMissionIds.includes(mission.id);
      // Try to find the completed mission in history to get actual EXP earned
      const completedMission = completedMissionHistory.find(cm => cm.id === mission.id);
      const isBoss = mission.difficulty === 'boss';
      
      // Get the rank colors
      const rankGradient = getRankColor(mission.rank as Rank);
      const rankSolid = getRankSolidColor(mission.rank as Rank);
      const rankBadge = getRankBadgeColor(mission.rank as Rank);
      const rankGlow = getRankGlowColor(mission.rank as Rank);
      
      // Glassmorphism and border classes
      const glassClasses = 'backdrop-blur-lg bg-card dark:bg-background/80';
      
      // Special styling for boss missions
      const borderClasses = isBoss 
        ? `border-2 border-amber-500/60 ${isLocked ? 'border-opacity-30' : 'border-opacity-80'}` 
        : `border-2 ${isLocked ? 'border-gray-300/40' : `border-${mission.rank.toLowerCase()}-400/60`}`;
      
      // Shadow and hover effects
      const shadowClasses = isCompleted
        ? 'shadow-md'
        : isBoss 
          ? 'shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-transform duration-200 shadow-amber-500/20'
          : 'shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-transform duration-200';
      
      // Glow effect for non-completed missions
      const glowClasses = !isCompleted && !isLocked 
        ? isBoss 
          ? 'ring-2 ring-offset-1 ring-amber-400/70' 
          : `ring-2 ring-offset-1 ${rankGlow}` 
        : '';
      
      // Background gradient based on rank
      const rankBg = isBoss 
        ? 'bg-gradient-to-br from-amber-500/10 to-amber-800/20' 
        : `bg-gradient-to-br from-${mission.rank.toLowerCase()}-400/5 to-${mission.rank.toLowerCase()}-600/10`;
      
      // Completion styles
      const completedClasses = isCompleted ? 'opacity-70' : '';
      
      return (
        <Card 
          key={mission.id} 
          className={`relative overflow-hidden rounded-xl ${borderClasses} ${glassClasses} ${shadowClasses} ${glowClasses} ${completedClasses}`}
        >
          {/* Rank indicator strip */}
          <div className={`absolute top-0 left-0 w-2 h-full ${isBoss ? 'bg-amber-500' : rankSolid.split(' ')[0]}`}></div>

          {/* Boss indicator */}
          {isBoss && (
            <div className="absolute top-0 right-0">
              <div className="w-16 h-16 overflow-hidden">
                <div className="absolute transform rotate-45 bg-amber-500 text-xs font-bold py-1 right-[-35px] top-[12px] w-[120px] text-center text-gray-900 shadow-md">
                  BOSS
                </div>
              </div>
            </div>
          )}

          <CardContent className="p-0">
            {/* Mission header with rank-colored background */}
            <div className={`p-4 border-b ${rankBg}`}>
              {/* Rank badge */}
              <div className="flex justify-between items-center mb-3">
                <Badge className={`px-2 py-1 ${isBoss ? 'border-amber-400 text-amber-500 font-bold' : rankBadge} bg-transparent font-semibold`}>
                  {mission.rank} Rank {isBoss && '• BOSS'}
                </Badge>
                <Badge className="flex items-center gap-1 bg-transparent border-amber-500 text-amber-500 py-1 px-2">
                  <Star className={`h-3 w-3 ${isBoss ? 'fill-amber-500 animate-pulse' : 'fill-amber-500'}`} />
                  +{mission.expReward} EXP
                </Badge>
              </div>
              
              {/* Mission title with rank gradient */}
              <div className="flex items-center gap-2 mt-2">
                <h3 className={`font-extrabold text-xl ${isBoss ? 'bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent drop-shadow-glow' : `bg-gradient-to-r ${rankGradient} bg-clip-text text-transparent`} ${isCompleted ? 'line-through' : ''}`}>
                  {mission.title}
                </h3>
                {isCompleted && <CheckCircle className="text-green-500 w-5 h-5" />}
              </div>
            </div>
            
            {/* Mission description */}
            <div className="p-4">
              <p className={`font-medium ${isCompleted ? 'text-gray-400' : 'text-muted-foreground'}`}>
                {mission.description}
              </p>
              
              {/* Completed mission experience earned */}
              {isCompleted && (
                <div className="text-blue-500 text-sm font-semibold mt-3 flex items-center">
                  <Star className="h-4 w-4 mr-1 fill-blue-500" />
                  {completedMission ? (
                    <>+{completedMission.expEarned} EXP (earned)</>
                  ) : (
                    <>+{mission.expReward} EXP (earned)</>
                  )}
                </div>
              )}
            </div>
            
            {/* Mission action button */}
            {!isCompleted && !isLocked && (
              <Button
                className={`w-full rounded-none h-14 text-lg font-medium ${isBoss ? 'bg-amber-500 hover:bg-amber-600 text-gray-900' : rankSolid}`}
                onClick={() => handleCompleteMission(mission)}
              >
                {isBoss ? '⚔️ Defeat Boss' : 'Complete Mission'}
              </Button>
            )}
            {!isCompleted && isLocked && (
              <div className="w-full rounded-none h-14 flex items-center justify-center gap-2 text-lg font-medium bg-gray-600 text-gray-300">
                <Lock className="h-5 w-5" /> Locked
              </div>
            )}
          </CardContent>
        </Card>
      );
    });
  };
  
  // Day Navigation Styles
  const dayNavButtonClass = `rounded-full w-14 h-14 flex items-center justify-center transition-colors ${isLocked ? 'hover:bg-gray-200 dark:hover:bg-gray-700' : 'hover:bg-accent'}`;
  const dayTitleClass = `text-4xl font-bold ${isLocked ? 'text-gray-400' : 'text-primary'}`;
  
  return (
    <div className="space-y-8">
      {/* Day Navigation */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          size="icon"
          onClick={handlePrevDay}
          disabled={currentDay <= 1}
          className={dayNavButtonClass}
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
        
        <div className="text-center">
          <div className={dayTitleClass}>Day {currentDay}</div>
          <div className="text-sm text-muted-foreground mt-1">
            {isLoading 
              ? 'Loading missions...' 
              : `${dayMissions.length} mission${dayMissions.length !== 1 ? 's' : ''} available`
            }
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="icon"
          onClick={handleNextDay}
          disabled={currentDay >= totalDays}
          className={dayNavButtonClass}
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      </div>
      
      {/* Mission cards displayed in a grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderMissionCards()}
      </div>
    </div>
  );
} 