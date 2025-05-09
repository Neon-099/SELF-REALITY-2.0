import { StateCreator } from 'zustand';
import { Quest, Task, DailyWinCategory, Difficulty, Stat } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { calculateExpToNextLevel, calculateRank } from '../../utils/calculations';
import { toast } from '@/hooks/use-toast';

export interface QuestSlice {
  quests: Quest[];
  addQuest: (title: string, description: string, isMainQuest: boolean, expReward: number, deadline?: Date, difficulty?: Difficulty) => void;
  completeQuest: (id: string) => void;
  startQuest: (id: string) => void;
  addQuestTask: (questId: string, title: string, description: string, category: DailyWinCategory, difficulty: Difficulty) => void;
  completeQuestTask: (questId: string, taskId: string) => void;
  canCompleteQuest: (id: string) => boolean;
  updateQuest: (id: string, updates: Partial<Quest>) => void;
  deleteQuest: (id: string) => void;
}

// Helper to map daily win categories to attribute stats
const categoryToStat = (category: DailyWinCategory): Stat => {
  switch(category) {
    case 'mental': return 'emotional';
    case 'physical': return 'physical';
    case 'spiritual': return 'spiritual';
    case 'intelligence': return 'cognitive';
    default: return 'emotional';
  }
};

// Helper to map attribute categories back to daily win categories
const attributeToDailyWin = (attributeCategory: string): DailyWinCategory | null => {
  switch(attributeCategory) {
    case 'physical': return 'physical';
    case 'cognitive': return 'intelligence';
    case 'emotional': return 'mental';
    case 'spiritual': return 'spiritual';
    case 'social': return 'mental'; // Default social to mental
    default: return null;
  }
};

