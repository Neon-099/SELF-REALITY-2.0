import { StateCreator } from 'zustand';
import { User, Stat, DailyWinCategory, DailyWinProgress } from '../../types';
import { calculateRank, calculateExpToNextLevel } from '../../utils/calculations';
import { toast } from '@/hooks/use-toast';
import { initialUser } from '../initial-state';
import { isSameDay } from '@/lib/utils';

export interface UserSlice {
  user: User;
  addExp: (exp: number) => void;
  addGold: (amount: number) => void;
  increaseStat: (stat: Stat) => void;
  increaseStatFree: (stat: Stat, amount: number) => void;
  addStatExp: (stat: Stat, amount: number) => void;
  resetDailyWins: () => void;
  updateStreak: () => void;
  updateDailyWin: (category: DailyWinCategory, taskId: string) => void;
  checkResetDailyWins: () => void;
}

const createEmptyDailyWins = (): Record<DailyWinCategory, DailyWinProgress> => ({
  mental: { count: 0, lastUpdated: new Date(), completedTasks: [], isCompleted: false },
  physical: { count: 0, lastUpdated: new Date(), completedTasks: [], isCompleted: false },
  spiritual: { count: 0, lastUpdated: new Date(), completedTasks: [], isCompleted: false },
  intelligence: { count: 0, lastUpdated: new Date(), completedTasks: [], isCompleted: false },
});
//HELPER TO MAP THE DAILY WIN CATEGORIES TO ATTRIBUTES STATS
const dailyWinToStat = (category: DailyWinCategory): Stat => {
  switch(category) {
    case 'mental': return 'emotional';
    case 'physical': return 'physical';
    case 'spiritual': return 'spiritual';
    case 'intelligence': return 'cognitive';
    default: return 'emotional';
  }
};

