import React, { useEffect, useState } from 'react';
import { useSoloLevelingStore } from '@/lib/store';
import { TaskCard } from '@/components/ui/task-card';
import { CompletedTaskCard } from '@/components/ui/completed-task-card';
import { DailyWinCard } from '@/components/ui/daily-win-card';
import { AddTaskDialog } from '@/components/dashboard/AddTaskDialog';
import { Brain, Dumbbell, Heart, BookOpen, Award, CalendarDays, CheckSquare, ChevronDown, ChevronUp, EyeOff, Eye } from 'lucide-react';
import { areAllDailyWinsCompleted, isSameDay } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [user, tasks, updateStreak, checkResetDailyWins] = useSoloLevelingStore(
    state => [state.user, state.tasks, state.updateStreak, state.checkResetDailyWins]
  );
  const { toast } = useToast();
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  
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
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-solo-text">
          Welcome, <span className="text-solo-primary glow-text">Hunter</span>
        </h1>
        <div className="flex items-center gap-2">
          <div className="bg-solo-dark border border-gray-800 px-4 py-2 rounded-md flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-400" />
            <div className="flex flex-col">
              <span className="text-xs text-gray-400">Current Streak</span>
              <span className="font-semibold">{user.streakDays} days</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* User Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* <div className="md:col-span-1">
          <UserInfo />
        </div> */}
        <div className="md:col-span-4">
          {/* Daily Wins Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-solo-text">Daily Wins</h2>
              {allDailyWinsCompleted && (
                <div className="px-3 py-1 bg-gradient-to-r from-solo-primary to-solo-secondary rounded-full text-white text-sm animate-pulse-glow">
                  All daily wins completed!
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <DailyWinCard 
                category="mental" 
                completed={currentDailyWins.mental}
                icon={<Brain size={20} />}
              />
              <DailyWinCard 
                category="physical" 
                completed={currentDailyWins.physical}
                icon={<Dumbbell size={20} />}
              />
              <DailyWinCard 
                category="spiritual" 
                completed={currentDailyWins.spiritual}
                icon={<Heart size={20} />}
              />
              <DailyWinCard 
                category="intelligence" 
                completed={currentDailyWins.intelligence}
                icon={<BookOpen size={20} />}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Current Tasks Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-solo-text">Today's Tasks</h2>
          <div className="flex gap-2">
            <Link to="/planner">
              <Button variant="outline" size="sm" className="gap-1">
                <CalendarDays className="h-4 w-4" /> Weekly Planner
              </Button>
            </Link>
            <AddTaskDialog />
          </div>
        </div>
        
        {incompleteTasks.length === 0 ? (
          <div className="bg-solo-dark border border-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400 mb-4">No active tasks. Add new tasks to start leveling up!</p>
            <div className="flex justify-center gap-4">
              <AddTaskDialog />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incompleteTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>

      {/* Completed Tasks Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-solo-text">Today's Completed Tasks</h2>
            {completedTasks.length > 0 && (
              <span className="bg-green-500/20 text-green-500 text-xs px-2 py-1 rounded-full">
                {completedTasks.length} task{completedTasks.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
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
                Hide completed
                </>
              ) : (
                <>
                <Eye className="h-4 w-4" /> 
                Show completed
                </>
              )}
            </Button>
          </div>
          
        {completedTasks.length === 0 ? (
          <div className="bg-solo-dark border border-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400">No completed tasks for today yet. Keep up the good work!</p>
          </div>
        ) : showCompletedTasks && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in-50 slide-in-from-top-2 duration-300">
              {completedTasks.map((task) => (
              <CompletedTaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>
    </div>
  );
};

export default Index;
