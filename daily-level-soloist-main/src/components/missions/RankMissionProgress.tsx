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
}

export default function RankMissionProgress({ missions, rankName, totalDays, rank }: RankMissionProgressProps) {
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
      
      return (
        <Card 
          key={mission.id} 
          className={`border overflow-hidden transition-all ${
            isCompleted
              ? 'border-green-500/50 bg-green-50/5 opacity-70'
              : 'border-border hover:border-border/80 hover:shadow-md'
          }`}
        >
          <CardContent className="p-0">
            {/* Mission header */}
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <h3 className={`font-medium text-xl text-foreground ${isCompleted ? 'line-through text-gray-400' : ''}`}>{mission.title}</h3>
                  {isCompleted && <CheckCircle className="text-green-500 w-5 h-5" />}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className="flex items-center gap-1 bg-transparent border-amber-500 text-amber-500 py-1 px-2">
                    <Star className="h-3 w-3 fill-amber-500" />
                    +{mission.expReward} EXP
                  </Badge>
                  <Badge variant="outline">Day {mission.day}</Badge>
                </div>
              </div>
              <p className={`mb-4 ${isCompleted ? 'text-gray-400' : 'text-muted-foreground'}`}>{mission.description}</p>
              {isCompleted && (
                <div className="text-blue-500 text-sm font-semibold mt-2">
                  {/* If we have direct access to the earned EXP */}
                  {completedMission ? (
                    <>+{completedMission.expEarned} EXP (earned)</>
                  ) : (
                    <>+{mission.expReward} EXP (earned)</>
                  )}
                </div>
              )}
            </div>
            {/* Mission action button */}
            {!isCompleted && (
              <Button
                className="w-full rounded-none h-14 text-lg font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => handleCompleteMission(mission)}
              >
                Complete Mission
              </Button>
            )}
            {isCompleted && (
              <div className="w-full rounded-none h-14 flex items-center justify-center text-lg font-medium bg-green-600 text-white">
                Completed
              </div>
            )}
          </CardContent>
        </Card>
      );
    });
  };
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{rankName} Missions</h2>
      </div>
      
      {/* Day navigation with styled buttons */}
      <div className="flex items-center justify-center space-x-16 py-4">
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