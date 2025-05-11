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
  activeRecoveryQuestIds: string[] | null;
  
  // Actions
  applyMissedDeadlinePenalty: (itemType: 'task' | 'mission' | 'quest', itemId: string) => void;
  checkCurseStatus: () => void;
  resetWeeklyChances: () => void;
  attemptRedemption: (success: boolean) => void;
  setActiveRecoveryQuestIds: (questIds: string[] | null) => void;
  
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
  activeRecoveryQuestIds: null,
  
  // Helper function to calculate end of current week (Sunday)
  // Adding this at the top for consistency across all functions
  getEndOfWeek: () => {
    const today = new Date();
    const daysUntilSunday = 7 - today.getDay();
    const endOfWeek = new Date();
    endOfWeek.setDate(today.getDate() + daysUntilSunday);
    endOfWeek.setHours(23, 59, 59, 999);
    return endOfWeek;
  },
  
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
    
    // Get end of week from helper function
    const endOfWeek = get().getEndOfWeek();
    
    set((state: PunishmentSlice) => {
      // Increment chance counter
      const newChanceCounter = state.chanceCounter + 1;
      
      // Check if user should be cursed (5 strikes)
      let newCursedUntil = state.cursedUntil;
      let newIsCursed = state.isCursed;
      
      // Variables for shadow fatigue state
      let newHasShadowFatigue = state.hasShadowFatigue;
      let newShadowFatigueUntil = state.shadowFatigueUntil;
      
      if (newChanceCounter >= 5 && !state.isCursed) {
        // User is now cursed - set curse until end of week
        newCursedUntil = endOfWeek;
        newIsCursed = true;
        
        // When cursed, shadow fatigue is temporarily deactivated
        newHasShadowFatigue = false;
        newShadowFatigueUntil = null;
        
        toast({
          title: "CURSED!",
          description: "You've used all 5 chances this week. You are now cursed until the week ends!",
          variant: "destructive"
        });
      } 
      else if (newChanceCounter < 5) {
        // If not cursed, always activate shadow fatigue until the end of week
        newHasShadowFatigue = true;
        newShadowFatigueUntil = endOfWeek;
      }
      
      return {
        chanceCounter: newChanceCounter,
        hasShadowFatigue: newHasShadowFatigue,
        shadowFatigueUntil: newShadowFatigueUntil,
        isCursed: newIsCursed,
        cursedUntil: newCursedUntil
      };
    });
    
    if (get().chanceCounter < 5) {
      toast({
        title: "Deadline Missed!",
        description: `Shadow Fatigue applied for the rest of the week! Tasks earn only 75% EXP. You have used ${get().chanceCounter}/5 chances this week.`,
        variant: "destructive"
      });
    }
    
    return expModifier; // Return the EXP modifier for the immediate completion
  },
  
  checkCurseStatus: () => {
    const { isCursed, cursedUntil, hasShadowFatigue, shadowFatigueUntil, lockedSideQuestsUntil } = get();
    const now = new Date();
    
    // Check if curse has expired
    if (isCursed && cursedUntil && now > cursedUntil) {
      // Get end of week from helper
      const endOfWeek = get().getEndOfWeek();
      
      // When curse expires naturally, reactivate shadow fatigue for the rest of the week
      // This matches the behavior when recovering via quests
      set({ 
        isCursed: false,
        cursedUntil: null,
        hasPendingRecovery: false,
        activeRecoveryQuestIds: null,
        // Reactivate shadow fatigue for consistency
        hasShadowFatigue: true,
        shadowFatigueUntil: endOfWeek
      });
      
      toast({
        title: "Curse Lifted!",
        description: "The weekly curse has been lifted. Shadow Fatigue remains for the rest of the week (75% EXP).",
        variant: "default"
      });
    }
    
    // Check if shadow fatigue has expired
    if (hasShadowFatigue && shadowFatigueUntil && now > shadowFatigueUntil) {
      set({ 
        hasShadowFatigue: false,
        shadowFatigueUntil: null
      });
      
      toast({
        title: "Shadow Fatigue Cleared!",
        description: "Your Shadow Fatigue has expired. You now earn full EXP again!",
        variant: "default"
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
        cursedUntil: null,
        hasShadowFatigue: false,
        shadowFatigueUntil: null,
        lastRedemptionDate: null
      });
      
      toast({
        title: "Weekly Reset!",
        description: "Your chance counter has been reset for the new week. All penalties have been cleared.",
        variant: "default"
      });
    }
  },
  
  attemptRedemption: (success) => {
    const { isCursed } = get();
    const now = new Date();
    
    // Check if already redeemed this week (since the last Sunday reset)
    if (get().lastRedemptionDate !== null) {
      toast({
        title: "Redemption Unavailable",
        description: "You've already attempted redemption this week (since Sunday reset).",
        variant: "destructive"
      });
      return;
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
      // Get end of week using helper function
      const endOfWeek = get().getEndOfWeek();
      
      set({ 
        isCursed: false, // Remove curse
        cursedUntil: null,
        chanceCounter: 4, // Set back to 4/5 chances
        hasShadowFatigue: true, // Reactivate shadow fatigue 
        shadowFatigueUntil: endOfWeek, // Lasts until end of week
        hasPendingRecovery: false,
        activeRecoveryQuestIds: null
      });
      
      toast({
        title: "Redemption Successful!",
        description: "You've successfully redeemed yourself. Curse lifted, but Shadow Fatigue remains for the rest of the week (75% EXP).",
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
  
  setActiveRecoveryQuestIds: (questIds) => {
    set({ 
      activeRecoveryQuestIds: questIds,
      hasPendingRecovery: !!(questIds && questIds.length > 0)
    });
  },
  
  // Getters
  getExpModifier: () => {
    const { isCursed, hasShadowFatigue } = get();
    
    if (isCursed) return 0.5; // 50% EXP while cursed (takes precedence over shadow fatigue)
    if (hasShadowFatigue) return 0.75; // 75% EXP with shadow fatigue
    
    return 1.0; // 100% normal EXP
  },
  
  canUseRedemption: () => {
    const { isCursed, lastRedemptionDate, hasPendingRecovery } = get();
    
    // Can't use redemption if not cursed
    if (!isCursed) return false;
    
    // Can't use redemption if there are already recovery quests in progress
    if (hasPendingRecovery) return false;
    
    // If lastRedemptionDate is not null, an attempt was already made in the current Sunday-Saturday cycle.
    if (lastRedemptionDate !== null) return false; 
    
    return true;
  },
  
  areSideQuestsLocked: () => {
    const { lockedSideQuestsUntil } = get();
    if (!lockedSideQuestsUntil) return false;
    
    return new Date() < lockedSideQuestsUntil;
  }
}); 