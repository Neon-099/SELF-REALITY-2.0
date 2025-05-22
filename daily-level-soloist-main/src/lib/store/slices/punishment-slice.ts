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
  applyMissedDeadlinePenalty: (itemType: string, itemId: string) => void;
  checkCurseStatus: () => void;
  resetWeeklyChances: () => void;
  attemptRedemption: (success: boolean) => void;
  setActiveRecoveryQuestIds: (questIds: string[] | null) => void;
  abandonRecoveryChallenge: () => void;

  // Getters
  getExpModifier: () => number;
  canUseRedemption: () => boolean;
  areSideQuestsLocked: () => boolean;
  getEndOfWeek: () => Date;
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
  applyMissedDeadlinePenalty: (itemType: string, itemId: string) => {
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
        lastRedemptionDate: null, // Reset redemption availability for new week
        hasPendingRecovery: false, // Clear any pending recovery
        activeRecoveryQuestIds: null // Clear active recovery quest tracking
      });

      toast({
        title: "Weekly Reset!",
        description: "Your chance counter has been reset for the new week. All penalties have been cleared.",
        variant: "default"
      });
    }
  },

  attemptRedemption: (success: boolean) => {
    // Implement redemption logic
    set((state: PunishmentSlice) => {
      if (success) {
        // Create recovery quests if redemption path is chosen
        // Set lastRedemptionDate immediately when redemption is started (strict rule)
        return {
          hasPendingRecovery: true,
          lastRedemptionDate: new Date(), // Mark redemption as attempted
          // Keep other state
          isCursed: state.isCursed,
          cursedUntil: state.cursedUntil
        };
      } else {
        // Reset chance counter to 0 but keep cursed until the end of week
        return {
          chanceCounter: 0,
          // Keep other state unchanged
          isCursed: state.isCursed,
          cursedUntil: state.cursedUntil,
          hasPendingRecovery: state.hasPendingRecovery
        };
      }
    });
  },

  setActiveRecoveryQuestIds: (questIds: string[] | null) => {
    set({ activeRecoveryQuestIds: questIds });
  },

  // Function to handle abandoning recovery quests
  abandonRecoveryChallenge: () => {
    const { activeRecoveryQuestIds, updateQuest } = get();

    if (activeRecoveryQuestIds && activeRecoveryQuestIds.length > 0) {
      const now = new Date();

      // Mark all recovery quests as completed/failed to prevent bypass
      activeRecoveryQuestIds.forEach((questId: string) => {
        updateQuest(questId, {
          completed: true,
          completedAt: now,
          missed: true // Mark as missed to indicate abandonment/failure
        });
      });

      // Clear the pending recovery state
      set({
        hasPendingRecovery: false,
        activeRecoveryQuestIds: null
      });

      toast({
        title: "Recovery Challenge Abandoned",
        description: "You have abandoned the recovery challenge. The curse remains and recovery quests have been marked as failed.",
        variant: "destructive"
      });
    }
  },

  // Getters
  getExpModifier: () => {
    const { isCursed, hasShadowFatigue } = get();

    if (isCursed) return 0.5; // 50% EXP while cursed (takes precedence over shadow fatigue)
    if (hasShadowFatigue) return 0.75; // 75% EXP with shadow fatigue

    return 1.0; // 100% normal EXP
  },

  canUseRedemption: () => {
    const { isCursed, lastRedemptionDate, hasPendingRecovery, chanceCounter } = get();

    // Can't use redemption if not cursed
    if (!isCursed) return false;

    // Can't use redemption if there are already recovery quests in progress
    if (hasPendingRecovery) return false;

    // Check if redemption was already attempted this week (strict one-time rule)
    if (lastRedemptionDate !== null) {
      const now = new Date();
      const lastAttempt = new Date(lastRedemptionDate);

      // Calculate start of current week (Sunday)
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      // If last attempt was in the current week, can't use redemption again
      if (lastAttempt >= startOfWeek) {
        return false;
      }
    }

    return true;
  },

  areSideQuestsLocked: () => {
    const { lockedSideQuestsUntil } = get();
    if (!lockedSideQuestsUntil) return false;

    return new Date() < lockedSideQuestsUntil;
  }
});