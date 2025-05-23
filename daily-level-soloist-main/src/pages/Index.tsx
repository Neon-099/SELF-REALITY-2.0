import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSoloLevelingStore } from '@/lib/store';
import { VirtualizedTaskList } from '@/components/ui/virtualized-task-list';
import { DailyWinCard } from '@/components/ui/daily-win-card';
import AddTaskDialog from '@/components/dashboard/AddTaskDialog';
import { ShadowPenalty } from '@/components/punishment';
import {
  Brain,
  Dumbbell,
  Heart,
  BookOpen,
  Award,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  EyeOff,
  Eye,
  Star,
  Sword,
  Zap,
  Target,
  TrendingUp,
  Plus
} from 'lucide-react';
import { areAllDailyWinsCompleted, isSameDay } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const [user, tasks, updateStreak, checkResetDailyWins] = useSoloLevelingStore(
    state => [state.user, state.tasks, state.updateStreak, state.checkResetDailyWins]
  );
  const { toast } = useToast();
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const isMobile = useIsMobile();

  // Check for day change periodically
  useEffect(() => {
    // Function to check if the day has changed
    const checkDateChange = () => {
      const now = new Date();
      if (!isSameDay(now, currentDate)) {
        setCurrentDate(now);
      }
    };

    // Check date change every minute
    const dateCheckInterval = setInterval(checkDateChange, 60000);

    return () => clearInterval(dateCheckInterval);
  }, [currentDate]);

  useEffect(() => {
    // Update streak on page load
    updateStreak();

    // Check if daily wins need to be reset
    checkResetDailyWins();

    // Set up a daily reset check
    const checkReset = () => {
      checkResetDailyWins();
    };

    // Check for reset every time the page becomes visible
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkReset();

        // Also check if day has changed
        const now = new Date();
        if (!isSameDay(now, currentDate)) {
          setCurrentDate(now);
        }
      }
    });

    return () => {
      document.removeEventListener('visibilitychange', checkReset);
    };
  }, [updateStreak, checkResetDailyWins, currentDate]);

  // Memoize task filtering to prevent unnecessary recalculations
  const incompleteTasks = useMemo(() => {
    return tasks.filter(task => {
      const isForToday = task.scheduledFor ?
        isSameDay(new Date(task.scheduledFor), currentDate) :
        isSameDay(new Date(task.createdAt), currentDate);
      return !task.completed && isForToday;
    });
  }, [tasks, currentDate]);

  // Memoize completed tasks filtering
  const completedTasks = useMemo(() => {
    return tasks.filter(task => {
      // Check if task was completed today
      const wasCompletedToday = task.completedAt ?
        isSameDay(new Date(task.completedAt), currentDate) :
        false;

      // Show any task that was completed today
      return task.completed && wasCompletedToday;
    });
  }, [tasks, currentDate]);

  const currentDailyWins = user.dailyWins;
  const allDailyWinsCompleted = areAllDailyWinsCompleted(currentDailyWins);

  // Format date for hero section
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      {/* Hero Section with Stats Overview */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-solo-primary/20 to-solo-secondary/20 border border-gray-800/50 shadow-lg">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.6))]"></div>
        <div className="relative p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold">
                Welcome, <span className="bg-clip-text text-transparent bg-gradient-to-r from-solo-primary to-solo-secondary glow-text">{user.name || "Hunter"}</span>
              </h1>
              <p className="text-gray-400">{formatDate(currentDate)}</p>
            </div>

            <div className="flex flex-wrap gap-2 md:gap-4">
              {/* Removed quick action buttons: Quests, Planner, Add Task */}
            </div>
          </div>
        </div>
      </div>

      {/* Shadow Penalty Status */}
      <ShadowPenalty />

      {/* Daily Wins Section with Enhanced Visual Design */}
      <Card className="border-gray-800/50 bg-solo-dark/90 shadow-md overflow-hidden">
        <CardHeader className="pb-3 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-solo-primary to-solo-secondary"></div>
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-solo-primary to-solo-secondary bg-clip-text text-transparent drop-shadow-glow">
            <Star className="h-5 w-5 sm:h-7 sm:w-7 text-yellow-400 drop-shadow-glow" />
            Daily <span className="text-solo-primary">Wins</span>
            {allDailyWinsCompleted && (
              <div className="ml-auto px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-solo-primary to-solo-secondary rounded-full text-white text-[10px] sm:text-xs animate-pulse-glow shadow-md">
                All completed!
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-3 px-3 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <div className="daily-win-container">
              <DailyWinCard
                category="mental"
                completed={currentDailyWins.mental}
                icon={<Brain size={isMobile ? 18 : 24} />}
              />
            </div>
            <div className="daily-win-container">
              <DailyWinCard
                category="physical"
                completed={currentDailyWins.physical}
                icon={<Dumbbell size={isMobile ? 18 : 24} />}
              />
            </div>
            <div className="daily-win-container">
              <DailyWinCard
                category="spiritual"
                completed={currentDailyWins.spiritual}
                icon={<Heart size={isMobile ? 18 : 24} />}
              />
            </div>
            <div className="daily-win-container">
              <DailyWinCard
                category="intelligence"
                completed={currentDailyWins.intelligence}
                icon={<BookOpen size={isMobile ? 18 : 24} />}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Tasks Section with Enhanced Design */}
      <Card className="border-gray-800/50 bg-solo-dark/90 shadow-md overflow-hidden">
        <CardHeader className="pb-3 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-glow">
              <Zap className="h-7 w-7 text-blue-400 drop-shadow-glow" />
              <span className="text-blue-400">Tasks</span>
            </CardTitle>
            <div className="flex gap-2">
              <Link to="/planner">
                <Button variant="outline" size="sm" className="gap-1 text-sm">
                  <CalendarDays className="h-4 w-4" />
                  {!isMobile && "Weekly Planner"}
                </Button>
              </Link>
              {isMobile ? (
                <AddTaskDialog>
                  <Button variant="default" size="sm" className="p-2">
                    <Plus className="h-4 w-4" />
                  </Button>
                </AddTaskDialog>
              ) : (
                <AddTaskDialog />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 px-2 sm:px-6">
          {incompleteTasks.length === 0 ? (
            <div className="bg-solo-dark/50 border border-gray-800/50 rounded-lg p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Zap className="h-8 w-8 text-blue-500/70" />
              </div>
              <p className="text-gray-400 mb-4 text-lg font-semibold">No active tasks. <span className="text-blue-400">Add new tasks</span> to start leveling up!</p>
              <div className="flex justify-center gap-4">
                {isMobile ? (
                  <AddTaskDialog>
                    <Button variant="default" size="sm" className="gap-1">
                      <Plus className="h-4 w-4" /> Add Task
                    </Button>
                  </AddTaskDialog>
                ) : (
                  <AddTaskDialog />
                )}
              </div>
            </div>
          ) : (
            <VirtualizedTaskList tasks={incompleteTasks} isCompleted={false} />
          )}
        </CardContent>
      </Card>

      {/* Completed Tasks Section with Enhanced Design */}
      <Card className="border-gray-800/50 bg-solo-dark/90 shadow-md overflow-hidden">
        <CardHeader className="pb-3 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400"></div>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-2xl font-extrabold tracking-tight bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-glow">
              <CheckSquare className="h-7 w-7 text-green-400 drop-shadow-glow" />
              <span className="text-green-400">Completed Tasks</span>
              {completedTasks.length > 0 && (
                <span className="ml-2 bg-green-500/20 text-green-500 text-xs px-2 py-1 rounded-full font-bold shadow-sm">
                  {completedTasks.length} task{completedTasks.length !== 1 ? 's' : ''}
                </span>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-gray-400 hover:text-white"
              onClick={() => setShowCompletedTasks(!showCompletedTasks)}
              disabled={completedTasks.length === 0}
            >
              {showCompletedTasks ? (
                <>
                <EyeOff className="h-4 w-4" />
                {!isMobile && "Hide completed"}
                </>
              ) : (
                <>
                <Eye className="h-4 w-4" />
                {!isMobile && "Show completed"}
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {completedTasks.length === 0 ? (
            <div className="bg-solo-dark/50 border border-gray-800/50 rounded-lg p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckSquare className="h-8 w-8 text-green-500/70" />
              </div>
              <p className="text-gray-400 text-lg font-semibold">No completed tasks for today yet. <span className="text-green-400">Keep up the good work!</span></p>
            </div>
          ) : showCompletedTasks && (
            <div className="animate-in fade-in-50 slide-in-from-top-2 duration-300">
              <VirtualizedTaskList tasks={completedTasks} isCompleted={true} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
