import React, { useState } from 'react';
import { useSoloLevelingStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { CheckCircle, Swords, Star, ListTodo, ChevronDown, ChevronUp, Sword, Coins } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { DailyWinCategory, Difficulty } from '@/lib/types';
import { isSameDay, format } from 'date-fns';

const AddTaskDialog = ({ questId, onClose }: { questId: string; onClose: () => void }) => {
  const addQuestTask = useSoloLevelingStore(state => state.addQuestTask);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [category, setCategory] = useState<DailyWinCategory>('mental');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');

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

  const handleCompleteQuest = (id: string, title: string, expReward: number) => {
    completeQuest(id);
    const goldEarned = Math.floor(expReward / 5) * 2; // Convert EXP to gold (5 EXP = 2 gold)
    addGold(goldEarned);
    addExp(expReward);
    
    // Show EXP earned toast
    toast({
      title: "Experience Gained!",
      description: (
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-400 stroke-2" />
          <span>+{expReward} EXP</span>
        </div>
      ),
    });
    
    // Show Gold earned toast
    toast({
      title: "Gold Earned!",
      description: (
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-yellow-400" />
          <span>+{goldEarned} Gold</span>
        </div>
      ),
    });
  };

  // Filter active quests
  const activeQuests = quests.filter(quest => {
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

  // Filter completed quests for today only
  const completedQuests = quests.filter(quest => 
    quest.completed && 
    quest.completedAt && 
    isSameDay(new Date(quest.completedAt), new Date())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-solo-text">Quests</h1>
      </div>

      {/* Active Quests */}
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
              <p className="text-gray-400 text-sm mt-2">Click "New Quest" to create a main quest.</p>
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
          {activeQuests.filter(quest => !quest.isMainQuest).length === 0 && (
            <div className="bg-solo-dark border border-gray-800 rounded-lg p-4 text-center">
              <p className="text-gray-400">No active side quests available.</p>
              <p className="text-gray-400 text-sm mt-2">Click "New Quest" to create a side quest.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Daily Quests Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-solo-text mb-4 flex items-center gap-2">
          <ListTodo className="text-green-500" size={20} />
          Daily Quests
          <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">Coming Soon</span>
        </h2>
        <div className="bg-solo-dark border border-green-500/20 rounded-lg p-4">
          <div className="mb-4">
            <p className="text-gray-400">Daily quests reset every day. Complete them to earn rewards and maintain your streak. Completed daily quests will appear in the "Today's Completed Quests" section below and reset at midnight.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* This section will be populated from MongoDB */}
            <div className="bg-solo-dark border border-gray-800 hover:border-green-500/50 rounded-lg p-4 transition-all">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-lg text-gray-400">Daily Quests Coming Soon</h3>
                </div>
                <span className="text-solo-primary font-bold flex items-center gap-1 opacity-50">
                  <Star size={14} className="text-yellow-400 stroke-2" />
                  +? EXP
                </span>
              </div>
              
              <p className="text-gray-500 mb-4 italic">Daily quests will be available in a future update.</p>
              
              <Button 
                variant="outline" 
                disabled
                size="sm"
                className="w-full flex justify-center items-center gap-2"
              >
                <CheckCircle size={14} />
                Complete Quest
              </Button>
            </div>
            
            {/* Another placeholder daily quest */}
            <div className="bg-solo-dark border border-gray-800 hover:border-green-500/50 rounded-lg p-4 transition-all">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-lg text-gray-400">Daily Quest Example</h3>
                </div>
                <span className="text-solo-primary font-bold flex items-center gap-1 opacity-50">
                  <Star size={14} className="text-yellow-400 stroke-2" />
                  +50 EXP
                </span>
              </div>
              
              <p className="text-gray-500 mb-4 italic">Complete a set of tasks daily to earn bonus rewards</p>
              
              <Button 
                variant="outline" 
                disabled
                size="sm"
                className="w-full flex justify-center items-center gap-2"
              >
                <CheckCircle size={14} />
                Complete Quest
              </Button>
            </div>
          </div>
        </div>
      </div>

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
