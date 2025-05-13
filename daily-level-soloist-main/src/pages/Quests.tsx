import React, { useState, useEffect } from 'react';
import { useSoloLevelingStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { CheckCircle, Swords, Star, ListTodo, ChevronDown, ChevronUp, Sword, Coins, Filter, Database, X, CalendarClock, Shield, Clock, Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { DailyWinCategory, Difficulty, Quest, Task as QuestTask } from '@/lib/types';
import { isSameDay, format } from 'date-fns';
import { getDB } from '@/lib/db';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import SideQuestCard from '../components/SideQuestCard';
import DailyQuestCard from '../components/DailyQuestCard';
import MainQuestCard from '../components/MainQuestCard';

// Define a type for quest types
type QuestType = 'main' | 'side' | 'daily';

const AddQuestDialog = ({ onClose }: { onClose: () => void }) => {
  const addQuest = useSoloLevelingStore(state => state.addQuest);
  const updateQuest = useSoloLevelingStore(state => state.updateQuest);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questType, setQuestType] = useState<QuestType>('side');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState<DailyWinCategory | ''>('mental');

  const handleAddQuest = () => {
    if (!title.trim()) {
      toast({
        title: "Quest title required",
        description: "Please provide a title for your quest.",
        variant: "destructive"
      });
      return;
    }

    // Get exp reward based on difficulty
    const expRewards: { [key in Difficulty]: number } = {
      easy: 15,
      medium: 30,
      hard: 60,
      boss: 100,
      normal: 20,
    };
    const expPoints = expRewards[difficulty];
    
    // For now, daily quests are treated as side quests in terms of storage
    const isMainQuest = questType === 'main';
    
    let deadlineDate: Date | undefined;
    
    if (questType === 'daily') {
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
    
    // Add the quest
    addQuest(title, description, isMainQuest, expPoints, deadlineDate, difficulty, category, questType === 'daily');
    
    // After quest is added, if it's a daily quest, find and update it
    if (questType === 'daily') {
      setTimeout(() => {
        // Find the quest we just added by matching title, description and deadline
        const quests = useSoloLevelingStore.getState().quests;
        const newQuest = quests.find(q => 
          q.title === title && 
          q.description === description && 
          q.deadline?.getTime() === deadlineDate?.getTime()
        );
        
        if (newQuest) {
          // Update with daily quest properties
          const updates: Partial<Quest> = { isDaily: true, category };
          
          updateQuest(newQuest.id, updates);
          
          toast({
            title: "Daily Quest Added",
            description: "Complete this quest by the end of today to avoid Shadow Penalty.",
            variant: "default"
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
    setDifficulty('easy');
    setDeadline('');
    setCategory('mental');
    onClose();
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Quest Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-gray-800 bg-solo-dark"
          placeholder="Quest title"
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Quest Type</label>
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
            <ListTodo className="h-4 w-4 text-green-500" />
            Daily
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-gray-800 bg-solo-dark min-h-[100px]"
          placeholder="Quest description"
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Difficulty</label>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          className="w-full px-3 py-2 rounded-md border border-gray-800 bg-solo-dark"
        >
          <option value="easy">Easy (15 XP)</option>
          <option value="medium">Medium (30 XP)</option>
          <option value="hard">Hard (60 XP)</option>
          <option value="boss">Boss (100 XP)</option>
          <option value="normal">Normal (20 XP)</option>
        </select>
      </div>
      
      {questType === 'daily' && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Category (optional)</label>
            <span className="text-xs text-gray-400">Not required</span>
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as DailyWinCategory | '')}
            className="w-full px-3 py-2 rounded-md border border-gray-800 bg-solo-dark"
          >
            <option value="">-- Select Category (Optional) --</option>
            <option value="mental">Mental</option>
            <option value="physical">Physical</option>
            <option value="spiritual">Spiritual</option>
            <option value="intelligence">Intelligence</option>
          </select>
          
          <div className="flex items-center justify-between mb-2 mt-3">
            <div className="text-xs text-amber-300 flex items-center">
              <Clock className="h-3 w-3 mr-1" /> Automated Deadline
            </div>
          </div>
          <div className="bg-amber-950/20 p-3 rounded-md text-sm border border-amber-900/20">
            <p className="text-amber-200 font-medium flex items-center">
              <CalendarClock className="h-4 w-4 mr-2 text-amber-400" />
              Deadline: Today at 11:59 PM ({format(new Date().setHours(23, 59, 59), 'MMM d, yyyy')})
            </p>
            <p className="text-xs text-amber-300/80 mt-1">
              Daily quests must be completed by the end of today. Missing the deadline will trigger Shadow Penalty, reducing EXP rewards by 50%.
            </p>
          </div>
        </div>
      )}
      
      {questType !== 'daily' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Deadline (optional)</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-800 bg-solo-dark"
          />
        </div>
      )}
      
      <Button onClick={handleAddQuest} className="w-full">
        Add Quest
      </Button>
    </div>
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
  const [quests, completeQuest, startQuest, canCompleteQuest, addGold, addExp] = useSoloLevelingStore(
    state => [
      state.quests, 
      state.completeQuest, 
      state.startQuest, 
      state.canCompleteQuest,
      state.addGold,
      state.addExp
    ]
  );

  const [showCompletedQuests, setShowCompletedQuests] = useState(false);
  const [isAddQuestDialogOpen, setIsAddQuestDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'main' | 'side' | 'daily'>('all');
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [dbContents, setDbContents] = useState<any>(null);
  const [questsData, setQuestsData] = useState<Quest[]>([]);

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

      setQuestsData(questsToSet);

      setDbContents({
        zustandStore: storeData ? JSON.parse(storeData) : null,
        directQuests: fetchedQuestsFromDB 
      });
      
      toast({
        title: "Database Loaded",
        description: "IndexedDB data has been retrieved successfully.",
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

  // Get daily quests (if any have the isDaily flag)
  const dailyQuests = questsData.filter(quest => 
    quest.isDaily === true && 
    (!quest.completedAt || isSameDay(new Date(quest.completedAt), new Date())) &&
    !quest.completed // ensure it's not completed if activeQuests doesn't already filter this
  );

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

  const renderQuests = () => {
    switch (activeFilter) {
      case 'main':
        return (
          <div>
            <h2 className="text-xl font-bold text-solo-text mb-4 flex items-center gap-2">
              <Swords className="text-yellow-500" size={20} />
              Main Quests
            </h2>
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
            <h2 className="text-xl font-bold text-solo-text mb-4 flex items-center gap-2">
              <Sword className="text-solo-primary" size={20} />
              Side Quests
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeQuests
                .filter(quest => !quest.isMainQuest && !quest.isDaily)
                .map((quest) => (
                  quest.isRecoveryQuest ? (
                    <div 
                      key={quest.id} 
                      className="bg-slate-900 border-2 border-amber-600/80 rounded-lg overflow-hidden transition-all"
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <Shield size={20} className="text-amber-500" />
                            <h3 className="font-medium text-lg text-amber-400">
                              {quest.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star size={16} className="text-yellow-400" />
                            <span className="text-amber-400 font-bold">+{quest.expReward} EXP</span>
                            <div className="bg-amber-950/50 text-xs text-amber-500 ml-1 px-1.5 py-0.5 rounded-sm">Recovery Quest</div>
                          </div>
                        </div>
                        
                        {quest.description && (
                          <p className="text-gray-300/90 mb-3 text-sm">
                            {quest.description}
                          </p>
                        )}
                        
                        {quest.deadline && (
                          <div className="flex items-center gap-2 my-3 p-2 bg-amber-950/30 rounded-md border border-amber-800/30">
                            <Clock size={16} className="text-amber-500" />
                            <div className="flex flex-col">
                              <span className="text-xs text-amber-300 font-medium">Complete by end of day</span>
                              <span className="text-xs text-amber-400/80">
                                {format(new Date(quest.deadline), "MMMM d, yyyy")}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => handleCompleteSideQuest(quest.id)}
                        className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 py-3 text-center text-white flex items-center justify-center gap-2 transition-colors"
                      >
                        <CheckCircle size={18} />
                        <span>Complete Recovery Quest</span>
                      </button>
                    </div>
                  ) : (
                    <SideQuestCard key={quest.id} quest={quest} onComplete={handleCompleteSideQuest} />
                  )
                ))}
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
            <h2 className="text-xl font-bold text-solo-text mb-4 flex items-center gap-2">
              <ListTodo className="text-green-500" size={20} />
              Daily Quests
            </h2>
            <div className="bg-solo-dark border border-green-500/20 rounded-lg p-4">
              <div className="mb-4">
                <p className="text-gray-400">Daily quests reset every day. Complete them to earn rewards and maintain your streak.</p>
              </div>

              {dailyQuests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dailyQuests.map((quest) => (
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
              <h2 className="text-xl font-bold text-solo-text mb-4 flex items-center gap-2">
                <Swords className="text-yellow-500" size={20} />
                Main Quests
              </h2>
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
              <h2 className="text-xl font-bold text-solo-text mb-4 flex items-center gap-2">
                <Sword className="text-solo-primary" size={20} />
                Side Quests
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeQuests
                      .filter(quest => !quest.isMainQuest && !quest.isDaily)
                  .map((quest) => (
                        quest.isRecoveryQuest ? (
                    <div 
                      key={quest.id} 
                            className="bg-slate-900 border-2 border-amber-600/80 rounded-lg overflow-hidden transition-all"
                    >
                            <div className="p-4">
                              <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                                  <Shield size={20} className="text-amber-500" />
                                  <h3 className="font-medium text-lg text-amber-400">
                                    {quest.title}
                                  </h3>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Star size={16} className="text-yellow-400" />
                                  <span className="text-amber-400 font-bold">+{quest.expReward} EXP</span>
                                  <div className="bg-amber-950/50 text-xs text-amber-500 ml-1 px-1.5 py-0.5 rounded-sm">Recovery Quest</div>
                        </div>
                      </div>
                      
                    {quest.description && (
                              <p className="text-gray-300/90 mb-3 text-sm">
                                {quest.description}
                              </p>
                            )}
                            
                            {quest.deadline && (
                              <div className="flex items-center gap-2 my-3 p-2 bg-amber-950/30 rounded-md border border-amber-800/30">
                                <Clock size={16} className="text-amber-500" />
                                <div className="flex flex-col">
                                  <span className="text-xs text-amber-300 font-medium">Complete by end of day</span>
                                  <span className="text-xs text-amber-400/80">
                                    {format(new Date(quest.deadline), "MMMM d, yyyy")}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <button 
                            onClick={() => handleCompleteSideQuest(quest.id)}
                            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 py-3 text-center text-white flex items-center justify-center gap-2 transition-colors"
                          >
                            <CheckCircle size={18} />
                            <span>Complete Recovery Quest</span>
                          </button>
                    </div>
                        ) : (
                          <SideQuestCard key={quest.id} quest={quest} onComplete={handleCompleteSideQuest} />
                        )
                  ))}
              </div>
            </div>
            
            {/* Daily Quests Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-solo-text mb-4 flex items-center gap-2">
                <ListTodo className="text-green-500" size={20} />
                Daily Quests
              </h2>
                
              {dailyQuests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dailyQuests.map((quest) => (
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
                <ListTodo className="h-4 w-4" />
                Add Quest
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Quest</DialogTitle>
              </DialogHeader>
              <AddQuestDialog onClose={() => setIsAddQuestDialogOpen(false)} />
            </DialogContent>
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
          <ListTodo className="h-4 w-4 text-green-500" />
          Daily Quests
        </Button>
      </div>

      {/* Active Quests */}
      {renderQuests()}

      {/* Completed Quests */}
      <div>
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-solo-text">Today's Completed Quests</h2>
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
                          className="bg-solo-dark border border-gray-800 rounded-lg p-4 opacity-70"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <div className="text-solo-primary/70">
                                <Sword size={16} />
                              </div>
                              <h3 className="font-medium text-lg line-through">{quest.title}</h3>
                            </div>
                            <span className="text-solo-primary/70 font-bold">+{quest.expReward} EXP</span>
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
                    <ListTodo className="text-green-500" size={18} />
                    Completed Daily Quests
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {completedQuests
                      .filter(quest => quest.isDaily)
                      .map((quest) => (
                        <div 
                          key={quest.id} 
                          className="bg-solo-dark border border-green-500/30 rounded-lg p-4 opacity-70"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <div className="text-green-500/70">
                                <ListTodo size={16} />
                              </div>
                              <div>
                                <h3 className="font-medium text-lg line-through">{quest.title}</h3>
                                {quest.category && (
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
                      ))}
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

export default Quests;