export const createQuestSlice: StateCreator<QuestSlice & any> = (set, get) => ({
  quests: [],
  addQuest: (title, description, isMainQuest, expReward, deadline, difficulty = 'easy') => {
    set((state: QuestSlice) => ({
      quests: [
        ...state.quests,
        {
          id: uuidv4(),
          title,
          description,
          completed: false,
          isMainQuest,
          tasks: [],
          expReward,
          createdAt: new Date(),
          deadline,
          started: false,
          difficulty,
          category: 'mental' // Default category
        }
      ]
    }));
  },
  startQuest: (id) => {
    set((state: QuestSlice) => ({
      quests: state.quests.map(quest =>
        quest.id === id ? { ...quest, started: true } : quest
      )
    }));
  },
  addQuestTask: (questId, title, description, category, difficulty) => {
    set((state: QuestSlice) => ({
      quests: state.quests.map(quest => {
        if (quest.id !== questId) return quest;
        
        const newTask: Task = {
          id: uuidv4(),
          title,
          description,
          completed: false,
          category,
          difficulty,
          expReward: Math.floor(quest.expReward / 4), // Split main quest EXP among tasks
          createdAt: new Date()
        };
        
        return {
          ...quest,
          tasks: [...quest.tasks, newTask]
        };
      })
    }));
  },
  completeQuestTask: (questId, taskId) => {
    set((state: any) => {
      const quest = state.quests.find((q: Quest) => q.id === questId);
      if (!quest) return state;

      const updatedQuests = state.quests.map((q: Quest) => {
        if (q.id !== questId) return q;
        
        const updatedTasks = q.tasks.map(task =>
          task.id === taskId ? { ...task, completed: true, completedAt: new Date() } : task
        );
        
        return { ...q, tasks: updatedTasks };
      });

      const completedTask = quest.tasks.find(t => t.id === taskId);
      if (!completedTask || completedTask.completed) return { quests: updatedQuests };

      // Determine if this is a daily win category or an attribute category
      const dailyWinCategories = ['mental', 'physical', 'spiritual', 'intelligence'];
      let attributeStat: Stat;
      let dailyWinCategory: DailyWinCategory;
      
      if (dailyWinCategories.includes(completedTask.category)) {
        // It's a standard daily win category
        dailyWinCategory = completedTask.category as DailyWinCategory;
        attributeStat = categoryToStat(dailyWinCategory);
        
        // Update daily win progress
        setTimeout(() => {
          get().updateDailyWin(dailyWinCategory, taskId);
        }, 100);
      } else {
        // It's an attribute category, map it back to a daily win
        const mappedDailyWin = attributeToDailyWin(completedTask.category);
        if (mappedDailyWin) {
          dailyWinCategory = mappedDailyWin;
          attributeStat = completedTask.category as Stat;
          
          // Update daily win progress
          setTimeout(() => {
            get().updateDailyWin(dailyWinCategory, taskId);
          }, 100);
        } else {
          // Default fallback if no mapping exists
          attributeStat = 'emotional';
        }
      }

      let { exp, level, expToNextLevel } = state.user;
      exp += completedTask.expReward;
      
      while (exp >= expToNextLevel) {
        level++;
        exp -= expToNextLevel;
        expToNextLevel = calculateExpToNextLevel(level);
      }
      
      // Call increaseStatFree after the state update
      setTimeout(() => {
        // Add 2 points to the attribute
        get().addStatExp(attributeStat, 8);
        // Toast handled by addStatExp
      }, 500);

      return {
        quests: updatedQuests,
        user: {
          ...state.user,
          exp,
          level,
          expToNextLevel,
          rank: calculateRank(level)
        }
      };
    });
  },
  canCompleteQuest: (id) => {
    const { quests, areSideQuestsLocked } = get();
    const quest = quests.find(q => q.id === id);
    
    // Quest not found
    if (!quest) return false;
    
    // Check if side quests are locked (only if this is a side quest)
    if (!quest.isMainQuest && areSideQuestsLocked()) {
      toast({
        title: "Side Quests Locked",
        description: "You must complete main quests first to unlock side quests.",
        variant: "destructive"
      });
      return false;
    }
    
    // Already completed
    if (quest.completed) return false;
    
    // If quest has tasks, all tasks must be completed
    if (quest.tasks.length > 0) {
      return quest.tasks.every(task => task.completed);
    }
    
    // Quest with no tasks can be completed
    return true;
  },
  completeQuest: (id) => {
    const { quests, user, addExp, addGold, getExpModifier } = get();
    const quest = quests.find(q => q.id === id);
    
    if (!quest || quest.completed) return;
    
    // Get experience modifier from punishment system
    const expModifier = getExpModifier();
    
    // Calculate final exp with modifier
    const finalExpReward = Math.floor(quest.expReward * expModifier);
    
    const now = new Date();
    
    // Check if quest has a deadline and whether it's missed
    let missedDeadline = false;
    if (quest.deadline && now > quest.deadline) {
      missedDeadline = true;
      
      // Apply the missed deadline penalty
      const { applyMissedDeadlinePenalty } = get();
      applyMissedDeadlinePenalty('quest', id);
    }
    
    // Update quest status
    set((state: QuestSlice) => ({
      quests: state.quests.map(q => 
        q.id === id ? {
          ...q,
          completed: true,
          completedAt: now,
          missed: missedDeadline
        } : q
      )
    }));
    
    // Add experience and gold
    addExp(finalExpReward);
    addGold(Math.floor(finalExpReward / 10));
    
    // Set notification message based on status
    let title = "Quest Completed!";
    let description = `${quest.title} - You earned ${finalExpReward} EXP and ${Math.floor(finalExpReward / 10)} gold`;
    
    if (expModifier < 1) {
      description += ` (${Math.round(expModifier * 100)}% rate due to penalty)`;
    }
    
    if (missedDeadline) {
      title = "Quest Completed Late";
      description += " (Deadline missed)";
    }
    
    toast({
      title,
      description,
      variant: missedDeadline ? "warning" : "default",
    });
  },
  updateQuest: (id, updates) => {
    set((state: QuestSlice) => ({
      quests: state.quests.map(quest =>
        quest.id === id ? { ...quest, ...updates } : quest
      )
    }));
  },
  deleteQuest: (id) => {
    set((state: QuestSlice) => ({
      quests: state.quests.filter(quest => quest.id !== id)
    }));
  }
});
