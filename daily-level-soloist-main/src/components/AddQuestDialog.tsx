import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSoloLevelingStore } from '@/lib/store';
import { DailyWinCategory, Difficulty, Task } from '@/lib/types';
import { Swords, Sword, ListTodo, Star, CalendarClock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

type QuestType = 'main' | 'side' | 'daily';

interface AddQuestDialogProps {
  onClose: () => void;
}

const AddQuestDialog: React.FC<AddQuestDialogProps> = ({ onClose }) => {
  const isMobile = useIsMobile();
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
    <div className={cn(isMobile ? "space-y-1.5 pr-1" : "space-y-3 pr-1")}>
      <div className={cn(isMobile ? "space-y-0.5" : "space-y-1.5")}>
        <label className={cn("font-medium text-white/80", isMobile ? "text-sm" : "text-sm")}>Quest Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={cn(
            "w-full px-3 rounded-md border border-gray-800 bg-solo-dark",
            isMobile ? "h-7 text-sm py-1" : "h-8 text-sm py-2"
          )}
          placeholder="Quest title"
        />
      </div>

      <div className={cn(isMobile ? "space-y-0.5" : "space-y-1.5")}>
        <label className={cn("font-medium text-white/80", isMobile ? "text-sm" : "text-sm")}>Quest Type</label>
        <div className={cn("grid grid-cols-3", isMobile ? "gap-1" : "gap-2")}>
          <Button
            type="button"
            variant={questType === 'main' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQuestType('main')}
            className={cn(
              "flex items-center justify-center gap-1 w-full",
              isMobile ? "h-6 text-xs px-1" : "h-8 text-xs"
            )}
          >
            <Swords className={cn(isMobile ? "h-3 w-3" : "h-3.5 w-3.5", "text-yellow-500")} />
            Main
          </Button>
          <Button
            type="button"
            variant={questType === 'side' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQuestType('side')}
            className={cn(
              "flex items-center justify-center gap-1 w-full",
              isMobile ? "h-6 text-xs px-1" : "h-8 text-xs"
            )}
          >
            <Sword className={cn(isMobile ? "h-3 w-3" : "h-3.5 w-3.5", "text-solo-primary")} />
            Side
          </Button>
          <Button
            type="button"
            variant={questType === 'daily' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQuestType('daily')}
            className={cn(
              "flex items-center justify-center gap-1 w-full",
              isMobile ? "h-6 text-xs px-1" : "h-8 text-xs"
            )}
          >
            <ListTodo className={cn(isMobile ? "h-3 w-3" : "h-3.5 w-3.5", "text-green-500")} />
            Daily
          </Button>
        </div>
      </div>

      <div className={cn(isMobile ? "space-y-0.5" : "space-y-1.5")}>
        <label className={cn("font-medium text-white/80", isMobile ? "text-sm" : "text-sm")}>Description (Optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={cn(
            "w-full px-3 rounded-md border border-gray-800 bg-solo-dark",
            isMobile ? "h-12 text-sm py-1" : "min-h-[60px] text-sm py-2"
          )}
          placeholder="Quest description"
        />
      </div>

      {/* EXP Input with Quick Selects, Quest Generator, and Number of Tasks */}
      <div className={cn("grid grid-cols-2", isMobile ? "gap-1" : "gap-4")}>
        <div className={cn(isMobile ? "space-y-0.5" : "space-y-1.5")}>
          <label className={cn("font-medium text-white/80 flex items-center gap-1", isMobile ? "text-sm" : "text-sm")}>
            <Star size={isMobile ? 12 : 14} className="text-yellow-400" />
            {isMobile ? "XP" : "Experience Points"}
          </label>
          <div className={cn("flex flex-col", isMobile ? "gap-1" : "gap-2")}>
            <input
              type="number"
              min="1"
              value={expPoints}
              onChange={(e) => handleExpChange(e.target.value)}
              className={cn(
                "w-full px-2 rounded-md border border-gray-800 bg-solo-dark",
                isMobile ? "h-6 text-xs py-1" : "h-8 text-sm py-2 px-3"
              )}
            />
            <div className={cn("flex items-center", isMobile ? "gap-0.5" : "gap-1")}>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setExpPoints(15)}
                className={cn(
                  `${expPoints === 15 ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300' : ''}`,
                  isMobile ? "text-xs px-1 py-0.5 h-6 flex-1" : "text-xs px-2 py-1 h-8"
                )}
              >
                15
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setExpPoints(30)}
                className={cn(
                  `${expPoints === 30 ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300' : ''}`,
                  isMobile ? "text-xs px-1 py-0.5 h-6 flex-1" : "text-xs px-2 py-1 h-8"
                )}
              >
                30
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setExpPoints(60)}
                className={cn(
                  `${expPoints === 60 ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300' : ''}`,
                  isMobile ? "text-xs px-1 py-0.5 h-6 flex-1" : "text-xs px-2 py-1 h-8"
                )}
              >
                60
              </Button>
            </div>
          </div>
        </div>

        {questType === 'daily' && (
          <div className={cn(isMobile ? "space-y-0.5" : "space-y-1.5")}>
            <label className={cn("font-medium text-white/80", isMobile ? "text-sm" : "text-sm")}>
              {isMobile ? "Generator" : "Quest Generator"}
            </label>
            <div className={cn("flex flex-col", isMobile ? "gap-1" : "gap-2")}>
              <div className={cn("flex items-center", isMobile ? "gap-1" : "gap-2")}>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={questGeneratorCount}
                  onChange={(e) => setQuestGeneratorCount(parseInt(e.target.value) || 1)}
                  className={cn(
                    "rounded-md border border-gray-800 bg-solo-dark",
                    isMobile ? "w-12 h-6 px-2 py-1 text-xs" : "w-16 px-3 py-2 text-sm"
                  )}
                />
                <span className={cn("text-gray-400", isMobile ? "text-xs" : "text-sm")}>
                  {questGeneratorCount === 1 ? 'day' : 'days'}
                </span>
              </div>
              {/* Spacer to match Experience Points height */}
              {isMobile && <div className="h-6"></div>}
            </div>
          </div>
        )}

        {(questType === 'main' || questType === 'side') && (
          <div className={cn(isMobile ? "space-y-0.5" : "space-y-1.5")}>
            <label className={cn("font-medium text-white/80", isMobile ? "text-sm" : "text-sm")}>
              {isMobile ? "Tasks" : "Number of Tasks"}
            </label>
            <div className={cn("flex flex-col", isMobile ? "gap-1" : "gap-2")}>
              <div className={cn("flex items-center", isMobile ? "gap-1" : "gap-2")}>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={taskCount}
                  onChange={(e) => setTaskCount(parseInt(e.target.value))}
                  className={cn(
                    "rounded-md border border-gray-800 bg-solo-dark",
                    isMobile ? "w-12 h-6 px-2 py-1 text-xs" : "w-16 px-3 py-2 text-sm"
                  )}
                />
                {!isMobile && <span className="text-sm text-gray-400">tasks</span>}
              </div>
              {/* Spacer to match Experience Points height */}
              {isMobile && <div className="h-6"></div>}
            </div>
          </div>
        )}
      </div>

      {/* Category selection for daily quests */}
      {questType === 'daily' && (
        <div className={cn(isMobile ? "space-y-0.5" : "space-y-1.5")}>
          <label className={cn("font-medium text-white/80", isMobile ? "text-sm" : "text-sm")}>Category (Optional)</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as DailyWinCategory | '')}
            className={cn(
              "w-full px-3 rounded-md border border-gray-800 bg-solo-dark",
              isMobile ? "h-7 text-sm py-1" : "h-8 text-sm py-2"
            )}
          >
            <option value=""></option>
            <option value="mental">Mental</option>
            <option value="physical">Physical</option>
            <option value="spiritual">Spiritual</option>
            <option value="intelligence">Intelligence</option>
          </select>
        </div>
      )}

      {/* Deadline selection for main and side quests */}
      {questType !== 'daily' && (
        <div className={cn(isMobile ? "space-y-0.5" : "space-y-1.5")}>
          <label className={cn("font-medium text-white/80 flex items-center gap-1", isMobile ? "text-sm" : "text-sm")}>
            <CalendarClock size={isMobile ? 12 : 14} className="text-amber-400" />
            Deadline (Optional)
          </label>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className={cn(
              "w-full px-3 rounded-md border border-gray-800 bg-solo-dark",
              isMobile ? "h-7 text-sm py-1" : "h-8 text-sm py-2"
            )}
          />
        </div>
      )}

      {/* Task titles for main and side quests */}
      {(questType === 'main' || questType === 'side') && taskCount > 0 && tasks.length > 0 && (
        <div className={cn(isMobile ? "space-y-0.5" : "space-y-1.5")}>
          <label className={cn("font-medium text-white/80", isMobile ? "text-sm" : "text-sm")}>Task Titles</label>
          <div className={cn(
            "overflow-y-auto pr-1.5 custom-scrollbar",
            isMobile ? "space-y-1 max-h-[120px]" : "space-y-1.5 max-h-[150px]"
          )}>
            {tasks.map((task, index) => (
              <input
                key={index}
                type="text"
                value={task.title}
                onChange={(e) => handleTaskTitleChange(index, e.target.value)}
                className={cn(
                  "w-full px-3 rounded-md border border-gray-800 bg-solo-dark",
                  isMobile ? "h-6 text-xs py-1" : "h-7 text-xs py-1.5"
                )}
                placeholder={`Task ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      <Button
        onClick={handleAddQuest}
        className={cn(
          "w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white",
          isMobile ? "h-7 text-sm mt-1" : "h-9 mt-2"
        )}
      >
        Add Quest
      </Button>
    </div>
  );
};

export default AddQuestDialog;