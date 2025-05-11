import React, { useState, useEffect } from 'react';
import { useSoloLevelingStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { CheckCircle, Swords, Star, ListTodo, ChevronDown, ChevronUp, Sword, Coins, Filter, Database, X, CalendarClock, Shield, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { DailyWinCategory, Difficulty } from '@/lib/types';
import { isSameDay, format } from 'date-fns';
import { getDB } from '@/lib/db';
import { DateTimePicker } from '@/components/ui/date-time-picker';

// Define a type for quest types
type QuestType = 'main' | 'side' | 'daily';

const AddQuestDialog = ({ onClose }: { onClose: () => void }) => {
  const addQuest = useSoloLevelingStore(state => state.addQuest);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questType, setQuestType] = useState<QuestType>('side');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState<DailyWinCategory>('mental');

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
    const expRewards = {
      easy: 15,
      medium: 30,
      hard: 60,
      boss: 100
    };
    const expPoints = expRewards[difficulty];
    
    // Convert deadline string to Date object if provided
    const deadlineDate = deadline ? new Date(deadline) : undefined;

    // For now, daily quests are treated as side quests in terms of storage
    const isMainQuest = questType === 'main';
    
    // Additional properties for daily quests can be added in future updates
    // Update isDaily flag directly once we have updated the quest interface
    // For now we only pass the 6 required parameters
    addQuest(title, description, isMainQuest, expPoints, deadlineDate, difficulty);
    
    // After quest is added, if it's a daily quest, update it
    if (questType === 'daily') {
      // TODO: Mark as daily quest in the future when the API supports it
    }
    
    // Reset form
    setTitle('');
    setDescription('');
    setQuestType('side');
    setDifficulty('medium');
    setDeadline('');
    setCategory('mental');
    onClose();
    
    toast({
      title: "Quest added",
      description: `Your new ${questType} quest has been added!`,
    });
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
        </select>
      </div>
      
      {questType === 'daily' && (
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
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
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

const QuestTasks = ({ quest }: { quest: any }) => {
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
      
      {quest.tasks.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No tasks added yet. Break down your quest into smaller tasks.</p>
      ) : (
        <div className="space-y-2">
          {quest.tasks.map((task: any) => (
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

  const [showCompletedQuests, setShowCompletedQuests] = useState(true);
  const [isAddQuestDialogOpen, setIsAddQuestDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'main' | 'side' | 'daily'>('all');
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [dbContents, setDbContents] = useState<any>(null);

  // Function to load and display IndexedDB data
  const loadDbData = async () => {
    try {
      setIsLoadingDb(true);
      const db = await getDB();
      
      // Get the raw data from the database
      const storeData = await db.get('store', 'soloist-store');
      
      // Get direct quest data if available
      let questsData = [];
      try {
        const questStore = db.transaction('quests').objectStore('quests');
        questsData = await questStore.getAll();
      } catch (error) {
        console.error('Error fetching quests directly:', error);
      }
      
      setDbContents({
        zustandStore: storeData ? JSON.parse(storeData) : null,
        directQuests: questsData
      });
      
      toast({
        title: "Database Loaded",
        description: "IndexedDB data has been retrieved successfully.",
      });
    } catch (error) {
      console.error('Error loading IndexedDB data:', error);
      toast({
        title: "Database Error",
        description: `Failed to load IndexedDB: ${error.message}`,
        variant: "destructive"
      });
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
  const activeQuests = quests.filter(quest => {
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
  const dailyQuests = activeQuests.filter(quest => 
    quest.isDaily === true && 
    (!quest.completedAt || isSameDay(new Date(quest.completedAt), new Date()))
  );

  // Filter completed quests for today only
  const completedQuests = quests.filter(quest => 
    quest.completed && 
    quest.completedAt && 
    isSameDay(new Date(quest.completedAt), new Date())
  );

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
                  <div 
                    key={quest.id} 
                    className="bg-solo-dark border border-yellow-500/50 hover:border-yellow-500 rounded-lg p-4 transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="text-yellow-500">
                          <Swords size={16} />
                        </div>
                        <h3 className="font-medium text-lg">{quest.title}</h3>
                      </div>
                      <span className="text-solo-primary font-bold flex items-center gap-1">
                        <Star size={14} className="text-yellow-400 stroke-2" />
                        +{quest.expReward} EXP
                      </span>
                    </div>
                    
                    {quest.description && (
                      <p className="text-gray-400 mb-4">{quest.description}</p>
                    )}

                    {!quest.started ? (
                      <Button 
                        variant="outline" 
                        onClick={() => startQuest(quest.id)}
                        size="sm"
                        className="w-full flex justify-center items-center gap-2"
                      >
                        <ListTodo size={14} />
                        Start Quest
                      </Button>
                    ) : (
                      <>
                        <QuestTasks quest={quest} />
                        {canCompleteQuest(quest.id) && (
                          <Button 
                            variant="outline" 
                            onClick={() => handleCompleteQuest(quest.id, quest.title, quest.expReward)}
                            size="sm"
                            className="w-full flex justify-center items-center gap-2 mt-4"
                          >
                            <CheckCircle size={14} />
                            Complete Quest
                          </Button>
                        )}
                      </>
                    )}
                  </div>
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
                .filter(quest => !quest.isMainQuest)
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
                        onClick={() => handleCompleteQuest(quest.id, quest.title, quest.expReward)}
                        className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 py-3 text-center text-white flex items-center justify-center gap-2 transition-colors"
                      >
                        <CheckCircle size={18} />
                        <span>Complete Recovery Quest</span>
                      </button>
                    </div>
                  ) : (
                    <div 
                      key={quest.id} 
                      className="bg-solo-dark border border-gray-800 hover:border-solo-primary/50 rounded-lg p-4 transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-lg">{quest.title}</h3>
                        </div>
                        <span className="text-solo-primary font-bold flex items-center gap-1">
                          <Star size={14} className="text-yellow-400 stroke-2" />
                          +{quest.expReward} EXP
                        </span>
                      </div>
                      
                      {quest.description && (
                        <p className="text-gray-400 mb-4">{quest.description}</p>
                      )}
                      
                      {quest.deadline && (
                        <div className="flex items-center gap-1 text-xs text-amber-400/80 mb-3">
                          <CalendarClock size={12} />
                          <span>Deadline: {format(new Date(quest.deadline), "MMM d, yyyy h:mm a")}</span>
                        </div>
                      )}
                      
                      <Button 
                        variant="outline" 
                        onClick={() => handleCompleteQuest(quest.id, quest.title, quest.expReward)}
                        size="sm"
                        className="w-full flex justify-center items-center gap-2"
                      >
                        <CheckCircle size={14} />
                        Complete Quest
                      </Button>
                    </div>
                  )
                ))}
            </div>
            {activeQuests.filter(quest => !quest.isMainQuest).length === 0 && (
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
                    <div 
                      key={quest.id} 
                      className="bg-solo-dark border border-gray-800 hover:border-green-500/50 rounded-lg p-4 transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className="text-green-500">
                            <ListTodo size={16} />
                          </div>
                          <h3 className="font-medium text-lg">{quest.title}</h3>
                        </div>
                        <span className="text-solo-primary font-bold flex items-center gap-1">
                          <Star size={14} className="text-yellow-400 stroke-2" />
                          +{quest.expReward} EXP
                        </span>
                      </div>
                      
                      {quest.description && (
                        <p className="text-gray-400 mb-4">{quest.description}</p>
                      )}
                      
                      <Button 
                        variant="outline" 
                        onClick={() => handleCompleteQuest(quest.id, quest.title, quest.expReward)}
                        size="sm"
                        className="w-full flex justify-center items-center gap-2"
                      >
                        <CheckCircle size={14} />
                        Complete Quest
                      </Button>
                    </div>
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
                    <div 
                      key={quest.id} 
                      className="bg-solo-dark border border-yellow-500/50 hover:border-yellow-500 rounded-lg p-4 transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className="text-yellow-500">
                            <Swords size={16} />
                          </div>
                          <h3 className="font-medium text-lg">{quest.title}</h3>
                        </div>
                        <span className="text-solo-primary font-bold flex items-center gap-1">
                          <Star size={14} className="text-yellow-400 stroke-2" />
                          +{quest.expReward} EXP
                        </span>
                      </div>
                      
                      {quest.description && (
                        <p className="text-gray-400 mb-4">{quest.description}</p>
                      )}

                      {!quest.started ? (
                        <Button 
                          variant="outline" 
                          onClick={() => startQuest(quest.id)}
                          size="sm"
                          className="w-full flex justify-center items-center gap-2"
                        >
                          <ListTodo size={14} />
                          Start Quest
                        </Button>
                      ) : (
                        <>
                          <QuestTasks quest={quest} />
                          {canCompleteQuest(quest.id) && (
                            <Button 
                              variant="outline" 
                              onClick={() => handleCompleteQuest(quest.id, quest.title, quest.expReward)}
                              size="sm"
                              className="w-full flex justify-center items-center gap-2 mt-4"
                            >
                              <CheckCircle size={14} />
                              Complete Quest
                            </Button>
                          )}
                        </>
                      )}
                    </div>
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
                  .filter(quest => !quest.isMainQuest)
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
                          onClick={() => handleCompleteQuest(quest.id, quest.title, quest.expReward)}
                          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 py-3 text-center text-white flex items-center justify-center gap-2 transition-colors"
                        >
                          <CheckCircle size={18} />
                          <span>Complete Recovery Quest</span>
                        </button>
                      </div>
                    ) : (
                      <div 
                        key={quest.id} 
                        className="bg-solo-dark border border-gray-800 hover:border-solo-primary/50 rounded-lg p-4 transition-all"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-lg">{quest.title}</h3>
                          </div>
                          <span className="text-solo-primary font-bold flex items-center gap-1">
                            <Star size={14} className="text-yellow-400 stroke-2" />
                            +{quest.expReward} EXP
                          </span>
                        </div>
                        
                        {quest.description && (
                          <p className="text-gray-400 mb-4">{quest.description}</p>
                        )}
                        
                        {quest.deadline && (
                          <div className="flex items-center gap-1 text-xs text-amber-400/80 mb-3">
                            <CalendarClock size={12} />
                            <span>Deadline: {format(new Date(quest.deadline), "MMM d, yyyy h:mm a")}</span>
                          </div>
                        )}
                        
                        <Button 
                          variant="outline" 
                          onClick={() => handleCompleteQuest(quest.id, quest.title, quest.expReward)}
                          size="sm"
                          className="w-full flex justify-center items-center gap-2"
                        >
                          <CheckCircle size={14} />
                          Complete Quest
                        </Button>
                      </div>
                    )
                  ))}
              </div>
              {activeQuests.filter(quest => !quest.isMainQuest).length === 0 && (
                <div className="bg-solo-dark border border-gray-800 rounded-lg p-4 text-center">
                  <p className="text-gray-400">No active side quests available.</p>
                  <p className="text-gray-400 text-sm mt-2">Click "Add Quest" to create a side quest.</p>
                </div>
              )}
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
                    <div 
                      key={quest.id} 
                      className="bg-solo-dark border border-gray-800 hover:border-green-500/50 rounded-lg p-4 transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className="text-green-500">
                            <ListTodo size={16} />
                          </div>
                          <h3 className="font-medium text-lg">{quest.title}</h3>
                        </div>
                        <span className="text-solo-primary font-bold flex items-center gap-1">
                          <Star size={14} className="text-yellow-400 stroke-2" />
                          +{quest.expReward} EXP
                        </span>
                      </div>
                      
                      {quest.description && (
                        <p className="text-gray-400 mb-4">{quest.description}</p>
                      )}
                      
                      <Button 
                        variant="outline" 
                        onClick={() => handleCompleteQuest(quest.id, quest.title, quest.expReward)}
                        size="sm"
                        className="w-full flex justify-center items-center gap-2"
                      >
                        <CheckCircle size={14} />
                        Complete Quest
                      </Button>
                    </div>
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-solo-text">Quests</h1>
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
      <div className="flex flex-wrap gap-2">
        <Button 
          variant={activeFilter === 'all' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setActiveFilter('all')}
          className="flex items-center gap-1"
        >
          <Filter className="h-4 w-4" />
          All Quests
        </Button>
        <Button 
          variant={activeFilter === 'main' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setActiveFilter('main')}
          className="flex items-center gap-1"
        >
          <Swords className="h-4 w-4 text-yellow-500" />
          Main Quests
        </Button>
        <Button 
          variant={activeFilter === 'side' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setActiveFilter('side')}
          className="flex items-center gap-1"
        >
          <Sword className="h-4 w-4 text-solo-primary" />
          Side Quests
        </Button>
        <Button 
          variant={activeFilter === 'daily' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setActiveFilter('daily')}
          className="flex items-center gap-1"
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
            className="flex items-center gap-2"
          >
            {showCompletedQuests ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Hide Completed
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show Completed
              </>
            )}
          </Button>
        </div>
        {showCompletedQuests && (
          completedQuests.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Example of how a completed daily quest would appear (to be removed when real implementation is done) */}
              <div className="bg-solo-dark border border-gray-800 rounded-lg p-4 opacity-70">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="text-green-500/70">
                      <ListTodo size={16} />
                    </div>
                    <h3 className="font-medium text-lg line-through">Example Completed Daily Quest</h3>
                  </div>
                  <span className="text-solo-primary/70 font-bold">+50 EXP</span>
                </div>
                
                <p className="text-gray-400/70 mb-2">This is how completed daily quests will appear in this section</p>
                
                <div className="text-green-500/70 text-sm flex items-center">
                  <CheckCircle size={14} className="mr-1" />
                  Completed {format(new Date(), 'h:mm a')}
                </div>
              </div>
              <div className="bg-solo-dark border border-gray-800 rounded-lg p-4 text-center">
                <p className="text-gray-400">No quests completed today. Complete some quests to see them here!</p>
                <p className="text-gray-400 text-sm mt-2">This section will reset at midnight.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedQuests.map((quest) => (
                <div 
                  key={quest.id} 
                  className="bg-solo-dark border border-gray-800 rounded-lg p-4 opacity-70"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {quest.isMainQuest ? (
                        <div className="text-yellow-500/70">
                          <Swords size={16} />
                        </div>
                      ) : (
                        /* In the future, we'll add a condition here for daily quests */
                        <div className="text-solo-primary/70">
                          <Sword size={16} />
                        </div>
                      )}
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
          )
        )}
      </div>
    </div>
  );
};

export default Quests;
