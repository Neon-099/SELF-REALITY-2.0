import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSoloLevelingStore } from '@/lib/store';
import { DailyWinCategory, Difficulty, Task } from '@/lib/types';
import { Swords, Sword, ListTodo, Star, CalendarClock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type QuestType = 'main' | 'side' | 'daily';

interface AddQuestDialogProps {
  onClose: () => void;
}

const AddQuestDialog: React.FC<AddQuestDialogProps> = ({ onClose }) => {
  const addQuest = useSoloLevelingStore(state => state.addQuest);
  const updateQuest = useSoloLevelingStore(state => state.updateQuest);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questType, setQuestType] = useState<QuestType>('side');
  const [expPoints, setExpPoints] = useState<number>(15);
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState<DailyWinCategory | ''>('mental');
  const [taskCount, setTaskCount] = useState<number>(1);
  const [tasks, setTasks] = useState<Array<{title: string, completed: boolean}>>([]);
  
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
    
    // Use quest DailyWinCategory or default value based on quest type
    const questCategory = isDaily ? (category || 'mental') as DailyWinCategory : category as DailyWinCategory;
    
    // Use a default difficulty since the API still requires it, but we're using custom EXP
    const defaultDifficulty: Difficulty = 'normal';
    
    // Add the quest with proper isDaily flag
    addQuest(title, description, isMainQuest, expPoints, deadlineDate, defaultDifficulty, questCategory, isDaily);
    
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
            title: "Daily Quest Added",
            description: "Complete this quest by the end of today to avoid Shadow Penalty.",
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
    setCategory('mental');
    setTaskCount(1);
    setTasks([]);
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
    <div className="space-y-3 pr-1">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Quest Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-gray-800 bg-solo-dark text-sm"
          placeholder="Quest title"
        />
      </div>
      
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Quest Type</label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant={questType === 'main' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQuestType('main')}
            className="flex items-center justify-center gap-1 w-full h-8 text-xs"
          >
            <Swords className="h-3.5 w-3.5 text-yellow-500" />
            Main
          </Button>
          <Button
            type="button"
            variant={questType === 'side' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQuestType('side')}
            className="flex items-center justify-center gap-1 w-full h-8 text-xs"
          >
            <Sword className="h-3.5 w-3.5 text-solo-primary" />
            Side
          </Button>
          <Button
            type="button"
            variant={questType === 'daily' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQuestType('daily')}
            className="flex items-center justify-center gap-1 w-full h-8 text-xs"
          >
            <ListTodo className="h-3.5 w-3.5 text-green-500" />
            Daily
          </Button>
        </div>
      </div>
      
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Description (Optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-gray-800 bg-solo-dark min-h-[60px] text-sm"
          placeholder="Quest description"
        />
      </div>
      
      {/* EXP Input with Quick Selects */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium flex items-center gap-1">
          <Star size={14} className="text-yellow-400" />
          Experience Points
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            value={expPoints}
            onChange={(e) => handleExpChange(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-800 bg-solo-dark text-sm"
          />
          <div className="flex items-center gap-1">
            <Button 
              type="button" 
              size="sm" 
              variant="outline" 
              onClick={() => setExpPoints(15)}
              className={`text-xs px-2 py-1 h-8 ${expPoints === 15 ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300' : ''}`}
            >
              15
            </Button>
            <Button 
              type="button" 
              size="sm" 
              variant="outline" 
              onClick={() => setExpPoints(30)}
              className={`text-xs px-2 py-1 h-8 ${expPoints === 30 ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300' : ''}`}
            >
              30
            </Button>
            <Button 
              type="button" 
              size="sm" 
              variant="outline" 
              onClick={() => setExpPoints(60)}
              className={`text-xs px-2 py-1 h-8 ${expPoints === 60 ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300' : ''}`}
            >
              60
            </Button>
          </div>
        </div>
      </div>

      {/* Category selection for daily quests */}
      {questType === 'daily' && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as DailyWinCategory)}
            className="w-full px-3 py-2 rounded-md border border-gray-800 bg-solo-dark text-sm"
          >
            <option value="mental">Mental</option>
            <option value="physical">Physical</option>
            <option value="spiritual">Spiritual</option>
            <option value="intelligence">Intelligence</option>
          </select>
        </div>
      )}
      
      {/* Deadline selection for main and side quests */}
      {questType !== 'daily' && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium flex items-center gap-1">
            <CalendarClock size={14} className="text-amber-400" />
            Deadline (Optional)
          </label>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-800 bg-solo-dark text-sm"
          />
        </div>
      )}
      
      {/* Task count for main and side quests */}
      {(questType === 'main' || questType === 'side') && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Number of Tasks</label>
          <input
            type="number"
            min="1"
            max="10"
            value={taskCount}
            onChange={(e) => setTaskCount(parseInt(e.target.value))}
            className="w-full px-3 py-2 rounded-md border border-gray-800 bg-solo-dark text-sm"
          />
          
          {taskCount > 0 && tasks.length > 0 && (
            <div className="space-y-1.5 mt-2">
              <label className="text-sm font-medium">Task Titles</label>
              <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1.5 custom-scrollbar">
                {tasks.map((task, index) => (
                  <input
                    key={index}
                    type="text"
                    value={task.title}
                    onChange={(e) => handleTaskTitleChange(index, e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-gray-800 bg-solo-dark text-xs"
                    placeholder={`Task ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      <Button 
        onClick={handleAddQuest} 
        className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white h-9 mt-2"
      >
        Add Quest
      </Button>
    </div>
  );
};

export default AddQuestDialog; 