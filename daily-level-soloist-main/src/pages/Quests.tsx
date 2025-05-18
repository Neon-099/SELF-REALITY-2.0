import React, { useState, useEffect } from 'react';
import { useSoloLevelingStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Swords, CalendarClock, ListTodo, Star, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { DateTimePicker } from '@/components/ui/date-time-picker';

// Import the component types
import MainQuestCard from '@/components/MainQuestCard';
import DailyQuestCard from '@/components/DailyQuestCard';
import SideQuestCard from '@/components/SideQuestCard';

// Import required types
import type { Quest, DailyWinCategory, Difficulty } from '@/lib/types';
import { MongoDBService } from '@/lib/services/mongodb-service';

// Define a type for quest types
type QuestType = 'main' | 'side' | 'daily';

// Get the MongoDB service instance
const dbService = MongoDBService.getInstance();

// AddQuestDialog component
const AddQuestDialog = ({ onClose }: { onClose: () => void }) => {
  const addQuest = useSoloLevelingStore(state => state.addQuest);
  const updateQuest = useSoloLevelingStore(state => state.updateQuest);
  const addQuestTask = useSoloLevelingStore(state => state.addQuestTask);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questType, setQuestType] = useState<QuestType>('side');
  const [expPoints, setExpPoints] = useState(15);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [category, setCategory] = useState<DailyWinCategory>('mental');
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);

  // For main quest tasks
  const [taskCount, setTaskCount] = useState(1);
  const [tasks, setTasks] = useState<{ description: string }[]>([{ description: '' }]);

  // Update task inputs when task count changes
  useEffect(() => {
    if (taskCount > tasks.length) {
      // Add new empty tasks
      setTasks([...tasks, ...Array(taskCount - tasks.length).fill(0).map(() => ({ description: '' }))]);
    } else if (taskCount < tasks.length) {
      // Remove extra tasks
      setTasks(tasks.slice(0, taskCount));
    }
  }, [taskCount]);

  // Handle task description change
  const handleTaskChange = (index: number, value: string) => {
    const newTasks = [...tasks];
    newTasks[index] = { description: value };
    setTasks(newTasks);
  };

  const handleAddQuest = async () => {
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

    // Daily quests default to end of today
    if (isDaily && !deadline) {
      const today = new Date();
      today.setHours(23, 59, 59);
      setDeadline(today);
    }

    try {
      // Pass the expPoints directly to addQuest as the custom exp reward
      // and pass all the necessary parameters
      const deadlineDate = isDaily
        ? (deadline || new Date(new Date().setHours(23, 59, 59)))
        : deadline;

      const savedQuest = await addQuest(
        title,
        description,
        isMainQuest,
        expPoints,
        deadlineDate,
        difficulty,
        category,
        isDaily
      );

      if (!savedQuest) {
        throw new Error("Failed to create quest");
      }

      // For main quests with tasks
      if (isMainQuest && tasks.length > 0) {
        // Add tasks to the quest
        for (const task of tasks) {
          if (task.description.trim()) {
            try {
              // Create a task with a proper title and description
              const taskTitle = task.description.trim();
              const taskDescription = task.description.trim();

              // Add the task to the quest
              await addQuestTask(savedQuest.id, taskTitle, taskDescription);

              // Log for debugging
              console.log('Added task to quest:', {
                questId: savedQuest.id,
                taskTitle,
                taskDescription
              });
            } catch (taskError) {
              console.error('Error adding task to quest:', taskError);
            }
          }
        }

        // Verify tasks were added correctly
        const updatedQuest = await dbService.getQuest(savedQuest.id);
        console.log('Updated quest after adding tasks:', updatedQuest);
      }

      toast({
        title: "Quest Added",
        description: `Your new ${questType} quest has been added!`,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setQuestType('side');
      setExpPoints(15);
      setDifficulty('normal');
      setCategory('mental');
      setDeadline(undefined);
      setTaskCount(1);
      setTasks([{ description: '' }]);

      onClose();
    } catch (error) {
      console.error("Error adding quest:", error);
      toast({
        title: "Error",
        description: "Failed to create quest. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Function to handle exp point changes with validation
  const handleExpChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1) {
      setExpPoints(numValue);

      // Update difficulty based on exp points
      if (numValue <= 15) setDifficulty('easy');
      else if (numValue <= 30) setDifficulty('medium');
      else if (numValue <= 60) setDifficulty('hard');
      else setDifficulty('boss');
    }
  };

  return (
    <div className="space-y-2 py-1 sm:space-y-4 sm:py-4">
      <DialogHeader className="pb-0.5 sm:pb-2">
        <DialogTitle className="text-sm sm:text-lg">Add New Quest</DialogTitle>
      </DialogHeader>

      <div className="space-y-0.5 sm:space-y-2">
        <label className="text-[10px] sm:text-sm font-medium">Quest Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-1.5 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-md border border-gray-800 bg-solo-dark"
          placeholder="Quest title"
        />
      </div>

      <div className="space-y-0.5 sm:space-y-2">
        <label className="text-[10px] sm:text-sm font-medium">Quest Type</label>
        <div className="grid grid-cols-3 gap-0.5 sm:gap-2">
          <Button
            type="button"
            variant={questType === 'main' ? 'default' : 'outline'}
            onClick={() => setQuestType('main')}
            className="flex items-center justify-center gap-0.5 w-full h-6 sm:h-10 text-[10px] sm:text-sm px-0.5 sm:px-2"
          >
            <Swords className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-yellow-500" />
            <span className="hidden xs:inline">Main</span>
            <span className="xs:hidden">M</span>
          </Button>
          <Button
            type="button"
            variant={questType === 'side' ? 'default' : 'outline'}
            onClick={() => setQuestType('side')}
            className="flex items-center justify-center gap-0.5 w-full h-6 sm:h-10 text-[10px] sm:text-sm px-0.5 sm:px-2"
          >
            <ListTodo className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-solo-primary" />
            <span className="hidden xs:inline">Side</span>
            <span className="xs:hidden">S</span>
          </Button>
          <Button
            type="button"
            variant={questType === 'daily' ? 'default' : 'outline'}
            onClick={() => setQuestType('daily')}
            className="flex items-center justify-center gap-0.5 w-full h-6 sm:h-10 text-[10px] sm:text-sm px-0.5 sm:px-2"
          >
            <CalendarClock className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-green-500" />
            <span className="hidden xs:inline">Daily</span>
            <span className="xs:hidden">D</span>
          </Button>
        </div>
      </div>

      <div className="space-y-0.5 sm:space-y-2">
        <label className="text-[10px] sm:text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-1.5 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-md border border-gray-800 bg-solo-dark min-h-[40px] sm:min-h-[100px]"
          placeholder="Quest description"
        />
      </div>

      <div className="space-y-0.5 sm:space-y-2">
        <label className="text-[10px] sm:text-sm font-medium">Experience Points (XP)</label>
        <div className="flex flex-col xs:flex-row items-start xs:items-center gap-1 sm:gap-2">
          <input
            type="number"
            min="1"
            value={expPoints}
            onChange={(e) => handleExpChange(e.target.value)}
            className="w-16 sm:w-24 px-1.5 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-md border border-gray-800 bg-solo-dark"
          />
          <div className="flex gap-0.5 sm:gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setExpPoints(15);
                setDifficulty('easy');
              }}
              className={`h-6 sm:h-8 px-1 sm:px-2 text-[10px] sm:text-xs ${expPoints === 15 ? "bg-blue-500/20" : ""}`}
            >
              15 XP
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setExpPoints(30);
                setDifficulty('medium');
              }}
              className={`h-6 sm:h-8 px-1 sm:px-2 text-[10px] sm:text-xs ${expPoints === 30 ? "bg-blue-500/20" : ""}`}
            >
              30 XP
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setExpPoints(60);
                setDifficulty('hard');
              }}
              className={`h-6 sm:h-8 px-1 sm:px-2 text-[10px] sm:text-xs ${expPoints === 60 ? "bg-blue-500/20" : ""}`}
            >
              60 XP
            </Button>
          </div>
        </div>
        <p className="text-[10px] sm:text-xs text-gray-400">Set the experience reward for completing this quest</p>
      </div>

      {questType === 'daily' && (
        <div className="space-y-0.5 sm:space-y-2">
          <label className="text-[10px] sm:text-sm font-medium">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as DailyWinCategory)}
            className="w-full px-1.5 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-md border border-gray-800 bg-solo-dark"
          >
            <option value="mental">Mental</option>
            <option value="physical">Physical</option>
            <option value="spiritual">Spiritual</option>
            <option value="intelligence">Intelligence</option>
          </select>
        </div>
      )}

      {/* Main Quest Tasks */}
      {questType === 'main' && (
        <div className="space-y-1 sm:space-y-3 border border-gray-700 rounded-md p-1.5 sm:p-3 bg-gray-900/20">
          <div className="flex justify-between items-center">
            <label className="text-[10px] sm:text-sm font-medium">Task Breakdown</label>
            <div className="flex items-center gap-0.5 sm:gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setTaskCount(Math.max(1, taskCount - 1))}
                className="h-5 w-5 sm:h-8 sm:w-8 p-0 flex items-center justify-center text-[10px] sm:text-xs"
                disabled={taskCount <= 1}
              >
                -
              </Button>
              <span className="text-[10px] sm:text-sm w-3 sm:w-5 text-center">{taskCount}</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setTaskCount(Math.min(10, taskCount + 1))}
                className="h-5 w-5 sm:h-8 sm:w-8 p-0 flex items-center justify-center text-[10px] sm:text-xs"
                disabled={taskCount >= 10}
              >
                +
              </Button>
            </div>
          </div>

          <div className="space-y-1 sm:space-y-2 max-h-[80px] sm:max-h-[200px] overflow-y-auto pr-1">
            {tasks.map((task, index) => (
              <div key={index} className="flex items-center gap-0.5 sm:gap-2">
                <span className="text-[10px] sm:text-xs text-gray-400 w-3 sm:w-5 text-right">{index + 1}.</span>
                <input
                  type="text"
                  value={task.description}
                  onChange={(e) => handleTaskChange(index, e.target.value)}
                  placeholder={`Task ${index + 1}`}
                  className="flex-1 px-1.5 py-0.5 sm:px-3 sm:py-2 rounded-md border border-gray-700 bg-gray-800/50 text-[10px] sm:text-sm"
                />
              </div>
            ))}
          </div>
          <p className="text-[9px] sm:text-xs text-amber-400/70">Break down your main quest into smaller steps.</p>
        </div>
      )}

      <div className="space-y-0.5 sm:space-y-2">
        <label className="text-[10px] sm:text-sm font-medium">Deadline (optional)</label>
        {questType === 'daily' ? (
          <div className="bg-amber-950/20 p-1.5 sm:p-3 rounded-md text-[10px] sm:text-sm border border-amber-900/20">
            <p className="text-amber-200 font-medium flex items-center">
              <CalendarClock className="h-2.5 w-2.5 sm:h-4 sm:w-4 mr-0.5 sm:mr-2 text-amber-400" />
              Today at 11:59 PM
            </p>
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <DateTimePicker
              date={deadline}
              setDate={setDeadline}
              className="mt-0.5 sm:mt-2 text-[10px] sm:text-sm"
            />
          </div>
        )}
      </div>

      <Button
        onClick={handleAddQuest}
        className="w-full mt-1.5 sm:mt-4 h-7 sm:h-10 text-[10px] sm:text-sm"
      >
        Add Quest
      </Button>
    </div>
  );
};

