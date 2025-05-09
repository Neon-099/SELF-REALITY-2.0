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
    const state = get();
    const quest = state.quests.find((q: Quest) => q.id === id);
    if (!quest || !quest.isMainQuest) return true;
    return quest.tasks.length > 0 && quest.tasks.every(task => task.completed);
  },
  completeQuest: (id) => {
    set((state: any) => {
      const quest = state.quests.find((q: Quest) => q.id === id);
      if (!quest || quest.completed) return state;
      
      // For main quests, check if all tasks are completed
      if (quest.isMainQuest) {
        const canComplete = get().canCompleteQuest(id);
        if (!canComplete) return state;
      }

      const updatedQuests = state.quests.map((q: Quest) => 
        q.id === id ? { ...q, completed: true, completedAt: new Date() } : q
      );

      let { exp, level, expToNextLevel } = state.user;
      
      // For main quests, only add remaining exp (since tasks gave partial exp)
      const remainingExp = quest.isMainQuest 
        ? Math.floor(quest.expReward / 2) // Give remaining 50% on completion
        : quest.expReward;
      
      exp += remainingExp;
      const goldReward = Math.floor(remainingExp / 5) * 2; // Convert EXP to gold (5 EXP = 2 gold)

      while (exp >= expToNextLevel) {
        level++;
        exp -= expToNextLevel;
        expToNextLevel = calculateExpToNextLevel(level);
      }
      
      // Call increaseStatFree after the state update
      setTimeout(() => {
        // Since quests might not have a category, we'll give a boost to all attributes
        // Or can use quest.category if it exists
        if (quest.category) {
          const attributeStat = categoryToStat(quest.category);
          get().addStatExp(attributeStat, 10);
          // Toast handled by addStatExp
        } else {
          // Give small boost to all attributes
          ['physical', 'cognitive', 'emotional', 'spiritual', 'social'].forEach(stat => {
            get().addStatExp(stat as Stat, 5);
          });
          
          toast({
            title: `+5 EXP to All Attributes`,
            description: `You gained experience for completing a quest!`,
            variant: "default"
          });
        }
      }, 500);

      return {
        quests: updatedQuests,
        user: {
          ...state.user,
          exp,
          level,
          expToNextLevel,
          gold: state.user.gold + goldReward,
          rank: calculateRank(level)
        }
      };
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
