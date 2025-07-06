import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, CheckCircle, Lock, Trophy, Calendar, Activity, Play, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSoloLevelingStore } from '@/lib/store';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Rank, Mission } from '@/lib/types';
import { PredefinedMission } from '@/data/predefined-missions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { formatRelative, addDays } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { VirtualizedMissionList } from './VirtualizedMissionList';

interface RankMissionProgressProps {
  missions: PredefinedMission[];
  rankName: string;
  totalDays: number;
  rank: Rank;
  isLocked?: boolean;
}

export default function RankMissionProgressVirtualized({ missions, rankName, totalDays, rank, isLocked = false }: RankMissionProgressProps) {
  const { toast } = useToast();
  const [currentDay, setCurrentDay] = useState(1);
  const completeMission = useSoloLevelingStore(state => state.completeMission);
  const startMission = useSoloLevelingStore(state => state.startMission);
  const updateMissionTasks = useSoloLevelingStore(state => state.updateMissionTasks);
  const completedMissionHistory = useSoloLevelingStore(state => state.completedMissionHistory);
  const [isLoading, setIsLoading] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [lockedPreviewDialogOpen, setLockedPreviewDialogOpen] = useState(false);
  const [currentMission, setCurrentMission] = useState<PredefinedMission | null>(null);
  const [completedTaskIndices, setCompletedTaskIndices] = useState<number[]>([]);
  const [dayUnlockStatus, setDayUnlockStatus] = useState<Record<number, boolean>>({});
  const today = new Date();
  const isMobile = useIsMobile();

  // Ensure missions is always an array
  const safeMissions = Array.isArray(missions) ? missions : [];

  // Filter missions for the current rank and day
  const dayMissions = safeMissions.filter(m => m.rank === rank && m.day === currentDay);

  // Add this function to check day unlocked status
  const isDayUnlocked = (dayNumber: number) => {
    // If rank is locked, all days are locked
    if (isLocked) return false;

    // Day 1 is always unlocked (if rank isn't locked)
    if (dayNumber === 1) return true;

    // Check if previous day's missions are all completed
    const prevDayMissions = safeMissions.filter(m => m.rank === rank && m.day === dayNumber - 1);
    const isPrevDayCompleted = prevDayMissions.length > 0 &&
      prevDayMissions.every(m => completedMissionHistory.some(cm => cm.id === m.id));

    // Check if the current date matches or exceeds the required date for this day
    // Day 1 = today, Day 2 = tomorrow, etc.
    const requiredDate = addDays(today, dayNumber - 1);
    const isDateUnlocked = today.getTime() >= requiredDate.getTime();

    return isPrevDayCompleted && isDateUnlocked;
  };

  // Add effect to update unlock statuses
  useEffect(() => {
    const statuses: Record<number, boolean> = {};
    for (let day = 1; day <= totalDays; day++) {
      statuses[day] = isDayUnlocked(day);
    }
    setDayUnlockStatus(statuses);
  }, [completedMissionHistory, safeMissions, currentDay, rank, totalDays]);

  // Modify the handleNextDay and handlePrevDay functions
  const handleNextDay = () => {
    if (currentDay < totalDays) {
      setCurrentDay(prev => Math.min(totalDays, prev + 1));
    }
  };

  // Adjust handlePrevDay (unchanged logic, but for consistency)
  const handlePrevDay = () => {
    if (currentDay > 1) {
      setCurrentDay(prev => Math.max(1, prev - 1));
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

    // If day is locked, show the locked preview dialog instead
    if (!dayUnlockStatus[currentDay]) {
      setCurrentMission(mission);
      setLockedPreviewDialogOpen(true);
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

      // If all tasks are completed, automatically save progress
      if (currentMission && currentMission.count && updated.length >= currentMission.count) {
        saveTaskProgress(updated);
      }

      return updated;
    });
  };

  const saveTaskProgress = async (indices: number[] = completedTaskIndices) => {
    if (!currentMission) return;

    try {
      await updateMissionTasks(currentMission.id, indices);

      // If all tasks are completed, close the dialog
      if (currentMission.count && indices.length >= currentMission.count) {
        setTaskDialogOpen(false);
        toast({
          title: "Mission Completed!",
          description: `Great job completing "${currentMission.title}"!`,
        });
      } else {
        toast({
          title: "Progress Saved",
          description: `Your progress on "${currentMission.title}" has been saved.`,
        });
      }
    } catch (error) {
      console.error("Error updating mission tasks:", error);
      toast({
        title: "Error",
        description: "Failed to save task progress",
        variant: "destructive",
      });
    }
  };

  // Get total completed missions for this rank
  const completedCount = missions.filter(m => completedMissionHistory.some(cm => cm.id === m.id)).length;
  const completionPercentage = Math.round((completedCount / missions.length) * 100);

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

  // Create a function for rank-specific day title styling
  const getDayTitleStyle = (rank: Rank) => {
    if (isLocked) return 'text-gray-400';

    switch (rank) {
      case 'F': return 'bg-gradient-to-r from-gray-400 to-gray-600 bg-clip-text text-transparent';
      case 'E': return 'bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent';
      case 'D': return 'bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent';
      case 'C': return 'bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent';
      case 'B': return 'bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent';
      case 'A': return 'bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent';
      case 'S': return 'bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent';
      case 'SS': return 'bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent';
      case 'SSS': return 'bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-600 bg-clip-text text-transparent';
    }
  };

  // Day Navigation Styles
  const dayNavButtonClass = `rounded-full flex items-center justify-center transition-all duration-300 border-2 ${isLocked ? 'hover:bg-gray-200 dark:hover:bg-gray-700' : 'hover:bg-accent hover:scale-110'} backdrop-blur-sm`;

  // Add this helper at the top (after imports):
  const getRankColorClass = (rank: Rank) => {
    switch (rank) {
      case 'F': return 'text-gray-400 bg-gradient-to-br from-gray-700/60 to-gray-900/80';
      case 'E': return 'text-orange-400 bg-gradient-to-br from-orange-700/60 to-gray-900/80';
      case 'D': return 'text-blue-400 bg-gradient-to-br from-blue-700/60 to-gray-900/80';
      case 'C': return 'text-green-400 bg-gradient-to-br from-green-700/60 to-gray-900/80';
      case 'B': return 'text-purple-400 bg-gradient-to-br from-purple-700/60 to-gray-900/80';
      case 'A': return 'text-red-400 bg-gradient-to-br from-red-700/60 to-gray-900/80';
      case 'S': return 'text-yellow-400 bg-gradient-to-br from-yellow-700/60 to-gray-900/80';
      case 'SS': return 'text-emerald-400 bg-gradient-to-br from-emerald-700/60 to-gray-900/80';
      case 'SSS': return 'text-indigo-400 bg-gradient-to-br from-indigo-700/60 to-gray-900/80';
      default: return 'text-gray-400 bg-gradient-to-br from-gray-700/60 to-gray-900/80';
    }
  };

  // Add this helper at the top (after getRankColorClass):
  const getRankButtonClass = (rank: Rank) => {
    switch (rank) {
      case 'F': return 'bg-gray-500 hover:bg-gray-600 text-white';
      case 'E': return 'bg-orange-500 hover:bg-orange-600 text-white';
      case 'D': return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'C': return 'bg-green-500 hover:bg-green-600 text-white';
      case 'B': return 'bg-purple-500 hover:bg-purple-600 text-white';
      case 'A': return 'bg-red-500 hover:bg-red-600 text-white';
      case 'S': return 'bg-yellow-400 hover:bg-yellow-500 text-gray-900';
      case 'SS': return 'bg-emerald-500 hover:bg-emerald-600 text-white';
      case 'SSS': return 'bg-indigo-500 hover:bg-indigo-600 text-white';
      default: return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
  };

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
          className={`${dayNavButtonClass} flex w-12 h-12 sm:w-16 sm:h-16`}
        >
          <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
        </Button>

        <div className="text-center">
          <div className={`text-2xl sm:text-4xl font-bold ${getDayTitleStyle(rank)} tracking-tight drop-shadow-sm`}>
            Day {currentDay}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2 flex items-center justify-center gap-1">
            {isLoading
              ? 'Loading missions...'
              : (
                <>
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  {dayMissions.length === 0 ? (
                    "No missions available"
                  ) : (
                    `${dayMissions.length} mission${dayMissions.length !== 1 ? 's' : ''} available`
                  )}
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
          className={`${dayNavButtonClass} flex w-12 h-12 sm:w-16 sm:h-16`}
        >
          <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
        </Button>
      </div>

      {/* Virtualized Mission List */}
      <div className="space-y-6">
        {/* Locked day banner - only show if day is locked */}
        {!dayUnlockStatus[currentDay] && (
          <div className="text-center py-3 bg-muted/10 rounded-xl border border-border flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 px-2 sm:px-4">
            <Lock className="h-5 w-5 text-amber-500" />
            <div>
              <p className="font-semibold text-amber-400 text-sm sm:text-base">Day {currentDay} is Locked</p>
              <p className="text-xs text-muted-foreground">
                {currentDay > 1 ?
                  `Complete all Day ${currentDay - 1} missions and wait until ${addDays(today, currentDay - 1).toLocaleDateString()}` :
                  'This day is not yet available'}
              </p>
              <p className="text-xs text-blue-400 mt-1">You can still preview missions in this day</p>
            </div>
          </div>
        )}

        {/* Use VirtualizedMissionList for better performance */}
        <VirtualizedMissionList
          missions={dayMissions}
          rank={rank}
          isLocked={isLocked}
          onViewMission={handleViewMission}
        />
      </div>

      {/* Task completion dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className={cn(
          "glassmorphism flex flex-col text-solo-text rounded-xl",
          "before:!absolute before:!inset-0 before:!rounded-xl",
          "before:!bg-gradient-to-br before:!from-indigo-500/10 before:!to-purple-500/5",
          "before:!backdrop-blur-xl before:!-z-10",
          isMobile
            ? "w-[90vw] max-w-[320px] p-2 sm:p-3 max-h-[85vh]"
            : "max-w-lg max-h-[90vh] p-4 sm:p-6"
        )}>
          {/* Decorative blurred background icon */}
          {currentMission && (
            <div className={cn("absolute opacity-10 pointer-events-none select-none z-0", isMobile ? "top-2 right-2" : "top-4 right-4")}>
              <Star className={cn(
                currentMission.difficulty === 'boss' ? 'text-amber-400' : getRankColorClass(currentMission.rank).split(' ')[0],
                isMobile ? "w-12 h-12" : "w-16 h-16"
              )} />
            </div>
          )}
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className={cn(
              "font-extrabold tracking-tight flex items-center gap-2 justify-center text-center drop-shadow-glow",
              currentMission?.difficulty === 'boss'
                ? 'text-amber-400'
                : currentMission ? getRankColorClass(currentMission.rank).split(' ')[0] : '',
              isMobile ? "text-base" : "text-xl"
            )}>
              {currentMission ? currentMission.title : 'Mission Tasks'}
            </DialogTitle>
          </DialogHeader>

          <div className={cn("flex-1 overflow-y-auto flex flex-col items-center", isMobile ? "py-2 space-y-3 pr-1" : "py-4 space-y-6 pr-2 -mr-2")}>
            {currentMission && (
              <>
                <div className="text-center w-full">
                  <div className={`font-semibold mb-2 ${isMobile ? 'text-xs' : 'text-sm'} ${currentMission.difficulty === 'boss' ? 'text-amber-400' : getRankColorClass(currentMission.rank).split(' ')[0]}`}>Task Progress</div>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Activity className={cn(isMobile ? "h-4 w-4" : "h-5 w-5", "text-blue-500")} />
                    <span className={cn(isMobile ? "text-lg" : "text-xl", "font-bold")}>{completedTaskIndices.length} / {currentMission.count || 1}</span>
                  </div>
                  <Progress
                    value={(completedTaskIndices.length / (currentMission.count || 1)) * 100}
                    className="h-2 w-full"
                  />
                </div>

                {/* Mission description with styled background */}
                <div className={`p-4 rounded-md border shadow-inner relative overflow-hidden w-full
                  ${currentMission.difficulty === 'boss'
                    ? 'bg-gradient-to-br from-amber-500/10 to-amber-800/10 border-amber-500/40'
                    : `bg-gradient-to-br from-${currentMission.rank.toLowerCase()}-400/10 to-${currentMission.rank.toLowerCase()}-600/10 border-${currentMission.rank.toLowerCase()}-400/40`}
                `}>
                  <div className="flex items-center gap-2 mb-2">
                    <Star className={`h-5 w-5 ${currentMission.difficulty === 'boss' ? 'text-amber-400' : `text-${currentMission.rank.toLowerCase()}-400`}`} />
                    <span className={`font-semibold ${isMobile ? 'text-sm' : 'text-base'} ${currentMission.difficulty === 'boss' ? 'text-foreground' : getRankColorClass(currentMission.rank).split(' ')[0]}`}>Description</span>
                  </div>
                  <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} leading-relaxed font-medium ${currentMission.difficulty === 'boss' ? 'text-foreground/90' : getRankColorClass(currentMission.rank).split(' ')[0]}`}>
                    {currentMission.description}
                  </p>
                </div>

                {/* Task list with checkboxes */}
                {currentMission.taskNames && currentMission.taskNames.length > 0 && (
                  <div className="space-y-2 mt-4 w-full">
                    <div className={`font-semibold text-sm ${currentMission.difficulty === 'boss' ? 'text-amber-400' : getRankColorClass(currentMission.rank).split(' ')[0]}`}>Check off completed tasks:</div>
                    <div className="max-h-48 overflow-y-auto space-y-3 border rounded-md p-3 relative z-10
                      bg-background/60 shadow-sm
                      ${currentMission.difficulty === 'boss'
                        ? 'border-amber-500/20 bg-amber-500/5'
                        : `border-${currentMission.rank.toLowerCase()}-400/20 bg-${currentMission.rank.toLowerCase()}-500/5`}
                    ">
                      {currentMission.taskNames.map((task, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start gap-3 p-2 rounded hover:bg-accent/20 transition-all duration-300 ${
                            completedTaskIndices.includes(idx)
                              ? 'bg-green-100/10 border border-green-500/30 shadow-[0_0_8px_rgba(34,197,94,0.2)]'
                              : 'border border-transparent'
                          }`}
                          onClick={() => handleTaskToggle(idx)}
                        >
                          <Checkbox
                            id={`task-${idx}`}
                            checked={completedTaskIndices.includes(idx)}
                            onCheckedChange={() => handleTaskToggle(idx)}
                            className="h-5 w-5 transition-transform duration-200 data-[state=checked]:scale-110 mt-0.5 flex-shrink-0"
                          />
                          <label
                            htmlFor={`task-${idx}`}
                            className={`flex-1 min-w-0 cursor-pointer transition-all duration-300 break-words leading-tight ${isMobile ? 'text-[10px]' : 'text-sm'}
                              ${completedTaskIndices.includes(idx)
                                ? 'line-through text-muted-foreground opacity-70'
                                : currentMission.difficulty === 'boss'
                                  ? 'text-amber-400'
                                  : getRankColorClass(currentMission.rank).split(' ')[0]
                              }`}
                          >
                            {task}
                          </label>
                          {completedTaskIndices.includes(idx) && (
                            <span className="text-green-500 scale-in-center flex-shrink-0 mt-0.5">
                              <CheckCircle className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-center text-sm text-muted-foreground w-full">
                  <p>Check off tasks as you complete them.</p>
                  <p className="mt-1">Your progress is saved automatically.</p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Mission Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className={cn(
          "glassmorphism flex flex-col text-solo-text rounded-xl",
          "before:!absolute before:!inset-0 before:!rounded-xl",
          "before:!bg-gradient-to-br before:!from-indigo-500/10 before:!to-purple-500/5",
          "before:!backdrop-blur-xl before:!-z-10",
          isMobile
            ? "w-[90vw] max-w-[320px] p-2 sm:p-3 max-h-[85vh]"
            : "max-w-lg max-h-[90vh] p-4 sm:p-6"
        )}>
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className={cn(
              "font-extrabold tracking-tight flex items-center gap-2 justify-center drop-shadow-glow",
              currentMission?.difficulty === 'boss'
                ? 'bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent'
                : currentMission ? getRankColorClass(currentMission.rank).split(' ')[0] : '',
              isMobile ? "text-base" : "text-xl"
            )}>
              {currentMission?.difficulty === 'boss' && <Trophy className={cn("text-amber-400 drop-shadow-glow animate-pulse", isMobile ? "h-4 w-4" : "h-6 w-6")} />}
              {currentMission ? currentMission.title : 'Mission Details'}
            </DialogTitle>
          </DialogHeader>

          <div className={cn("flex-1 overflow-y-auto relative", isMobile ? "py-2 space-y-3 pr-1" : "py-4 space-y-6 pr-2 -mr-2")}>
            {currentMission && (
              <>
                {/* Mission description with styled background */}
                <div className={`p-4 rounded-md border shadow-inner relative overflow-hidden
                  ${currentMission.difficulty === 'boss'
                    ? 'bg-gradient-to-br from-amber-500/10 to-amber-800/10 border-amber-500/40'
                    : `bg-gradient-to-br from-${currentMission.rank.toLowerCase()}-400/10 to-${currentMission.rank.toLowerCase()}-600/10 border-${currentMission.rank.toLowerCase()}-400/40`}
                `}>
                  <div className="flex items-center gap-2 mb-2">
                    <Star className={`h-5 w-5 ${currentMission.difficulty === 'boss' ? 'text-amber-400' : `text-${currentMission.rank.toLowerCase()}-400`}`} />
                    <span className={`font-semibold ${isMobile ? 'text-sm' : 'text-base'} ${currentMission.difficulty === 'boss' ? 'text-foreground' : getRankColorClass(currentMission.rank).split(' ')[0]}`}>Description</span>
                  </div>
                  <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} leading-relaxed font-medium ${currentMission.difficulty === 'boss' ? 'text-foreground/90' : getRankColorClass(currentMission.rank).split(' ')[0]}`}>
                    {currentMission.description}
                  </p>
                </div>

                {/* Mission tasks preview */}
                {currentMission.count && currentMission.count > 0 && (
                  <div className="space-y-2">
                    <h4 className={`font-semibold text-sm flex items-center gap-1 mb-1
                      ${currentMission.difficulty === 'boss'
                        ? 'text-amber-500'
                        : `text-${currentMission.rank.toLowerCase()}-500`}
                    `}>
                      <Activity className="h-4 w-4" />
                      This mission contains {currentMission.count} {currentMission.count === 1 ? 'task' : 'tasks'}:
                    </h4>
                    <div className={`max-h-48 overflow-y-auto border rounded-md p-3 space-y-2 bg-background/60 shadow-sm
                      ${currentMission.difficulty === 'boss'
                        ? 'border-amber-500/20 bg-amber-500/5'
                        : `border-${currentMission.rank.toLowerCase()}-400/20 bg-${currentMission.rank.toLowerCase()}-500/5`}
                    `}>
                      {currentMission.taskNames && currentMission.taskNames.map((task, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start gap-3 p-3 ${isMobile ? 'text-[10px]' : 'text-sm'} border-b last:border-0 rounded transition-colors duration-200
                            ${currentMission.difficulty === 'boss'
                              ? 'border-amber-500/20 hover:bg-amber-500/10'
                              : `border-${currentMission.rank.toLowerCase()}-400/20 hover:bg-${currentMission.rank.toLowerCase()}-500/10`}
                          `}
                        >
                          <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold mt-0.5 flex-shrink-0
                            ${currentMission.difficulty === 'boss'
                              ? 'bg-amber-500/20 text-amber-500'
                              : `bg-${currentMission.rank.toLowerCase()}-500/20 text-${currentMission.rank.toLowerCase()}-500`}
                          `}>
                            {idx + 1}
                          </span>
                          <span className="font-medium flex-1 min-w-0 break-words leading-tight">{task}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* EXP Reward Badge */}
                <div className="flex justify-center mt-4">
                  <div className={`rounded-full px-4 py-2 flex items-center gap-2 text-sm font-semibold shadow-md
                    ${currentMission.difficulty === 'boss'
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                      : `bg-${currentMission.rank.toLowerCase()}-500/20 border border-${currentMission.rank.toLowerCase()}-500/40 text-${currentMission.rank.toLowerCase()}-400`}
                  `}>
                    <Trophy className="h-4 w-4" />
                    <span>Reward: {currentMission.expReward} EXP</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter className={cn(
            "flex-shrink-0 flex gap-2 border-t border-gray-700",
            isMobile ? "mt-2 pt-2 flex-col" : "mt-4 pt-4 items-center justify-center"
          )}>
            <Button
              onClick={handleStartMission}
              className={cn(
                "gap-2 font-semibold shadow-md shadow-primary/10",
                currentMission?.difficulty === 'boss'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-900'
                  : currentMission ? getRankButtonClass(currentMission.rank) : 'bg-primary hover:bg-primary/90 text-white',
                isMobile ? "h-8 text-xs" : "h-9 text-sm flex-1"
              )}
            >
              <Play className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")} />
              Start Mission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Locked Mission Preview Dialog - Read Only */}
      <Dialog open={lockedPreviewDialogOpen} onOpenChange={setLockedPreviewDialogOpen}>
        <DialogContent className={cn(
          "glassmorphism flex flex-col text-solo-text rounded-xl",
          "before:!absolute before:!inset-0 before:!rounded-xl",
          "before:!bg-gradient-to-br before:!from-indigo-500/10 before:!to-purple-500/5",
          "before:!backdrop-blur-xl before:!-z-10",
          isMobile
            ? "w-[90vw] max-w-[320px] p-2 sm:p-3 max-h-[85vh]"
            : "max-w-lg max-h-[90vh] p-4 sm:p-6"
        )}>
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className={cn(
              "font-extrabold tracking-tight flex items-center gap-2 justify-center drop-shadow-glow",
              currentMission?.difficulty === 'boss'
                ? 'bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent'
                : currentMission ? getRankColorClass(currentMission.rank).split(' ')[0] : '',
              isMobile ? "text-base" : "text-xl"
            )}>
              {currentMission?.difficulty === 'boss' && <Trophy className={cn("text-amber-400 drop-shadow-glow animate-pulse", isMobile ? "h-4 w-4" : "h-6 w-6")} />}
              {currentMission ? currentMission.title : 'Mission Details'}
            </DialogTitle>
          </DialogHeader>

          <div className={cn("flex-1 overflow-y-auto relative", isMobile ? "py-2 space-y-3 pr-1" : "py-4 space-y-6 pr-2 -mr-2")}>
            {/* "Locked" banner */}
            <div className={cn("absolute z-20 overflow-hidden", isMobile ? "top-0 right-0 w-16 h-16" : "top-0 right-0 w-20 h-20")}>
              <div className={cn("absolute transform rotate-45 bg-gray-800/90 font-bold text-center text-gray-300 shadow-md border-t border-gray-700",
                isMobile
                  ? "text-[8px] py-0.5 w-24 right-[-12px] top-[12px]"
                  : "text-xs py-1 w-32 right-[-16px] top-[16px]"
              )}>
                {isMobile ? "LOCKED" : "DAY LOCKED"}
              </div>
            </div>

            {currentMission && (
              <>
                {/* Mission description with styled background */}
                <div className={`p-4 rounded-md border shadow-inner relative overflow-hidden
                  ${currentMission.difficulty === 'boss'
                    ? 'bg-gradient-to-br from-amber-500/10 to-amber-800/10 border-amber-500/40'
                    : `bg-gradient-to-br from-${currentMission.rank.toLowerCase()}-400/10 to-${currentMission.rank.toLowerCase()}-600/10 border-${currentMission.rank.toLowerCase()}-400/40`}
                `}>
                  <div className="flex items-center gap-2 mb-2">
                    <Star className={`h-5 w-5 ${currentMission.difficulty === 'boss' ? 'text-amber-400' : `text-${currentMission.rank.toLowerCase()}-400`}`} />
                    <span className={`font-semibold ${isMobile ? 'text-sm' : 'text-base'} ${currentMission.difficulty === 'boss' ? 'text-foreground' : getRankColorClass(currentMission.rank).split(' ')[0]}`}>Description</span>
                  </div>
                  <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} leading-relaxed font-medium ${currentMission.difficulty === 'boss' ? 'text-foreground/90' : getRankColorClass(currentMission.rank).split(' ')[0]}`}>
                    {currentMission.description}
                  </p>
                </div>

                {/* Mission tasks preview */}
                {currentMission.count && currentMission.count > 0 && (
                  <div className="space-y-2">
                    <h4 className={`font-semibold text-sm flex items-center gap-1 mb-1
                      ${currentMission.difficulty === 'boss'
                        ? 'text-amber-500'
                        : `text-${currentMission.rank.toLowerCase()}-500`}
                    `}>
                      <Activity className="h-4 w-4" />
                      This mission contains {currentMission.count} {currentMission.count === 1 ? 'task' : 'tasks'}:
                    </h4>
                    <div className={`max-h-48 overflow-y-auto border rounded-md p-3 space-y-2 bg-background/60 shadow-sm
                      ${currentMission.difficulty === 'boss'
                        ? 'border-amber-500/20 bg-amber-500/5'
                        : `border-${currentMission.rank.toLowerCase()}-400/20 bg-${currentMission.rank.toLowerCase()}-500/5`}
                    `}>
                      {currentMission.taskNames && currentMission.taskNames.map((task, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start gap-3 p-3 ${isMobile ? 'text-[10px]' : 'text-sm'} border-b last:border-0 rounded transition-colors duration-200
                            ${currentMission.difficulty === 'boss'
                              ? 'border-amber-500/20 hover:bg-amber-500/10'
                              : `border-${currentMission.rank.toLowerCase()}-400/20 hover:bg-${currentMission.rank.toLowerCase()}-500/10`}
                          `}
                        >
                          <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold mt-0.5 flex-shrink-0
                            ${currentMission.difficulty === 'boss'
                              ? 'bg-amber-500/20 text-amber-500'
                              : `bg-${currentMission.rank.toLowerCase()}-500/20 text-${currentMission.rank.toLowerCase()}-500`}
                          `}>
                            {idx + 1}
                          </span>
                          <span className="font-medium flex-1 min-w-0 break-words leading-tight">{task}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* EXP Reward Badge */}
                <div className="flex justify-center mt-4">
                  <div className={`rounded-full px-4 py-2 flex items-center gap-2 text-sm font-semibold shadow-md
                    ${currentMission.difficulty === 'boss'
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                      : `bg-${currentMission.rank.toLowerCase()}-500/20 border border-${currentMission.rank.toLowerCase()}-500/40 text-${currentMission.rank.toLowerCase()}-400`}
                  `}>
                    <Trophy className="h-4 w-4" />
                    <span>Reward: {currentMission.expReward} EXP</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter className={cn(
            "flex-shrink-0 flex items-center justify-center border-t border-gray-700",
            isMobile ? "mt-2 pt-2" : "mt-4 pt-4"
          )}>
            <Button
              variant="outline"
              onClick={() => setLockedPreviewDialogOpen(false)}
              className={cn("w-full text-center", isMobile ? "h-8 text-xs" : "h-9 text-sm")}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}