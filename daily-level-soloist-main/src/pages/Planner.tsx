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
import { useIsMobile } from '@/hooks/use-mobile';

// Helper functions for color (move to top level)
const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy': return 'bg-blue-500 text-blue-500';
    case 'medium': return 'bg-purple-500 text-purple-500';
    case 'hard': return 'bg-red-500 text-red-500';
    case 'boss': return 'bg-yellow-500 text-yellow-500';
    default: return 'bg-gray-500 text-gray-500';
  }
};
const getCategoryColor = (category: string) => {
  switch (category) {
    case 'mental': return 'bg-purple-500 text-purple-500';
    case 'physical': return 'bg-blue-500 text-blue-500';
    case 'spiritual': return 'bg-teal-500 text-teal-500';
    case 'intelligence': return 'bg-amber-500 text-amber-500';
    case 'cognitive': return 'bg-pink-500 text-pink-500';
    case 'emotional': return 'bg-rose-500 text-rose-500';
    case 'social': return 'bg-green-500 text-green-500';
    default: return 'bg-gray-500 text-gray-500';
  }
};

// Gradient colors for categories
const getCategoryColorGradient = (category: string) => {
  switch (category) {
    case 'mental': return 'from-purple-400 to-purple-600';
    case 'physical': return 'from-blue-400 to-blue-600';
    case 'spiritual': return 'from-teal-400 to-teal-600';
    case 'intelligence': return 'from-amber-400 to-amber-600';
    case 'cognitive': return 'from-pink-400 to-pink-600';
    case 'emotional': return 'from-rose-400 to-rose-600';
    case 'social': return 'from-green-400 to-green-600';
    default: return 'from-gray-400 to-gray-600';
  }
};

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
  const [deadline, setDeadline] = React.useState<Date | undefined>(editingTask?.deadline || selectedDate);
  const [showReminderDialog, setShowReminderDialog] = React.useState(false);

  // Update form values when editingTask changes or dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setTitle(editingTask?.title || '');
      setDescription(editingTask?.description || '');
      setDifficulty(editingTask?.difficulty || 'medium');
      setCategoryType(
        editingTask ?
          (["mental", "physical", "spiritual", "intelligence"].includes(editingTask.category) ? 'dailyWin' : 'attribute') :
          'dailyWin'
      );
      setCategory(editingTask?.category || 'mental');
      setDeadline(editingTask?.deadline || selectedDate);
    }
  }, [isOpen, editingTask]);

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

    // If editing a task, skip reminder and create directly
    if (editingTask) {
      handleCreateTask();
      return;
    }

    // Show reminder dialog only for new tasks
    setShowReminderDialog(true);
  };

  // Function to actually create/update the task after reminder confirmation
  const handleCreateTask = () => {
    const formData = {
      title,
      description,
      difficulty
    };

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

      const updatedTask: Task = {
        id: uuidv4(), // Generate a new ID for consistency with home page editing
        title: formData.title,
        description: formData.description,
        completed: editingTask.completed,
        completedAt: editingTask.completedAt,
        category: categoryToUse,
        difficulty: formData.difficulty as Difficulty,
        expReward: getExpForDifficulty(formData.difficulty as Difficulty),
        createdAt: editingTask.createdAt,
        scheduledFor: editingTask.scheduledFor,
        deadline: deadline,
        missed: editingTask.missed
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
        title: "Task created",
        description: deadline
          ? `Your task has been created with a deadline of ${deadline.toLocaleString()}`
          : "Your task has been created successfully",
        duration: 2000
      });
    }

    setTitle('');
    setDescription('');
    setCategoryType('dailyWin');
    setCategory('mental');
    setDifficulty('medium');
    setDeadline(selectedDate);
    setShowReminderDialog(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="
          glassmorphism flex flex-col
          text-solo-text sm:max-w-[320px] w-[90vw] max-w-[280px] sm:max-w-[320px] p-2 sm:p-3 max-h-[85vh] overflow-hidden rounded-xl
          before:!absolute before:!inset-0 before:!rounded-xl
          before:!bg-gradient-to-br before:!from-indigo-500/10 before:!to-purple-500/5
          before:!backdrop-blur-xl before:!-z-10
        "
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="font-semibold text-white/90 tracking-wide text-base">
            {editingTask ? 'Edit Task' : 'Add New Task'}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 pr-1">
          <form onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }} className="space-y-1.5 sm:space-y-2 pt-1 sm:pt-1.5 relative z-10">
          <div className="space-y-0.5 sm:space-y-1">
            <Label htmlFor="title" className="text-white/80 font-medium text-xs sm:text-sm">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              className="border-indigo-500/20 bg-gray-800/90 h-7 sm:h-8 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all text-xs sm:text-sm"
              disabled={isTaskCompleted}
            />
          </div>

          <div className="space-y-0.5 sm:space-y-1">
            <Label htmlFor="description" className="text-white/80 font-medium text-xs sm:text-sm">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              className="border-indigo-500/20 bg-gray-800/90 min-h-[50px] focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all text-xs sm:text-sm"
              disabled={isTaskCompleted}
            />
          </div>

          <div className="space-y-0.5 sm:space-y-1">
            <Label className="text-white/80 font-medium text-sm">Category</Label>
            <div className="grid grid-cols-2 gap-0 rounded-md overflow-hidden border border-indigo-500/20 bg-gray-800/80">
              <button
                type="button"
                onClick={() => !isTaskCompleted && setCategoryType('attribute')}
                disabled={isTaskCompleted}
                className={cn(
                  "py-1 px-2 text-center transition-all duration-200 text-xs",
                  categoryType === 'attribute'
                    ? "bg-indigo-500/10 border-b-2 border-indigo-500 font-medium text-indigo-300"
                    : "text-gray-400 hover:bg-gray-800/50 border-b-2 border-transparent"
                )}
              >
                Attribute
              </button>
              <button
                type="button"
                onClick={() => !isTaskCompleted && !allDailyWinsCompleted && setCategoryType('dailyWin')}
                disabled={isTaskCompleted || (allDailyWinsCompleted && categoryType !== 'dailyWin')}
                className={cn(
                  "py-1 px-2 text-center transition-all duration-200 text-xs",
                  categoryType === 'dailyWin'
                    ? "bg-indigo-500/10 border-b-2 border-indigo-500 font-medium text-indigo-300"
                    : "text-gray-400 hover:bg-gray-800/50 border-b-2 border-transparent",
                  (allDailyWinsCompleted && categoryType !== 'dailyWin') && "opacity-50 cursor-not-allowed hover:bg-transparent"
                )}
              >
                Daily Win
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-0.5 sm:space-y-1">
              <Label htmlFor="difficulty" className="text-white/80 font-medium text-sm">Difficulty</Label>
              <Select
                value={difficulty}
                onValueChange={(value: Difficulty) => setDifficulty(value)}
                disabled={isTaskCompleted}
              >
                <SelectTrigger id="difficulty" className="border-indigo-500/20 bg-gray-800/90 h-7 text-xs focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent className="border-indigo-500/20 bg-gray-800/90">
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-0.5 sm:space-y-1">
              <Label htmlFor="category-select" className="text-white/80 font-medium text-sm">Type</Label>
              <Select
                value={category}
                onValueChange={(value) => setCategory(value)}
                disabled={isTaskCompleted}
              >
                <SelectTrigger
                  id="category-select"
                  className={cn(
                    "border-indigo-500/20 bg-gray-800/90 h-7 text-xs focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                  )}
                >
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="border-indigo-500/20 bg-gray-800/90">
                  {categoryType === 'dailyWin' ? (
                    // Daily Win Categories
                    dailyWinCategories.map(cat => (
                      <SelectItem
                        key={cat}
                        value={cat}
                        disabled={isDateTodayOrPast(selectedDate) &&
                          (isDailyWinCompleted(user.dailyWins, cat as DailyWinCategory) ||
                          hasPendingDailyWinTask(tasks, cat as DailyWinCategory, selectedDate))}
                      >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))
                  ) : (
                    // Attribute Categories
                    attributeCategories.map(cat => (
                      <SelectItem
                        key={cat}
                        value={cat}
                        disabled={isAttributeCategoryLimited(cat)}
                      >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-0.5 sm:space-y-1">
            <Label className="text-white/80 font-medium text-sm">Deadline</Label>
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs text-indigo-300 flex items-center">
                <CalendarClock className="h-3 w-3 mr-1" /> Automatic deadline enforcement
              </div>
            </div>
            <DateTimePicker
              date={deadline}
              setDate={setDeadline}
              disabled={isTaskCompleted}
              className="mt-1"
            />
            <p className="text-xs text-gray-400 mt-0.5">
              Missing a deadline will automatically apply Shadow Penalty, reducing EXP reward by 50%.
            </p>
          </div>

            <div className="pt-1.5 flex justify-between items-center">
              {editingTask && !isTaskCompleted && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={onDelete}
                  className="px-2 py-0.5 text-[10px]"
                >
                  Delete
                </Button>
              )}
              <Button
                type="submit"
                disabled={isTaskCompleted}
                className={cn(
                  "bg-indigo-500 hover:bg-indigo-600 text-white font-medium h-7 text-xs",
                  editingTask ? "px-4" : "w-full"
                )}
              >
                {editingTask ? 'Save Changes' : 'Create Task'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>

      {/* Deadline Reminder Dialog */}
      <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <DialogContent className="glassmorphism w-[90vw] max-w-[280px] sm:max-w-[400px] p-2 sm:p-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1 sm:gap-2 text-amber-300 text-sm sm:text-base">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
              Deadline Reminder
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 sm:space-y-4">
            <div className="p-2 sm:p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs sm:text-sm text-amber-200 mb-2 sm:mb-3">
                Before {editingTask ? 'updating' : 'creating'} your task, please double-check:
              </p>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-amber-100">
                <li className="flex items-center gap-1 sm:gap-2">
                  <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
                  Your deadline date is correct
                </li>
                <li className="flex items-center gap-1 sm:gap-2">
                  <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
                  Your deadline time is set properly
                </li>
                <li className="flex items-center gap-1 sm:gap-2">
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-amber-400" />
                  Missing deadlines apply Shadow Penalty (-50% EXP)
                </li>
              </ul>
            </div>

            <div className="p-2 sm:p-3 rounded-lg bg-gray-800/50 border border-gray-600">
              <p className="text-xs text-gray-300 mb-1 sm:mb-2">Current deadline:</p>
              <p className="text-xs sm:text-sm font-medium text-white">
                {deadline ? deadline.toLocaleString() : 'No deadline set'}
              </p>
            </div>

            <div className="flex gap-1 sm:gap-2">
              <Button
                variant="outline"
                onClick={() => setShowReminderDialog(false)}
                className="flex-1 h-7 sm:h-9 text-xs sm:text-sm"
              >
                Review Deadline
              </Button>
              <Button
                onClick={handleCreateTask}
                className="flex-1 bg-indigo-500 hover:bg-indigo-600 h-7 sm:h-9 text-xs sm:text-sm"
              >
                {editingTask ? 'Update Task' : 'Create Task'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

const TaskCard = ({ task, onClick }: { task: any; onClick: () => void }) => {
  const isMobile = useIsMobile();

  // Format deadline for display (same as home page task cards)
  const formatDeadline = (deadline: Date | undefined) => {
    if (!deadline) return null;

    const now = new Date();
    const deadlineDate = new Date(deadline);

    // Check if deadline is past (more precise comparison)
    const isPast = deadlineDate.getTime() <= now.getTime();

    // Calculate time remaining
    const timeRemaining = deadlineDate.getTime() - now.getTime();
    const hoursRemaining = timeRemaining / (1000 * 60 * 60);

    // Determine urgency level
    let urgencyLevel = "";
    if (isPast) {
      urgencyLevel = "overdue";
    } else if (hoursRemaining < 2) {
      urgencyLevel = "critical"; // Less than 2 hours
    } else if (hoursRemaining < 6) {
      urgencyLevel = "urgent"; // Less than 6 hours
    } else if (hoursRemaining < 24) {
      urgencyLevel = "warning"; // Less than 24 hours
    }

    // If deadline is today, show time only
    const isToday =
      deadlineDate.getDate() === now.getDate() &&
      deadlineDate.getMonth() === now.getMonth() &&
      deadlineDate.getFullYear() === now.getFullYear();

    if (isToday) {
      return {
        text: `Today at ${deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        isPast,
        urgencyLevel
      };
    }

    // If deadline is tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow =
      deadlineDate.getDate() === tomorrow.getDate() &&
      deadlineDate.getMonth() === tomorrow.getMonth() &&
      deadlineDate.getFullYear() === tomorrow.getFullYear();

    if (isTomorrow) {
      return {
        text: `Tomorrow at ${deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        isPast,
        urgencyLevel
      };
    }

    // Otherwise, show date and time
    return {
      text: `${deadlineDate.toLocaleDateString()} at ${deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      isPast,
      urgencyLevel
    };
  };

  const deadlineInfo = formatDeadline(task.deadline);

  return (
    <div
      onClick={onClick}
      className={
        `relative rounded-xl border bg-solo-dark p-4 transition-all cursor-pointer flex flex-col shadow-md overflow-hidden
        hover:border-solo-primary hover:shadow-lg group`
      }
    >
      {/* Colored left accent bar */}
      <div className={`absolute left-0 top-0 h-full w-1.5 rounded-l-md ${getDifficultyColor(task.difficulty)}`}></div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 mb-1">
          {/* Difficulty badge */}
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase ${getDifficultyColor(task.difficulty)} bg-opacity-20 bg-solo-primary/10`}>
            <span className="w-2 h-2 rounded-full mr-1" style={{ background: 'currentColor' }}></span>
            {task.difficulty}
          </span>
          {/* Category badge */}
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold capitalize ${getCategoryColor(task.category)} bg-opacity-20 bg-solo-primary/10 ml-1`}>
            {task.category}
          </span>
        </div>
        {/* Title with gradient and shadow */}
        <div className="font-extrabold text-sm md:text-base bg-gradient-to-r from-solo-primary to-solo-secondary bg-clip-text text-transparent drop-shadow-glow truncate">
          {task.title}
        </div>
        {/* Description */}
        {task.description && (
          <div className="text-xs text-gray-400 mt-1 line-clamp-1 italic">{task.description}</div>
        )}
        {/* EXP, Deadline, and Details */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-md text-[10px] sm:text-xs">
            +{task.expReward} EXP
          </span>
          {deadlineInfo && (
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] sm:text-xs ${
              // Color based on urgency level (same as home page)
              deadlineInfo.urgencyLevel === "overdue" ? "bg-red-600/20 text-red-400" :
              deadlineInfo.urgencyLevel === "critical" ? "bg-orange-600/20 text-orange-400" :
              deadlineInfo.urgencyLevel === "urgent" ? "bg-yellow-600/20 text-yellow-400" :
              deadlineInfo.urgencyLevel === "warning" ? "bg-blue-600/20 text-blue-400" :
              "bg-indigo-500/10 text-indigo-300"
            }`}>
              {!isMobile && <CalendarClock className="h-3 w-3" />}
              {deadlineInfo.text}
            </span>
          )}
        </div>
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
      <DialogContent className="sm:max-w-[400px] max-h-[80vh] w-[90%] p-4 overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg">
            {format(date, 'EEEE, MMMM d')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {tasks.length === 0 ? (
            <div className="text-center text-gray-400 py-6">
              <p>No tasks scheduled for this day.</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={onAddTask}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className="p-2.5 rounded-lg border border-gray-800 bg-gray-900/50 hover:border-solo-primary/50 cursor-pointer transition-all"
                  onClick={() => onEditTask({...task})}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-sm">{task.title}</h3>
                      {task.description && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{task.description}</p>
                      )}
                    </div>
                    <span className="text-solo-primary text-[10px] sm:text-xs font-medium">
                      {task.expReward} EXP
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] sm:text-xs text-gray-500">
                    <span className="capitalize">{task.category}</span>
                    {(() => {
                      // Format deadline for display (same logic as TaskCard)
                      const formatDeadline = (deadline: Date | undefined) => {
                        if (!deadline) return null;
                        const now = new Date();
                        const deadlineDate = new Date(deadline);
                        const isToday = deadlineDate.getDate() === now.getDate() &&
                          deadlineDate.getMonth() === now.getMonth() &&
                          deadlineDate.getFullYear() === now.getFullYear();

                        if (isToday) {
                          return `Today at ${deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                        }

                        const tomorrow = new Date(now);
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        const isTomorrow = deadlineDate.getDate() === tomorrow.getDate() &&
                          deadlineDate.getMonth() === tomorrow.getMonth() &&
                          deadlineDate.getFullYear() === tomorrow.getFullYear();

                        if (isTomorrow) {
                          return `Tomorrow at ${deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                        }

                        return `${deadlineDate.toLocaleDateString()} at ${deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                      };

                      const deadlineText = formatDeadline(task.deadline);
                      return deadlineText ? (
                        <>
                          <span>•</span>
                          <span className="text-indigo-300">
                            {deadlineText}
                          </span>
                        </>
                      ) : null;
                    })()}
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 py-1.5 text-xs"
                onClick={onAddTask}
              >
                <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
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
  const isMobile = useIsMobile();

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
      // Check if task deadline has passed
      if (selectedTask.deadline && new Date(selectedTask.deadline) <= new Date()) {
        toast({
          title: "Cannot Delete Task",
          description: "This task cannot be deleted because its deadline has passed.",
          variant: "destructive"
        });
        return;
      }

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

    // Check if we're on a small screen (using window.innerWidth for client-side detection)
    const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 640; // sm breakpoint in Tailwind

    if (isSmallScreen) {
      // More compact format for mobile: "May 12-18"
      if (startMonth === endMonth) {
        return `${startMonth} ${startDay}-${endDay}`;
      } else {
        return `${startMonth} ${startDay}-${endMonth} ${endDay}`;
      }
    } else {
      // Regular format for larger screens
      if (startMonth === endMonth) {
        return `${startMonth} ${startDay} - ${endDay}, ${endYear}`;
      } else {
        return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${endYear}`;
      }
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
    <div className="space-y-2 w-full px-0">
      {/* Date navigation header */}
      <div className="bg-gray-900 py-2 md:py-3 px-3 md:px-4 rounded-md flex justify-between items-center overflow-hidden">
        <button
          onClick={() => navigateWeek('prev')}
          className="h-7 w-7 md:h-8 md:w-8 flex items-center justify-center rounded bg-gray-800 text-gray-300"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1 md:gap-2 text-sm md:text-lg lg:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-solo-primary to-solo-secondary bg-clip-text text-transparent drop-shadow-glow hover:scale-105 transition-transform">
              <span className="text-xs sm:text-sm md:text-lg lg:text-2xl">{dateRangeFormatted()}</span>
              <CalendarIcon className="h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 text-solo-primary drop-shadow-glow" />
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
              <div className="mt-4">
                <Button
                  onClick={() => {
                    setIsTaskDialogOpen(true);
                    setCalendarOpen(false);
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

        <button
          onClick={() => navigateWeek('next')}
          className="h-7 w-7 md:h-8 md:w-8 flex items-center justify-center rounded bg-gray-800 text-gray-300"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekly Overview */}
      <div className="bg-gray-900 py-3 px-3 md:px-4 rounded-md">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xl md:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-solo-primary to-solo-secondary bg-clip-text text-transparent drop-shadow-glow flex items-center gap-1 md:gap-2">
            <CalendarDays className="h-5 w-5 md:h-7 md:w-7 text-solo-primary drop-shadow-glow" />
            <span>Weekly Overview</span>
          </h3>
          <p className="hidden md:block text-sm text-gray-400 font-medium italic">Your planned tasks for this week</p>
        </div>

        <div className="space-y-4 mt-3">
          {weekDates.map((date) => {
            const dateString = date.toISOString();
            const incompleteTasks = getIncompleteDayTasks(date);
            const completedTasks = getCompletedDayTasks(date);
            const allDayTasks = [...incompleteTasks, ...completedTasks];
            const isHidden = isDayHidden(dateString);
            const isTodayDate = isToday(date);

              return (
              <div key={dateString} className={cn(
                "pb-2",
                isTodayDate && "relative before:absolute before:-left-2 before:top-0 before:bottom-0 before:w-1 before:bg-indigo-500 before:rounded-full"
              )}>
                <div className={cn(
                  "flex justify-between items-center mb-2 p-1.5 rounded-md transition-colors",
                  isTodayDate ? "bg-indigo-500/10 border border-indigo-500/30" : "hover:bg-gray-800/50"
                )}>
                  <div className="flex items-center gap-1 md:gap-2">
                    <div className={cn(
                      "hidden md:flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded-full",
                      isTodayDate ? "bg-indigo-500/30 text-indigo-400" : "bg-blue-500/20 text-blue-500"
                    )}>
                      <CalendarIcon className="h-3 w-3 md:h-4 md:w-4" />
                    </div>
                    <h4 className={cn(
                      "text-lg md:text-xl font-bold capitalize tracking-tight flex items-center gap-1 md:gap-2 bg-gradient-to-r from-solo-primary to-solo-secondary bg-clip-text text-transparent drop-shadow-glow",
                      isTodayDate ? "text-indigo-300" : ""
                    )}>
                      {getDayName(date)}
                      {isTodayDate && <span className="ml-1 text-xs bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full font-semibold shadow">Today</span>}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Add Task button for this day */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                      onClick={() => {
                        setSelectedTask(null);
                        setSelectedDate(date);
                        setIsTaskDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1 md:mr-1" />
                      <span className="hidden md:inline">Add Task</span>
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
                      <div className="pl-3 py-2 text-sm text-gray-500">
                        No tasks planned for {getDayName(date)}
                      </div>
                    ) : (
                      <div className="space-y-3 px-1">
                        {/* Pending Tasks Section */}
                        {incompleteTasks.length > 0 && (
                          <div>
                            <h5 className="text-sm font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-glow mb-1 ml-1 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 text-blue-400" /> Pending Tasks
                            </h5>
                            <div className="grid grid-cols-1 gap-1.5 md:gap-2">
                              {incompleteTasks.map(task => (
                                <div
                                  key={task.id}
                                  className="relative rounded-md border border-gray-700/50 bg-gradient-to-br from-gray-800/90 to-gray-900/80 overflow-hidden cursor-pointer hover:border-blue-400/50 hover:shadow-lg transition-all duration-200 shadow-md group"
                                  onClick={() => {
                                    setSelectedTask({...task});
                                    setSelectedDate(date);
                                    setIsTaskDialogOpen(true);
                                  }}
                                >
                                  {/* Colored left accent bar with gradient */}
                                  <div className={`absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b ${getCategoryColorGradient(task.category)}`}></div>

                                  <div className="flex flex-col p-3 pl-4 group-hover:translate-x-0.5 transition-transform duration-200">
                                    {/* Header with category and due date */}
                                    <div className="flex justify-between items-center mb-2">
                                      <span className={`text-[10px] sm:text-xs font-medium capitalize ${getCategoryColor(task.category)} bg-clip-text text-transparent`}>
                                        {task.category}
                                      </span>

                                      <div className="flex items-center gap-2">
                                        {(() => {
                                          // Format deadline for display (same logic as TaskCard)
                                          const formatDeadline = (deadline: Date | undefined) => {
                                            if (!deadline) return null;
                                            const now = new Date();
                                            const deadlineDate = new Date(deadline);

                                            // Calculate urgency level
                                            const timeRemaining = deadlineDate.getTime() - now.getTime();
                                            const hoursRemaining = timeRemaining / (1000 * 60 * 60);
                                            let urgencyLevel = "";
                                            if (deadlineDate.getTime() <= now.getTime()) {
                                              urgencyLevel = "overdue";
                                            } else if (hoursRemaining < 2) {
                                              urgencyLevel = "critical";
                                            } else if (hoursRemaining < 6) {
                                              urgencyLevel = "urgent";
                                            } else if (hoursRemaining < 24) {
                                              urgencyLevel = "warning";
                                            }

                                            const isToday = deadlineDate.getDate() === now.getDate() &&
                                              deadlineDate.getMonth() === now.getMonth() &&
                                              deadlineDate.getFullYear() === now.getFullYear();

                                            if (isToday) {
                                              return {
                                                text: `Today at ${deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                                                urgencyLevel
                                              };
                                            }

                                            const tomorrow = new Date(now);
                                            tomorrow.setDate(tomorrow.getDate() + 1);
                                            const isTomorrow = deadlineDate.getDate() === tomorrow.getDate() &&
                                              deadlineDate.getMonth() === tomorrow.getMonth() &&
                                              deadlineDate.getFullYear() === tomorrow.getFullYear();

                                            if (isTomorrow) {
                                              return {
                                                text: `Tomorrow at ${deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                                                urgencyLevel
                                              };
                                            }

                                            return {
                                              text: `${deadlineDate.toLocaleDateString()} at ${deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                                              urgencyLevel
                                            };
                                          };

                                          const deadlineInfo = formatDeadline(task.deadline);
                                          return deadlineInfo ? (
                                            <span className={`text-[10px] sm:text-xs flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold ${
                                              deadlineInfo.urgencyLevel === "overdue" ? "bg-red-600/20 text-red-400" :
                                              deadlineInfo.urgencyLevel === "critical" ? "bg-orange-600/20 text-orange-400" :
                                              deadlineInfo.urgencyLevel === "urgent" ? "bg-yellow-600/20 text-yellow-400" :
                                              deadlineInfo.urgencyLevel === "warning" ? "bg-blue-600/20 text-blue-400" :
                                              "bg-indigo-500/10 text-indigo-300"
                                            }`}>
                                              {!isMobile && <CalendarClock className="h-3 w-3" />}
                                              {deadlineInfo.text}
                                            </span>
                                          ) : null;
                                        })()}

                                        <span className="flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900 shadow-sm">
                                          +{task.expReward} EXP
                                        </span>
                                      </div>
                                    </div>

                                    {/* Task title with improved styling */}
                                    <div className="font-bold text-lg bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-1 group-hover:from-blue-300 group-hover:to-indigo-300 transition-colors duration-200">
                                      {task.title}
                                    </div>

                                    {/* Description with improved styling */}
                                    {task.description && (
                                      <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-200">
                                        {task.description}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Completed Tasks Section */}
                        {completedTasks.length > 0 && (
                          <div>
                            <h5 className="text-sm font-semibold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-glow mb-1 ml-1 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-green-400" /> Completed Tasks
                            </h5>
                            <div className="grid grid-cols-1 gap-1.5 md:gap-2">
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
                                      "bg-gray-800/30 rounded-md px-2 py-1.5 md:px-3 md:py-2 transition-all",
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
                                          <XCircle className="h-3 w-3 md:h-3.5 md:w-3.5 text-red-500 mr-1.5" />
                                        ) : isLate ? (
                                          <AlertTriangle className="h-3 w-3 md:h-3.5 md:w-3.5 text-orange-500 mr-1.5" />
                                        ) : (
                                          <Check className="h-3 w-3 md:h-3.5 md:w-3.5 text-green-500 mr-1.5" />
                                        )}
                                        <span className="font-medium text-gray-400 truncate line-through text-sm md:text-base">{task.title}</span>
                                      </div>
                                      <span className={cn(
                                        "ml-1 text-xs px-1.5 py-0.5 rounded-full",
                                        isMissed
                                          ? "bg-red-500/20 text-red-400"
                                          : isLate
                                            ? "bg-orange-500/20 text-orange-400"
                                            : "bg-green-500/20 text-green-400"
                                      )}>
                                        {isMissed ? "Missed" : isLate ? "Late" : "Completed"}
                                      </span>
                                    </div>
                                    {task.description && (
                                      <div className="text-xs text-gray-500 truncate pl-5 line-through">{task.description}</div>
                                    )}
                                    <div className="text-[10px] sm:text-xs text-gray-500 truncate pl-5">
                                      {task.category}
                                      {(() => {
                                        // Format deadline for display (same logic as TaskCard)
                                        const formatDeadline = (deadline: Date | undefined) => {
                                          if (!deadline) return null;
                                          const now = new Date();
                                          const deadlineDate = new Date(deadline);
                                          const isToday = deadlineDate.getDate() === now.getDate() &&
                                            deadlineDate.getMonth() === now.getMonth() &&
                                            deadlineDate.getFullYear() === now.getFullYear();

                                          if (isToday) {
                                            return `Today at ${deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                                          }

                                          const tomorrow = new Date(now);
                                          tomorrow.setDate(tomorrow.getDate() + 1);
                                          const isTomorrow = deadlineDate.getDate() === tomorrow.getDate() &&
                                            deadlineDate.getMonth() === tomorrow.getMonth() &&
                                            deadlineDate.getFullYear() === tomorrow.getFullYear();

                                          if (isTomorrow) {
                                            return `Tomorrow at ${deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                                          }

                                          return `${deadlineDate.toLocaleDateString()} at ${deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                                        };

                                        const deadlineText = formatDeadline(task.deadline);
                                        return deadlineText ? (
                                          <span className="ml-1">
                                            {deadlineText}
                                          </span>
                                        ) : null;
                                      })()}
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
        onDelete={selectedTask && !selectedTask.completed && !(selectedTask.deadline && new Date(selectedTask.deadline) <= new Date()) ? handleDeleteTask : undefined}
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
          setSelectedTask({...task});
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