export const createUserSlice: StateCreator<UserSlice> = (set, get) => ({
  user: initialUser,
  addExp: (exp) => {
    set((state: any) => {
      // Get the current EXP modifier from punishment system
      // We're explicitly NOT applying it here because callers should handle this
      // This prevents double-applying the modifier
      
      let { exp: currentExp, level, expToNextLevel } = state.user;
      currentExp += exp;
      
      let leveledUp = false;
      while (currentExp >= expToNextLevel) {
        level++;
        currentExp -= expToNextLevel;
        expToNextLevel = calculateExpToNextLevel(level);
        leveledUp = true;
      }
      
      const rank = leveledUp ? calculateRank(level) : state.user.rank;
      
      // Show toast notification for EXP earned
      toast({
        title: `+${exp} EXP`,
        description: `You earned experience!`,
        variant: "default"
      });
      
      // Award gold based on EXP (2 gold for every 5 EXP)
      let goldEarned = Math.floor(exp / 5) * 2;
      
      if (goldEarned > 0) {
        // Show separate toast for gold
        setTimeout(() => {
          toast({
            title: `+${goldEarned} Gold`,
            description: `You earned gold for your hard work!`,
            variant: "default"
          });
        }, 500);
      }
      
      return {
        user: {
          ...state.user,
          exp: currentExp,
          level,
          expToNextLevel,
          rank,
          gold: state.user.gold + goldEarned
        }
      };
    });
  },
  addGold: (amount) => {
    set((state: any) => ({
      user: {
        ...state.user,
        gold: state.user.gold + amount
      }
    }));
  },
  increaseStat: (stat) => {
    get().increaseStatFree(stat, 1);
  },
  increaseStatFree: (stat, amount = 1) => {
    set((state: any) => {
      const currentStatValue = state.user.stats[stat];
      
      return {
        user: {
          ...state.user,
          stats: {
            ...state.user.stats,
            [stat]: currentStatValue + amount
          }
        }
      };
    });
  },
  addStatExp: (stat, amount) => {
    set((state: any) => {
      // Get current stat exp and level
      const statLevel = state.user.stats[stat];
      const statExpKey = `${stat}Exp` as keyof typeof state.user.stats;
      
      // Ensure currentStatExp is a valid number
      const currentStatExp = typeof state.user.stats[statExpKey] === 'number' && !isNaN(state.user.stats[statExpKey])
        ? state.user.stats[statExpKey]
        : 0;
      
      // Use a fixed value of 100 for EXP needed for next level
      const expToNextLevel = 100;
      
      // Add exp
      let newStatExp = currentStatExp + amount;
      let newStatLevel = statLevel;
      
      // Level up if enough exp
      if (newStatExp >= expToNextLevel) {
        newStatExp -= expToNextLevel;
        newStatLevel += 1;
        
        // Show toast for level up
        toast({
          title: `${stat.charAt(0).toUpperCase() + stat.slice(1)} Leveled Up!`,
          description: `Your ${stat} attribute is now level ${newStatLevel}`,
          variant: "default"
        });
      } else {
        // Show toast for exp gain
        toast({
          title: `+${amount} ${stat.charAt(0).toUpperCase() + stat.slice(1)} EXP`,
          description: `Progress: ${newStatExp}/${expToNextLevel}`,
          variant: "default"
        });
      }
      
      return {
        user: {
          ...state.user,
          stats: {
            ...state.user.stats,
            [stat]: newStatLevel,
            [statExpKey]: newStatExp
          }
        }
      };
    });
  },
  updateDailyWin: (category: DailyWinCategory, taskId: string) => {
    set((state) => {
      // Check if this category is already completed
      const currentProgress = state.user.dailyWins[category];
      
      // If already completed, return without changes
      if (currentProgress.isCompleted) {
        toast({
          title: "Already Completed",
          description: `You've already completed your ${category} daily win for today!`,
          variant: "destructive"
        });
        return state;
      }
      
      // Update daily win count to 1 (limit to exactly 1)
      const newCount = 1;
      const isCompleted = true;
      
      // Get the EXP modifier from the punishment system
      const { getExpModifier } = get();
      const expModifier = getExpModifier();
      
      // Give attribute EXP reward for completing daily win
      setTimeout(() => {
        const statToIncrease = dailyWinToStat(category);
        // Apply the EXP modifier to the stat EXP reward
        const statExpReward = Math.floor(10 * expModifier);
        get().addStatExp(statToIncrease, statExpReward);
        
        // Notify user if a penalty was applied
        if (expModifier < 1) {
          toast({
            title: `Daily Win - ${category}`,
            description: `Earned ${statExpReward} stat EXP (${Math.round(expModifier * 100)}% rate due to penalty)`,
            variant: "default"
          });
        }
      }, 500);

      return {
        user: {
          ...state.user,
          dailyWins: {
            ...state.user.dailyWins,
            [category]: {
              count: newCount,
              lastUpdated: new Date(),
              completedTasks: [...currentProgress.completedTasks, taskId],
              isCompleted,
            },
          },
        },
      };
    });
  },
  resetDailyWins: () => {
    set((state) => ({
      user: {
        ...state.user,
        dailyWins: createEmptyDailyWins(),
      },
    }));
  },
  checkResetDailyWins: () => {
    set((state) => {
      const today = new Date();
      let needsReset = false;
      
      // Check each category's last update date
      Object.values(state.user.dailyWins).forEach(progress => {
        const lastUpdated = new Date(progress.lastUpdated);
        if (!isSameDay(lastUpdated, today)) {
          needsReset = true;
        }
      });
      
      // If any category needs reset, reset all
      if (needsReset) {
        toast({
          title: "Daily Wins Reset",
          description: "Your daily wins have been reset for a new day!",
        });
        
        return {
          user: {
            ...state.user,
            dailyWins: createEmptyDailyWins(),
          },
        };
      }
      
      return state;
    });
  },
  updateStreak: () => {
    set((state: any) => {
      const today = new Date();
      const lastActive = new Date(state.user.lastActive);
      
      const isYesterday = (
        lastActive.getDate() === today.getDate() - 1 &&
        lastActive.getMonth() === today.getMonth() &&
        lastActive.getFullYear() === today.getFullYear()
      );
      
      const isToday = (
        lastActive.getDate() === today.getDate() &&
        lastActive.getMonth() === today.getMonth() &&
        lastActive.getFullYear() === today.getFullYear()
      );
      
      let streakDays = state.user.streakDays;
      
      if (isToday) {
        return state;
      } else if (isYesterday) {
        streakDays++;
      } else {
        streakDays = 1;
      }
      
      const longestStreak = Math.max(streakDays, state.user.longestStreak);
      
      // Check if daily wins need to be reset
      get().checkResetDailyWins();
      
      return {
        user: {
          ...state.user,
          streakDays,
          longestStreak,
          lastActive: today
        }
      };
    });
  }
});
