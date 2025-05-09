import React, { useState, useEffect } from 'react';
import { useSoloLevelingStore } from '@/lib/store';
import { getAvailableMissions, getUpcomingMissions, PredefinedMission } from '@/data/predefined-missions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Calendar, DayClickEventHandler } from '@/components/ui/calendar';
import { format, isEqual, isBefore, isAfter, isToday, addDays } from 'date-fns';
import { CalendarIcon, ChevronLeft, ChevronRight, Calendar as CalendarDayIcon } from 'lucide-react';
import { CompletedMission } from '@/lib/store/slices/mission-slice';

export default function MissionBoard() {
  const { toast } = useToast();
  const user = useSoloLevelingStore(state => state.user);
  const completeMission = useSoloLevelingStore(state => state.completeMission);
  const completedMissionIds = useSoloLevelingStore(state => state.completedMissionIds);
  const completedMissionHistory = useSoloLevelingStore(state => state.completedMissionHistory);
  const loadCompletedMissions = useSoloLevelingStore(state => state.loadCompletedMissions);
  const getMissionsByDay = useSoloLevelingStore(state => state.getMissionsByDay);
  
  const [availableMissions, setAvailableMissions] = useState<PredefinedMission[]>([]);
  const [upcomingMissions, setUpcomingMissions] = useState<PredefinedMission[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [missionsByDay, setMissionsByDay] = useState<CompletedMission[]>([]);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [showDayFilter, setShowDayFilter] = useState<boolean>(false);

  // Load completed missions on mount
  useEffect(() => {
    loadCompletedMissions();
  }, [loadCompletedMissions]);

  useEffect(() => {
    const fetchMissions = async () => {
      if (!user?.rank) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch available missions based on user's rank and day
        const missions = await getAvailableMissions(user.rank, showDayFilter ? currentDay : undefined);
        setAvailableMissions(missions);

        // Fetch upcoming missions
        const upcoming = await getUpcomingMissions(user.rank);
        setUpcomingMissions(upcoming);
      } catch (error) {
        console.error('Error fetching missions:', error);
        setError('Failed to load missions. Please try again.');
        toast({
          title: 'Error',
          description: 'There was a problem loading missions.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMissions();
  }, [user?.rank, currentDay, showDayFilter]);

  useEffect(() => {
    if (selectedDate) {
      const missionsForDay = getMissionsByDay(selectedDate);
      setMissionsByDay(missionsForDay);
    }
  }, [selectedDate, completedMissionHistory, getMissionsByDay]);

  const handleClaimReward = async (mission: PredefinedMission) => {
    if (completedMissionIds.includes(mission.id)) {
      toast({
        title: "Mission Already Completed",
        description: `You have already claimed the reward for "${mission.title}"`,
        variant: "destructive",
      });
      return;
    }

    // Complete the mission in the store
    await completeMission(mission.id);
    
    // Reload completed missions to ensure UI is up to date
    await loadCompletedMissions();

    toast({
      title: "Mission Reward Claimed!",
      description: `You earned ${mission.expReward} EXP from "${mission.title}"`,
      variant: "default",
    });
  };

  const nextDay = () => {
    setSelectedDate(d => addDays(d, 1));
  };

  const previousDay = () => {
    setSelectedDate(d => addDays(d, -1));
  };

  const incrementCurrentDay = () => {
    setCurrentDay(prev => prev + 1);
  };

  const decrementCurrentDay = () => {
    setCurrentDay(prev => Math.max(1, prev - 1));
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'list' ? 'calendar' : 'list');
  };

  const toggleDayFilter = () => {
    setShowDayFilter(!showDayFilter);
  };

  if (!user) {
    return <div className="p-4">Please log in to view missions</div>;
  }

  // Helper function to highlight days with completed missions
  const highlightCompletedMissionDays = (date: Date) => {
    return completedMissionHistory.some(mission => {
      const missionDate = new Date(mission.completedAt);
      return (
        missionDate.getDate() === date.getDate() &&
        missionDate.getMonth() === date.getMonth() &&
        missionDate.getFullYear() === date.getFullYear()
      );
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-2xl font-bold mb-4 sm:mb-0">Mission Board</h1>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={toggleViewMode} 
            size="sm"
          >
            {viewMode === 'list' ? 'Calendar View' : 'List View'}
          </Button>
          
          <Button 
            variant={showDayFilter ? "default" : "outline"} 
            onClick={toggleDayFilter} 
            size="sm"
            className="flex items-center gap-1"
          >
            <CalendarDayIcon className="w-4 h-4" />
            {showDayFilter ? 'All Days' : 'Filter by Day'}
          </Button>
        </div>
      </div>
      
      {showDayFilter && (
        <div className="mb-6 p-3 bg-muted/30 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={decrementCurrentDay} disabled={currentDay <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <h3 className="text-lg font-medium">Day {currentDay}</h3>
              <p className="text-sm text-muted-foreground">Showing missions for this specific day</p>
            </div>
            <Button variant="ghost" size="sm" onClick={incrementCurrentDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="p-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-900/10 border border-red-800 rounded-lg text-center">
          <p>{error}</p>
          <Button 
            variant="default" 
            onClick={() => getAvailableMissions(user.rank)} 
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      ) : viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={date => date && setSelectedDate(date)}
                className="border rounded-md"
                modifiers={{
                  completed: highlightCompletedMissionDays,
                }}
                modifiersClassNames={{
                  completed: "bg-green-100 text-green-900 font-bold dark:bg-green-900/30 dark:text-green-400",
                }}
              />
            </div>
          </div>
          
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <Button variant="ghost" size="icon" onClick={previousDay}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle>
                  {isToday(selectedDate) ? 'Today' : format(selectedDate, 'PPP')}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={nextDay}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {missionsByDay.length === 0 ? (
                <div className="text-center p-4 text-gray-500">
                  No missions completed on this day
                </div>
              ) : (
                <div className="space-y-3">
                  {missionsByDay.map(mission => {
                    const matchingPredefinedMission = availableMissions.find(m => m.id === mission.id);
                    
                    return (
                      <div key={mission.id} className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/10 rounded-md">
                        <div>
                          <div className="font-medium">{matchingPredefinedMission?.title || "Unknown Mission"}</div>
                          <div className="text-sm text-gray-500">
                            {format(new Date(mission.completedAt), 'h:mm a')}
                          </div>
                        </div>
                        <Badge>+{mission.expEarned} EXP</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="available">Available ({availableMissions.length})</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming ({upcomingMissions.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedMissionIds.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="available" className="space-y-4 mt-4">
            {availableMissions.length === 0 ? (
              <div className="text-center p-4">
                {showDayFilter 
                  ? `No available missions at your current rank for Day ${currentDay}` 
                  : 'No available missions at your current rank'}
              </div>
            ) : (
              availableMissions
                .filter(mission => !completedMissionIds.includes(mission.id))
                .map((mission) => (
                  <MissionCard 
                    key={mission.id} 
                    mission={mission} 
                    isCompleted={false}
                    onClaim={() => handleClaimReward(mission)}
                  />
                ))
            )}
          </TabsContent>
          
          <TabsContent value="upcoming" className="space-y-4 mt-4">
            {upcomingMissions.length === 0 ? (
              <div className="text-center p-4">No upcoming missions</div>
            ) : (
              upcomingMissions.map((mission) => (
                <MissionCard 
                  key={mission.id} 
                  mission={mission} 
                  isUpcoming
                />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="space-y-4 mt-4">
            {completedMissionIds.length === 0 ? (
              <div className="text-center p-4">You haven't completed any missions yet</div>
            ) : (
              availableMissions
                .filter((mission) => completedMissionIds.includes(mission.id))
                .map((mission) => (
                  <MissionCard 
                    key={mission.id} 
                    mission={mission} 
                    isCompleted={true}
                  />
                ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

interface MissionCardProps {
  mission: PredefinedMission;
  isCompleted?: boolean;
  isUpcoming?: boolean;
  onClaim?: () => void;
}

function MissionCard({ mission, isCompleted, isUpcoming, onClaim }: MissionCardProps) {
  const releaseDate = new Date(mission.releaseDate).toLocaleDateString();
  const expiryDate = mission.expiryDate ? new Date(mission.expiryDate).toLocaleDateString() : null;

  return (
    <Card className={`
      ${isCompleted ? 'bg-green-50 dark:bg-green-900/10' : ''}
      ${isUpcoming ? 'bg-blue-50 dark:bg-blue-900/10' : ''}
      ${mission.isSpecial ? 'border-yellow-500' : ''}
    `}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{mission.title}</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{mission.rank} Rank</Badge>
            <Badge variant="secondary">Day {mission.day}</Badge>
            {mission.isSpecial && <Badge className="bg-yellow-500">Special</Badge>}
          </div>
        </div>
        <CardDescription>
          {mission.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div>
            <span className="font-semibold text-green-600 dark:text-green-400">
              {mission.expReward} EXP
            </span>
            {isUpcoming && (
              <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                Available on: {releaseDate}
              </div>
            )}
            {expiryDate && (
              <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                Expires on: {expiryDate}
              </div>
            )}
          </div>
          
          {!isCompleted && !isUpcoming && onClaim && (
            <Button onClick={onClaim}>
              Claim Reward
            </Button>
          )}
          
          {isCompleted && (
            <Badge className="bg-green-500">Completed</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 