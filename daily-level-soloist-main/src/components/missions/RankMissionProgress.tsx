import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, CheckCircle } from 'lucide-react';
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
      case 'F': return {
        gradient: 'from-gray-400 to-gray-600',
        border: 'border-gray-400',
        text: 'text-gray-400',
        bg: 'bg-gray-400/10',
        glow: 'shadow-gray-400/20'
      };
      case 'E': return {
        gradient: 'from-orange-400 to-orange-600',
        border: 'border-orange-400',
        text: 'text-orange-400',
        bg: 'bg-orange-400/10',
        glow: 'shadow-orange-400/20'
      };
      case 'D': return {
        gradient: 'from-blue-400 to-blue-600',
        border: 'border-blue-400',
        text: 'text-blue-400',
        bg: 'bg-blue-400/10',
        glow: 'shadow-blue-400/20'
      };
      case 'C': return {
        gradient: 'from-green-400 to-green-600',
        border: 'border-green-400',
        text: 'text-green-400',
        bg: 'bg-green-400/10',
        glow: 'shadow-green-400/20'
      };
      case 'B': return {
        gradient: 'from-purple-400 to-purple-600',
        border: 'border-purple-400',
        text: 'text-purple-400',
        bg: 'bg-purple-400/10',
        glow: 'shadow-purple-400/20'
      };
      case 'A': return {
        gradient: 'from-red-400 to-red-600',
        border: 'border-red-400',
        text: 'text-red-400',
        bg: 'bg-red-400/10',
        glow: 'shadow-red-400/20'
      };
      case 'S': return {
        gradient: 'from-yellow-400 to-yellow-600',
        border: 'border-yellow-400',
        text: 'text-yellow-400',
        bg: 'bg-yellow-400/10',
        glow: 'shadow-yellow-400/20'
      };
      case 'SS': return {
        gradient: 'from-emerald-400 to-emerald-600',
        border: 'border-emerald-400',
        text: 'text-emerald-400',
        bg: 'bg-emerald-400/10',
        glow: 'shadow-emerald-400/20'
      };
      case 'SSS': return {
        gradient: 'from-indigo-400 to-indigo-600',
        border: 'border-indigo-400',
        text: 'text-indigo-400',
        bg: 'bg-indigo-400/10',
        glow: 'shadow-indigo-400/20'
      };
      default: return {
        gradient: 'from-gray-400 to-gray-600',
        border: 'border-gray-400',
        text: 'text-gray-400',
        bg: 'bg-gray-400/10',
        glow: 'shadow-gray-400/20'
      };
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
      const completedMission = completedMissionHistory.find(cm => cm.id === mission.id);
      const rankColors = getRankColor(mission.rank as Rank);
      
      return (
        <Card 
          key={mission.id} 
          className={`relative overflow-hidden rounded-2xl border-l-8 ${rankColors.border} 
            backdrop-blur-xl bg-white/5 dark:bg-gray-900/40 border border-white/10
            ${isCompleted ? 'shadow-md' : 'shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-200'}
            ${!isCompleted ? `ring-2 ring-offset-2 ring-${mission.rank.toLowerCase()}-400/40` : ''}
            ${rankColors.bg} ${rankColors.glow}`}
        >
          <CardContent className="p-0">
            {/* Mission header */}
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <h3 className={`font-extrabold text-xl bg-gradient-to-r ${rankColors.gradient} bg-clip-text text-transparent drop-shadow-glow ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                    {mission.title}
                  </h3>
                  {isCompleted && <CheckCircle className="text-green-500 w-5 h-5" />}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={`flex items-center gap-1 bg-transparent border-amber-500 text-amber-500 py-1 px-2 ${rankColors.glow}`}>
                    <Star className="h-3 w-3 fill-amber-500" />
                    +{mission.expReward} EXP
                  </Badge>
                  <Badge variant="outline" className={rankColors.text}>Day {mission.day}</Badge>
                </div>
              </div>
              <p className={`mb-4 font-medium ${isCompleted ? 'text-gray-400' : rankColors.text}`}>
                {mission.description}
              </p>
              {isCompleted && (
                <div className="text-blue-500 text-sm font-semibold mt-2">
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
                className={`w-full rounded-none h-14 text-lg font-medium bg-gradient-to-r ${rankColors.gradient} hover:opacity-90 text-white transition-all duration-200`}
                onClick={() => handleCompleteMission(mission)}
              >
                Complete Mission
              </Button>
            )}
            {!isCompleted && isLocked && (
              <div className={`w-full rounded-none h-14 flex items-center justify-center text-lg font-medium bg-gradient-to-r ${rankColors.gradient} opacity-50 text-white`}>
                Locked
              </div>
            )}
          </CardContent>
        </Card>
      );
    });
  };
  
  return (
    <div className="space-y-6">
      {/* Day Navigation */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          size="icon"
          onClick={handlePrevDay}
          disabled={currentDay <= 1}
          className="rounded-full w-14 h-14 flex items-center justify-center hover:bg-accent"
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
        
        <div className="text-center">
          <div className="text-4xl font-bold text-primary">Day {currentDay}</div>
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
          className="rounded-full w-14 h-14 flex items-center justify-center hover:bg-accent"
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