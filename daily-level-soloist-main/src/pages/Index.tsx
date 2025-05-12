import React, { useEffect, useState } from 'react';
import { useSoloLevelingStore } from '@/lib/store';
import { TaskCard } from '@/components/ui/task-card';
import { CompletedTaskCard } from '@/components/ui/completed-task-card';
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
  
  // Filter tasks that are either not scheduled for a specific date
  // or are scheduled for today
  const incompleteTasks = tasks.filter(task => {
    const isForToday = task.scheduledFor ? 
      isSameDay(new Date(task.scheduledFor), currentDate) : 
      isSameDay(new Date(task.createdAt), currentDate);
    return !task.completed && isForToday;
  });
  
  // Filter completed tasks for today - show ALL tasks completed today, including those from weekly planner
  const completedTasks = tasks.filter(task => {
    // Check if task was completed today
    const wasCompletedToday = task.completedAt ? 
      isSameDay(new Date(task.completedAt), currentDate) : 
      false;
    
    // Show any task that was completed today
    return task.completed && wasCompletedToday;
  });
  
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
              <div className="flex items-center gap-2 mt-2">
                <div className="bg-solo-dark/70 border border-gray-800/50 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                  <Target size={14} className="text-solo-primary" />
                  <span className="text-xs">Level {user.level}</span>
                </div>
                <div className="bg-solo-dark/70 border border-gray-800/50 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                  <Award size={14} className="text-yellow-500" />
                  <span className="text-xs">{user.rank} Rank</span>
                </div>
                <div className="bg-solo-dark/70 border border-gray-800/50 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                  <TrendingUp size={14} className="text-green-500" />
                  <span className="text-xs">{user.streakDays} Day Streak</span>
                </div>
              </div>
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
          <CardTitle className="flex items-center gap-2 text-2xl font-extrabold tracking-tight bg-gradient-to-r from-solo-primary to-solo-secondary bg-clip-text text-transparent drop-shadow-glow">
            <Star className="h-7 w-7 text-yellow-400 drop-shadow-glow" />
            Daily <span className="text-solo-primary">Wins</span>
            {allDailyWinsCompleted && (
              <div className="ml-auto px-3 py-1 bg-gradient-to-r from-solo-primary to-solo-secondary rounded-full text-white text-xs animate-pulse-glow shadow-md">
                All daily wins completed!
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <DailyWinCard 
              category="mental" 
              completed={currentDailyWins.mental}
              icon={<Brain size={24} />}
            />
            <DailyWinCard 
              category="physical" 
              completed={currentDailyWins.physical}
              icon={<Dumbbell size={24} />}
            />
            <DailyWinCard 
              category="spiritual" 
              completed={currentDailyWins.spiritual}
              icon={<Heart size={24} />}
            />
            <DailyWinCard 
              category="intelligence" 
              completed={currentDailyWins.intelligence}
              icon={<BookOpen size={24} />}
            />
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
              Today's <span className="text-blue-400">Tasks</span>
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
        <CardContent className="pt-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incompleteTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in-50 slide-in-from-top-2 duration-300">
              {completedTasks.map((task) => (
                <CompletedTaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
