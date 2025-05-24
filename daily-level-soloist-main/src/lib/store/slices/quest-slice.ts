import { StateCreator } from 'zustand';
import { Quest, Task, DailyWinCategory, Difficulty, Stat } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { calculateExpToNextLevel, calculateRank } from '../../utils/calculations';
import { toast } from '@/hooks/use-toast';
import { StoreState } from '../index';

export interface QuestSlice {
  quests: Quest[];
  addQuest: (title: string, description: string, isMainQuest: boolean, expReward: number, deadline?: Date, difficulty?: Difficulty, category?: DailyWinCategory | '', isDaily?: boolean) => void;
  completeQuest: (id: string) => void;
  startQuest: (id: string) => void;
  addQuestTask: (questId: string, title: string, description: string, category: DailyWinCategory, difficulty: Difficulty, deadline?: Date) => void;
  completeQuestTask: (questId: string, taskId: string) => void;
  canCompleteQuest: (id: string) => boolean;
  canStartQuest: (id: string) => boolean;
  updateQuest: (id: string, updates: Partial<Quest>) => void;
  deleteQuest: (id: string) => void;
  getDailyQuestCompletionStatus: () => { mainQuestsCompleted: number; sideQuestsCompleted: number; dailyQuestsCompleted: number };
  hasReachedDailyLimit: (isMainQuest: boolean, isDaily: boolean) => boolean;
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

// Use StoreState instead of listing all dependencies for better compatibility
export const createQuestSlice: StateCreator<StoreState, [], [], QuestSlice> = (set, get) => {
  // Helper function to calculate end of current week (Sunday)
  const getEndOfWeek = () => {
    const today = new Date();
    const daysUntilSunday = 7 - today.getDay();
    const endOfWeek = new Date();
    endOfWeek.setDate(today.getDate() + daysUntilSunday);
    endOfWeek.setHours(23, 59, 59, 999);
    return endOfWeek;
  };

  return {
    quests: [],
    addQuest: (title, description, isMainQuest, expReward, deadline, difficulty = 'easy', category = 'mental', isDaily = false) => {
      set((state: StoreState) => ({
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
      const { quests } = get();
      const quest = quests.find(q => q.id === id);

      if (!quest) return;

      // Check daily limits before starting quest (only for main and side quests, not daily quests)
      if (!quest.isDaily) {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

        // Count started or completed quests today
        const startedOrCompletedTodayMainQuests = quests.filter(q =>
          q.isMainQuest &&
          !q.isDaily &&
          (q.started || q.completed) &&
          (
            (q.createdAt && new Date(q.createdAt) >= todayStart && new Date(q.createdAt) <= todayEnd) ||
            (q.completedAt && new Date(q.completedAt) >= todayStart && new Date(q.completedAt) <= todayEnd)
          )
        ).length;

        const startedOrCompletedTodaySideQuests = quests.filter(q =>
          !q.isMainQuest &&
          !q.isDaily &&
          !q.isRecoveryQuest && // Exclude recovery quests from side quest limitations
          (q.started || q.completed) &&
          (
            (q.createdAt && new Date(q.createdAt) >= todayStart && new Date(q.createdAt) <= todayEnd) ||
            (q.completedAt && new Date(q.completedAt) >= todayStart && new Date(q.completedAt) <= todayEnd)
          )
        ).length;

        // Check limits
        if (quest.isMainQuest && startedOrCompletedTodayMainQuests >= 1) {
          toast({
            title: "Daily Limit Reached",
            description: "You can only start/complete 1 main quest per day. Try again tomorrow!",
            variant: "destructive"
          });
          return;
        }

        if (!quest.isMainQuest && !quest.isRecoveryQuest && startedOrCompletedTodaySideQuests >= 1) {
          toast({
            title: "Daily Limit Reached",
            description: "You can only start/complete 1 side quest per day. Try again tomorrow!",
            variant: "destructive"
          });
          return;
        }
      }

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

        const completedTask = quest.tasks.find((t: Task) => t.id === taskId);
        if (!completedTask || completedTask.completed) return { quests: updatedQuests };

        // Recovery quest tasks should not award EXP - they are simple completion tasks
        if (quest.isRecoveryQuest) {
          return { quests: updatedQuests };
        }

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

      // Check if side quests are locked (only if this is a side quest, not recovery quest)
      if (!quest.isMainQuest && !quest.isDaily && !quest.isRecoveryQuest && areSideQuestsLocked()) {
        toast({
          title: "Side Quests Locked",
          description: "You must complete main quests first to unlock side quests.",
          variant: "destructive"
        });
        return false;
      }

      // Already completed
      if (quest.completed) return false;

      // Check daily completion limits (only for main and side quests, not daily quests)
      if (!quest.isDaily) {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

        // Count started or completed quests today
        const usedTodayMainQuests = quests.filter(q =>
          q.isMainQuest &&
          !q.isDaily &&
          (q.started || q.completed) &&
          (
            (q.createdAt && new Date(q.createdAt) >= todayStart && new Date(q.createdAt) <= todayEnd) ||
            (q.completedAt && new Date(q.completedAt) >= todayStart && new Date(q.completedAt) <= todayEnd)
          )
        ).length;

        const usedTodaySideQuests = quests.filter(q =>
          !q.isMainQuest &&
          !q.isDaily &&
          !q.isRecoveryQuest && // Exclude recovery quests from side quest limitations
          (q.started || q.completed) &&
          (
            (q.createdAt && new Date(q.createdAt) >= todayStart && new Date(q.createdAt) <= todayEnd) ||
            (q.completedAt && new Date(q.completedAt) >= todayStart && new Date(q.completedAt) <= todayEnd)
          )
        ).length;

        // Check limits
        if (quest.isMainQuest && usedTodayMainQuests >= 1) {
          toast({
            title: "Daily Limit Reached",
            description: "You can only start/complete 1 main quest per day. Try again tomorrow!",
            variant: "destructive"
          });
          return false;
        }

        if (!quest.isMainQuest && !quest.isRecoveryQuest && usedTodaySideQuests >= 1) {
          toast({
            title: "Daily Limit Reached",
            description: "You can only start/complete 1 side quest per day. Try again tomorrow!",
            variant: "destructive"
          });
          return false;
        }
      }

      // If quest has tasks, all tasks must be completed
      if (quest.tasks.length > 0) {
        return quest.tasks.every(task => task.completed);
      }

      // Quest with no tasks can be completed
      return true;
    },
    canStartQuest: (id) => {
      const { quests, areSideQuestsLocked } = get();
      const quest = quests.find(q => q.id === id);

      // Quest not found
      if (!quest) return false;

      // Already started or completed
      if (quest.started || quest.completed) return false;

      // Check if side quests are locked (only if this is a side quest, not recovery quest)
      if (!quest.isMainQuest && !quest.isDaily && !quest.isRecoveryQuest && areSideQuestsLocked()) {
        return false;
      }

      // Check daily limits before starting quest (only for main and side quests, not daily quests)
      if (!quest.isDaily) {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

        // Count started or completed quests today
        const usedTodayMainQuests = quests.filter(q =>
          q.isMainQuest &&
          !q.isDaily &&
          (q.started || q.completed) &&
          (
            (q.createdAt && new Date(q.createdAt) >= todayStart && new Date(q.createdAt) <= todayEnd) ||
            (q.completedAt && new Date(q.completedAt) >= todayStart && new Date(q.completedAt) <= todayEnd)
          )
        ).length;

        const usedTodaySideQuests = quests.filter(q =>
          !q.isMainQuest &&
          !q.isDaily &&
          !q.isRecoveryQuest && // Exclude recovery quests from side quest limitations
          (q.started || q.completed) &&
          (
            (q.createdAt && new Date(q.createdAt) >= todayStart && new Date(q.createdAt) <= todayEnd) ||
            (q.completedAt && new Date(q.completedAt) >= todayStart && new Date(q.completedAt) <= todayEnd)
          )
        ).length;

        // Check limits
        if (quest.isMainQuest && usedTodayMainQuests >= 1) {
          return false;
        }

        if (!quest.isMainQuest && !quest.isRecoveryQuest && usedTodaySideQuests >= 1) {
          return false;
        }
      }

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

      // Award EXP and gold for all quests, including recovery quests
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
            const endOfWeek = getEndOfWeek();

            // Reduce chance counter by 1 for completing redemption challenge
            const currentChanceCounter = get().chanceCounter || 0;
            const newChanceCounter = Math.max(0, currentChanceCounter - 1);

            set((state) => ({
              ...state,
              isCursed: false, // Remove the curse
              cursedUntil: null,
              hasPendingRecovery: false,
              activeRecoveryQuestIds: null,
              hasShadowFatigue: true, // Activate shadow fatigue
              shadowFatigueUntil: endOfWeek, // Shadow fatigue lasts until end of week
              chanceCounter: newChanceCounter, // Reduce by 1 as reward for completing redemption
              // Don't set lastRedemptionDate here - it's already set when redemption starts
            }));

            toast({
              title: "Redemption Complete!",
              description: `You've completed all recovery quests! The curse has been lifted, but Shadow Fatigue remains for the rest of the week (75% EXP). Weekly chances reduced to ${newChanceCounter}/5.`,
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
    },
    getDailyQuestCompletionStatus: () => {
      const { quests } = get();
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      // Count started or completed quests today (this represents the daily limit usage)
      const usedTodayMainQuests = quests.filter(q =>
        q.isMainQuest &&
        !q.isDaily &&
        (q.started || q.completed) &&
        (
          (q.createdAt && new Date(q.createdAt) >= todayStart && new Date(q.createdAt) <= todayEnd) ||
          (q.completedAt && new Date(q.completedAt) >= todayStart && new Date(q.completedAt) <= todayEnd)
        )
      ).length;

      const usedTodaySideQuests = quests.filter(q =>
        !q.isMainQuest &&
        !q.isDaily &&
        !q.isRecoveryQuest && // Exclude recovery quests from side quest limitations
        (q.started || q.completed) &&
        (
          (q.createdAt && new Date(q.createdAt) >= todayStart && new Date(q.createdAt) <= todayEnd) ||
          (q.completedAt && new Date(q.completedAt) >= todayStart && new Date(q.completedAt) <= todayEnd)
        )
      ).length;

      const completedTodayDailyQuests = quests.filter(q =>
        q.isDaily &&
        q.completed &&
        q.completedAt &&
        new Date(q.completedAt) >= todayStart &&
        new Date(q.completedAt) <= todayEnd
      ).length;

      return {
        mainQuestsCompleted: usedTodayMainQuests,
        sideQuestsCompleted: usedTodaySideQuests,
        dailyQuestsCompleted: completedTodayDailyQuests
      };
    },
    hasReachedDailyLimit: (isMainQuest, isDaily) => {
      if (isDaily) return false; // Daily quests have no limit

      const { getDailyQuestCompletionStatus } = get();
      const status = getDailyQuestCompletionStatus();

      if (isMainQuest) {
        return status.mainQuestsCompleted >= 1;
      } else {
        return status.sideQuestsCompleted >= 1;
      }
    }
  };
};
