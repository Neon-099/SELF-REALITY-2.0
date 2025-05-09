import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Difficulty, DailyWinCategory, Task } from '@/lib/types';
import { useSoloLevelingStore } from '@/lib/store';
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { areAllDailyWinsCompleted, isDailyWinCompleted, hasPendingDailyWinTask, isAttributeLimitReached, getAttributeTaskCount } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { getExpForDifficulty } from '@/lib/utils/calculations';

export function AddTaskDialog() {
  // Added this log to confirm component is refreshing
  console.log('AddTaskDialog rendered with glassmorphism styles - ' + new Date().toISOString());
  
  const addTask = useSoloLevelingStore(state => state.addTask);
  const { toast } = useToast();
  const user = useSoloLevelingStore(state => state.user);
  const tasks = useSoloLevelingStore(state => state.tasks);
  
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [difficulty, setDifficulty] = React.useState<Difficulty>('medium');
  const [categoryType, setCategoryType] = React.useState<'dailyWin' | 'attribute'>('dailyWin');
  const [category, setCategory] = React.useState<string>('mental');
  
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
  
  // Reset category when category type changes
  React.useEffect(() => {
    if (categoryType === 'dailyWin') {
      setCategory('mental');
    } else {
      setCategory('physical');
    }
  }, [categoryType]);
  
  // Automatically switch to attributes if all daily wins are completed
  React.useEffect(() => {
    if (allDailyWinsCompleted && categoryType === 'dailyWin') {
      setCategoryType('attribute');
    }
  }, [allDailyWinsCompleted]);

  // Update the toast notifications effect
  React.useEffect(() => {
    if (open) {
      if (allDailyWinsCompleted) {
        toast({
          title: "All Daily Wins Completed!",
          description: "You've completed all daily wins for today. You can still add attribute tasks.",
          variant: "default",
          className: "bg-green-500/20 border-green-500/30 text-green-500",
          duration: 2000
        });
      } else if (isSelectedCategoryCompleted) {
        const isDailyWinDone = isDailyWinCompleted(user.dailyWins, category as DailyWinCategory);
        const hasPendingTask = hasPendingDailyWinTask(tasks, category as DailyWinCategory, new Date());
        
        toast({
          title: `${category.charAt(0).toUpperCase() + category.slice(1)} Win ${isDailyWinDone ? 'Completed' : 'Already Planned'}!`,
          description: isDailyWinDone 
            ? `You've already completed your ${category} daily win for today. Try another category or select attribute tasks.`
            : `You already have a pending ${category} daily win task for today. Complete it first or choose another category.`,
          variant: "default",
          className: "bg-amber-500/20 border-amber-500/30 text-amber-500",
          duration: 2000
        });
      }
    }
  }, [open, allDailyWinsCompleted, isSelectedCategoryCompleted, category]);
  
  // Add a function to check if an attribute category is at its limit
  const isAttributeCategoryLimited = (cat: string) => {
    return isAttributeLimitReached(tasks, cat, new Date());
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
    
    // Create a new task with today's date as scheduledFor
    const newTask: Task = {
      id: uuidv4(),
      title,
      description,
      completed: false,
      category: category as DailyWinCategory,
      difficulty,
      expReward: getExpForDifficulty(difficulty),
      scheduledFor: new Date(), // Schedule for today
      createdAt: new Date(),
    };
    
    // Add the task
    addTask(newTask);
    
    toast({
      title: "Task added",
      description: "Your task has been added successfully",
      duration: 2000
    });
    
    // Reset form
    setTitle('');
    setDescription('');
    setDifficulty('medium');
    setCategoryType('dailyWin');
    setCategory('mental');
    setOpen(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-solo-primary hover:bg-solo-primary/80">
          <Plus className="mr-2 h-4 w-4" /> Add Task
        </Button>
      </DialogTrigger>
      
      <DialogContent
        className="
          glassmorphism
          text-solo-text sm:max-w-[425px] w-[90%] p-4 sm:p-6 max-h-[90vh] overflow-y-auto rounded-xl
          before:!absolute before:!inset-0 before:!rounded-xl 
          before:!bg-gradient-to-br before:!from-indigo-500/10 before:!to-purple-500/5 
          before:!backdrop-blur-xl before:!-z-10
        "
      >
        <DialogHeader>
          <DialogTitle className="font-semibold text-white/90 tracking-wide">Add New Task</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 relative z-10">
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="title" className="text-white/80 font-medium">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              className="border-indigo-500/20 bg-gray-800/90 h-9 sm:h-10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
            />
          </div>
          
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="description" className="text-white/80 font-medium">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              className="border-indigo-500/20 bg-gray-800/90 min-h-[80px] focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
            />
          </div>
          
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-white/80 font-medium">Category</Label>
            <div className="grid grid-cols-2 gap-0 rounded-md overflow-hidden border border-indigo-500/20 bg-gray-800/90">
              <button
                type="button"
                onClick={() => setCategoryType('attribute')}
                className={cn(
                  "py-1 px-3 text-center transition-all duration-200",
                  categoryType === 'attribute' 
                    ? "bg-gradient-to-r from-solo-primary/20 to-indigo-500/20 border-b-2 border-solo-primary font-medium text-solo-primary" 
                    : "text-gray-300 hover:bg-white/5 border-b-2 border-transparent"
                )}
              >
                Attribute
              </button>
              <button
                type="button"
                onClick={() => !allDailyWinsCompleted && setCategoryType('dailyWin')}
                disabled={allDailyWinsCompleted}
                className={cn(
                  "py-1 px-3 text-center transition-all duration-200",
                  categoryType === 'dailyWin' 
                    ? "bg-gradient-to-r from-solo-primary/20 to-indigo-500/20 border-b-2 border-solo-primary font-medium text-solo-primary" 
                    : "text-gray-300 hover:bg-white/5 border-b-2 border-transparent",
                  allDailyWinsCompleted && "opacity-50 cursor-not-allowed"
                )}
              >
                Daily Win
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="difficulty" className="text-white/80 font-medium">Difficulty</Label>
              <Select 
                value={difficulty} 
                onValueChange={(value) => setDifficulty(value as Difficulty)}
              >
                <SelectTrigger id="difficulty" className="border-indigo-500/20 bg-gray-800/90 h-9 sm:h-10 focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500/50">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent className="border-indigo-500/20 bg-gray-800 backdrop-blur-md">
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="category" className="text-white/80 font-medium">Type</Label>
              <Select 
                value={category} 
                onValueChange={(value) => setCategory(value as string)}
              >
                <SelectTrigger id="category" className="border-indigo-500/20 bg-gray-800/90 h-9 sm:h-10 focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500/50">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="border-indigo-500/20 bg-gray-800 backdrop-blur-md">
                  {categoryType === 'dailyWin' ? (
                    // Daily Win Categories
                    <>
                      {dailyWinCategories.map((cat) => {
                        const isCompleted = isDailyWinCompleted(user.dailyWins, cat as DailyWinCategory);
                        const hasPending = hasPendingDailyWinTask(tasks, cat as DailyWinCategory, new Date());
                        const isDisabled = isCompleted || hasPending;
                        
                        return (
                          <SelectItem 
                            key={cat}
                            value={cat} 
                            disabled={isDisabled}
                            className={isDisabled ? "opacity-50" : ""}
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
                            className={isLimited ? "opacity-50" : ""}
                          >
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}{' '}
                            {isLimited ? `(Limit: 5/5)` : `(${getAttributeTaskCount(tasks, cat, new Date())}/5)`}
                          </SelectItem>
                        );
                      })}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full mt-2 bg-gradient-to-r from-solo-primary to-indigo-600 hover:from-solo-primary/90 hover:to-indigo-600/90 shadow-md shadow-indigo-500/20"
            disabled={categoryType === 'dailyWin' && isSelectedCategoryCompleted}
          >
            Add Task
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