const Quests = () => {
  const {
    quests = [],
    loadQuests,
    completeQuest,
    startQuest,
    canCompleteQuest,
    addQuest,
    addQuestTask,
    updateQuest
  } = useSoloLevelingStore(state => ({
    quests: Array.isArray(state.quests) ? state.quests : [],
    loadQuests: state.loadQuests,
    completeQuest: state.completeQuest,
    startQuest: state.startQuest,
    canCompleteQuest: state.canCompleteQuest,
    addQuest: state.addQuest,
    addQuestTask: state.addQuestTask,
    updateQuest: state.updateQuest
  }));

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddQuestOpen, setIsAddQuestOpen] = useState(false);

  // State for showing completed quests sections - default to true to ensure visibility
  const [showCompletedMain, setShowCompletedMain] = useState(true);
  const [showCompletedSide, setShowCompletedSide] = useState(true);
  const [showCompletedDaily, setShowCompletedDaily] = useState(true);
  // Master toggle for the entire completed quests section - default to hidden
  const [showCompletedSection, setShowCompletedSection] = useState(false);

  useEffect(() => {
    const initializeQuests = async () => {
      try {
        setIsLoading(true);
        await loadQuests();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load quests');
        console.error('Failed to load quests:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeQuests();
  }, [loadQuests]);

  // Handler for completing main quests
  const handleCompleteMainQuest = (id: string) => {
    completeQuest(id);

    // The EXP is now directly added in the completeQuest function
    // No need to do anything else here
  };

  // Handler for starting quests
  const handleStartQuest = async (id: string) => {
    try {
      // Log before starting
      console.log('Before starting quest from Quests page:', id);

      // Get the quest before starting
      const questBeforeStart = await dbService.getQuest(id);
      console.log('Quest before starting:', questBeforeStart);

      // Start the quest
      const startedQuest = await startQuest(id);

      // Log after starting
      console.log('Quest started from Quests page:', id);
      console.log('Started quest data:', startedQuest);

      // Get the latest quest data
      const latestQuest = await dbService.getQuest(id);
      console.log('Latest quest data after starting:', latestQuest);

      toast({
        title: "Quest Started",
        description: "You've started a new quest!",
      });

      // Return the started quest
      return startedQuest;
    } catch (error) {
      console.error('Error starting quest:', error);
      toast({
        title: "Error Starting Quest",
        description: "There was an error starting the quest. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handler for completing side and daily quests
  const handleCompleteQuest = (id: string) => {
    completeQuest(id);
    // The EXP is now directly added in the completeQuest function
    // No need to do anything else here
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading Quests...</h2>
          <p className="text-gray-500">Please wait while we fetch your quests.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-500 mb-2">Error Loading Quests</h2>
          <p className="text-gray-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Ensure all quests have a tasks array, even if empty
  const normalizedQuests = quests.map(quest => ({
    ...quest,
    tasks: Array.isArray(quest.tasks) ? quest.tasks : [],
    // Ensure the quest has both isMainQuest and isDaily properties
    isMainQuest: Boolean(quest.isMainQuest),
    isDaily: Boolean(quest.isDaily)
  }));

  // Check if a quest was completed today
  const isCompletedToday = (quest: Quest) => {
    if (!quest.completedAt) return false;
    const today = new Date();
    const completedDate = new Date(quest.completedAt);
    return completedDate.getDate() === today.getDate() &&
           completedDate.getMonth() === today.getMonth() &&
           completedDate.getFullYear() === today.getFullYear();
  };

  // Log quest types for debugging
  console.log('Main quests:', normalizedQuests.filter(q => q.isMainQuest).length);
  console.log('Daily quests:', normalizedQuests.filter(q => q.isDaily).length);
  console.log('Side quests:', normalizedQuests.filter(q => !q.isMainQuest && !q.isDaily).length);

  // Separate active and completed quests
  const activeMainQuests = normalizedQuests.filter(q => q.isMainQuest === true && q.completed === false);
  const completedMainQuests = normalizedQuests.filter(q => q.isMainQuest === true && q.completed === true);

  const activeSideQuests = normalizedQuests.filter(q => q.isMainQuest === false && q.isDaily === false && q.completed === false);
  const completedSideQuests = normalizedQuests.filter(q => q.isMainQuest === false && q.isDaily === false && q.completed === true);

  // For daily quests
  const activeDailyQuests = normalizedQuests.filter(q => q.isDaily === true && q.completed === false);
  const completedDailyQuests = normalizedQuests.filter(q => q.isDaily === true && q.completed === true);

  // Counts for displaying in headers
  const completedMainCount = completedMainQuests.length;
  const completedSideCount = completedSideQuests.length;
  const completedDailyCount = completedDailyQuests.length;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quests</h1>
        <Dialog open={isAddQuestOpen} onOpenChange={setIsAddQuestOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-amber-400 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20">
              + Add Quest
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[90%] max-w-[320px] max-h-[85vh] overflow-y-auto p-2 sm:p-6">
            <AddQuestDialog onClose={() => setIsAddQuestOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Quests Sections */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Active Quests</h2>

        {/* Main Quests Section */}
        <section className="mb-8">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Swords className="text-yellow-500" size={20} />
              <span>Main Quests</span>
            </h3>
          </div>

          <div className="grid gap-4">
            {activeMainQuests.length > 0 ? (
              activeMainQuests.map(quest => (
                <MainQuestCard
                  key={quest.id}
                  quest={quest}
                  onComplete={handleCompleteMainQuest}
                  onStart={handleStartQuest}
                  canComplete={canCompleteQuest}
                />
              ))
            ) : (
              <p className="text-gray-500 italic p-4 border border-dashed border-gray-700 rounded-lg bg-gray-900/30">No active main quests. Add one to get started!</p>
            )}
          </div>
        </section>

        

        {/* Side Quests Section */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <ListTodo className="text-solo-primary" size={20} />
            <span>Side Quests</span>
          </h3>

          <div className="grid gap-4">
            {activeSideQuests.length > 0 ? (
              activeSideQuests.map(quest => (
                <SideQuestCard
                  key={quest.id}
                  quest={quest}
                  onComplete={handleCompleteQuest}
                />
              ))
            ) : (
              <p className="text-gray-500 italic p-4 border border-dashed border-gray-700 rounded-lg bg-gray-900/30">No active side quests. Add one to get started!</p>
            )}
            
            {/* Daily Quests Section */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CalendarClock className="text-green-500" size={20} />
            <span>Daily Quests</span>
          </h3>

          <div className="grid gap-4">
            {activeDailyQuests.length > 0 ? (
              activeDailyQuests.map(quest => (
                <DailyQuestCard
                  key={quest.id}
                  quest={quest}
                  onComplete={handleCompleteQuest}
                />
              ))
            ) : (
              <p className="text-gray-500 italic p-4 border border-dashed border-gray-700 rounded-lg bg-gray-900/30">No active daily quests. Add one to get started!</p>
            )}
          </div>
        </section>
          </div>
        </section>
      </div>

      {/* Completed Quests Sections */}
      <div className="mt-12 pt-8 border-t border-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Completed Quests</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCompletedSection(!showCompletedSection)}
            className="flex items-center gap-1 text-gray-400 hover:text-white"
            aria-label={showCompletedSection ? "Hide completed quests" : "Show completed quests"}
          >
            {showCompletedSection ? (
              <>
                <span className="hidden md:inline">Hide</span>
                <ChevronDown className="h-5 w-5" />
              </>
            ) : (
              <>
                <span className="hidden md:inline">Show</span>
                <ChevronRight className="h-5 w-5" />
              </>
            )}
          </Button>
        </div>

        {showCompletedSection && (
          <>
            {/* Completed Main Quests */}
            <section className="mb-8">
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                <button
                  onClick={() => setShowCompletedMain(!showCompletedMain)}
                  className="flex w-full items-center justify-between mb-2"
                >
                  <span className="text-gray-300 hover:text-white text-sm font-medium flex items-center gap-1">
                    {showCompletedMain ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                    <Swords className="text-yellow-500 ml-1" size={16} />
                    Completed Main Quests
                  </span>
                  <span className="bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded-full">
                    {completedMainCount}
                  </span>
                </button>

                {showCompletedMain && (
                  <div className="grid gap-4 mt-2">
                    {completedMainQuests.length > 0 ? (
                      completedMainQuests.map(quest => (
                        <MainQuestCard
                          key={quest.id}
                          quest={quest}
                          onComplete={handleCompleteMainQuest}
                          onStart={handleStartQuest}
                          canComplete={canCompleteQuest}
                        />
                      ))
                    ) : (
                      <p className="text-gray-500 italic p-4">No completed main quests yet.</p>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Completed Daily Quests */}
            <section className="mb-8">
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                <button
                  onClick={() => setShowCompletedDaily(!showCompletedDaily)}
                  className="flex w-full items-center justify-between mb-2"
                >
                  <span className="text-gray-300 hover:text-white text-sm font-medium flex items-center gap-1">
                    {showCompletedDaily ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                    <CalendarClock className="text-green-500 ml-1" size={16} />
                    Completed Daily Quests
                  </span>
                  <span className="bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded-full">
                    {completedDailyCount}
                  </span>
                </button>

                {showCompletedDaily && (
                  <div className="grid gap-4 mt-2">
                    {completedDailyQuests.length > 0 ? (
                      completedDailyQuests.map(quest => (
                        <DailyQuestCard
                          key={quest.id}
                          quest={quest}
                          onComplete={handleCompleteQuest}
                        />
                      ))
                    ) : (
                      <p className="text-gray-500 italic p-4">No completed daily quests yet.</p>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Completed Side Quests */}
            <section className="mb-8">
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                <button
                  onClick={() => setShowCompletedSide(!showCompletedSide)}
                  className="flex w-full items-center justify-between mb-2"
                >
                  <span className="text-gray-300 hover:text-white text-sm font-medium flex items-center gap-1">
                    {showCompletedSide ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                    <ListTodo className="text-solo-primary ml-1" size={16} />
                    Completed Side Quests
                  </span>
                  <span className="bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded-full">
                    {completedSideCount}
                  </span>
                </button>

                {showCompletedSide && (
                  <div className="grid gap-4 mt-2">
                    {completedSideQuests.length > 0 ? (
                      completedSideQuests.map(quest => (
                        <SideQuestCard
                          key={quest.id}
                          quest={quest}
                          onComplete={handleCompleteQuest}
                        />
                      ))
                    ) : (
                      <p className="text-gray-500 italic p-4">No completed side quests yet.</p>
                    )}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default Quests;
