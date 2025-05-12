import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, CheckCircle, Lock, Trophy, Calendar } from 'lucide-react';
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
import { motion } from 'framer-motion';

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
        ? 'bg-gradient-to-br from-amber-500/10 to-amber-800/20' 
        : `bg-gradient-to-br from-${mission.rank.toLowerCase()}-400/5 to-${mission.rank.toLowerCase()}-600/10`;
      
      // Completion styles
      const completedClasses = isCompleted ? 'opacity-75 dark:opacity-60' : '';
      
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
            {/* Rank indicator strip */}
            <div className={`absolute top-0 left-0 w-2 h-full ${isBoss ? 'bg-amber-500/80' : rankSolid.split(' ')[0]} group-hover:w-3 transition-all duration-300`}></div>

            {/* Boss indicator */}
            {isBoss && (
              <div className="absolute top-0 right-0">
                <div className="w-16 h-16 overflow-hidden">
                  <div className="absolute transform rotate-45 bg-gradient-to-r from-amber-400 to-amber-600 text-xs font-bold py-1 right-[-35px] top-[12px] w-[120px] text-center text-gray-900 shadow-md group-hover:from-amber-500 group-hover:to-amber-700 transition-colors duration-300">
                    BOSS
                  </div>
                </div>
              </div>
            )}

            <CardContent className="p-0">
              {/* Mission header with rank-colored background */}
              <div className={`p-5 border-b ${rankBg} relative overflow-hidden`}>
                {/* Subtle background pattern for boss missions */}
                {isBoss && (
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
                  <Badge 
                    className="flex items-center gap-1 bg-transparent border-amber-500 text-amber-500 py-1.5 px-3 border-2 backdrop-blur-sm dark:shadow-inner group-hover:scale-110 transition-transform duration-300"
                  >
                    <Star className={`h-3.5 w-3.5 ${isBoss ? 'fill-amber-500 animate-pulse' : 'fill-amber-500'} group-hover:scale-110 transition-transform duration-300`} />
                    +{mission.expReward} EXP
                  </Badge>
                </div>
                
                {/* Mission title with rank gradient */}
                <div className="flex items-center gap-2 mt-3 relative z-10">
                  <h3 
                    className={`font-extrabold text-2xl ${isBoss 
                      ? 'bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent drop-shadow-glow' 
                      : `bg-gradient-to-r ${rankGradient} bg-clip-text text-transparent`} 
                      ${isCompleted ? 'line-through' : ''} tracking-tight leading-tight group-hover:tracking-normal transition-all duration-300`}
                  >
                    {mission.title}
                  </h3>
                  {isCompleted && (
                    <div className="relative">
                      <div className="absolute inset-0 animate-ping opacity-30">
                        <CheckCircle className="text-green-500 w-5 h-5" />
                      </div>
                      <CheckCircle className="text-green-500 w-5 h-5" />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Mission description */}
              <div className="p-5 relative">
                {/* Subtle background pattern for boss missions */}
                {isBoss && (
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0 bg-repeat bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMiIgZmlsbD0iI2ZmZmZmZiIgZmlsbC1vcGFjaXR5PSIwLjQiLz48L3N2Zz4=')] animate-pulse"></div>
                  </div>
                )}
                
                <p className={`font-medium ${isCompleted ? 'text-gray-400' : 'text-muted-foreground'} relative z-10 leading-relaxed`}>
                  {mission.description}
                </p>
                
                {/* Completed mission experience earned */}
                {isCompleted && (
                  <div className="text-blue-500 text-sm font-semibold mt-4 flex items-center bg-blue-500/10 p-2 rounded-lg relative z-10">
                    <Star className="h-4 w-4 mr-2 fill-blue-500" />
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
                  className={`w-full rounded-none h-16 text-lg font-medium ${isBoss 
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-900' 
                    : `${rankSolid} hover:brightness-110`}`}
                  onClick={() => handleCompleteMission(mission)}
                >
                  {isBoss ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-bounce">⚔️</div> 
                      <span>Defeat Boss</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 animate-pulse" /> 
                      <span>Complete Mission</span>
                    </div>
                  )}
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
                <div className="w-full rounded-none h-16 flex items-center justify-center gap-2 text-lg font-medium bg-gradient-to-r from-green-600 to-green-700 text-white">
                  <CheckCircle className="h-5 w-5" /> 
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
          className={dayNavButtonClass}
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
          className={dayNavButtonClass}
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      </div>
      
      {/* Mission cards displayed in a grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {renderMissionCards()}
      </div>
    </div>
  );
} 