import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, addWeeks, isSameDay, parseISO } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { useSoloLevelingStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { 
  PlusCircle, 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  CheckCircle2,
  AlertCircle,
  EyeOff,
  Eye,
  Plus,
  Check,
  Trophy,
  XCircle,
  AlertTriangle,
  CalendarClock
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { DailyWinCategory, Difficulty, Task, Stat } from '@/lib/types';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { getExpForDifficulty } from '@/lib/utils/calculations';
import { areAllDailyWinsCompleted, isDailyWinCompleted, hasPendingDailyWinTask, isAttributeLimitReached, getAttributeTaskCount } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DateTimePicker } from '@/components/ui/date-time-picker';

// Type guard to check if a string is a valid DailyWinCategory
const isDailyWinCategory = (category: string): category is DailyWinCategory => {
  return ['mental', 'physical', 'spiritual', 'intelligence'].includes(category);
};

const TaskDialog = ({ 
  isOpen, 
  onClose, 
  selectedDate, 
  editingTask = null,
  onDelete = null
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  selectedDate: Date;
  editingTask?: any;
  onDelete?: () => void;
}) => {
  const createTask = useSoloLevelingStore(state => state.createTask);
  const addTask = useSoloLevelingStore(state => state.addTask);
  const deleteTask = useSoloLevelingStore(state => state.deleteTask);
  const tasks = useSoloLevelingStore(state => state.tasks);
  const user = useSoloLevelingStore(state => state.user);
  
  const [title, setTitle] = React.useState(editingTask?.title || '');
  const [description, setDescription] = React.useState(editingTask?.description || '');
  const [difficulty, setDifficulty] = React.useState<Difficulty>(editingTask?.difficulty || 'medium');
  const [categoryType, setCategoryType] = React.useState<'dailyWin' | 'attribute'>(
    editingTask ? 
      (["mental", "physical", "spiritual", "intelligence"].includes(editingTask.category) ? 'dailyWin' : 'attribute') : 
      'dailyWin'
  );
  const [category, setCategory] = React.useState<string>(editingTask?.category || 'mental');
  const [deadline, setDeadline] = React.useState<Date | undefined>(editingTask?.deadline || new Date(Date.now() + 24 * 60 * 60 * 1000));
  
  // Daily win categories and attribute categories
  const dailyWinCategories = ["mental", "physical", "spiritual", "intelligence"];
  const attributeCategories = ["physical", "cognitive", "emotional", "spiritual", "social"];
  
  // Check if all daily wins are completed
  const allDailyWinsCompleted = areAllDailyWinsCompleted(user.dailyWins);
  
  // Inside TaskDialog component, add a new helper function to check if a date is today or in the past
  const isDateTodayOrPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate <= today;
  };
  
  // Modify the isSelectedCategoryCompleted check
  const isSelectedCategoryCompleted = (() => {
    if (categoryType !== 'dailyWin') return false;
    if (!['mental', 'physical', 'spiritual', 'intelligence'].includes(category)) return false;
    
    // Check both completed daily wins and pending tasks
    const isCompleted = isDateTodayOrPast(selectedDate) && isDailyWinCompleted(user.dailyWins, category as DailyWinCategory);
    const hasPending = hasPendingDailyWinTask(tasks, category as DailyWinCategory, selectedDate);
    
    return isCompleted || hasPending;
  })();
  
  // Modify the toast notifications effect
  React.useEffect(() => {
    if (isOpen && isDateTodayOrPast(selectedDate)) {
      if (allDailyWinsCompleted) {
        toast({
          title: "All Daily Wins Completed!",
          description: "You've completed all daily wins for today. You can still add attribute tasks.",
          variant: "default",
          className: "bg-green-500/20 border-green-500/30 text-green-500",
          duration: 1000
        });
      } else if (isSelectedCategoryCompleted) {
        toast({
          title: `${category.charAt(0).toUpperCase() + category.slice(1)} Win Completed!`,
          description: `You've already completed your ${category} daily win for today. Try another category or select attribute tasks.`,
          variant: "default",
          className: "bg-amber-500/20 border-amber-500/30 text-amber-500",
          duration: 1000
        });
      }
    }
  }, [isOpen, allDailyWinsCompleted, isSelectedCategoryCompleted, category, selectedDate]);
  
  // Reset category when category type changes
  React.useEffect(() => {
    if (categoryType === 'dailyWin') {
      setCategory('mental');
    } else {
      setCategory('physical');
    }
  }, [categoryType]);
  
  // Modify the auto-switch to attributes effect
  React.useEffect(() => {
    // Only auto-switch for today's tasks
    if (allDailyWinsCompleted && categoryType === 'dailyWin' && isSameDay(selectedDate, new Date())) {
      setCategoryType('attribute');
    }
  }, [allDailyWinsCompleted, categoryType, selectedDate]);
  
  const isTaskCompleted = editingTask?.completed || false;
  
  // Add a function to check if an attribute category is at its limit
  const isAttributeCategoryLimited = (cat: string) => {
    return isAttributeLimitReached(tasks, cat, selectedDate);
  };
  
  const handleSave = () => {
    const formData = {
      title,
      description,
      difficulty
    };
    
    if (!formData.title) {
      toast({
        title: "Error",
        description: "Please enter a task title",
        variant: "destructive",
        duration: 2000
      });
      return;
    }
    
    // Check for daily win limitations
    if (categoryType === 'dailyWin') {
      if (isDateTodayOrPast(selectedDate) && isDailyWinCompleted(user.dailyWins, category as DailyWinCategory)) {
        toast({
          title: `${category.charAt(0).toUpperCase() + category.slice(1)} Win Already Completed`,
          description: `You've already completed your ${category} daily win for today!`,
          variant: "destructive",
          duration: 2000
        });
        return;
      }
      
      if (hasPendingDailyWinTask(tasks, category as DailyWinCategory, selectedDate)) {
        toast({
          title: `${category.charAt(0).toUpperCase() + category.slice(1)} Win Already Planned`,
          description: `You already have a pending ${category} daily win task for this date. Complete it first or choose another category.`,
          variant: "destructive",
          duration: 2000
        });
        return;
      }
    } 
    // Check for attribute task limitations
    else if (categoryType === 'attribute') {
      if (isAttributeLimitReached(tasks, category, selectedDate)) {
        toast({
          title: `${category.charAt(0).toUpperCase() + category.slice(1)} Attribute Limit Reached`,
          description: `You can only add up to 5 ${category} attribute tasks per day. Try another attribute.`,
          variant: "destructive",
          duration: 2000
        });
        return;
      }
    }
    
    if (editingTask) {
      // Update the task
      // For type compatibility, cast daily win categories to DailyWinCategory, 
      // but for attributes, we must cast to any to bypass type checking
      const categoryToUse = categoryType === 'dailyWin' && isDailyWinCategory(category) 
        ? category 
        : category as any;
        
      const updatedTask = {
        ...editingTask,
        title: formData.title,
        description: formData.description,
        category: categoryToUse,
        difficulty: formData.difficulty as Difficulty,
        expReward: getExpForDifficulty(formData.difficulty as Difficulty),
        deadline: deadline
      };
      
      // Delete the old task
      deleteTask(editingTask.id);
      
      // Add the updated task
      addTask(updatedTask);
      
      toast({
        title: "Task updated",
        description: "Your task has been updated",
        duration: 1000
      });
    } else {
      // Create a new task
      // For type compatibility, cast daily win categories to DailyWinCategory, 
      // but for attributes, we must cast to any to bypass type checking
      const categoryToUse = categoryType === 'dailyWin' && isDailyWinCategory(category) 
        ? category 
        : category as any;
        
      const newTask: Task = {
        id: uuidv4(),
        title: formData.title,
        description: formData.description,
        completed: false,
        category: categoryToUse,
        difficulty: formData.difficulty as Difficulty,
        expReward: getExpForDifficulty(formData.difficulty as Difficulty),
        scheduledFor: selectedDate,
        createdAt: new Date(),
        deadline: deadline
      };
      
      // Add the new task
      addTask(newTask);
      
      toast({
        title: "Task scheduled",
        description: `Your task has been scheduled for ${format(selectedDate, 'PP')}`,
        duration: 1000
      });
    }
    
    setTitle('');
    setDescription('');
    setCategoryType('dailyWin');
    setCategory('mental');
    setDifficulty('medium');
    setDeadline(new Date(Date.now() + 24 * 60 * 60 * 1000));
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="backdrop-blur-xl bg-gray-900/40 border border-white/10 shadow-xl text-solo-text sm:max-w-[400px] w-[90%] p-3 sm:p-4 max-h-[85vh] overflow-y-auto rounded-xl before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-indigo-500/10 before:to-purple-500/5 before:backdrop-blur-xl before:-z-10">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base font-semibold text-white/90 tracking-wide">
            {editingTask ? (isTaskCompleted ? 'View Completed Task' : 'Edit Task') : 'Add Task'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-3 relative z-10">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-sm text-white/80 font-medium">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              className="border-white/10 bg-gray-800/50 backdrop-blur-sm h-8 focus:border-solo-primary/50 focus:ring-1 focus:ring-solo-primary/30 transition-all"
              disabled={isTaskCompleted}
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-sm text-white/80 font-medium">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              className="border-white/10 bg-gray-800/50 backdrop-blur-sm min-h-[50px] text-sm focus:border-solo-primary/50 focus:ring-1 focus:ring-solo-primary/30 transition-all"
              disabled={isTaskCompleted}
            />
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-sm text-white/80 font-medium">Category</Label>
            <div className="grid grid-cols-2 gap-0 rounded-md overflow-hidden border border-white/10 bg-gray-800/30 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => !isTaskCompleted && setCategoryType('attribute')}
                disabled={isTaskCompleted}
                className={cn(
                  "py-1 px-3 text-center transition-all duration-200 text-xs",
                  categoryType === 'attribute' 
                    ? "bg-gradient-to-r from-solo-primary/20 to-indigo-500/20 border-b-2 border-solo-primary font-medium text-solo-primary" 
                    : "text-gray-300 hover:bg-white/5 border-b-2 border-transparent",
                  isTaskCompleted && "opacity-50 cursor-not-allowed"
                )}
              >
                Attribute
              </button>
              <button
                type="button"
                onClick={() => !isTaskCompleted && (!isDateTodayOrPast(selectedDate) || !allDailyWinsCompleted) && setCategoryType('dailyWin')}
                disabled={isTaskCompleted || (isDateTodayOrPast(selectedDate) && allDailyWinsCompleted && categoryType !== 'dailyWin')}
                className={cn(
                  "py-1 px-3 text-center transition-all duration-200 text-xs",
                  categoryType === 'dailyWin' 
                    ? "bg-gradient-to-r from-solo-primary/20 to-indigo-500/20 border-b-2 border-solo-primary font-medium text-solo-primary" 
                    : "text-gray-300 hover:bg-white/5 border-b-2 border-transparent",
                  (isTaskCompleted || (isDateTodayOrPast(selectedDate) && allDailyWinsCompleted && categoryType !== 'dailyWin')) && "opacity-50 cursor-not-allowed"
                )}
              >
                Daily Win
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="difficulty" className="text-sm text-white/80 font-medium">Difficulty</Label>
              <Select 
                value={difficulty}
                onValueChange={(value) => !isTaskCompleted && setDifficulty(value as Difficulty)}
                disabled={isTaskCompleted}
              >
                <SelectTrigger id="difficulty" className="border-white/10 bg-gray-800/50 backdrop-blur-sm h-8 text-sm focus:ring-1 focus:ring-solo-primary/30 focus:border-solo-primary/50">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-gray-800/90 backdrop-blur-md">
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-sm text-white/80 font-medium">Type</Label>
              <Select 
                value={category} 
                onValueChange={(value) => !isTaskCompleted && setCategory(value as string)}
                disabled={isTaskCompleted}
              >
                <SelectTrigger id="category" className="border-white/10 bg-gray-800/50 backdrop-blur-sm h-8 text-sm focus:ring-1 focus:ring-solo-primary/30 focus:border-solo-primary/50">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-gray-800/90 backdrop-blur-md">
                  {categoryType === 'dailyWin' ? (
                    // Daily Win Categories
                    <>
                      {dailyWinCategories.map((cat) => {
                        const isCompleted = isDateTodayOrPast(selectedDate) && isDailyWinCompleted(user.dailyWins, cat as DailyWinCategory);
                        const hasPending = hasPendingDailyWinTask(tasks, cat as DailyWinCategory, selectedDate);
                        const isDisabled = isCompleted || hasPending;
                        
                        return (
                          <SelectItem 
                            key={cat}
                            value={cat} 
                            disabled={isDisabled}
                            className={cn("text-sm", isDisabled ? "opacity-50" : "")}
                          >
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}{' '}
                            {isCompleted ? "✓" : hasPending ? "(Pending)" : ""}
                          </SelectItem>
                        );
                      })}
                    </>
                  ) : (
                    // Attribute Categories
                    <>
                      {attributeCategories.map((cat) => {
                        const isLimited = isAttributeCategoryLimited(cat);
                        return (
                          <SelectItem 
                            key={cat} 
                            value={cat} 
                            disabled={isLimited}
                            className={cn("text-sm", isLimited ? "opacity-50" : "")}
                          >
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}{' '}
                            {isLimited ? `(Limit: 5/5)` : `(${getAttributeTaskCount(tasks, cat, selectedDate)}/5)`}
                          </SelectItem>
                        );
                      })}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-sm text-white/80 font-medium">Deadline</Label>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-indigo-300 flex items-center">
                <CalendarClock className="h-3 w-3 mr-1" /> Automatic deadline enforcement
              </div>
            </div>
            
            <DateTimePicker 
              date={deadline || new Date(Date.now() + 24 * 60 * 60 * 1000)}
              setDate={setDeadline}
              className="mt-2"
              disabled={isTaskCompleted}
            />
            <p className="text-xs text-gray-400 mt-1">
              Missing a deadline will automatically apply Shadow Penalty, reducing EXP reward by 50%.
            </p>
          </div>
          
          {!isTaskCompleted && (
            <div className="flex justify-between pt-2">
              {/* Delete button on the left side */}
            {editingTask && onDelete && (
              <Button 
                variant="destructive" 
                  size="sm"
                onClick={onDelete}
                  type="button"
                  className="h-8 text-xs bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-red-400"
              >
                  Delete Task
                </Button>
              )}
              
              {/* If there's no delete function, this creates an empty space */}
              {(!editingTask || !onDelete) && <div></div>}
              
              {/* Update/Add button on the right side */}
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-solo-primary to-indigo-600 hover:from-solo-primary/90 hover:to-indigo-600/90 h-8 text-xs shadow-md shadow-indigo-500/20"
                disabled={categoryType === 'dailyWin' && isSelectedCategoryCompleted}
              >
                {editingTask ? 'Update Task' : 'Add Task'}
              </Button>
            </div>
            )}
        </form>
        
        {isTaskCompleted && (
          <div className="flex justify-center pt-2">
            <Button
              variant="secondary"
              onClick={onClose}
              type="button"
              className="h-8 text-xs bg-white/5 border border-white/10 hover:bg-white/10 backdrop-blur-sm"
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const TaskCard = ({ task, onClick }: { task: any; onClick: () => void }) => {
  return (
    <div 
      onClick={onClick}
      className="text-sm p-2 rounded bg-gray-800/50 border border-gray-700 cursor-pointer hover:border-solo-primary/50 hover:bg-gray-800/80 transition-all"
    >
      <div className="font-medium truncate">{task.title}</div>
      <div className="text-xs text-gray-400 mt-1">
        {task.category} • {task.expReward} EXP
      </div>
    </div>
  );
};

const DayDialog = ({ 
  isOpen, 
  onClose, 
  date,
  tasks,
  onAddTask,
  onEditTask
}: { 
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  tasks: any[];
  onAddTask: () => void;
  onEditTask: (task: any) => void;
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {format(date, 'EEEE, MMMM d')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {tasks.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p>No tasks scheduled for this day.</p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-4"
                onClick={onAddTask}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => (
                <div 
                  key={task.id}
                  className="p-3 rounded-lg border border-gray-800 bg-gray-900/50 hover:border-solo-primary/50 cursor-pointer transition-all"
                  onClick={() => onEditTask(task)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-gray-400 mt-1">{task.description}</p>
                      )}
                    </div>
                    <span className="text-solo-primary text-sm font-medium">
                      {task.expReward} EXP
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <span className="capitalize">{task.category}</span>
                  </div>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={onAddTask}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Another Task
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Custom calendar component that doesn't highlight today
const PlannerCalendar = ({ selected, onSelect, className }: { 
  selected?: Date; 
  onSelect?: (date?: Date) => void;
  className?: string;
}) => {
  const defaultDate = new Date(); // Use the current date as default
  
  return (
    <Calendar
      mode="single"
      selected={selected || defaultDate}
      onSelect={onSelect}
      initialFocus
      className={className}
      classNames={{
        day_today: "bg-blue-100/10 text-blue-400 rounded-md", // Highlight today with subtle blue
        day_selected: "bg-indigo-600 text-white hover:bg-indigo-600 hover:text-white focus:bg-indigo-600 focus:text-white"
      }}
      defaultMonth={selected || defaultDate} // Use current month or selected month
    />
  );
};

const Planner = () => {
  // Use the current date as the default selected date
  const today = new Date();
  
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [weekStartDate, setWeekStartDate] = useState<Date>(startOfWeek(today, { weekStartsOn: 1 }));
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isDayDialogOpen, setIsDayDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Initialize hiddenDays with all dates hidden by default
  const [hiddenDays, setHiddenDays] = useState<Record<string, boolean>>({});
  
  // Add state for congratulation dialog
  const [showCongratulationsDialog, setShowCongratulationsDialog] = useState(false);
  const [hasShownCongratulationsForWeek, setHasShownCongratulationsForWeek] = useState(false);

  const tasks = useSoloLevelingStore(state => state.tasks);
  const deleteTask = useSoloLevelingStore(state => state.deleteTask);

  // Initialize hidden state for new days
  React.useEffect(() => {
    const weekDatesArray = getWeekDates();
    const newHiddenState = { ...hiddenDays };
    let hasChanges = false;

    weekDatesArray.forEach(date => {
      const dateString = date.toISOString();
      if (newHiddenState[dateString] === undefined) {
        newHiddenState[dateString] = true; // Default to hidden
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setHiddenDays(newHiddenState);
    }
    
    // Reset the congratulations state when week changes
    setHasShownCongratulationsForWeek(false);
  }, [weekStartDate]);
  
  // Check if all days in the week have at least one task and none of the days have completed tasks
  const checkIfAllDaysHaveTasks = () => {
    const weekDatesArray = getWeekDates();
    
    // Check if all days in the week have at least one task
    const allDaysHaveTasks = weekDatesArray.every(date => {
      const dayTasks = getAllDayTasks(date);
      return dayTasks.length > 0;
    });
    
    // Check if any day in the week has completed tasks
    const hasCompletedTasks = weekDatesArray.some(date => {
      const completedTasks = getCompletedDayTasks(date);
      return completedTasks.length > 0;
    });
    
    // Return true only if all days have tasks AND none of the days have completed tasks
    return allDaysHaveTasks && !hasCompletedTasks;
  };
  
  // Add effect to check if all days have tasks and show congratulations
  useEffect(() => {
    // Only check if we haven't shown congratulations for this week yet
    if (!hasShownCongratulationsForWeek) {
      const shouldShowCongratulations = checkIfAllDaysHaveTasks();
      
      if (shouldShowCongratulations) {
        // Set timeout to show the dialog after a short delay
        const timer = setTimeout(() => {
          setShowCongratulationsDialog(true);
          setHasShownCongratulationsForWeek(true);
        }, 500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [tasks, weekStartDate, hasShownCongratulationsForWeek]);

  const handleDeleteTask = () => {
    if (selectedTask) {
      deleteTask(selectedTask.id);
      toast({
        title: "Task deleted",
        description: "The task has been removed from your schedule"
      });
      setSelectedTask(null);
      setIsTaskDialogOpen(false);
    }
  };

  const getWeekDates = () => {
    // Generate 7 dates starting from the weekStartDate
    return Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setWeekStartDate(prevDate => 
      direction === 'next' 
        ? addWeeks(prevDate, 1) 
        : addWeeks(prevDate, -1)
    );
  };

  // Handle date selection from calendar
  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      // Set the selected date
      setSelectedDate(date);
      // Set the week start to the Monday of the selected date's week
      const newWeekStart = startOfWeek(date, { weekStartsOn: 1 });
      setWeekStartDate(newWeekStart);
      setCalendarOpen(false);
    }
  };

  // Get all tasks for a specific day
  const getAllDayTasks = (date: Date) => {
    return tasks.filter(task => 
      task.scheduledFor && 
      isSameDay(new Date(task.scheduledFor), date)
    );
  };

  // Get only incomplete tasks for a day
  const getIncompleteDayTasks = (date: Date) => {
    return tasks.filter(task => 
      task.scheduledFor && 
      isSameDay(new Date(task.scheduledFor), date) &&
      !task.completed
    );
  };

  // Get only completed tasks for a day
  const getCompletedDayTasks = (date: Date) => {
    return tasks.filter(task => 
      task.scheduledFor && 
      isSameDay(new Date(task.scheduledFor), date) &&
      task.completed
    );
  };

  const weekDates = getWeekDates();
  
  // Format date range like "Apr 27 - May 3, 2025"
  const dateRangeFormatted = () => {
    const startDate = weekDates[0];
    const endDate = weekDates[weekDates.length - 1];
    
    const startMonth = format(startDate, 'MMM');
    const startDay = format(startDate, 'd');
    
    const endMonth = format(endDate, 'MMM');
    const endDay = format(endDate, 'd');
    const endYear = format(endDate, 'yyyy');
    
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}, ${endYear}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${endYear}`;
    }
  };

  // Get the day name for a date (Monday, Tuesday, etc.)
  const getDayName = (date: Date) => {
    return format(date, 'EEEE');
  };
  
  // Toggle hidden state for a specific day
  const toggleDayVisibility = (dateString: string) => {
    setHiddenDays(prev => ({
      ...prev,
      [dateString]: !prev[dateString]
    }));
  };
  
  // Check if a day's tasks are hidden
  const isDayHidden = (dateString: string) => {
    return !!hiddenDays[dateString];
  };

  // Add a function to check if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return isSameDay(date, today);
  };

  return (
    <div className="space-y-4">
      {/* Date navigation header */}
      <div className="bg-gray-900 py-4 px-6 rounded-lg flex justify-between items-center">
        <button 
          onClick={() => navigateWeek('prev')}
          className="h-8 w-8 flex items-center justify-center rounded bg-gray-800 text-gray-300"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 text-xl font-medium text-white hover:text-solo-primary transition-colors">
              {dateRangeFormatted()}
              <CalendarIcon className="h-5 w-5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-gray-900 border border-gray-800" align="center">
            <div className="p-3">
              <div className="text-lg font-medium text-white mb-2">Select Date</div>
              <p className="text-sm text-gray-400 mb-3">Choose a date to plan your tasks</p>
              <PlannerCalendar
                selected={selectedDate}
                onSelect={handleCalendarSelect}
                className="border border-gray-800 rounded-md"
              />
        </div>
          </PopoverContent>
        </Popover>
        
        <button 
          onClick={() => navigateWeek('next')}
          className="h-8 w-8 flex items-center justify-center rounded bg-gray-800 text-gray-300"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekly Overview */}
      <div className="bg-gray-900 py-4 px-6 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-solo-text">Weekly Overview</h3>
          <p className="text-xs text-gray-400">Your planned tasks for this week</p>
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 hover:bg-blue-500/30 transition-colors">
                <CalendarIcon className="h-5 w-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-gray-900 border border-gray-800" align="end">
              <div className="p-3">
                <div className="text-lg font-medium text-white mb-2">Select Date</div>
                <p className="text-sm text-gray-400 mb-3">Choose a date to plan your tasks</p>
                <PlannerCalendar
                  selected={selectedDate}
                  onSelect={handleCalendarSelect}
                  className="border border-gray-800 rounded-md"
                />
                <div className="mt-4">
                  <Button
                    onClick={() => {
                      setIsTaskDialogOpen(true);
                    }}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Task
          </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-6 mt-4">
          {weekDates.map((date) => {
            const dateString = date.toISOString();
            const incompleteTasks = getIncompleteDayTasks(date);
            const completedTasks = getCompletedDayTasks(date);
            const allDayTasks = [...incompleteTasks, ...completedTasks];
            const isHidden = isDayHidden(dateString);
            const isTodayDate = isToday(date);
              
              return (
              <div key={dateString} className={cn(
                "pb-3",
                isTodayDate && "relative before:absolute before:-left-2 before:top-0 before:bottom-0 before:w-1 before:bg-indigo-500 before:rounded-full"
              )}>
                <div className={cn(
                  "flex justify-between items-center mb-3 p-2 rounded-lg transition-colors",
                  isTodayDate ? "bg-indigo-500/10 border border-indigo-500/30" : "hover:bg-gray-800/50"
                )}>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "h-6 w-6 flex items-center justify-center rounded-full",
                      isTodayDate ? "bg-indigo-500/30 text-indigo-400" : "bg-blue-500/20 text-blue-500"
                    )}>
                      <CalendarIcon className="h-4 w-4" />
                    </div>
                    <h4 className={cn(
                      "text-lg font-medium capitalize",
                      isTodayDate ? "text-indigo-300" : "text-white"
                    )}>
                      {getDayName(date)}
                      {isTodayDate && <span className="ml-2 text-xs bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full">Today</span>}
                    </h4>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Add Task button for this day */}
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                onClick={() => {
                        setSelectedTask(null);
                            setSelectedDate(date);
                            setIsTaskDialogOpen(true);
                          }}
                        >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Task
                    </Button>
                    
                    {/* Hide/Show button */}
                    {allDayTasks.length > 0 && (
                      <button
                        onClick={() => toggleDayVisibility(dateString)}
                        className="text-gray-400 hover:text-gray-300 p-1 rounded-full hover:bg-gray-800"
                      >
                        {isHidden ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
          </div>
          
                {!isHidden && (
                  <>
                    {allDayTasks.length === 0 ? (
                      <div className="pl-8 py-3 text-sm text-gray-500">
                        No tasks planned for {getDayName(date)}
                  </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Pending Tasks Section */}
                        {incompleteTasks.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-400 mb-2 ml-1">Pending Tasks</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {incompleteTasks.map(task => (
                        <div 
                          key={task.id}
                                  className="bg-gray-800/80 border border-gray-700 rounded-lg px-4 py-3 cursor-pointer hover:border-blue-500/30 transition-all"
                                  onClick={() => {
                            setSelectedTask(task);
                            setSelectedDate(date);
                            setIsTaskDialogOpen(true);
                          }}
                        >
                                  <div className="flex justify-between items-start">
                                    <span className="font-medium text-gray-200 truncate">{task.title}</span>
                                    <span className="ml-2 text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
                                      Pending
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-400 mt-1 truncate">
                                    {task.category}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                        )}
                        
                        {/* Completed Tasks Section */}
                        {completedTasks.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-400 mb-2 ml-1">Completed Tasks</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {completedTasks.map(task => {
                                // Check task completion status
                                const isMissed = task.missed === true;
                                const isLate = task.deadline && task.completedAt 
                                  ? new Date(task.completedAt) > new Date(task.deadline) 
                                  : false;
                                
                                return (
                                  <div 
                                    key={task.id}
                                    className={cn(
                                      "bg-gray-800/30 rounded-lg px-4 py-3 transition-all",
                                      isMissed 
                                        ? "border border-red-500/30" 
                                        : isLate
                                          ? "border border-orange-500/30"
                                          : "border border-green-500/30"
                                    )}
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="flex items-center">
                                        {isMissed ? (
                                          <XCircle className="h-4 w-4 text-red-500 mr-2" />
                                        ) : isLate ? (
                                          <AlertTriangle className="h-4 w-4 text-orange-500 mr-2" />
                                        ) : (
                                          <Check className="h-4 w-4 text-green-500 mr-2" />
                                        )}
                                        <span className="font-medium text-gray-400 truncate line-through">{task.title}</span>
                                      </div>
                                      <span className={cn(
                                        "ml-2 text-xs px-2 py-0.5 rounded-full",
                                        isMissed 
                                          ? "bg-red-500/20 text-red-400" 
                                          : isLate
                                            ? "bg-orange-500/20 text-orange-400"
                                            : "bg-green-500/20 text-green-400"
                                      )}>
                                        {isMissed ? "Missed" : isLate ? "Late" : "Completed"}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1 truncate pl-6">
                                      {task.category}
                                      {task.deadline && (
                                        <span className="ml-2">
                                          {new Date(task.deadline).toLocaleString([], { 
                                            month: 'short', 
                                            day: 'numeric', 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                          })}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
                </div>
              );
            })}
        </div>
      </div>

      <TaskDialog
        isOpen={isTaskDialogOpen}
        onClose={() => {
          setIsTaskDialogOpen(false);
          setSelectedTask(null);
        }}
        selectedDate={selectedDate}
        editingTask={selectedTask}
        onDelete={selectedTask && !selectedTask.completed ? handleDeleteTask : undefined}
      />

      <DayDialog
        isOpen={isDayDialogOpen}
        onClose={() => setIsDayDialogOpen(false)}
        date={selectedDate}
        tasks={getAllDayTasks(selectedDate)}
        onAddTask={() => {
          setIsDayDialogOpen(false);
          setIsTaskDialogOpen(true);
        }}
        onEditTask={(task) => {
          setSelectedTask(task);
          setIsDayDialogOpen(false);
          setIsTaskDialogOpen(true);
        }}
      />
      
      {/* Congratulations Dialog */}
      <Dialog open={showCongratulationsDialog} onOpenChange={setShowCongratulationsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl justify-center text-center gap-2 text-yellow-400">
              <Trophy className="h-6 w-6 text-yellow-400" />
              Congratulations!
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center space-y-4 py-4">
            <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Trophy className="h-10 w-10 text-yellow-400" />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-white">Perfect Week Planning!</h3>
              <p className="text-gray-300">
                You've successfully planned tasks for every day this week! Keep up the great work and stay consistent with your productivity.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={() => setShowCongratulationsDialog(false)}
              className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600"
            >
              Continue Planning
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Planner;
