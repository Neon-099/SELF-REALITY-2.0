import { StateCreator } from 'zustand';
import { Mission, Task, Quest } from '../../types';
import { toast } from '@/hooks/use-toast';

export interface PunishmentSlice {
  // State
  chanceCounter: number;
  isCursed: boolean;
  hasShadowFatigue: boolean;
  shadowFatigueUntil: Date | null;
  cursedUntil: Date | null;
  lockedSideQuestsUntil: Date | null;
  missedMainQuestStreak: number;
  lastRedemptionDate: Date | null;
  hasPendingRecovery: boolean;
  
  // Actions
  applyMissedDeadlinePenalty: (itemType: 'task' | 'mission' | 'quest', itemId: string) => void;
  checkCurseStatus: () => void;
  resetWeeklyChances: () => void;
  attemptRedemption: (success: boolean) => void;
  
  // Getters
  getExpModifier: () => number;
  canUseRedemption: () => boolean;
  areSideQuestsLocked: () => boolean;
}

export const createPunishmentSlice: StateCreator<PunishmentSlice & any> = (set, get) => ({
  // State
  chanceCounter: 0,
  isCursed: false,
  hasShadowFatigue: false,
  shadowFatigueUntil: null,
  cursedUntil: null,
  lockedSideQuestsUntil: null,
  missedMainQuestStreak: 0,
  lastRedemptionDate: null,
  hasPendingRecovery: false,
  
  // Actions
  applyMissedDeadlinePenalty: (itemType, itemId) => {
    const state = get();
    let expModifier = 0.5; // 50% EXP penalty for missed deadline
    let item;
    
    // Find the item based on type
    switch (itemType) {
      case 'task':
        item = state.tasks.find((t: Task) => t.id === itemId);
        break;
      case 'mission':
        item = state.missions.find((m: Mission) => m.id === itemId);
        break;
      case 'quest':
        item = state.quests.find((q: Quest) => q.id === itemId);
        // Track main quest streak
        if (item && item.isMainQuest) {
          const newStreak = state.missedMainQuestStreak + 1;
          set({ missedMainQuestStreak: newStreak });
          
          // Check if side quests should be locked (3 missed main quests in a row)
          if (newStreak >= 3) {
            const lockUntil = new Date();
            lockUntil.setDate(lockUntil.getDate() + 7); // Lock for 7 days
            
            set({ 
              lockedSideQuestsUntil: lockUntil,
              missedMainQuestStreak: 0 // Reset streak after locking
            });
            
            toast({
              title: "Side Quests Locked!",
              description: "You've missed 3 main quests in a row. Side quests are locked for 7 days.",
              variant: "destructive"
            });
          }
        } else {
          // Reset main quest streak if a regular quest is missed
          set({ missedMainQuestStreak: 0 });
        }
        break;
    }
    
    if (!item) return;
    
    // Apply Shadow Fatigue Debuff
    const fatigueEnd = new Date();
    fatigueEnd.setDate(fatigueEnd.getDate() + 1); // 1 day debuff
    
    set((state: PunishmentSlice) => {
      // Increment chance counter
      const newChanceCounter = state.chanceCounter + 1;
      
      // Check if user should be cursed (5 strikes)
      let newCursedUntil = state.cursedUntil;
      let newIsCursed = state.isCursed;
      
      if (newChanceCounter >= 5 && !state.isCursed) {
        // Calculate end of week (Sunday)
        const today = new Date();
        const daysUntilSunday = 7 - today.getDay();
        const endOfWeek = new Date();
        endOfWeek.setDate(today.getDate() + daysUntilSunday);
        endOfWeek.setHours(23, 59, 59, 999);
        
        newCursedUntil = endOfWeek;
        newIsCursed = true;
        
        toast({
          title: "CURSED!",
          description: "You've used all 5 chances this week. You are now cursed until the week ends!",
          variant: "destructive"
        });
      }
      
      return {
        chanceCounter: newChanceCounter,
        hasShadowFatigue: true,
        shadowFatigueUntil: fatigueEnd,
        isCursed: newIsCursed,
        cursedUntil: newCursedUntil
      };
    });
    
    toast({
      title: "Deadline Missed!",
      description: `Shadow Fatigue applied! Next completion will earn only 75% EXP. You have used ${get().chanceCounter}/5 chances this week.`,
      variant: "destructive"
    });
    
    return expModifier; // Return the EXP modifier for the immediate completion
  },
  
  checkCurseStatus: () => {
    const { isCursed, cursedUntil, hasShadowFatigue, shadowFatigueUntil, lockedSideQuestsUntil } = get();
    const now = new Date();
    
    // Check if curse has expired
    if (isCursed && cursedUntil && now > cursedUntil) {
      set({ 
        isCursed: false,
        cursedUntil: null
      });
      
      toast({
        title: "Curse Lifted!",
        description: "The weekly curse has been lifted. You are back to normal EXP rates.",
        variant: "default"
      });
    }
    
    // Check if shadow fatigue has expired
    if (hasShadowFatigue && shadowFatigueUntil && now > shadowFatigueUntil) {
      set({ 
        hasShadowFatigue: false,
        shadowFatigueUntil: null
      });
    }
    
    // Check if side quest lock has expired
    if (lockedSideQuestsUntil && now > lockedSideQuestsUntil) {
      set({ lockedSideQuestsUntil: null });
      
      toast({
        title: "Side Quests Unlocked!",
        description: "Side quests are now available again.",
        variant: "default"
      });
    }
    
    // Check for missed deadlines on incomplete tasks
    const { tasks, quests, missions } = get();
    
    // Check tasks with deadlines
    if (tasks && Array.isArray(tasks)) {
      let missedTasksCount = 0;
      
      tasks.forEach(task => {
        if (!task.completed && task.deadline && new Date(task.deadline) < now && !task.missed) {
          // Apply missed deadline penalty
          const { markTaskAsMissed } = get();
          markTaskAsMissed(task.id);
          missedTasksCount++;
        }
      });
      
      // Show a single aggregated notification if multiple tasks were missed
      if (missedTasksCount > 1) {
        toast({
          title: `${missedTasksCount} Deadlines Missed!`,
          description: `${missedTasksCount} tasks have passed their deadlines. Shadow Penalty applied to all.`,
          variant: "destructive"
        });
      } else if (missedTasksCount === 1) {
        // The individual notification is shown in markTaskAsMissed
      }
    }
    
    // Check quests with deadlines
    if (quests && Array.isArray(quests)) {
      let missedQuestsCount = 0;
      
      quests.forEach(quest => {
        if (!quest.completed && quest.deadline && new Date(quest.deadline) < now && !quest.missed) {
          // Apply missed deadline penalty
          const { applyMissedDeadlinePenalty } = get();
          applyMissedDeadlinePenalty('quest', quest.id);
          missedQuestsCount++;
          
          // Individual notifications for quests
          toast({
            title: "Quest Deadline Missed!",
            description: `The deadline for "${quest.title}" has passed. Shadow Penalty applied.`,
            variant: "destructive"
          });
        }
      });
    }
  },
  
  resetWeeklyChances: () => {
    // Check if we're in a new week
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday
    
    // If it's Sunday, reset the chances
    if (dayOfWeek === 0) {
      set({ 
        chanceCounter: 0,
        isCursed: false,
        cursedUntil: null
      });
      
      toast({
        title: "Weekly Reset!",
        description: "Your chance counter has been reset for the new week.",
        variant: "default"
      });
    }
  },
  
  attemptRedemption: (success) => {
    const { isCursed, lastRedemptionDate } = get();
    const now = new Date();
    
    // Check if already redeemed this week
    if (lastRedemptionDate) {
      const lastRedemptionWeek = Math.floor(lastRedemptionDate.getTime() / (7 * 24 * 60 * 60 * 1000));
      const currentWeek = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000));
      
      if (lastRedemptionWeek === currentWeek) {
        toast({
          title: "Redemption Failed",
          description: "You've already attempted redemption this week.",
          variant: "destructive"
        });
        return;
      }
    }
    
    if (!isCursed) {
      toast({
        title: "No Redemption Needed",
        description: "You're not currently cursed. No redemption necessary.",
        variant: "default"
      });
      return;
    }
    
    set({ lastRedemptionDate: now });
    
    if (success) {
      set({ 
        isCursed: false,
        cursedUntil: null,
        chanceCounter: 4 // Set back to 4/5 chances
      });
      
      toast({
        title: "Redemption Successful!",
        description: "You've successfully redeemed yourself. Curse lifted!",
        variant: "default"
      });
    } else {
      // Penalty: lose one rank
      const { user } = get();
      const currentLevel = user.level;
      
      // Reduce level by 1 or equivalent EXP penalty
      const updatedUser = {
        ...user,
        level: Math.max(1, currentLevel - 1), // Don't go below level 1
        exp: 0 // Reset exp in the new level
      };
      
      set({ user: updatedUser });
      
      toast({
        title: "Redemption Failed!",
        description: "You failed the redemption challenge. You've lost a rank!",
        variant: "destructive"
      });
    }
  },
  
  // Getters
  getExpModifier: () => {
    const { isCursed, hasShadowFatigue } = get();
    
    if (isCursed) return 0.5; // 50% EXP while cursed
    if (hasShadowFatigue) return 0.75; // 75% EXP with shadow fatigue
    
    return 1.0; // 100% normal EXP
  },
  
  canUseRedemption: () => {
    const { isCursed, lastRedemptionDate, hasPendingRecovery } = get();
    
    // Can't use redemption if not cursed
    if (!isCursed) return false;
    
    // Can't use redemption if there are already recovery quests in progress
    if (hasPendingRecovery) return false;
    
    // Check if they've already used redemption this week
    if (lastRedemptionDate) {
      const now = new Date();
      const lastRedemption = new Date(lastRedemptionDate);
      
      // Allow once per week
      const daysSinceLastRedemption = Math.floor((now.getTime() - lastRedemption.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastRedemption < 7) return false;
    }
    
    return true;
  },
  
  areSideQuestsLocked: () => {
    const { lockedSideQuestsUntil } = get();
    if (!lockedSideQuestsUntil) return false;
    
    return new Date() < lockedSideQuestsUntil;
  }
}); 