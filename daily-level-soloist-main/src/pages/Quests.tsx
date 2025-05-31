import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useSoloLevelingStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Swords, Star, ListTodo, ChevronDown, ChevronUp, Sword, Coins, Filter, Database, X, CalendarClock, Shield, Clock, Eye, EyeOff, Sunrise, CalendarDays, Plus, AlertCircle, HelpCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { DailyWinCategory, Difficulty, Quest, Task as QuestTask } from '@/lib/types';
import { isSameDay, format } from 'date-fns';
import { getDB } from '@/lib/db';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import SideQuestCard from '../components/SideQuestCard';
import DailyQuestCard from '../components/DailyQuestCard';
import MainQuestCard from '../components/MainQuestCard';
import RecoveryQuestCard from '../components/RecoveryQuestCard';
import { CustomDialogContent } from '@/components/ui/custom-dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

// Define experience reward values by difficulty
const expRewards: { [key in Difficulty]: number } = {
  easy: 15,
  medium: 30,
  hard: 60,
  boss: 100,
  normal: 20,
};

// Define a type for quest types
type QuestType = 'main' | 'side' | 'daily';

const AddQuestDialog = ({ onClose, isMobile }: { onClose: () => void; isMobile: boolean }) => {
  const addQuest = useSoloLevelingStore(state => state.addQuest);
  const updateQuest = useSoloLevelingStore(state => state.updateQuest);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questType, setQuestType] = useState<QuestType>('side');
  const [expPoints, setExpPoints] = useState<number>(15);
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState<DailyWinCategory | ''>('');
  const [taskCount, setTaskCount] = useState<number>(1);
  const [tasks, setTasks] = useState<Array<{title: string, completed: boolean}>>([]);
  const [questGeneratorCount, setQuestGeneratorCount] = useState<number>(1);

  // Generate empty tasks when taskCount changes
  useEffect(() => {
    if (questType === 'main' || questType === 'side') {
      const newTasks = Array(taskCount).fill(null).map((_, index) => ({
        title: `Task ${index + 1}`,
        completed: false
      }));
      setTasks(newTasks);
    }
  }, [taskCount, questType]);

  const handleAddQuest = () => {
    if (!title.trim()) {
      toast({
        title: "Quest title required",
        description: "Please provide a title for your quest.",
        variant: "destructive"
      });
      return;
    }

    // Set quest type flags
    const isMainQuest = questType === 'main';
    const isDaily = questType === 'daily';

    let deadlineDate: Date | undefined;

    if (isDaily) {
      // For daily quests, set deadline to end of current day (11:59:59 PM)
      const today = new Date();
      deadlineDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        23, 59, 59
      );
    } else {
      // Convert deadline string to Date object if provided for non-daily quests
      deadlineDate = deadline ? new Date(deadline) : undefined;
    }

    // Use quest DailyWinCategory or undefined for empty category
    const questCategory = isDaily ? (category || undefined) as DailyWinCategory | undefined : category as DailyWinCategory;

    // Use a default difficulty since the API still requires it, but we're using custom EXP
    const defaultDifficulty: Difficulty = 'normal';

    // For daily quests, create multiple instances if questGeneratorCount > 1
    if (isDaily && questGeneratorCount > 1) {
      for (let i = 0; i < questGeneratorCount; i++) {
        // Calculate deadline for each day (today + i days)
        const questDate = new Date();
        questDate.setDate(questDate.getDate() + i);
        const questDeadline = new Date(
          questDate.getFullYear(),
          questDate.getMonth(),
          questDate.getDate(),
          23, 59, 59
        );

        // Add day number to title for clarity
        const questTitle = questGeneratorCount > 1 ? `${title} (Day ${i + 1})` : title;

        addQuest(questTitle, description, isMainQuest, expPoints, questDeadline, defaultDifficulty, questCategory, isDaily);
      }
    } else {
      // Add single quest (normal behavior)
      addQuest(title, description, isMainQuest, expPoints, deadlineDate, defaultDifficulty, questCategory, isDaily);
    }

    // For daily quests, make sure the category is set
    if (isDaily) {
      setTimeout(() => {
        // Find the quest we just added by matching title, description and deadline
        const quests = useSoloLevelingStore.getState().quests;
        const newQuest = quests.find(q =>
          q.title === title &&
          q.description === description &&
          q.deadline?.getTime() === deadlineDate?.getTime() &&
          q.isDaily === true
        );

        if (newQuest) {
          // Update with daily quest properties if category was provided
          if (category) {
            updateQuest(newQuest.id, { category: questCategory });
          }

          toast({
            title: questGeneratorCount > 1 ? `${questGeneratorCount} Daily Quests Added` : "Daily Quest Added",
            description: questGeneratorCount > 1
              ? `Created ${questGeneratorCount} daily quests for consecutive days. Each has its own deadline.`
              : "Complete this quest by the end of today to avoid Shadow Penalty.",
            variant: "default"
          });
        }
      }, 100);
    } else if ((questType === 'main' || questType === 'side') && tasks.length > 0) {
      // For main or side quests with tasks, find the newly added quest and add tasks
      setTimeout(() => {
        const quests = useSoloLevelingStore.getState().quests;
        const newQuest = quests.find(q =>
          q.title === title &&
          q.description === description &&
          (questType === 'main' ? q.isMainQuest === true : q.isMainQuest === false)
        );

        if (newQuest) {
          // Add empty tasks for the quest
          const addQuestTask = useSoloLevelingStore.getState().addQuestTask;

          tasks.forEach((task, index) => {
            addQuestTask(
              newQuest.id,
              task.title,
              '', // No description for pre-generated tasks
              'mental', // Default category
              'normal' // Default difficulty
            );
          });

          toast({
            title: `${questType.charAt(0).toUpperCase() + questType.slice(1)} Quest Added`,
            description: `Your new ${questType} quest has been added with ${tasks.length} tasks!`,
          });
        }
      }, 100);
    } else {
      toast({
        title: "Quest added",
        description: `Your new ${questType} quest has been added!`,
      });
    }

    // Reset form
    setTitle('');
    setDescription('');
    setQuestType('side');
    setExpPoints(15);
    setDeadline('');
    setCategory('');
    setTaskCount(1);
    setTasks([]);
    setQuestGeneratorCount(1);
    onClose();
  };

  const handleTaskTitleChange = (index: number, value: string) => {
    const updatedTasks = [...tasks];
    updatedTasks[index].title = value;
    setTasks(updatedTasks);
  };

  // Function to handle exp point changes with validation
  const handleExpChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1) {
      setExpPoints(numValue);
    }
  };

  return (
    <form className={cn("relative z-10", isMobile ? "space-y-1.5 pt-1" : "space-y-3")} onSubmit={(e) => { e.preventDefault(); handleAddQuest(); }}>
      <div className={cn(isMobile ? "space-y-0.5" : "space-y-1")}>
        <Label htmlFor="quest-title" className={cn("text-white/80 font-medium", isMobile ? "text-sm" : "text-base")}>
          Quest Title
        </Label>
        <Input
          id="quest-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Quest title"
          required
          className={cn(
            "border-indigo-500/20 bg-gray-800/90 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all",
            isMobile ? "h-7 text-sm" : "h-8 text-base"
          )}
        />
      </div>

      <div className={cn(isMobile ? "space-y-0.5" : "space-y-1")}>
        <Label className={cn("text-white/80 font-medium", isMobile ? "text-sm" : "text-base")}>
          Quest Type
        </Label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant={questType === 'main' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQuestType('main')}
            className="flex items-center justify-center gap-1 w-full"
          >
            <Swords className="h-4 w-4 text-yellow-500" />
            Main
          </Button>
          <Button
            type="button"
            variant={questType === 'side' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQuestType('side')}
            className="flex items-center justify-center gap-1 w-full"
          >
            <Sword className="h-4 w-4 text-solo-primary" />
            Side
          </Button>
          <Button
            type="button"
            variant={questType === 'daily' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQuestType('daily')}
            className="flex items-center justify-center gap-1 w-full"
          >
            <Sunrise className="h-4 w-4 text-green-500" />
            Daily
          </Button>
        </div>
      </div>

      <div className={cn(isMobile ? "space-y-0.5" : "space-y-1")}>
        <Label htmlFor="quest-description" className={cn("text-white/80 font-medium", isMobile ? "text-sm" : "text-base")}>
          Description
        </Label>
        <Textarea
          id="quest-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Quest description"
          required
          className={cn(
            "border-indigo-500/20 bg-gray-800/90 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all",
            isMobile ? "h-12 text-sm" : "h-16 text-base"
          )}
        />
      </div>

      <div className={cn("grid grid-cols-2", isMobile ? "gap-1" : "gap-2")}>
        <div className={cn(isMobile ? "space-y-0.5" : "space-y-1")}>
          <Label htmlFor="quest-exp" className={cn("text-white/80 font-medium", isMobile ? "text-sm" : "text-base")}>
            Experience Points
          </Label>
          <Input
            id="quest-exp"
            type="number"
            min="1"
            value={expPoints}
            onChange={(e) => handleExpChange(e.target.value)}
            placeholder="EXP"
            required
            className={cn(
              "border-indigo-500/20 bg-gray-800/90 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all",
              isMobile ? "h-7 text-sm" : "h-8 text-base"
            )}
          />
        </div>

        {questType === 'daily' && (
          <div className={cn(isMobile ? "space-y-0.5" : "space-y-1")}>
            <Label htmlFor="quest-generator" className={cn("text-white/80 font-medium", isMobile ? "text-sm" : "text-base")}>
              Quest Generator
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="quest-generator"
                type="number"
                min="1"
                max="30"
                value={questGeneratorCount}
                onChange={(e) => setQuestGeneratorCount(parseInt(e.target.value) || 1)}
                placeholder="Days"
                className={cn(
                  "border-indigo-500/20 bg-gray-800/90 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all",
                  isMobile ? "h-7 text-sm w-16" : "h-8 text-base w-20"
                )}
              />
              <span className={cn("text-gray-400", isMobile ? "text-xs" : "text-sm")}>
                {questGeneratorCount === 1 ? 'day' : 'days'}
              </span>
            </div>
          </div>
        )}

        {(questType === 'main' || questType === 'side') && (
          <div className={cn(isMobile ? "space-y-0.5" : "space-y-1")}>
            <Label htmlFor="quest-tasks" className={cn("text-white/80 font-medium", isMobile ? "text-sm" : "text-base")}>
              Number of Tasks
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="quest-tasks"
                type="number"
                min="1"
                max="10"
                value={taskCount}
                onChange={(e) => setTaskCount(parseInt(e.target.value) || 1)}
                placeholder="Tasks"
                className={cn(
                  "border-indigo-500/20 bg-gray-800/90 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all",
                  isMobile ? "h-7 text-sm w-16" : "h-8 text-base w-20"
                )}
              />
              {!isMobile && <span className="text-sm text-gray-400">tasks</span>}
            </div>
          </div>
        )}
      </div>

      {(questType === 'main' || questType === 'side') && (
        <div className={cn(isMobile ? "space-y-0.5" : "space-y-1")}>
          <Label className={cn("text-white/80 font-medium", isMobile ? "text-sm" : "text-base")}>
            Task Names
          </Label>
          <div className={cn("space-y-2 max-h-[200px] overflow-y-auto", isMobile ? "pr-1" : "pr-2")}>
            {tasks.map((task, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  type="text"
                  value={task.title}
                  onChange={(e) => handleTaskTitleChange(index, e.target.value)}
                  placeholder={`Task ${index + 1}`}
                  className={cn(
                    "border-indigo-500/20 bg-gray-800/90 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all",
                    isMobile ? "h-7 text-sm" : "h-8 text-base"
                  )}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {questType === 'daily' && (
        <div className={cn(isMobile ? "space-y-1.5" : "space-y-2")}>
          <div className={cn(isMobile ? "space-y-0.5" : "space-y-1")}>
            <div className="flex justify-between items-center">
              <Label className={cn("text-white/80 font-medium", isMobile ? "text-sm" : "text-base")}>
                Category (optional)
              </Label>
              <span className={cn("text-gray-400", isMobile ? "text-xs" : "text-sm")}>Not required</span>
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DailyWinCategory | '')}
              className={cn(
                "w-full px-3 py-2 rounded-md border border-indigo-500/20 bg-gray-800/90 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all text-white",
                isMobile ? "h-7 text-sm" : "h-8 text-base"
              )}
            >
              <option value="">Select category</option>
              <option value="mental">Mental</option>
              <option value="physical">Physical</option>
              <option value="spiritual">Spiritual</option>
              <option value="intelligence">Intelligence</option>
            </select>
          </div>

          <div className="flex items-center justify-between mb-2 mt-3">
            <div className={cn("text-amber-300 flex items-center", isMobile ? "text-xs" : "text-sm")}>
              <Clock className={cn("mr-1", isMobile ? "h-3 w-3" : "h-4 w-4")} /> Automated Deadline
            </div>
          </div>
          <div className={cn("bg-amber-950/20 p-3 rounded-md border border-amber-900/20", isMobile ? "text-xs" : "text-sm")}>
            <p className="text-amber-200 font-medium flex items-center">
              <CalendarClock className={cn("mr-2 text-amber-400", isMobile ? "h-3 w-3" : "h-4 w-4")} />
              Deadline: Today at 11:59 PM ({format(new Date().setHours(23, 59, 59), 'MMM d, yyyy')})
            </p>
            <p className={cn("text-amber-300/80 mt-1", isMobile ? "text-xs" : "text-sm")}>
              Daily quests must be completed by the end of today. Missing the deadline will trigger Shadow Penalty, reducing EXP rewards by 50%.
            </p>
          </div>
        </div>
      )}

      {questType !== 'daily' && (
        <div className={cn(isMobile ? "space-y-0.5" : "space-y-1")}>
          <Label htmlFor="quest-deadline" className={cn("text-white/80 font-medium", isMobile ? "text-sm" : "text-base")}>
            Deadline (optional)
          </Label>
          <Input
            id="quest-deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className={cn(
              "border-indigo-500/20 bg-gray-800/90 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all",
              isMobile ? "h-7 text-sm" : "h-8 text-base"
            )}
          />
        </div>
      )}

      <div className={cn("flex gap-2 border-t border-gray-700", isMobile ? "mt-2 pt-2" : "mt-4 pt-4")}>
        <Button
          type="submit"
          className={cn(
            "bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white w-full",
            isMobile ? "h-8 text-xs" : "h-9 text-sm"
          )}
        >
          Create Quest
        </Button>
      </div>
    </form>
  );
};

