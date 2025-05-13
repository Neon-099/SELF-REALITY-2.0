import { StateCreator } from 'zustand';
import { Quest, Task, DailyWinCategory, Difficulty, Stat } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { calculateExpToNextLevel, calculateRank } from '../../utils/calculations';
import { toast } from '@/hooks/use-toast';

export interface QuestSlice {
  quests: Quest[];
  addQuest: (title: string, description: string, isMainQuest: boolean, expReward: number, deadline?: Date, difficulty?: Difficulty, category?: DailyWinCategory | '', isDaily?: boolean) => void;
  completeQuest: (id: string) => void;
  startQuest: (id: string) => void;
  addQuestTask: (questId: string, title: string, description: string, category: DailyWinCategory, difficulty: Difficulty, deadline?: Date) => void;
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
  addQuest: (title, description, isMainQuest, expReward, deadline, difficulty = 'easy', category = 'mental', isDaily = false) => {
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
          category, // Use passed category
          isDaily // Set isDaily flag
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
  addQuestTask: (questId, title, description, category, difficulty, deadline) => {
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

      // Get the experience modifier from punishment system
      const getExpModifier = get().getExpModifier;
      const expModifier = getExpModifier();
      
      // Calculate the modified EXP reward
      const finalExpReward = Math.floor(completedTask.expReward * expModifier);

      let { exp, level, expToNextLevel } = state.user;
      exp += finalExpReward;
      
      while (exp >= expToNextLevel) {
        level++;
        exp -= expToNextLevel;
        expToNextLevel = calculateExpToNextLevel(level);
      }
      
      // Call increaseStatFree after the state update
      setTimeout(() => {
        // Add stat points with modifier applied
        const statExpReward = Math.floor(8 * expModifier);
        get().addStatExp(attributeStat, statExpReward);
        
        // Notify user if a penalty was applied
        if (expModifier < 1) {
          toast({
            title: "Quest Task Completed",
            description: `You earned ${finalExpReward} EXP and ${statExpReward} attribute points (${Math.round(expModifier * 100)}% rate due to penalty)`,
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
    const { quests, user, addExp, addGold, getExpModifier, activeRecoveryQuestIds, setActiveRecoveryQuestIds } = get();
    const quest = quests.find(q => q.id === id);
    
    if (!quest || quest.completed) return;
    
    const expModifier = getExpModifier();
    const finalExpReward = Math.floor(quest.expReward * expModifier);
    const now = new Date();
    let missedDeadline = false;

    if (quest.deadline && now > new Date(quest.deadline)) {
      missedDeadline = true;
      const { applyMissedDeadlinePenalty } = get();
      applyMissedDeadlinePenalty('quest', id);
    }
    
    const updatedQuests = quests.map(q => 
      q.id === id ? {
        ...q,
        completed: true,
        completedAt: now,
        missed: missedDeadline
      } : q
    );

    set((state) => ({
      ...state,
      quests: updatedQuests,
    }));
      
    addExp(finalExpReward);
    addGold(Math.floor(finalExpReward / 10));
    
    let toastTitle = "Quest Completed!";
    let toastDescription = `${quest.title} - You earned ${finalExpReward} EXP and ${Math.floor(finalExpReward / 10)} gold`;
    
    if (expModifier < 1) {
      toastDescription += ` (${Math.round(expModifier * 100)}% rate due to penalty)`;
    }
    if (missedDeadline) {
      toastTitle = "Quest Completed Late";
      toastDescription += " (Deadline missed)";
    }
          
    toast({
      title: toastTitle,
      description: toastDescription,
      variant: missedDeadline ? "default" : "default",
    });

    if (quest.isRecoveryQuest && activeRecoveryQuestIds && activeRecoveryQuestIds.length > 0) {
      if (activeRecoveryQuestIds.includes(quest.id)) {
        const allActiveBatchCompleted = activeRecoveryQuestIds.every(activeId => {
          const recoveryQuest = updatedQuests.find(q => q.id === activeId);
          return recoveryQuest && recoveryQuest.completed;
        });

        if (allActiveBatchCompleted) {
          // Use the shared helper function for end of week calculation
          const endOfWeek = get().getEndOfWeek();
          
          set((state) => ({
            ...state,
            isCursed: false, // Remove the curse
            cursedUntil: null,
            hasPendingRecovery: false,
            activeRecoveryQuestIds: null,
            hasShadowFatigue: true, // Activate shadow fatigue
            shadowFatigueUntil: endOfWeek, // Shadow fatigue lasts until end of week
            chanceCounter: 4,
            lastRedemptionDate: new Date(),
          }));
          
          toast({
            title: "Redemption Complete!",
            description: "You've completed all recovery quests! The curse has been lifted, but Shadow Fatigue remains for the rest of the week (75% EXP).",
            variant: "default"
          });
        }
      }
    }
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
