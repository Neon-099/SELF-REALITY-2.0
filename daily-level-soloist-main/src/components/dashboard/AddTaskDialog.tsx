import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Difficulty, DailyWinCategory, Task } from '@/lib/types';
import { useSoloLevelingStore } from '@/lib/store';
import { Plus, Clock, CalendarClock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { areAllDailyWinsCompleted, isDailyWinCompleted, hasPendingDailyWinTask, isAttributeLimitReached, getAttributeTaskCount } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { getExpForDifficulty } from '@/lib/utils/calculations';
import { Switch } from '@/components/ui/switch';
import { DateTimePicker } from '@/components/ui/date-time-picker';

interface AddTaskDialogProps {
  children?: React.ReactNode;
}

// Export as a named export and as default export to support both import styles
export const AddTaskDialog = ({ children }: AddTaskDialogProps) => {
  // Added this log to confirm component is refreshing
  console.log('AddTaskDialog rendered with glassmorphism styles - ' + new Date().toISOString());

  const addTask = useSoloLevelingStore(state => state.addTask);
  const createTask = useSoloLevelingStore(state => state.createTask);
  const { toast } = useToast();
  const user = useSoloLevelingStore(state => state.user);
  const tasks = useSoloLevelingStore(state => state.tasks);

  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [difficulty, setDifficulty] = React.useState<Difficulty>('medium');
  const [categoryType, setCategoryType] = React.useState<'dailyWin' | 'attribute'>('dailyWin');
  const [category, setCategory] = React.useState<string>('mental');
  const [hasDeadline, setHasDeadline] = React.useState(false);
  const [deadline, setDeadline] = React.useState<Date | undefined>(new Date());
  const [showReminderDialog, setShowReminderDialog] = React.useState(false);

  // Daily win categories and attribute categories
  const dailyWinCategories = ["mental", "physical", "spiritual", "intelligence"];
  const attributeCategories = ["physical", "cognitive", "emotional", "spiritual", "social"];

  // Check if all daily wins are completed
  const allDailyWinsCompleted = areAllDailyWinsCompleted(user.dailyWins);

  // Modify the isSelectedCategoryCompleted check to include pending tasks
  const isSelectedCategoryCompleted = (() => {
    if (categoryType !== 'dailyWin') return false;
    if (!['mental', 'physical', 'spiritual', 'intelligence'].includes(category)) return false;

    // Check both completed daily wins and pending tasks
    const isCompleted = isDailyWinCompleted(user.dailyWins, category as DailyWinCategory);
    const hasPending = hasPendingDailyWinTask(tasks, category as DailyWinCategory, new Date());

    return isCompleted || hasPending;
  })();

  // Reset fields when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setTitle('');
      setDescription('');
      setDifficulty('medium');
      setCategoryType('dailyWin');
      setCategory('mental');
      setHasDeadline(false);
      setDeadline(undefined);
    } else {
      // When dialog opens, set default deadline to current day
      if (!deadline) {
        const today = new Date();
        setDeadline(today);
      }
    }
  }, [open]);

  // Reset category when category type changes
  React.useEffect(() => {
    if (categoryType === 'dailyWin') {
      setCategory('mental');
    } else {
      setCategory('physical');
    }
  }, [categoryType]);

  // Calculate attribute task counts
  const getAttributeTaskCountText = (attributeCategory: string) => {
    const count = getAttributeTaskCount(tasks, attributeCategory, new Date());
    const max = 5;
    return `${count}/${max}`;
  };

  // Update the handleSubmit function
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title) {
      toast({
        title: "Error",
        description: "Please enter a task title",
        variant: "destructive",
        duration: 2000
      });
      return;
    }

    // Show reminder dialog first
    setShowReminderDialog(true);
  };

  // Function to actually create the task after reminder confirmation
  const handleCreateTask = () => {

    // Check for daily win limitations
    if (categoryType === 'dailyWin') {
      if (isDailyWinCompleted(user.dailyWins, category as DailyWinCategory)) {
        toast({
          title: `${category.charAt(0).toUpperCase() + category.slice(1)} Win Already Completed`,
          description: `You've already completed your ${category} daily win for today!`,
          variant: "destructive",
          duration: 2000
        });
        return;
      }

      if (hasPendingDailyWinTask(tasks, category as DailyWinCategory, new Date())) {
        toast({
          title: `${category.charAt(0).toUpperCase() + category.slice(1)} Win Already Planned`,
          description: `You already have a pending ${category} daily win task for today. Complete it first or choose another category.`,
          variant: "destructive",
          duration: 2000
        });
        return;
      }
    }
    // Check for attribute task limitations
    else if (categoryType === 'attribute') {
      if (isAttributeLimitReached(tasks, category, new Date())) {
        toast({
          title: `${category.charAt(0).toUpperCase() + category.slice(1)} Attribute Limit Reached`,
          description: `You can only add up to 5 ${category} attribute tasks per day. Try another attribute.`,
          variant: "destructive",
          duration: 2000
        });
        return;
      }
    }

    // Create the task using createTask
    createTask(
      title,
      description,
      difficulty,
      category as DailyWinCategory,
      deadline
    );

    toast({
      title: "Task added",
      description: deadline
        ? `Your task has been added with a deadline of ${deadline.toLocaleString()}`
        : "Your task has been added successfully",
      duration: 2000
    });

    // Reset form
    setTitle('');
    setDescription('');
    setDifficulty('medium');
    setCategoryType('dailyWin');
    setCategory('mental');
    setHasDeadline(false);
    setDeadline(undefined);
    setShowReminderDialog(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-solo-primary hover:bg-solo-primary/80">
            <Plus className="mr-2 h-4 w-4" /> Add Task
          </Button>
        )}
      </DialogTrigger>

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
          <DialogTitle className="font-semibold text-white/90 tracking-wide text-base">Add New Task</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 pr-1">
          <form onSubmit={handleSubmit} className="space-y-1.5 sm:space-y-2 pt-1 sm:pt-1.5 relative z-10">
          <div className="space-y-0.5 sm:space-y-1">
            <Label htmlFor="title" className="text-white/80 font-medium text-xs sm:text-sm">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              className="border-indigo-500/20 bg-gray-800/90 h-7 sm:h-8 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all text-xs sm:text-sm"
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
            />
          </div>

          <div className="space-y-0.5 sm:space-y-1">
            <Label className="text-white/80 font-medium text-sm">Category</Label>
            <div className="grid grid-cols-2 gap-0 rounded-md overflow-hidden border border-indigo-500/20 bg-gray-800/80">
              <button
                type="button"
                onClick={() => setCategoryType('attribute')}
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
                onClick={() => !allDailyWinsCompleted && setCategoryType('dailyWin')}
                disabled={allDailyWinsCompleted && categoryType !== 'dailyWin'}
                className={cn(
                  "py-1 px-2 text-center transition-all duration-200 text-xs",
                  categoryType === 'dailyWin'
                    ? "bg-indigo-500/10 border-b-2 border-indigo-500 font-medium text-indigo-300"
                    : "text-gray-400 hover:bg-gray-800/50 border-b-2 border-transparent",
                  allDailyWinsCompleted && categoryType !== 'dailyWin' && "opacity-50 cursor-not-allowed hover:bg-transparent"
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
              <Label htmlFor="category" className="text-white/80 font-medium text-sm">Type</Label>
              <Select
                value={category}
                onValueChange={(value) => setCategory(value)}
              >
                <SelectTrigger
                  id="category"
                  className={cn(
                    "border-indigo-500/20 bg-gray-800/90 h-7 text-xs focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all",
                    isSelectedCategoryCompleted && "border-orange-500/30 text-orange-400"
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
                        disabled={isDailyWinCompleted(user.dailyWins, cat as DailyWinCategory) ||
                                 hasPendingDailyWinTask(tasks, cat as DailyWinCategory, new Date())}
                        className={cn(
                          (isDailyWinCompleted(user.dailyWins, cat as DailyWinCategory) ||
                          hasPendingDailyWinTask(tasks, cat as DailyWinCategory, new Date())) &&
                          "opacity-50 line-through"
                        )}
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
                        disabled={isAttributeLimitReached(tasks, cat, new Date())}
                        className={cn(
                          isAttributeLimitReached(tasks, cat, new Date()) && "opacity-50 line-through"
                        )}
                      >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)} {getAttributeTaskCountText(cat)}
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
              date={deadline || new Date()} // Default to today
              setDate={setDeadline}
              className="mt-1"
            />
            <p className="text-xs text-gray-400 mt-0.5">
              Missing a deadline will automatically apply Shadow Penalty, reducing EXP reward by 50%.
            </p>
          </div>

            <div className="pt-1.5">
              <Button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium h-7 text-xs">
                Create Task
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
                Before creating your task, please double-check:
              </p>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-amber-100">
                <li className="flex items-center gap-1 sm:gap-2">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
                  Your deadline date is correct
                </li>
                <li className="flex items-center gap-1 sm:gap-2">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
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
                Create Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

// Add default export to support both import styles
export default AddTaskDialog;