const AddTaskDialog = ({ questId, onClose }: { questId: string; onClose: () => void }) => {
  const addQuestTask = useSoloLevelingStore(state => state.addQuestTask);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [category, setCategory] = useState<DailyWinCategory>('mental');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [deadline, setDeadline] = useState<Date>(new Date(Date.now() + 24 * 60 * 60 * 1000));

  const handleAddTask = () => {
    if (!taskTitle.trim()) {
      toast({
        title: "Task title required",
        description: "Please provide a title for your task.",
        variant: "destructive"
      });
      return;
    }

    addQuestTask(questId, taskTitle, taskDescription, category, difficulty);
    setTaskTitle('');
    setTaskDescription('');
    onClose();

    toast({
      title: "Task added",
      description: "Your new task has been added to the quest!",
    });
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Task Title</label>
        <input
          type="text"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-gray-800 bg-solo-dark"
          placeholder="Task title"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <textarea
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-gray-800 bg-solo-dark min-h-[100px]"
          placeholder="Task description"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as DailyWinCategory)}
          className="w-full px-3 py-2 rounded-md border border-gray-800 bg-solo-dark"
        >
          <option value="mental">Mental</option>
          <option value="physical">Physical</option>
          <option value="spiritual">Spiritual</option>
          <option value="intelligence">Intelligence</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Difficulty</label>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          className="w-full px-3 py-2 rounded-md border border-gray-800 bg-solo-dark"
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
          <option value="boss">Boss</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Deadline</label>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-indigo-300 flex items-center">
            <CalendarClock className="h-3 w-3 mr-1" /> Automatic deadline enforcement
          </div>
        </div>

        <DateTimePicker
          date={deadline}
          setDate={setDeadline}
          className="mt-2"
        />
        <p className="text-xs text-gray-400 mt-1">
          Missing a deadline will automatically apply Shadow Penalty, reducing EXP reward by 50%.
        </p>
      </div>
      <Button onClick={handleAddTask} className="w-full">
        Add Task
      </Button>
    </div>
  );
};

const QuestTasks = ({ quest }: { quest: Quest }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const completeQuestTask = useSoloLevelingStore(state => state.completeQuestTask);

  return (
    <div className="mt-4 space-y-2">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-semibold text-gray-400">Quest Tasks</h4>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
            </DialogHeader>
            <AddTaskDialog questId={quest.id} onClose={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {quest.tasks?.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No tasks added yet. Break down your quest into smaller tasks.</p>
      ) : (
        <div className="space-y-2">
          {quest.tasks?.map((task: QuestTask) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-2 bg-gray-800/50 rounded-md"
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${task.completed ? 'bg-green-500' : 'bg-gray-500'}`} />
                <span className={`text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-200'}`}>
                  {task.title}
                </span>
              </div>
              {!task.completed && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => completeQuestTask(quest.id, task.id)}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Quests = () => {
  const [quests, completeQuest, startQuest, canCompleteQuest, canStartQuest, addGold, addExp, getDailyQuestCompletionStatus, hasReachedDailyLimit] = useSoloLevelingStore(
    state => [
      state.quests,
      state.completeQuest,
      state.startQuest,
      state.canCompleteQuest,
      state.canStartQuest,
      state.addGold,
      state.addExp,
      state.getDailyQuestCompletionStatus,
      state.hasReachedDailyLimit
    ]
  );

  const [showCompletedQuests, setShowCompletedQuests] = useState(false);
  const [isAddQuestDialogOpen, setIsAddQuestDialogOpen] = useState(false);
  const [isSideQuestsDialogOpen, setIsSideQuestsDialogOpen] = useState(false);
  const [isDailyQuestsDialogOpen, setIsDailyQuestsDialogOpen] = useState(false);
  const [individualQuestDialogOpen, setIndividualQuestDialogOpen] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'main' | 'side' | 'daily'>('all');
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [dbContents, setDbContents] = useState<any>(null);
  const [questsData, setQuestsData] = useState<Quest[]>([]);
  const isMobile = useIsMobile();

  // Add useEffect to update questsData when quests from the store change
  useEffect(() => {
    setQuestsData(quests);
  }, [quests]);

  // Load data from database on component mount
  useEffect(() => {
    loadDbData();
  }, []);

  // Function to load and display IndexedDB data
  const loadDbData = async () => {
    try {
      setIsLoadingDb(true);
      const db = await getDB();

      const storeData = await db.get('store', 'soloist-store');

      let fetchedQuestsFromDB: Quest[] = [];
      try {
        const questStore = db.transaction('quests').objectStore('quests');
        const rawFetchedQuests = await questStore.getAll();
        fetchedQuestsFromDB = rawFetchedQuests.map((q: any): Quest => ({
          id: q.id || String(Date.now() + Math.random()),
          title: q.title || 'Untitled Quest',
          description: q.description,
          isMainQuest: q.isMainQuest !== undefined ? q.isMainQuest : false,
          difficulty: q.difficulty !== undefined ? q.difficulty : 'easy',
          createdAt: q.createdAt ? new Date(q.createdAt) : new Date(),
          completed: q.completed !== undefined ? q.completed : false,
          expReward: q.expReward || expRewards[q.difficulty as Difficulty || 'easy'],
          tasks: q.tasks || [],
          started: q.started !== undefined ? q.started : false,
          category: q.category || (q.isDaily ? 'mental' : undefined),
          deadline: q.deadline ? new Date(q.deadline) : undefined,
          completedAt: q.completedAt ? new Date(q.completedAt) : undefined,
          missed: q.missed,
          isRecoveryQuest: q.isRecoveryQuest,
          isDaily: q.isDaily,
        }));
      } catch (error) {
        if (error instanceof Error) {
          console.error('Error fetching quests directly from DB:', error.message);
        } else {
          console.error('An unknown error occurred fetching quests directly from DB:', error);
        }
      }

      let questsToSet: Quest[] = fetchedQuestsFromDB;

      if (storeData && storeData.state && Array.isArray(storeData.state.quests)) {
        questsToSet = (storeData.state.quests as any[]).map((q: any): Quest => ({
            id: q.id || String(Date.now() + Math.random()),
            title: q.title || 'Untitled Quest',
            description: q.description,
            isMainQuest: q.isMainQuest !== undefined ? q.isMainQuest : false,
            difficulty: q.difficulty !== undefined ? q.difficulty : 'easy',
            createdAt: q.createdAt ? new Date(q.createdAt) : new Date(),
            completed: q.completed !== undefined ? q.completed : false,
            expReward: q.expReward || expRewards[q.difficulty as Difficulty || 'easy'],
            tasks: q.tasks || [],
            started: q.started !== undefined ? q.started : false,
            category: q.category || (q.isDaily ? 'mental' : undefined),
            deadline: q.deadline ? new Date(q.deadline) : undefined,
            completedAt: q.completedAt ? new Date(q.completedAt) : undefined,
            missed: q.missed,
            isRecoveryQuest: q.isRecoveryQuest,
            isDaily: q.isDaily,
        }));
      }

      setQuestsData(questsToSet.length > 0 ? questsToSet : quests);

      setDbContents({
        zustandStore: storeData ? JSON.parse(storeData) : null,
        directQuests: fetchedQuestsFromDB
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error loading data from DB:", error.message);
        toast({
          title: "Database Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.error("An unknown error occurred while loading data:", error);
        toast({
          title: "Database Error",
          description: "An unexpected error occurred while loading data.",
          variant: "destructive",
        });
      }
      // If there's an error, at least use the quests from the store
      setQuestsData(quests);
    } finally {
      setIsLoadingDb(false);
    }
  };

  const handleCompleteQuest = (id: string, title: string, expReward: number) => {
    completeQuest(id);
    // The completeQuest function in the store already adds exp and gold rewards
    // No need to add them again here
  };

  // Filter active quests
  const activeQuests = questsData.filter(quest => {
    // Skip completed quests
    if (quest.completed) return false;

    // Skip daily quests (they're handled separately)
    if (quest.isDaily === true) return false;

    // For side quests, only show if they're scheduled for today or have no deadline
    if (!quest.isMainQuest) {
      if (quest.deadline) {
        return isSameDay(new Date(quest.deadline), new Date());
      }
      // Show quests with no deadline (backward compatibility)
      return true;
    }

    // Show all active main quests
    return true;
  });

  // Get daily quests for today only (main section display)
  const dailyQuests = questsData.filter(quest =>
    quest.isDaily === true &&
    !quest.completed && // Skip completed daily quests
    quest.deadline && isSameDay(new Date(quest.deadline), new Date()) // Only show today's daily quests
  );

  // Get all daily quests (for "View All" dialog) - exclude expired quests and sort chronologically
  const allDailyQuests = questsData
    .filter(quest => {
      if (!quest.isDaily || quest.completed) return false;

      // If quest has a deadline, only show if it's not expired
      if (quest.deadline) {
        const questDate = new Date(quest.deadline);
        const today = new Date();
        // Remove time component for comparison
        questDate.setHours(23, 59, 59, 999);
        today.setHours(0, 0, 0, 0);
        return questDate >= today;
      }

      return true;
    })
    .sort((a, b) => {
      // Sort by deadline: today's quests first, then tomorrow, then day after, etc.
      const aDate = a.deadline ? new Date(a.deadline) : new Date();
      const bDate = b.deadline ? new Date(b.deadline) : new Date();

      // Remove time component for comparison
      aDate.setHours(0, 0, 0, 0);
      bDate.setHours(0, 0, 0, 0);

      return aDate.getTime() - bDate.getTime();
    });

  // Filter completed quests for today only
  const completedQuests = questsData.filter(quest =>
    quest.completed &&
    quest.completedAt &&
    isSameDay(new Date(quest.completedAt), new Date())
  );

  const handleCompleteDailyQuest = (id: string) => {
    const quest = quests.find(q => q.id === id);
    if (quest) {
      handleCompleteQuest(id, quest.title, quest.expReward);
    }
  };

  const handleCompleteSideQuest = (id: string) => {
    const quest = quests.find(q => q.id === id);
    if (quest) {
      handleCompleteQuest(id, quest.title, quest.expReward);
    }
  };

  // Get daily completion status
  const dailyStatus = getDailyQuestCompletionStatus();

  const renderQuests = () => {
    switch (activeFilter) {
      case 'main':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-solo-text flex items-center gap-2">
                <Swords className="text-yellow-500" size={20} />
                Main Quests
              </h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 border-yellow-500/30 hover:border-yellow-500/60 text-yellow-500 text-xs px-2 py-1 sm:text-sm sm:px-3 sm:py-2"
                  >
                    <Eye size={14} />
                    View All
                  </Button>
                </DialogTrigger>
                <CustomDialogContent className="w-[95vw] max-w-[350px] sm:w-[90vw] sm:max-w-[500px] p-3 max-h-[80vh] overflow-hidden flex flex-col">
                  <DialogHeader className="border-b border-yellow-500/20 pb-2 mb-3 relative">
                    <DialogTitle className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 drop-shadow-sm text-lg">
                      All Main Quests
                    </DialogTitle>
                    <DialogClose className="absolute right-0 top-0 h-6 w-6 rounded-full bg-gradient-to-r from-yellow-600/30 to-amber-700/30 hover:from-yellow-600/50 hover:to-amber-700/50 transition-all p-0.5 border border-yellow-500/20 flex items-center justify-center cursor-pointer z-10">
                      <X className="h-4 w-4 text-yellow-300" />
                    </DialogClose>
                  </DialogHeader>
                  <div className="py-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-1 gap-2">
                      {questsData
                        .filter(quest => quest.isMainQuest && !quest.completed)
                        .map((quest) => (
                          <div
                            key={quest.id}
                            className="bg-gray-900 border border-yellow-500/20 rounded-lg p-3 hover:border-yellow-500/40 transition-all"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-medium text-yellow-400">{quest.title}</h3>
                              <div className="flex items-center gap-1 text-xs">
                                <Star size={12} className="text-yellow-400" />
                                <span className="text-yellow-500">+{quest.expReward} XP</span>
                              </div>
                            </div>
                            {quest.description && (
                              <p className="text-gray-400 text-sm mb-2 line-clamp-2">{quest.description}</p>
                            )}
                            <div className="flex justify-between items-center text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock size={10} />
                                {quest.started ? 'Started' : 'Not started'}
                              </span>
                              {quest.tasks && quest.tasks.length > 0 && (
                                <span>
                                  {quest.tasks.filter(t => t.completed).length}/{quest.tasks.length} Tasks
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                    {questsData.filter(quest => quest.isMainQuest && !quest.completed).length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-gray-400">No active main quests available.</p>
                      </div>
                    )}
                  </div>
                </CustomDialogContent>
              </Dialog>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeQuests
                .filter(quest => quest.isMainQuest)
                .map((quest) => (
                  <MainQuestCard
                    key={quest.id}
                    quest={quest}
                    onComplete={handleCompleteQuest}
                    onStart={startQuest}
                    canComplete={canCompleteQuest}
                    canStart={canStartQuest}
                  />
                ))}
            </div>
            {activeQuests.filter(quest => quest.isMainQuest).length === 0 && (
              <div className="bg-solo-dark border border-yellow-500/20 rounded-lg p-4 text-center">
                <p className="text-gray-400">No active main quests available.</p>
                <p className="text-gray-400 text-sm mt-2">Click "Add Quest" to create a main quest.</p>
              </div>
            )}
          </div>
        );
      case 'side':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-solo-text flex items-center gap-2">
                <Sword className="text-solo-primary" size={20} />
                Side Quests
              </h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 border-indigo-500/30 hover:border-indigo-500/60 text-indigo-500 text-xs px-2 py-1 sm:text-sm sm:px-3 sm:py-2"
                  >
                    <Eye size={14} />
                    View All
                  </Button>
                </DialogTrigger>
                <CustomDialogContent className="w-[95vw] max-w-[350px] sm:w-[90vw] sm:max-w-[500px] p-3 max-h-[80vh] overflow-hidden flex flex-col">
                  <DialogHeader className="border-b border-indigo-500/20 pb-2 mb-3 relative">
                    <DialogTitle className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-500 drop-shadow-sm text-lg">
                      All Side Quests
                    </DialogTitle>
                    <DialogClose className="absolute right-0 top-0 h-6 w-6 rounded-full bg-gradient-to-r from-indigo-600/30 to-purple-700/30 hover:from-indigo-600/50 hover:to-purple-700/50 transition-all p-0.5 border border-indigo-500/20 flex items-center justify-center cursor-pointer z-10">
                      <X className="h-4 w-4 text-indigo-300" />
                    </DialogClose>
                  </DialogHeader>
                  <div className="py-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-1 gap-2">
                      {questsData
                        .filter(quest => !quest.isMainQuest && !quest.isDaily && !quest.completed)
                        .map((quest) => (
                          <div
                            key={quest.id}
                            className="bg-gray-900 border border-indigo-500/20 rounded-lg p-3 hover:border-indigo-500/40 transition-all"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-medium text-indigo-400">{quest.title}</h3>
                              <div className="flex items-center gap-1 text-xs">
                                <Star size={12} className="text-yellow-400" />
                                <span className="text-indigo-500">+{quest.expReward} XP</span>
                              </div>
                            </div>
                            {quest.description && (
                              <p className="text-gray-400 text-sm mb-2 line-clamp-2">{quest.description}</p>
                            )}
                            <div className="flex justify-between items-center text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock size={10} />
                                {quest.started ? 'Started' : 'Not started'}
                              </span>
                              {quest.tasks && quest.tasks.length > 0 && (
                                <span>
                                  {quest.tasks.filter(t => t.completed).length}/{quest.tasks.length} Tasks
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                    {questsData.filter(quest => !quest.isMainQuest && !quest.isDaily && !quest.completed).length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-gray-400">No active side quests available.</p>
                      </div>
                    )}
                  </div>
                </CustomDialogContent>
              </Dialog>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(() => {
                const sideQuests = activeQuests.filter(quest => !quest.isMainQuest && !quest.isDaily);
                const regularSideQuests = sideQuests.filter(quest => !quest.isRecoveryQuest);
                const recoveryQuests = sideQuests.filter(quest => quest.isRecoveryQuest);

                // Show recovery quests only if there are no ongoing regular side quests
                const hasOngoingSideQuest = regularSideQuests.some(quest => quest.started && !quest.completed);
                const questsToShow = hasOngoingSideQuest ? regularSideQuests : sideQuests;

                return questsToShow.map((quest) => (
                  quest.isRecoveryQuest ? (
                    <RecoveryQuestCard
                      key={quest.id}
                      quest={quest}
                      onComplete={handleCompleteSideQuest}
                      canComplete={canCompleteQuest}
                    />
                  ) : (
                    <SideQuestCard key={quest.id} quest={quest} onComplete={handleCompleteSideQuest} onStart={startQuest} canStart={canStartQuest} />
                  )
                ));
              })()}
            </div>
            {activeQuests.filter(quest => !quest.isMainQuest && !quest.isDaily).length === 0 && (
              <div className="bg-solo-dark border border-gray-800 rounded-lg p-4 text-center">
                <p className="text-gray-400">No active side quests available.</p>
                <p className="text-gray-400 text-sm mt-2">Click "Add Quest" to create a side quest.</p>
              </div>
            )}
          </div>
        );
      case 'daily':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-solo-text flex items-center gap-2">
                <Sunrise className="text-green-500" size={20} />
                Daily Quests
              </h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 border-green-500/30 hover:border-green-500/60 text-green-500 text-xs px-2 py-1 sm:text-sm sm:px-3 sm:py-2"
                  >
                    <Eye size={14} />
                    View All
                  </Button>
                </DialogTrigger>
                <CustomDialogContent className={cn(
                  isMobile
                    ? "w-[90vw] max-w-[320px] p-2 sm:p-3 max-h-[85vh]"
                    : "w-[95vw] max-w-[350px] sm:w-[90vw] sm:max-w-[500px] p-3 max-h-[80vh]",
                  "overflow-hidden flex flex-col"
                )}>
                  <DialogHeader className="border-b border-green-500/20 pb-2 mb-3 relative">
                    <DialogTitle className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-500 drop-shadow-sm text-lg">
                      All Daily Quests
                    </DialogTitle>
                    <DialogClose className="absolute right-0 top-0 h-6 w-6 rounded-full bg-gradient-to-r from-green-600/30 to-emerald-700/30 hover:from-green-600/50 hover:to-emerald-700/50 transition-all p-0.5 border border-green-500/20 flex items-center justify-center cursor-pointer z-10">
                      <X className="h-4 w-4 text-green-300" />
                    </DialogClose>
                  </DialogHeader>
                  <div className="py-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-1 gap-2">
                      {allDailyQuests
                        .map((quest) => {
                          // Remove day text from quest title for display
                          const displayTitle = quest.title.replace(/\s*\(Day \d+\)$/, '');
                          return (
                            <div
                              key={quest.id}
                              className="bg-gray-900 border border-green-500/20 rounded-lg p-3 hover:border-green-500/40 transition-all"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-medium text-green-400">{displayTitle}</h3>
                                <div className="flex items-center gap-1 text-xs">
                                  {quest.category && quest.category.length > 0 && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border shadow-sm font-medium ${
                                      quest.category === 'mental'
                                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                        : quest.category === 'physical'
                                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                        : quest.category === 'spiritual'
                                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                    }`}>
                                      {quest.category.charAt(0).toUpperCase() + quest.category.slice(1)}
                                    </span>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <Star size={12} className="text-yellow-400" />
                                    <span className="text-green-500">+{quest.expReward} XP</span>
                                  </div>
                                </div>
                              </div>
                              {quest.description && (
                                <p className="text-gray-400 text-sm mb-2 line-clamp-2">{quest.description}</p>
                              )}
                              <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                                <span className="flex items-center gap-1">
                                  <CalendarClock size={10} />
                                  {quest.deadline ? (
                                    isSameDay(new Date(quest.deadline), new Date())
                                      ? 'Due today'
                                      : `Due ${format(new Date(quest.deadline), 'MMM d')}`
                                  ) : 'No deadline'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    {allDailyQuests.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-gray-400">No active daily quests available.</p>
                      </div>
                    )}
                  </div>
                </CustomDialogContent>
              </Dialog>
            </div>
            <div className="bg-solo-dark border border-green-500/20 rounded-lg p-4">
              <div className="mb-4">
                <p className="text-gray-400">Daily quests reset every day. Complete them to earn rewards and maintain your streak.</p>
              </div>

              {dailyQuests.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {dailyQuests.slice(0, isMobile ? 2 : 4).map((quest) => (
                    <DailyQuestCard key={quest.id} quest={quest} onComplete={handleCompleteDailyQuest} />
                  ))}
                </div>
              ) : (
                <div className="bg-solo-dark border border-gray-800 rounded-lg p-4 text-center">
                  <p className="text-gray-400">No active daily quests available.</p>
                  <p className="text-gray-400 text-sm mt-2">Click "Add Quest" to create a daily quest.</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'all':
      default:
        return (
          <div className="space-y-8">
            {/* Main Quests Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-solo-text flex items-center gap-2">
                  <Swords className="text-yellow-500" size={20} />
                  Main Quests
                </h2>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 border-yellow-500/30 hover:border-yellow-500/60 text-yellow-500 text-xs px-2 py-1 sm:text-sm sm:px-3 sm:py-2"
                    >
                      <Eye size={14} />
                      View All
                    </Button>
                  </DialogTrigger>
                  <CustomDialogContent className={cn(
                    isMobile
                      ? "w-[90vw] max-w-[320px] p-2 sm:p-3 max-h-[85vh]"
                      : "w-[95vw] max-w-[350px] sm:w-[90vw] sm:max-w-[500px] p-3 max-h-[80vh]",
                    "overflow-hidden flex flex-col"
                  )}>
                    <DialogHeader className="border-b border-yellow-500/20 pb-2 mb-3 relative">
                      <DialogTitle className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 drop-shadow-sm text-lg">
                        All Main Quests
                      </DialogTitle>
                      <DialogClose className="absolute right-0 top-0 h-6 w-6 rounded-full bg-gradient-to-r from-yellow-600/30 to-amber-700/30 hover:from-yellow-600/50 hover:to-amber-700/50 transition-all p-0.5 border border-yellow-500/20 flex items-center justify-center cursor-pointer z-10">
                        <X className="h-4 w-4 text-yellow-300" />
                      </DialogClose>
                    </DialogHeader>
                    <div className="py-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                      {/* In Progress Quests */}
                      {questsData.filter(quest => quest.isMainQuest && !quest.completed && quest.started).length > 0 && (
                        <div className="mb-4">
                          <h3 className="text-yellow-400 font-medium mb-2 flex items-center gap-1">
                            <Clock size={14} className="text-yellow-500" />
                            In Progress
                          </h3>
                          <div className="grid grid-cols-1 gap-2">
                            {questsData
                              .filter(quest => quest.isMainQuest && !quest.completed && quest.started)
                              .map((quest) => (
                                <div
                                  key={quest.id}
                                  className="bg-gray-900 border border-yellow-500/20 rounded-lg p-3 hover:border-yellow-500/40 transition-all"
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-medium text-yellow-400">{quest.title}</h3>
                                    <div className="flex items-center gap-1 text-xs">
                                      <Star size={12} className="text-yellow-400" />
                                      <span className="text-yellow-500">+{quest.expReward} XP</span>
                                    </div>
                                  </div>
                                  {quest.description && (
                                    <p className="text-gray-400 text-sm mb-2 line-clamp-2">{quest.description}</p>
                                  )}
                                  <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                                    <span className="flex items-center gap-1 bg-green-900/20 text-green-400 px-1.5 py-0.5 rounded-full border border-green-500/20">
                                      <Clock size={10} />
                                      In Progress
                                    </span>
                                    {quest.tasks && quest.tasks.length > 0 && (
                                      <span>
                                        {quest.tasks.filter(t => t.completed).length}/{quest.tasks.length} Tasks
                                      </span>
                                    )}
                                  </div>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full border-yellow-500/30 hover:border-yellow-500/60 text-yellow-500 text-xs px-2 py-1 sm:text-sm sm:px-3 sm:py-2"
                                      >
                                        <Eye size={12} className="mr-1" />
                                        View Quest
                                      </Button>
                                    </DialogTrigger>
                                    <CustomDialogContent className={cn(
                                      isMobile
                                        ? "w-[90vw] max-w-[320px] p-2 sm:p-3 max-h-[85vh]"
                                        : "w-[95vw] max-w-[350px] sm:w-[90vw] sm:max-w-[500px] p-4 max-h-[80vh]",
                                      "overflow-hidden flex flex-col"
                                    )}>
                                      <DialogHeader className="border-b border-yellow-500/20 pb-2 mb-3 relative">
                                        <DialogTitle className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 drop-shadow-sm text-lg">
                                          {quest.title}
                                        </DialogTitle>
                                        <DialogClose className="absolute right-0 top-0 h-6 w-6 rounded-full bg-gradient-to-r from-yellow-600/30 to-amber-700/30 hover:from-yellow-600/50 hover:to-amber-700/50 transition-all p-0.5 border border-yellow-500/20 flex items-center justify-center cursor-pointer z-10">
                                          <X className="h-4 w-4 text-yellow-300" />
                                        </DialogClose>
                                      </DialogHeader>
                                      <div className="py-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                        {quest.description && (
                                          <div className="mb-4">
                                            <h4 className="text-sm font-semibold text-yellow-400 mb-2">Description:</h4>
                                            <div className="p-3 bg-gray-800/30 rounded-md">
                                              <p className="text-gray-300/90 text-sm">{quest.description}</p>
                                            </div>
                                          </div>
                                        )}

                                        {/* Quest Tasks */}
                                        <div className="mb-4">
                                          <h4 className="text-sm font-semibold text-yellow-400 mb-2">Tasks:</h4>
                                          {quest.tasks && quest.tasks.length > 0 ? (
                                            <div className="space-y-1.5">
                                              {quest.tasks.map((task, index) => (
                                                <div
                                                  key={task.id}
                                                  className="flex items-start p-2 rounded-lg bg-gradient-to-r from-gray-800/60 to-gray-800/40 border border-gray-700/30"
                                                >
                                                  <span className="text-yellow-400 text-xs font-medium w-5 text-center flex-shrink-0 mt-0.5">
                                                    {index + 1}.
                                                  </span>
                                                  <div className="ml-2 flex-1 min-w-0">
                                                    <p className={`font-medium text-gray-200 break-words leading-tight ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
                                                      {task.title}
                                                    </p>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <p className="text-sm text-gray-400 italic">No tasks added yet.</p>
                                          )}
                                        </div>

                                        {/* Start Quest Button */}
                                        {!quest.started ? (
                                          <Button
                                            variant="default"
                                            onClick={() => {
                                              if (canStartQuest(quest.id)) {
                                                startQuest(quest.id);
                                                toast({
                                                  title: "Quest Started!",
                                                  description: `You've started the quest "${quest.title}"`,
                                                });
                                              }
                                            }}
                                            disabled={!canStartQuest(quest.id)}
                                            className={`w-full ${
                                              !canStartQuest(quest.id)
                                                ? 'bg-gray-600 hover:bg-gray-600 text-gray-400 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black'
                                            }`}
                                          >
                                            {!canStartQuest(quest.id) ? 'Daily Limit Reached' : 'Start Quest'}
                                          </Button>
                                        ) : (
                                          <div className="bg-green-900/20 p-2 rounded-md border border-green-500/20 text-center text-green-400 text-sm">
                                            <Clock className="inline-block h-4 w-4 mr-1" />
                                            Quest in progress
                                          </div>
                                        )}
                                      </div>
                                    </CustomDialogContent>
                                  </Dialog>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Not Started Quests */}
                      {questsData.filter(quest => quest.isMainQuest && !quest.completed && !quest.started).length > 0 && (
                        <div>
                          <h3 className="text-yellow-400 font-medium mb-2 flex items-center gap-1">
                            <ListTodo size={14} className="text-yellow-500" />
                            Not Started
                          </h3>
                          <div className="grid grid-cols-1 gap-2">
                            {questsData
                              .filter(quest => quest.isMainQuest && !quest.completed && !quest.started)
                              .map((quest) => (
                                <div
                                  key={quest.id}
                                  className="bg-gray-900 border border-yellow-500/20 rounded-lg p-3 hover:border-yellow-500/40 transition-all"
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-medium text-yellow-400">{quest.title}</h3>
                                    <div className="flex items-center gap-1 text-xs">
                                      <Star size={12} className="text-yellow-400" />
                                      <span className="text-yellow-500">+{quest.expReward} XP</span>
                                    </div>
                                  </div>
                                  {quest.description && (
                                    <p className="text-gray-400 text-sm mb-2 line-clamp-2">{quest.description}</p>
                                  )}
                                  <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                                    <span className="flex items-center gap-1">
                                      <Clock size={10} />
                                      Not Started
                                    </span>
                                    {quest.tasks && quest.tasks.length > 0 && (
                                      <span>
                                        {quest.tasks.length} Tasks
                                      </span>
                                    )}
                                  </div>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full border-yellow-500/30 hover:border-yellow-500/60 text-yellow-500 text-xs px-2 py-1 sm:text-sm sm:px-3 sm:py-2"
                                      >
                                        <Eye size={12} className="mr-1" />
                                        View Quest
                                      </Button>
                                    </DialogTrigger>
                                    <CustomDialogContent className={cn(
                                      isMobile
                                        ? "w-[90vw] max-w-[320px] p-2 sm:p-3 max-h-[85vh]"
                                        : "w-[95vw] max-w-[350px] sm:w-[90vw] sm:max-w-[500px] p-4 max-h-[80vh]",
                                      "overflow-hidden flex flex-col"
                                    )}>
                                      <DialogHeader className="border-b border-yellow-500/20 pb-2 mb-3 relative">
                                        <DialogTitle className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 drop-shadow-sm text-lg">
                                          {quest.title}
                                        </DialogTitle>
                                        <DialogClose className="absolute right-0 top-0 h-6 w-6 rounded-full bg-gradient-to-r from-yellow-600/30 to-amber-700/30 hover:from-yellow-600/50 hover:to-amber-700/50 transition-all p-0.5 border border-yellow-500/20 flex items-center justify-center cursor-pointer z-10">
                                          <X className="h-4 w-4 text-yellow-300" />
                                        </DialogClose>
                                      </DialogHeader>
                                      <div className="py-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                        {quest.description && (
                                          <div className="mb-4">
                                            <h4 className="text-sm font-semibold text-yellow-400 mb-2">Description:</h4>
                                            <div className="p-3 bg-gray-800/30 rounded-md">
                                              <p className="text-gray-300/90 text-sm">{quest.description}</p>
                                            </div>
                                          </div>
                                        )}

                                        {/* Quest Tasks */}
                                        <div className="mb-4">
                                          <h4 className="text-sm font-semibold text-yellow-400 mb-2">Tasks:</h4>
                                          {quest.tasks && quest.tasks.length > 0 ? (
                                            <div className="space-y-1.5">
                                              {quest.tasks.map((task, index) => (
                                                <div
                                                  key={task.id}
                                                  className="flex items-start p-2 rounded-lg bg-gradient-to-r from-gray-800/60 to-gray-800/40 border border-gray-700/30"
                                                >
                                                  <span className="text-yellow-400 text-xs font-medium w-5 text-center flex-shrink-0 mt-0.5">
                                                    {index + 1}.
                                                  </span>
                                                  <div className="ml-2 flex-1 min-w-0">
                                                    <p className={`font-medium text-gray-200 break-words leading-tight ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
                                                      {task.title}
                                                    </p>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <p className="text-sm text-gray-400 italic">No tasks added yet.</p>
                                          )}
                                        </div>

                                        {/* Start Quest Button */}
                                        {!quest.started ? (
                                          <Button
                                            variant="default"
                                            onClick={() => {
                                              if (canStartQuest(quest.id)) {
                                                startQuest(quest.id);
                                                toast({
                                                  title: "Quest Started!",
                                                  description: `You've started the quest "${quest.title}"`,
                                                });
                                              }
                                            }}
                                            disabled={!canStartQuest(quest.id)}
                                            className={`w-full ${
                                              !canStartQuest(quest.id)
                                                ? 'bg-gray-600 hover:bg-gray-600 text-gray-400 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black'
                                            }`}
                                          >
                                            {!canStartQuest(quest.id) ? 'Daily Limit Reached' : 'Start Quest'}
                                          </Button>
                                        ) : (
                                          <div className="bg-green-900/20 p-2 rounded-md border border-green-500/20 text-center text-green-400 text-sm">
                                            <Clock className="inline-block h-4 w-4 mr-1" />
                                            Quest in progress
                                          </div>
                                        )}
                                      </div>
                                    </CustomDialogContent>
                                  </Dialog>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                      {questsData.filter(quest => quest.isMainQuest && !quest.completed).length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-gray-400">No active main quests available.</p>
                        </div>
                      )}
                    </div>
                  </CustomDialogContent>
                </Dialog>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {activeQuests
                  .filter(quest => quest.isMainQuest)
                  .slice(0, isMobile ? 2 : 4)
                  .map((quest) => (
                    <MainQuestCard
                      key={quest.id}
                      quest={quest}
                      onComplete={handleCompleteQuest}
                      onStart={startQuest}
                      canComplete={canCompleteQuest}
                      canStart={canStartQuest}
                    />
                  ))}
              </div>
              {activeQuests.filter(quest => quest.isMainQuest).length === 0 && (
                <div className="bg-solo-dark border border-yellow-500/20 rounded-lg p-4 text-center">
                  <p className="text-gray-400">No active main quests available.</p>
                  <p className="text-gray-400 text-sm mt-2">Click "Add Quest" to create a main quest.</p>
                </div>
              )}
            </div>

            {/* Side Quests Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-solo-text flex items-center gap-2">
                  <Sword className="text-solo-primary" size={20} />
                  Side Quests
                </h2>
                <Dialog open={isSideQuestsDialogOpen} onOpenChange={setIsSideQuestsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 border-indigo-500/30 hover:border-indigo-500/60 text-indigo-500 text-xs px-2 py-1 sm:text-sm sm:px-3 sm:py-2"
                    >
                      <Eye size={14} />
                      View All
                    </Button>
                  </DialogTrigger>
                  <CustomDialogContent className={cn(
                    isMobile
                      ? "w-[90vw] max-w-[320px] p-2 sm:p-3 max-h-[85vh]"
                      : "w-[95vw] max-w-[350px] sm:w-[90vw] sm:max-w-[500px] p-3 max-h-[80vh]",
                    "overflow-hidden flex flex-col"
                  )}>
                    <DialogHeader className="border-b border-indigo-500/20 pb-2 mb-3 relative">
                      <DialogTitle className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-500 drop-shadow-sm text-lg">
                        All Side Quests
                      </DialogTitle>
                      <button
                        type="button"
                        className="absolute right-0 top-0 h-6 w-6 rounded-full bg-gradient-to-r from-indigo-600/30 to-purple-700/30 hover:from-indigo-600/50 hover:to-purple-700/50 transition-all p-0.5 border border-indigo-500/20 flex items-center justify-center cursor-pointer z-10"
                        onClick={() => setIsSideQuestsDialogOpen(false)}
                        aria-label="Close dialog"
                      >
                        <X className="h-4 w-4 text-indigo-300" />
                      </button>
                    </DialogHeader>
                    <div className="py-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                      {/* In Progress Quests */}
                      {questsData.filter(quest => !quest.isMainQuest && !quest.isDaily && !quest.completed && quest.started).length > 0 && (
                        <div className="mb-4">
                          <h3 className="text-indigo-400 font-medium mb-2 flex items-center gap-1">
                            <Clock size={14} className="text-indigo-500" />
                            In Progress
                          </h3>
                          <div className="grid grid-cols-1 gap-2">
                            {questsData
                              .filter(quest => !quest.isMainQuest && !quest.isDaily && !quest.completed && quest.started)
                              .map((quest) => (
                                <div
                                  key={quest.id}
                                  className={`rounded-lg p-3 transition-all ${
                                    quest.isRecoveryQuest
                                      ? 'bg-amber-950/30 border border-amber-600/40 hover:border-amber-500/60'
                                      : 'bg-gray-900 border border-indigo-500/20 hover:border-indigo-500/40'
                                  }`}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                      {quest.isRecoveryQuest && <Shield size={14} className="text-amber-500" />}
                                      <h3 className={`font-medium ${quest.isRecoveryQuest ? 'text-amber-400' : 'text-indigo-400'}`}>
                                        {quest.title}
                                      </h3>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs">
                                      <Star size={12} className="text-yellow-400" />
                                      <span className={quest.isRecoveryQuest ? 'text-amber-500' : 'text-indigo-500'}>
                                        +{quest.expReward} XP
                                      </span>
                                    </div>
                                  </div>
                                  {quest.description && (
                                    <p className="text-gray-400 text-sm mb-2 line-clamp-2">{quest.description}</p>
                                  )}
                                  <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                                    <span className="flex items-center gap-1 bg-green-900/20 text-green-400 px-1.5 py-0.5 rounded-full border border-green-500/20">
                                      <Clock size={10} />
                                      In Progress
                                    </span>
                                    {quest.tasks && quest.tasks.length > 0 && (
                                      <span>
                                        {quest.tasks.filter(t => t.completed).length}/{quest.tasks.length} Tasks
                                      </span>
                                    )}
                                  </div>
                                  <Dialog open={individualQuestDialogOpen === quest.id} onOpenChange={(open) => setIndividualQuestDialogOpen(open ? quest.id : null)}>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className={`w-full text-xs px-2 py-1 sm:text-sm sm:px-3 sm:py-2 ${
                                          quest.isRecoveryQuest
                                            ? 'border-amber-500/30 hover:border-amber-500/60 text-amber-500'
                                            : 'border-indigo-500/30 hover:border-indigo-500/60 text-indigo-500'
                                        }`}
                                      >
                                        <Eye size={12} className="mr-1" />
                                        View Quest
                                      </Button>
                                    </DialogTrigger>
                                    <CustomDialogContent className={cn(
                                      quest.isRecoveryQuest
                                        ? "glassmorphism flex flex-col text-solo-text rounded-xl before:!absolute before:!inset-0 before:!rounded-xl before:!bg-gradient-to-br before:!from-indigo-500/10 before:!to-purple-500/5 before:!backdrop-blur-xl before:!-z-10"
                                        : isMobile
                                          ? "w-[90vw] max-w-[320px] p-2 sm:p-3 max-h-[85vh] overflow-hidden flex flex-col"
                                          : "w-[95vw] max-w-[350px] sm:w-[90vw] sm:max-w-[500px] p-4 max-h-[80vh] overflow-hidden flex flex-col",
                                      quest.isRecoveryQuest && (isMobile
                                        ? "w-[90vw] max-w-[320px] p-2 sm:p-3 max-h-[85vh]"
                                        : "max-w-lg max-h-[90vh] p-4 sm:p-6")
                                    )}>
                                      <DialogHeader className={cn(
                                        quest.isRecoveryQuest ? "flex-shrink-0 relative" : "border-b border-indigo-500/20 pb-2 mb-3 relative"
                                      )}>
                                        <DialogTitle className={cn(
                                          quest.isRecoveryQuest
                                            ? cn("font-semibold text-white/90 tracking-wide", isMobile ? "text-base" : "text-xl")
                                            : "text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-500 drop-shadow-sm text-lg"
                                        )}>
                                          {quest.title}
                                        </DialogTitle>
                                        {quest.isRecoveryQuest && (
                                          <DialogDescription className={cn("text-white/70", isMobile ? "text-xs" : "text-sm")}>
                                            Complete this special recovery quest to lift your curse and restore your experience gain rate.
                                          </DialogDescription>
                                        )}
                                        <button
                                          type="button"
                                          className={`absolute right-0 top-0 h-6 w-6 rounded-full transition-all p-0.5 border flex items-center justify-center cursor-pointer z-10 ${
                                            quest.isRecoveryQuest
                                              ? 'bg-gradient-to-r from-amber-600/30 to-orange-700/30 hover:from-amber-600/50 hover:to-orange-700/50 border-amber-500/20'
                                              : 'bg-gradient-to-r from-indigo-600/30 to-purple-700/30 hover:from-indigo-600/50 hover:to-purple-700/50 border-indigo-500/20'
                                          }`}
                                          onClick={() => setIndividualQuestDialogOpen(null)}
                                          aria-label="Close dialog"
                                        >
                                          <X className={`h-4 w-4 ${quest.isRecoveryQuest ? 'text-amber-300' : 'text-indigo-300'}`} />
                                        </button>
                                      </DialogHeader>
                                      <div className={cn(
                                        quest.isRecoveryQuest
                                          ? cn("flex-1 overflow-y-auto", isMobile ? "pr-1" : "pr-2 -mr-2")
                                          : "py-2 flex-1 overflow-y-auto pr-2 custom-scrollbar"
                                      )}>
                                        {quest.isRecoveryQuest ? (
                                          <div className={cn("relative z-10", isMobile ? "space-y-2 pt-1" : "space-y-4")}>
                                            {quest.description && (
                                              <div className={cn("border border-amber-500/30 bg-amber-950/20 rounded-md", isMobile ? "p-2" : "p-3")}>
                                                <h4 className={cn("font-semibold text-amber-400 mb-2", isMobile ? "text-sm" : "text-base")}>
                                                  Quest Description:
                                                </h4>
                                                <p className={cn("text-amber-200/90", isMobile ? "text-xs" : "text-sm")}>{quest.description}</p>
                                              </div>
                                            )}

                                            {/* Quest Tasks */}
                                            <div className={cn("border border-amber-500/30 bg-amber-950/20 rounded-md", isMobile ? "p-2" : "p-3")}>
                                              <h4 className={cn("font-semibold text-amber-400 mb-2", isMobile ? "text-sm" : "text-base")}>
                                                Recovery Tasks:
                                              </h4>
                                              {quest.tasks && quest.tasks.length > 0 ? (
                                                <div className={cn("text-amber-200/90", isMobile ? "space-y-2 text-xs" : "space-y-3 text-sm")}>
                                                  {quest.tasks.map((task, index) => (
                                                    <div key={task.id} className="space-y-1">
                                                      <div className="flex items-center gap-2">
                                                        <CheckCircle className={cn("text-amber-500 flex-shrink-0", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                                                        <span className={cn("font-medium", isMobile ? "text-xs" : "text-sm")}>{task.title}</span>
                                                      </div>
                                                      {task.description && (
                                                        <div className={cn("space-y-1", isMobile ? "ml-4" : "ml-6")}>
                                                          <div className={cn("flex items-start gap-2 text-amber-300/80", isMobile ? "text-[10px]" : "text-xs")}>
                                                            <span className="text-amber-500 mt-0.5">•</span>
                                                            <span>{task.description}</span>
                                                          </div>
                                                        </div>
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : (
                                                <p className={cn("text-amber-300/80 italic", isMobile ? "text-xs" : "text-sm")}>No tasks added yet.</p>
                                              )}
                                            </div>

                                            <div className={cn("border border-amber-500/30 bg-amber-950/20 rounded-md", isMobile ? "p-2" : "p-3")}>
                                              <h4 className={cn("font-semibold text-amber-400 mb-2", isMobile ? "text-sm" : "text-base")}>
                                                Important Notes:
                                              </h4>
                                              <ul className={cn("text-amber-200/90", isMobile ? "space-y-1 text-xs" : "space-y-1 text-sm")}>
                                                <li className="flex items-start gap-2">
                                                  <AlertCircle className={cn("text-amber-500 flex-shrink-0 mt-0.5", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                                                  <span>This is a special recovery quest to lift your curse</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                  <AlertCircle className={cn("text-amber-500 flex-shrink-0 mt-0.5", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                                                  <span>Complete all tasks to restore your experience gain rate</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                  <AlertCircle className={cn("text-amber-500 flex-shrink-0 mt-0.5", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                                                  <span>Abandoning this quest will reset your redemption progress</span>
                                                </li>
                                              </ul>
                                            </div>
                                          </div>
                                        ) : (
                                          <>
                                            {quest.description && (
                                              <div className="mb-4 p-3 bg-gray-800/30 rounded-md">
                                                <p className="text-gray-300/90 text-sm">{quest.description}</p>
                                              </div>
                                            )}

                                            {/* Quest Tasks */}
                                            <div className="mb-4">
                                              <h4 className="text-sm font-semibold text-indigo-400 mb-2">Tasks:</h4>
                                              {quest.tasks && quest.tasks.length > 0 ? (
                                                <div className="space-y-1.5">
                                                  {quest.tasks.map((task, index) => (
                                                    <div
                                                      key={task.id}
                                                      className="flex items-start p-2 rounded-lg bg-gradient-to-r from-gray-800/60 to-gray-800/40 border border-gray-700/30"
                                                    >
                                                      <span className="text-indigo-400 text-xs font-medium w-5 text-center flex-shrink-0 mt-0.5">
                                                        {index + 1}.
                                                      </span>
                                                      <div className="ml-2 flex-1 min-w-0">
                                                        <p className={`font-medium text-gray-200 break-words leading-tight ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
                                                          {task.title}
                                                        </p>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : (
                                                <p className="text-sm text-gray-400 italic">No tasks added yet.</p>
                                              )}
                                            </div>
                                          </>
                                        )}

                                      </div>

                                      <DialogFooter className={cn(
                                        quest.isRecoveryQuest
                                          ? cn(
                                              "flex-shrink-0 flex gap-2 border-t border-gray-700",
                                              isMobile ? "mt-2 pt-2 flex-col" : "mt-4 pt-4 sm:justify-between"
                                            )
                                          : "pt-2"
                                      )}>
                                        {quest.isRecoveryQuest ? (
                                          <>
                                            {!quest.started ? (
                                              <Button
                                                variant="default"
                                                onClick={() => {
                                                  if (canStartQuest(quest.id)) {
                                                    startQuest(quest.id);
                                                    toast({
                                                      title: "Recovery Quest Started!",
                                                      description: `You've started the recovery quest "${quest.title}"`,
                                                    });
                                                    const closeButton = document.querySelector('[aria-label="Close dialog"]');
                                                    if (closeButton) {
                                                      (closeButton as HTMLElement).click();
                                                    }
                                                  }
                                                }}
                                                disabled={!canStartQuest(quest.id)}
                                                className={cn(
                                                  !canStartQuest(quest.id)
                                                    ? 'bg-gray-600 hover:bg-gray-600 text-gray-400 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white',
                                                  isMobile ? "h-8 text-xs" : "h-9 text-sm"
                                                )}
                                              >
                                                <Shield className={cn("mr-2", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                                                {!canStartQuest(quest.id) ? 'Daily Limit Reached' : 'Start Recovery Quest'}
                                              </Button>
                                            ) : (
                                              <div className={cn(
                                                "bg-green-900/20 p-2 rounded-md border border-green-500/20 text-center text-green-400",
                                                isMobile ? "text-xs" : "text-sm"
                                              )}>
                                                <Clock className={cn("inline-block mr-1", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                                                Recovery Quest in progress
                                              </div>
                                            )}
                                          </>
                                        ) : (
                                          <>
                                            {/* Start Quest Button */}
                                            {!quest.started ? (
                                              <Button
                                                variant="default"
                                                onClick={() => {
                                                  if (canStartQuest(quest.id)) {
                                                    startQuest(quest.id);
                                                    toast({
                                                      title: "Quest Started!",
                                                      description: `You've started the quest "${quest.title}"`,
                                                    });
                                                  }
                                                }}
                                                disabled={!canStartQuest(quest.id)}
                                                className={`w-full ${
                                                  !canStartQuest(quest.id)
                                                    ? 'bg-gray-600 hover:bg-gray-600 text-gray-400 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white'
                                                }`}
                                              >
                                                {!canStartQuest(quest.id) ? 'Daily Limit Reached' : 'Start Quest'}
                                              </Button>
                                            ) : (
                                              <div className="bg-green-900/20 p-2 rounded-md border border-green-500/20 text-center text-green-400 text-sm">
                                                <Clock className="inline-block h-4 w-4 mr-1" />
                                                Quest in progress
                                              </div>
                                            )}
                                          </>
                                        )}
                                      </DialogFooter>
                                    </CustomDialogContent>
                                  </Dialog>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Not Started Quests */}
                      {questsData.filter(quest => !quest.isMainQuest && !quest.isDaily && !quest.completed && !quest.started).length > 0 && (
                        <div>
                          <h3 className="text-indigo-400 font-medium mb-2 flex items-center gap-1">
                            <ListTodo size={14} className="text-indigo-500" />
                            Not Started
                          </h3>
                          <div className="grid grid-cols-1 gap-2">
                            {questsData
                              .filter(quest => !quest.isMainQuest && !quest.isDaily && !quest.completed && !quest.started)
                              .map((quest) => (
                                <div
                                  key={quest.id}
                                  className={`rounded-lg p-3 transition-all ${
                                    quest.isRecoveryQuest
                                      ? 'bg-amber-950/30 border border-amber-600/40 hover:border-amber-500/60'
                                      : 'bg-gray-900 border border-indigo-500/20 hover:border-indigo-500/40'
                                  }`}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                      {quest.isRecoveryQuest && <Shield size={14} className="text-amber-500" />}
                                      <h3 className={`font-medium ${quest.isRecoveryQuest ? 'text-amber-400' : 'text-indigo-400'}`}>
                                        {quest.title}
                                      </h3>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs">
                                      <Star size={12} className="text-yellow-400" />
                                      <span className={quest.isRecoveryQuest ? 'text-amber-500' : 'text-indigo-500'}>
                                        +{quest.expReward} XP
                                      </span>
                                    </div>
                                  </div>
                                  {quest.description && (
                                    <p className="text-gray-400 text-sm mb-2 line-clamp-2">{quest.description}</p>
                                  )}
                                  <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                                    <span className="flex items-center gap-1">
                                      <Clock size={10} />
                                      Not Started
                                    </span>
                                    {quest.tasks && quest.tasks.length > 0 && (
                                      <span>
                                        {quest.tasks.length} Tasks
                                      </span>
                                    )}
                                  </div>
                                  <Dialog open={individualQuestDialogOpen === quest.id} onOpenChange={(open) => setIndividualQuestDialogOpen(open ? quest.id : null)}>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className={`w-full text-xs px-2 py-1 sm:text-sm sm:px-3 sm:py-2 ${
                                          quest.isRecoveryQuest
                                            ? 'border-amber-500/30 hover:border-amber-500/60 text-amber-500'
                                            : 'border-indigo-500/30 hover:border-indigo-500/60 text-indigo-500'
                                        }`}
                                      >
                                        <Eye size={12} className="mr-1" />
                                        View Quest
                                      </Button>
                                    </DialogTrigger>
                                    <CustomDialogContent className={cn(
                                      quest.isRecoveryQuest
                                        ? "glassmorphism flex flex-col text-solo-text rounded-xl before:!absolute before:!inset-0 before:!rounded-xl before:!bg-gradient-to-br before:!from-indigo-500/10 before:!to-purple-500/5 before:!backdrop-blur-xl before:!-z-10"
                                        : isMobile
                                          ? "w-[90vw] max-w-[320px] p-2 sm:p-3 max-h-[85vh] overflow-hidden flex flex-col"
                                          : "w-[95vw] max-w-[350px] sm:w-[90vw] sm:max-w-[500px] p-4 max-h-[80vh] overflow-hidden flex flex-col",
                                      quest.isRecoveryQuest && (isMobile
                                        ? "w-[90vw] max-w-[320px] p-2 sm:p-3 max-h-[85vh]"
                                        : "max-w-lg max-h-[90vh] p-4 sm:p-6")
                                    )}>
                                      <DialogHeader className={cn(
                                        quest.isRecoveryQuest ? "flex-shrink-0 relative" : "border-b border-indigo-500/20 pb-2 mb-3 relative"
                                      )}>
                                        <DialogTitle className={cn(
                                          quest.isRecoveryQuest
                                            ? cn("font-semibold text-white/90 tracking-wide", isMobile ? "text-base" : "text-xl")
                                            : "text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-500 drop-shadow-sm text-lg"
                                        )}>
                                          {quest.title}
                                        </DialogTitle>
                                        {quest.isRecoveryQuest && (
                                          <DialogDescription className={cn("text-white/70", isMobile ? "text-xs" : "text-sm")}>
                                            Complete this special recovery quest to lift your curse and restore your experience gain rate.
                                          </DialogDescription>
                                        )}
                                        <button
                                          type="button"
                                          className={`absolute right-0 top-0 h-6 w-6 rounded-full transition-all p-0.5 border flex items-center justify-center cursor-pointer z-10 ${
                                            quest.isRecoveryQuest
                                              ? 'bg-gradient-to-r from-amber-600/30 to-orange-700/30 hover:from-amber-600/50 hover:to-orange-700/50 border-amber-500/20'
                                              : 'bg-gradient-to-r from-indigo-600/30 to-purple-700/30 hover:from-indigo-600/50 hover:to-purple-700/50 border-indigo-500/20'
                                          }`}
                                          onClick={() => setIndividualQuestDialogOpen(null)}
                                          aria-label="Close dialog"
                                        >
                                          <X className={`h-4 w-4 ${quest.isRecoveryQuest ? 'text-amber-300' : 'text-indigo-300'}`} />
                                        </button>
                                      </DialogHeader>
                                      <div className={cn(
                                        quest.isRecoveryQuest
                                          ? cn("flex-1 overflow-y-auto", isMobile ? "pr-1" : "pr-2 -mr-2")
                                          : "py-2 flex-1 overflow-y-auto pr-2 custom-scrollbar"
                                      )}>
                                        {quest.isRecoveryQuest ? (
                                          <div className={cn("relative z-10", isMobile ? "space-y-2 pt-1" : "space-y-4")}>
                                            {quest.description && (
                                              <div className={cn("border border-amber-500/30 bg-amber-950/20 rounded-md", isMobile ? "p-2" : "p-3")}>
                                                <h4 className={cn("font-semibold text-amber-400 mb-2", isMobile ? "text-sm" : "text-base")}>
                                                  Quest Description:
                                                </h4>
                                                <p className={cn("text-amber-200/90", isMobile ? "text-xs" : "text-sm")}>{quest.description}</p>
                                              </div>
                                            )}

                                            {/* Quest Tasks */}
                                            <div className={cn("border border-amber-500/30 bg-amber-950/20 rounded-md", isMobile ? "p-2" : "p-3")}>
                                              <h4 className={cn("font-semibold text-amber-400 mb-2", isMobile ? "text-sm" : "text-base")}>
                                                Recovery Tasks:
                                              </h4>
                                              {quest.tasks && quest.tasks.length > 0 ? (
                                                <div className={cn("text-amber-200/90", isMobile ? "space-y-2 text-xs" : "space-y-3 text-sm")}>
                                                  {quest.tasks.map((task, index) => (
                                                    <div key={task.id} className="space-y-1">
                                                      <div className="flex items-center gap-2">
                                                        <CheckCircle className={cn("text-amber-500 flex-shrink-0", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                                                        <span className={cn("font-medium", isMobile ? "text-xs" : "text-sm")}>{task.title}</span>
                                                      </div>
                                                      {task.description && (
                                                        <div className={cn("space-y-1", isMobile ? "ml-4" : "ml-6")}>
                                                          <div className={cn("flex items-start gap-2 text-amber-300/80", isMobile ? "text-[10px]" : "text-xs")}>
                                                            <span className="text-amber-500 mt-0.5">•</span>
                                                            <span>{task.description}</span>
                                                          </div>
                                                        </div>
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : (
                                                <p className={cn("text-amber-300/80 italic", isMobile ? "text-xs" : "text-sm")}>No tasks added yet.</p>
                                              )}
                                            </div>

                                            <div className={cn("border border-amber-500/30 bg-amber-950/20 rounded-md", isMobile ? "p-2" : "p-3")}>
                                              <h4 className={cn("font-semibold text-amber-400 mb-2", isMobile ? "text-sm" : "text-base")}>
                                                Important Notes:
                                              </h4>
                                              <ul className={cn("text-amber-200/90", isMobile ? "space-y-1 text-xs" : "space-y-1 text-sm")}>
                                                <li className="flex items-start gap-2">
                                                  <AlertCircle className={cn("text-amber-500 flex-shrink-0 mt-0.5", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                                                  <span>This is a special recovery quest to lift your curse</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                  <AlertCircle className={cn("text-amber-500 flex-shrink-0 mt-0.5", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                                                  <span>Complete all tasks to restore your experience gain rate</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                  <AlertCircle className={cn("text-amber-500 flex-shrink-0 mt-0.5", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                                                  <span>Abandoning this quest will reset your redemption progress</span>
                                                </li>
                                              </ul>
                                            </div>
                                          </div>
                                        ) : (
                                          <>
                                            {quest.description && (
                                              <div className="mb-4">
                                                <h4 className="text-sm font-semibold text-indigo-400 mb-2">Description:</h4>
                                                <div className="p-3 bg-gray-800/30 rounded-md">
                                                  <p className="text-gray-300/90 text-sm">{quest.description}</p>
                                                </div>
                                              </div>
                                            )}

                                            {/* Quest Tasks */}
                                            <div className="mb-4">
                                              <h4 className="text-sm font-semibold text-indigo-400 mb-2">Tasks:</h4>
                                              {quest.tasks && quest.tasks.length > 0 ? (
                                                <div className="space-y-1.5">
                                                  {quest.tasks.map((task, index) => (
                                                    <div
                                                      key={task.id}
                                                      className="flex items-start p-2 rounded-lg bg-gradient-to-r from-gray-800/60 to-gray-800/40 border border-gray-700/30"
                                                    >
                                                      <span className="text-indigo-400 text-xs font-medium w-5 text-center flex-shrink-0 mt-0.5">
                                                        {index + 1}.
                                                      </span>
                                                      <div className="ml-2 flex-1 min-w-0">
                                                        <p className={`font-medium text-gray-200 break-words leading-tight ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
                                                          {task.title}
                                                        </p>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : (
                                                <p className="text-sm text-gray-400 italic">No tasks added yet.</p>
                                              )}
                                            </div>
                                          </>
                                        )}
                                      </div>

                                      <DialogFooter className={cn(
                                        quest.isRecoveryQuest
                                          ? cn(
                                              "flex-shrink-0 flex gap-2 border-t border-gray-700",
                                              isMobile ? "mt-2 pt-2 flex-col" : "mt-4 pt-4 sm:justify-between"
                                            )
                                          : "pt-2"
                                      )}>
                                        {quest.isRecoveryQuest ? (
                                          <>
                                            {!quest.started ? (
                                              <Button
                                                variant="default"
                                                onClick={() => {
                                                  if (canStartQuest(quest.id)) {
                                                    startQuest(quest.id);
                                                    toast({
                                                      title: "Recovery Quest Started!",
                                                      description: `You've started the recovery quest "${quest.title}"`,
                                                    });
                                                    const closeButton = document.querySelector('[aria-label="Close dialog"]');
                                                    if (closeButton) {
                                                      (closeButton as HTMLElement).click();
                                                    }
                                                  }
                                                }}
                                                disabled={!canStartQuest(quest.id)}
                                                className={cn(
                                                  !canStartQuest(quest.id)
                                                    ? 'bg-gray-600 hover:bg-gray-600 text-gray-400 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white',
                                                  isMobile ? "h-8 text-xs" : "h-9 text-sm"
                                                )}
                                              >
                                                <Shield className={cn("mr-2", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                                                {!canStartQuest(quest.id) ? 'Daily Limit Reached' : 'Start Recovery Quest'}
                                              </Button>
                                            ) : (
                                              <div className={cn(
                                                "bg-green-900/20 p-2 rounded-md border border-green-500/20 text-center text-green-400",
                                                isMobile ? "text-xs" : "text-sm"
                                              )}>
                                                <Clock className={cn("inline-block mr-1", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                                                Recovery Quest in progress
                                              </div>
                                            )}
                                          </>
                                        ) : (
                                          <>
                                            {/* Start Quest Button */}
                                            {!quest.started ? (
                                              <Button
                                                variant="default"
                                                onClick={() => {
                                                  if (canStartQuest(quest.id)) {
                                                    startQuest(quest.id);
                                                    toast({
                                                      title: "Quest Started!",
                                                      description: `You've started the quest "${quest.title}"`,
                                                    });
                                                  }
                                                }}
                                                disabled={!canStartQuest(quest.id)}
                                                className={`w-full ${
                                                  !canStartQuest(quest.id)
                                                    ? 'bg-gray-600 hover:bg-gray-600 text-gray-400 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white'
                                                }`}
                                              >
                                                {!canStartQuest(quest.id) ? 'Daily Limit Reached' : 'Start Quest'}
                                              </Button>
                                            ) : (
                                              <div className="bg-green-900/20 p-2 rounded-md border border-green-500/20 text-center text-green-400 text-sm">
                                                <Clock className="inline-block h-4 w-4 mr-1" />
                                                Quest in progress
                                              </div>
                                            )}
                                          </>
                                        )}
                                      </DialogFooter>
                                    </CustomDialogContent>
                                  </Dialog>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                      {questsData.filter(quest => !quest.isMainQuest && !quest.isDaily && !quest.completed).length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-gray-400">No active side quests available.</p>
                        </div>
                      )}
                    </div>
                  </CustomDialogContent>
                </Dialog>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(() => {
                  const sideQuests = activeQuests.filter(quest => !quest.isMainQuest && !quest.isDaily);
                  const regularSideQuests = sideQuests.filter(quest => !quest.isRecoveryQuest);

                  // Show recovery quests only if there are no ongoing regular side quests
                  const hasOngoingSideQuest = regularSideQuests.some(quest => quest.started && !quest.completed);
                  const questsToShow = hasOngoingSideQuest ? regularSideQuests : sideQuests;

                  return questsToShow
                    .slice(0, isMobile ? 2 : 4)
                    .map((quest) => (
                      quest.isRecoveryQuest ? (
                        <RecoveryQuestCard
                          key={quest.id}
                          quest={quest}
                          onComplete={handleCompleteSideQuest}
                          canComplete={canCompleteQuest}
                        />
                      ) : (
                        <SideQuestCard key={quest.id} quest={quest} onComplete={handleCompleteSideQuest} onStart={startQuest} canStart={canStartQuest} />
                      )
                    ));
                })()}
              </div>
            </div>

            {/* Daily Quests Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-solo-text flex items-center gap-2">
                  <Sunrise className="text-green-500" size={20} />
                  Daily Quests
                </h2>
                <Dialog open={isDailyQuestsDialogOpen} onOpenChange={setIsDailyQuestsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 border-green-500/30 hover:border-green-500/60 text-green-500 text-xs px-2 py-1 sm:text-sm sm:px-3 sm:py-2"
                    >
                      <Eye size={14} />
                      View All
                    </Button>
                  </DialogTrigger>
                  <CustomDialogContent className={cn(
                    isMobile
                      ? "w-[90vw] max-w-[320px] p-2 sm:p-3 max-h-[85vh]"
                      : "w-[95vw] max-w-[350px] sm:w-[90vw] sm:max-w-[500px] p-3 max-h-[80vh]",
                    "overflow-hidden flex flex-col"
                  )}>
                    <DialogHeader className="border-b border-green-500/20 pb-2 mb-3 relative">
                      <DialogTitle className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-500 drop-shadow-sm text-lg">
                        All Daily Quests
                      </DialogTitle>
                      <button
                        type="button"
                        className="absolute right-0 top-0 h-6 w-6 rounded-full bg-gradient-to-r from-green-600/30 to-emerald-700/30 hover:from-green-600/50 hover:to-emerald-700/50 transition-all p-0.5 border border-green-500/20 flex items-center justify-center cursor-pointer z-10"
                        onClick={() => setIsDailyQuestsDialogOpen(false)}
                        aria-label="Close dialog"
                      >
                        <X className="h-4 w-4 text-green-300" />
                      </button>
                    </DialogHeader>
                    <div className="py-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                      <div className="space-y-4">
                        {(() => {
                          // Group quests by day
                          const questsByDay = allDailyQuests.reduce((groups, quest) => {
                            const questDate = quest.deadline ? new Date(quest.deadline) : new Date();
                            questDate.setHours(0, 0, 0, 0);
                            const dateKey = questDate.toDateString();

                            if (!groups[dateKey]) {
                              groups[dateKey] = [];
                            }
                            groups[dateKey].push(quest);
                            return groups;
                          }, {} as Record<string, typeof allDailyQuests>);

                          // Get sorted date keys
                          const sortedDateKeys = Object.keys(questsByDay).sort((a, b) =>
                            new Date(a).getTime() - new Date(b).getTime()
                          );

                          return sortedDateKeys.map(dateKey => {
                            const questsForDay = questsByDay[dateKey];
                            const date = new Date(dateKey);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);

                            // Determine day label
                            let dayLabel = '';
                            const dayDiff = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                            if (dayDiff === 0) {
                              dayLabel = 'Today';
                            } else if (dayDiff === 1) {
                              dayLabel = 'Tomorrow';
                            } else if (dayDiff === 2) {
                              dayLabel = 'Day After Tomorrow';
                            } else {
                              dayLabel = `${date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`;
                            }

                            return (
                              <div key={dateKey} className="space-y-2">
                                {/* Day Header */}
                                <div className="flex items-center gap-2 pb-2 border-b border-green-500/20">
                                  <h3 className={`font-semibold text-sm ${
                                    dayDiff === 0 ? 'text-green-400' :
                                    dayDiff === 1 ? 'text-yellow-400' :
                                    'text-gray-400'
                                  }`}>
                                    {dayLabel}
                                  </h3>
                                  <span className="text-xs text-gray-500">
                                    ({questsForDay.length} quest{questsForDay.length !== 1 ? 's' : ''})
                                  </span>
                                </div>

                                {/* Quests for this day */}
                                <div className="grid grid-cols-1 gap-2">
                                  {questsForDay.map((quest) => {
                                    // Remove day text from quest title for display
                                    const displayTitle = quest.title.replace(/\s*\(Day \d+\)$/, '');
                                    // Check if quest is available for completion (only today's quests)
                                    const isAvailableForCompletion = quest.deadline ?
                                      new Date().toDateString() === new Date(quest.deadline).toDateString() : true;
                                    return (
                              <div
                                key={quest.id}
                                className="bg-gray-900 border border-green-500/20 rounded-lg p-3 hover:border-green-500/40 transition-all"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-medium text-green-400">{displayTitle}</h3>
                                <div className="flex items-center gap-1 text-xs">
                                  {quest.category && quest.category.length > 0 && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border shadow-sm font-medium ${
                                      quest.category === 'mental'
                                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                        : quest.category === 'physical'
                                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                        : quest.category === 'spiritual'
                                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                    }`}>
                                      {quest.category.charAt(0).toUpperCase() + quest.category.slice(1)}
                                    </span>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <Star size={12} className="text-yellow-400" />
                                    <span className="text-green-500">+{quest.expReward} XP</span>
                                  </div>
                                </div>
                              </div>
                              {quest.description && (
                                <div className="mb-2">
                                  <p className="text-green-400 text-xs font-medium mb-1">Description:</p>
                                  <p className="text-gray-400 text-sm line-clamp-2">{quest.description}</p>
                                </div>
                              )}
                              <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                                <span className="flex items-center gap-1">
                                  <CalendarClock size={10} />
                                  {quest.deadline ? (
                                    isSameDay(new Date(quest.deadline), new Date())
                                      ? 'Due today'
                                      : `Due ${format(new Date(quest.deadline), 'MMM d')}`
                                  ) : 'No deadline'}
                                </span>
                              </div>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full border-green-500/30 hover:border-green-500/60 text-green-500 text-xs px-2 py-1 sm:text-sm sm:px-3 sm:py-2"
                                  >
                                    <Eye size={12} className="mr-1" />
                                    View Quest
                                  </Button>
                                </DialogTrigger>
                                <CustomDialogContent className="w-[95vw] max-w-[350px] sm:w-[90vw] sm:max-w-[500px] p-4 max-h-[80vh] overflow-hidden flex flex-col">
                                  <DialogHeader className="border-b border-green-500/20 pb-2 mb-3 relative">
                                    <DialogTitle className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-500 drop-shadow-sm text-lg">
                                      {displayTitle}
                                    </DialogTitle>
                                    <DialogClose asChild>
                                      <button
                                        type="button"
                                        className="absolute right-0 top-0 h-6 w-6 rounded-full bg-gradient-to-r from-green-600/30 to-emerald-700/30 hover:from-green-600/50 hover:to-emerald-700/50 transition-all p-0.5 border border-green-500/20 flex items-center justify-center cursor-pointer z-10"
                                        aria-label="Close dialog"
                                      >
                                        <X className="h-4 w-4 text-green-300" />
                                      </button>
                                    </DialogClose>
                                  </DialogHeader>
                                  <div className="py-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                    {quest.description && (
                                      <div className="mb-4">
                                        <h4 className="text-sm font-semibold text-green-400 mb-2">Description:</h4>
                                        <div className="p-3 bg-gray-800/30 rounded-md">
                                          <p className={`text-gray-300/90 ${isMobile ? 'text-xs' : 'text-sm'}`}>{quest.description}</p>
                                        </div>
                                      </div>
                                    )}

                                    {/* Category */}
                                    {quest.category && quest.category.length > 0 && (
                                      <div className="mb-4">
                                        <h4 className="text-sm font-semibold text-green-400 mb-2">Category:</h4>
                                        <div className="flex items-center">
                                          <span className={`text-xs px-2 py-1 rounded-full border shadow-sm font-medium ${
                                            quest.category === 'mental'
                                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                              : quest.category === 'physical'
                                              ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                              : quest.category === 'spiritual'
                                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                              : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                          }`}>
                                            {quest.category.charAt(0).toUpperCase() + quest.category.slice(1)}
                                          </span>
                                        </div>
                                      </div>
                                    )}

                                    {/* Complete Quest Button */}
                                    {isAvailableForCompletion ? (
                                      <Button
                                        variant="default"
                                        onClick={() => {
                                          handleCompleteDailyQuest(quest.id);
                                          const closeButton = document.querySelector('[aria-label="Close dialog"]');
                                          if (closeButton) {
                                            (closeButton as HTMLElement).click();
                                          }
                                        }}
                                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                                      >
                                        Complete Quest
                                      </Button>
                                    ) : (
                                      <div className="w-full flex justify-center items-center gap-2 p-3 bg-gray-700/30 border border-gray-600/40 rounded-md">
                                        <span className="text-gray-400 text-sm font-medium">Available on quest day</span>
                                      </div>
                                    )}
                                  </div>
                                </CustomDialogContent>
                              </Dialog>
                            </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          });
                        })()}
                        {allDailyQuests.length === 0 && (
                          <div className="text-center py-8">
                            <p className="text-gray-400">No active daily quests available.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CustomDialogContent>
                </Dialog>
              </div>

              {dailyQuests.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {dailyQuests.slice(0, isMobile ? 2 : 4).map((quest) => (
                    <DailyQuestCard key={quest.id} quest={quest} onComplete={handleCompleteDailyQuest} />
                  ))}
                </div>
              ) : (
                <div className="bg-solo-dark border border-green-500/20 rounded-lg p-4">
                  <div className="mb-4">
                    <p className="text-gray-400">Daily quests reset every day. Complete them to earn rewards and maintain your streak.</p>
              </div>
                  <div className="bg-solo-dark border border-gray-800 rounded-lg p-4 text-center">
                    <p className="text-gray-400">No active daily quests available.</p>
                    <p className="text-gray-400 text-sm mt-2">Click "Add Quest" to create a daily quest.</p>
              </div>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-solo-primary to-solo-secondary bg-clip-text text-transparent drop-shadow-glow mb-4 flex items-center gap-2">
        <Swords className="h-8 w-8 text-yellow-400 drop-shadow-glow" />
        Quests
      </h1>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Dialog open={isAddQuestDialogOpen} onOpenChange={setIsAddQuestDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Quest
              </Button>
            </DialogTrigger>
            <CustomDialogContent className={cn(
              "glassmorphism flex flex-col text-solo-text rounded-xl",
              "before:!absolute before:!inset-0 before:!rounded-xl",
              "before:!bg-gradient-to-br before:!from-indigo-500/10 before:!to-purple-500/5",
              "before:!backdrop-blur-xl before:!-z-10",
              isMobile
                ? "w-[90vw] max-w-[320px] p-2 sm:p-3 max-h-[85vh]"
                : "max-w-lg max-h-[90vh] p-4 sm:p-6"
            )}>
              <DialogHeader className="flex-shrink-0 relative">
                <DialogTitle className={cn("font-semibold text-white/90 tracking-wide", isMobile ? "text-base" : "text-xl")}>
                  Create New Quest
                </DialogTitle>
                <DialogClose asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "absolute right-0 top-0 h-6 w-6 rounded-full hover:bg-gray-700/50 transition-colors",
                      isMobile ? "h-5 w-5" : "h-6 w-6"
                    )}
                  >
                    <X className={cn("text-gray-400 hover:text-white", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                  </Button>
                </DialogClose>
              </DialogHeader>

              <div className={cn("flex-1 overflow-y-auto", isMobile ? "pr-1" : "pr-2 -mr-2")}>
                <AddQuestDialog onClose={() => setIsAddQuestDialogOpen(false)} isMobile={isMobile} />
              </div>
            </CustomDialogContent>
          </Dialog>

          {/* Help button */}
          <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHelpDialog(true)}
              className={cn(
                "text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors",
                isMobile ? "w-8 h-8" : "w-10 h-10"
              )}
            >
              <HelpCircle className={cn(isMobile ? "w-4 h-4" : "w-5 h-5")} />
            </Button>
            <CustomDialogContent className={cn(
              "glassmorphism flex flex-col text-solo-text rounded-xl",
              "before:!absolute before:!inset-0 before:!rounded-xl",
              "before:!bg-gradient-to-br before:!from-indigo-500/10 before:!to-purple-500/5",
              "before:!backdrop-blur-xl before:!-z-10",
              isMobile
                ? "w-[90vw] max-w-[350px] p-3 max-h-[80vh]"
                : "max-w-md max-h-[85vh] p-6"
            )}>
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className={cn("font-semibold text-white/90 tracking-wide flex items-center gap-2", isMobile ? "text-lg" : "text-xl")}>
                  <HelpCircle className="w-5 h-5 text-blue-400" />
                  Quest Help
                </DialogTitle>
              </DialogHeader>

              <div className={cn("flex-1 overflow-y-auto space-y-4", isMobile ? "text-sm" : "text-base")}>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-white/90 mb-2">What are Quests?</h3>
                    <p className="text-gray-300 leading-relaxed">
                      Quests are structured challenges that help you level up your character. There are three types: Main Quests (major objectives), Side Quests (optional challenges), and Daily Quests (time-limited tasks).
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white/90 mb-2">Quest Types</h3>
                    <ul className="text-gray-300 space-y-1 list-disc list-inside">
                      <li><span className="font-medium text-yellow-400">Main Quests:</span> Important objectives with high rewards (1 per day limit)</li>
                      <li><span className="font-medium text-indigo-400">Side Quests:</span> Optional challenges for extra experience (1 per day limit)</li>
                      <li><span className="font-medium text-green-400">Daily Quests:</span> Time-limited tasks that reset daily (unlimited)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white/90 mb-2">How to Create Quests</h3>
                    <ul className="text-gray-300 space-y-1 list-disc list-inside">
                      <li>Click "Add Quest" to create new quests</li>
                      <li>Choose quest type, set experience rewards</li>
                      <li>Add multiple tasks to break down complex objectives</li>
                      <li>Set deadlines to stay motivated</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white/90 mb-2">Daily Limits</h3>
                    <p className="text-gray-300 leading-relaxed">
                      You can only complete 1 Main Quest and 1 Side Quest per day. Daily Quests have no limits but must be completed by midnight to avoid Shadow Penalty.
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex-shrink-0 border-t border-gray-700 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowHelpDialog(false)}
                  className={cn("w-full", isMobile ? "h-9 text-sm" : "h-10 text-base")}
                >
                  Got it!
                </Button>
              </DialogFooter>
            </CustomDialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quest type filter buttons */}
      <div className="flex flex-wrap gap-2 mt-2">
        <Button
          variant={activeFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveFilter('all')}
          className={`flex items-center gap-1 font-bold ${activeFilter === 'all' ? 'bg-gradient-to-r from-solo-primary to-solo-secondary text-white drop-shadow-glow' : ''}`}
        >
          <Filter className="h-4 w-4" />
          All Quests
        </Button>
        <Button
          variant={activeFilter === 'main' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveFilter('main')}
          className={`flex items-center gap-1 font-bold ${activeFilter === 'main' ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white drop-shadow-glow' : ''}`}
        >
          <Swords className="h-4 w-4 text-yellow-500" />
          Main Quests
        </Button>
        <Button
          variant={activeFilter === 'side' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveFilter('side')}
          className={`flex items-center gap-1 font-bold ${activeFilter === 'side' ? 'bg-gradient-to-r from-solo-primary to-solo-secondary text-white drop-shadow-glow' : ''}`}
        >
          <Sword className="h-4 w-4 text-solo-primary" />
          Side Quests
        </Button>
        <Button
          variant={activeFilter === 'daily' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveFilter('daily')}
          className={`flex items-center gap-1 font-bold ${activeFilter === 'daily' ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-white drop-shadow-glow' : ''}`}
        >
          <Sunrise className="h-4 w-4 text-green-500" />
          Daily Quests
        </Button>
      </div>

      {/* Daily Completion Status */}
      <div className="bg-solo-dark border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-solo-text mb-3 flex items-center gap-2">
          <CalendarClock size={20} className="text-blue-500" />
          Today's Progress
        </h3>
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-3'}`}>
          <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Swords size={16} className="text-yellow-500" />
              <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-yellow-400`}>{isMobile ? 'Main' : 'Main Quests'}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`${isMobile ? 'text-base' : 'text-lg'} font-bold ${dailyStatus.mainQuestsCompleted >= 1 ? 'text-green-400' : 'text-yellow-400'}`}>
                {dailyStatus.mainQuestsCompleted}
              </span>
              <span className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-400`}>/</span>
              <span className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-400`}>1</span>
              {dailyStatus.mainQuestsCompleted >= 1 && <CheckCircle size={isMobile ? 14 : 16} className="text-green-400 ml-1" />}
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Sword size={16} className="text-indigo-500" />
              <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-indigo-400`}>{isMobile ? 'Side' : 'Side Quests'}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`${isMobile ? 'text-base' : 'text-lg'} font-bold ${dailyStatus.sideQuestsCompleted >= 1 ? 'text-green-400' : 'text-indigo-400'}`}>
                {dailyStatus.sideQuestsCompleted}
              </span>
              <span className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-400`}>/</span>
              <span className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-400`}>1</span>
              {dailyStatus.sideQuestsCompleted >= 1 && <CheckCircle size={isMobile ? 14 : 16} className="text-green-400 ml-1" />}
            </div>
          </div>
          {/* Hide Daily Quests on mobile */}
          {!isMobile && (
            <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Sunrise size={16} className="text-green-500" />
                <span className="text-sm font-medium text-green-400">Daily Quests</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold text-green-400">
                  {dailyStatus.dailyQuestsCompleted}
                </span>
                <span className="text-gray-400">/</span>
                <span className="text-gray-400">∞</span>
              </div>
            </div>
          )}
        </div>
        <div className="mt-3 text-xs text-gray-500 text-center">
          Daily limits reset at midnight. You can only start/complete 1 main quest and 1 side quest per day.
        </div>
      </div>

      {/* Active Quests */}
      {renderQuests()}

      {/* Completed Quests */}
      <div>
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-solo-text">Completed Quests</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCompletedQuests(!showCompletedQuests)}
            className={`p-1 flex items-center gap-2 ${showCompletedQuests ? 'text-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
            title={showCompletedQuests ? "Hide completed" : "Show completed"}
          >
            {showCompletedQuests ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            <span className="text-sm">{showCompletedQuests ? "Hide completed" : "Show completed"}</span>
          </Button>
        </div>
        {showCompletedQuests && (
          completedQuests.length === 0 ? (
            <div className="bg-solo-dark border border-gray-800 rounded-lg p-4 text-center">
              <p className="text-gray-400">No quests completed today. Complete some quests to see them here!</p>
              <p className="text-gray-400 text-sm mt-2">This section will reset at midnight.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Completed Main Quests */}
              {completedQuests.filter(quest => quest.isMainQuest).length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-solo-text mb-3 flex items-center gap-2 opacity-70">
                    <Swords className="text-yellow-500" size={18} />
                    Completed Main Quests
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {completedQuests
                      .filter(quest => quest.isMainQuest)
                      .map((quest) => (
                        <div
                          key={quest.id}
                          className="bg-solo-dark border-2 border-yellow-500/30 rounded-lg p-4 opacity-70"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <div className="text-yellow-500/70">
                                <Swords size={16} />
                              </div>
                              <h3 className="font-medium text-lg line-through">{quest.title}</h3>
                            </div>
                            <span className="text-yellow-500/70 font-bold">+{quest.expReward} EXP</span>
                          </div>

                          {quest.description && (
                            <p className="text-gray-400/70 mb-2">{quest.description}</p>
                          )}

                          <div className="text-green-500/70 text-sm flex items-center">
                            <CheckCircle size={14} className="mr-1" />
                            Completed {quest.completedAt && format(new Date(quest.completedAt), 'h:mm a')}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Completed Side Quests */}
              {completedQuests.filter(quest => !quest.isMainQuest && !quest.isDaily).length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-solo-text mb-3 flex items-center gap-2 opacity-70">
                    <Sword className="text-solo-primary" size={18} />
                    Completed Side Quests
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {completedQuests
                      .filter(quest => !quest.isMainQuest && !quest.isDaily)
                      .map((quest) => (
                        <div
                          key={quest.id}
                          className={`bg-solo-dark rounded-lg p-4 opacity-70 ${
                            quest.isRecoveryQuest
                              ? 'border border-amber-500/30'
                              : 'border border-gray-800'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <div className={quest.isRecoveryQuest ? "text-amber-500/70" : "text-solo-primary/70"}>
                                {quest.isRecoveryQuest ? <Shield size={16} /> : <Sword size={16} />}
                              </div>
                              <h3 className="font-medium text-lg line-through">{quest.title}</h3>
                            </div>
                            <span className={quest.isRecoveryQuest ? "text-amber-500/70 font-bold" : "text-solo-primary/70 font-bold"}>
                              +{quest.expReward} EXP
                            </span>
                          </div>

                          {quest.description && (
                            <p className="text-gray-400/70 mb-2">{quest.description}</p>
                          )}

                          <div className="text-green-500/70 text-sm flex items-center">
                            <CheckCircle size={14} className="mr-1" />
                            Completed {quest.completedAt && format(new Date(quest.completedAt), 'h:mm a')}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Completed Daily Quests */}
              {completedQuests.filter(quest => quest.isDaily).length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-solo-text mb-3 flex items-center gap-2 opacity-70">
                    <Sunrise className="text-green-500" size={18} />
                    Completed Daily Quests
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {completedQuests
                      .filter(quest => quest.isDaily)
                      .map((quest) => {
                        // Remove day text from quest title for display
                        const displayTitle = quest.title.replace(/\s*\(Day \d+\)$/, '');
                        return (
                          <div
                            key={quest.id}
                            className="bg-solo-dark border border-green-500/30 rounded-lg p-4 opacity-70"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <div className="text-green-500/70">
                                  <Sunrise size={16} />
                                </div>
                                <div>
                                  <h3 className="font-medium text-lg line-through">{displayTitle}</h3>
                                {quest.category && quest.category.length > 0 && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full opacity-70 ${
                                    quest.category === 'mental'
                                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                      : quest.category === 'physical'
                                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                      : quest.category === 'spiritual'
                                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                      : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                  }`}>
                                    {quest.category.charAt(0).toUpperCase() + quest.category.slice(1)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-green-500/70 font-bold">+{quest.expReward} EXP</span>
                          </div>

                          {quest.description && (
                            <p className="text-gray-400/70 mb-2">{quest.description}</p>
                          )}

                          <div className="text-green-500/70 text-sm flex items-center">
                            <CheckCircle size={14} className="mr-1" />
                            Completed {quest.completedAt && format(new Date(quest.completedAt), 'h:mm a')}
                          </div>
                        </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Show nothing if no completed quests of any type */}
              {completedQuests.length > 0 &&
               completedQuests.filter(quest => quest.isMainQuest).length === 0 &&
               completedQuests.filter(quest => !quest.isMainQuest && !quest.isDaily).length === 0 &&
               completedQuests.filter(quest => quest.isDaily).length === 0 && (
                <div className="bg-solo-dark border border-gray-800 rounded-lg p-4 text-center">
                  <p className="text-gray-400">No quests completed today. Complete some quests to see them here!</p>
                  <p className="text-gray-400 text-sm mt-2">This section will reset at midnight.</p>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Quests