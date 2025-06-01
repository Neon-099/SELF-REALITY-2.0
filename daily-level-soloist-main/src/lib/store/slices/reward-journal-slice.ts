import { StateCreator } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { RewardJournalEntry, WeeklyRewardEntry } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

export interface RewardJournalSlice {
  // Reward Journal Actions
  setDailyReward: (date: Date, customReward: string) => void;
  checkDailyCompletion: (date: Date) => boolean;
  claimDailyReward: (date: Date) => void;
  getDailyRewardEntry: (date: Date) => RewardJournalEntry | undefined;
  getRewardJournalStats: () => {
    totalRewards: number;
    claimedRewards: number;
    currentStreak: number;
    longestStreak: number;
    weeklyStats: { earned: number; missed: number };
  };
  updateDailyCompletionStatus: (date: Date) => void;
  getDailyCompletionDetails: (date: Date) => {
    dailyWins: { completed: string[]; missing: string[] };
    attributes: { completed: string[]; missing: string[] };
    quests: { mainQuest: boolean; sideQuest: boolean; dailyQuests: boolean };
    missions: boolean;
    missedItems: { tasks: number; quests: number; missions: number };
    overall: boolean;
  };

  // Weekly Reward Actions
  setWeeklyReward: (weekStart: Date, customReward: string) => void;
  getWeeklyRewardEntry: (weekStart: Date) => WeeklyRewardEntry | undefined;
  checkWeeklyCompletion: (weekStart: Date) => boolean;
  checkWeeklyReducedCompletion: (weekStart: Date) => boolean;
  getWeeklyCompletionDetails: (weekStart: Date) => {
    dailyTasks: { completed: number; total: number; allCompleted: boolean };
    dailyQuests: { completed: number; required: number; met: boolean };
    mainQuests: { completed: number; required: number; met: boolean };
    sideQuests: { completed: number; required: number; met: boolean };
    missions: { completed: number; required: number; met: boolean };
    overall: boolean;
    reducedRequirements: {
      weeklyPlannerTasks: { completed: number; total: number; allCompleted: boolean };
      dailyQuests: { completed: number; required: number; met: boolean };
      mainQuests: { completed: number; required: number; met: boolean };
      sideQuests: { completed: number; required: number; met: boolean };
      missions: { completed: number; required: number; met: boolean };
      overall: boolean;
    };
  };
}

export const createRewardJournalSlice: StateCreator<
  RewardJournalSlice & any,
  [],
  [],
  RewardJournalSlice
> = (set, get) => ({
  setDailyReward: (date: Date, customReward: string) => {
    const { user } = get();
    const dateKey = date.toDateString();

    // Ensure rewardJournal exists
    if (!user.rewardJournal) {
      user.rewardJournal = [];
    }

    // Check if entry already exists for this date
    const existingEntryIndex = user.rewardJournal.findIndex(
      (entry: RewardJournalEntry) => new Date(entry.date).toDateString() === dateKey
    );

    const newEntry: RewardJournalEntry = {
      id: uuidv4(),
      date: new Date(date),
      customReward: customReward.trim(),
      completed: false,
      claimed: false,
      requiredTasks: {
        allTasks: false,
        mainQuest: false,
        sideQuest: false,
        dailyQuests: false,
        missionTasks: false
      }
    };

    set((state: any) => {
      // Ensure rewardJournal exists in state
      if (!state.user.rewardJournal) {
        state.user.rewardJournal = [];
      }
      const updatedJournal = [...state.user.rewardJournal];

      if (existingEntryIndex >= 0) {
        // Update existing entry
        updatedJournal[existingEntryIndex] = {
          ...updatedJournal[existingEntryIndex],
          customReward: customReward.trim(),
          // Reset completion status if reward is changed
          completed: false,
          claimed: false,
          claimedAt: undefined
        };
      } else {
        // Add new entry
        updatedJournal.push(newEntry);
      }

      return {
        user: {
          ...state.user,
          rewardJournal: updatedJournal
        }
      };
    });

    toast({
      title: "Daily Reward Set!",
      description: `Your reward for ${date.toLocaleDateString()}: "${customReward}"`,
      variant: "default"
    });
  },

  checkDailyCompletion: (date: Date) => {
    const state = get();
    const { tasks = [], missions = [], getDailyQuestCompletionStatus } = state;
    const dateKey = date.toDateString();
    const today = new Date().toDateString();

    // Only check completion for today or past dates
    // Future dates cannot be completed yet
    if (new Date(dateKey) > new Date(today)) {
      return false;
    }

    // For today, use real-time checking
    if (dateKey === today) {
      // Check all tasks for today
      const tasksForToday = tasks.filter((task: any) => {
        const taskDate = task.scheduledFor ? new Date(task.scheduledFor) : new Date(task.createdAt);
        return taskDate.toDateString() === dateKey;
      });

      // Check if all tasks are completed AND none are missed
      const allTasksCompleted = tasksForToday.length === 0 || tasksForToday.every((task: any) => task.completed);
      const noMissedTasks = tasksForToday.every((task: any) => !task.missed);

      // Check quest completion for today (main and side quests are no longer required)
      const questStatus = getDailyQuestCompletionStatus ? getDailyQuestCompletionStatus() : { mainQuestsCompleted: 0, sideQuestsCompleted: 0, dailyQuestsCompleted: 0 };
      const dailyQuestsCompleted = questStatus.dailyQuestsCompleted >= 5; // Require 5 daily quests

      // Check mission completion for today - require at least 3 missions completed
      const completedMissionsToday = missions.filter((mission: any) => {
        if (!mission.completed || !mission.completedAt) return false;
        const completedDate = new Date(mission.completedAt);
        return completedDate.toDateString() === dateKey;
      });
      const missionRequirementMet = completedMissionsToday.length >= 3;

      // Check if any missions are missed
      const noMissedMissions = completedMissionsToday.every((mission: any) => !mission.missed);

      // Daily reward is only claimable if ALL requirements are met AND nothing is missed
      return allTasksCompleted && noMissedTasks && dailyQuestsCompleted && missionRequirementMet && noMissedMissions;
    }

    // For past dates, we can't accurately check completion in real-time
    // Instead, rely on the stored completion status in the reward journal entry
    const { user } = get();
    if (!user.rewardJournal) return false;

    const entry = user.rewardJournal.find(
      (entry: RewardJournalEntry) => new Date(entry.date).toDateString() === dateKey
    );

    return entry ? entry.completed : false;
  },

  claimDailyReward: (date: Date) => {
    const { user, checkDailyCompletion } = get();
    const dateKey = date.toDateString();
    const today = new Date().toDateString();

    // Prevent claiming future rewards
    if (new Date(dateKey) > new Date(today)) {
      toast({
        title: "Cannot Claim Future Reward",
        description: "You can only claim rewards for today or past dates.",
        variant: "destructive"
      });
      return;
    }

    // Ensure rewardJournal exists
    if (!user.rewardJournal) {
      user.rewardJournal = [];
    }

    const entryIndex = user.rewardJournal.findIndex(
      (entry: RewardJournalEntry) => new Date(entry.date).toDateString() === dateKey
    );

    if (entryIndex < 0) {
      toast({
        title: "No Reward Set",
        description: "You haven't set a reward for this day.",
        variant: "destructive"
      });
      return;
    }

    const entry = user.rewardJournal[entryIndex];

    if (entry.claimed) {
      toast({
        title: "Already Claimed",
        description: "You've already claimed this reward!",
        variant: "destructive"
      });
      return;
    }

    const isCompleted = checkDailyCompletion(date);

    if (!isCompleted) {
      toast({
        title: "Reward Not Unlocked",
        description: "Complete all your tasks, 5 daily quests, and at least 3 missions without any missed items to unlock your reward!",
        variant: "destructive"
      });
      return;
    }

    set((state: any) => {
      const updatedJournal = [...state.user.rewardJournal];
      updatedJournal[entryIndex] = {
        ...updatedJournal[entryIndex],
        completed: true,
        claimed: true,
        claimedAt: new Date()
      };

      return {
        user: {
          ...state.user,
          rewardJournal: updatedJournal
        }
      };
    });

    toast({
      title: "🎉 Reward Unlocked!",
      description: `Congratulations! You've earned: "${entry.customReward}"`,
      variant: "default"
    });
  },

  getDailyRewardEntry: (date: Date) => {
    const { user } = get();
    const dateKey = date.toDateString();

    // Ensure rewardJournal exists
    if (!user.rewardJournal) {
      return undefined;
    }

    return user.rewardJournal.find(
      (entry: RewardJournalEntry) => new Date(entry.date).toDateString() === dateKey
    );
  },

  getRewardJournalStats: () => {
    const { user } = get();

    // Ensure rewardJournal exists
    if (!user.rewardJournal) {
      return {
        totalRewards: 0,
        claimedRewards: 0,
        currentStreak: 0,
        longestStreak: 0,
        weeklyStats: { earned: 0, missed: 0 }
      };
    }

    const journal = user.rewardJournal;

    const totalRewards = journal.length;
    const claimedRewards = journal.filter((entry: RewardJournalEntry) => entry.claimed).length;

    // Calculate current streak
    let currentStreak = 0;
    const sortedEntries = [...journal]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    for (const entry of sortedEntries) {
      if (entry.claimed) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;

    for (const entry of sortedEntries.reverse()) {
      if (entry.claimed) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // Calculate weekly stats (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyEntries = journal.filter((entry: RewardJournalEntry) => new Date(entry.date) >= weekAgo);
    const weeklyEarned = weeklyEntries.filter((entry: RewardJournalEntry) => entry.claimed).length;
    const weeklyMissed = weeklyEntries.filter((entry: RewardJournalEntry) => !entry.claimed && entry.customReward).length;

    return {
      totalRewards,
      claimedRewards,
      currentStreak,
      longestStreak,
      weeklyStats: {
        earned: weeklyEarned,
        missed: weeklyMissed
      }
    };
  },

  updateDailyCompletionStatus: (date: Date) => {
    const { user, checkDailyCompletion } = get();
    const dateKey = date.toDateString();
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    // Ensure rewardJournal exists
    if (!user.rewardJournal) {
      user.rewardJournal = [];
    }

    const entryIndex = user.rewardJournal.findIndex(
      (entry: RewardJournalEntry) => new Date(entry.date).toDateString() === dateKey
    );

    if (entryIndex >= 0) {
      const isCompleted = checkDailyCompletion(date);

      set((state: any) => {
        const updatedJournal = [...state.user.rewardJournal];

        // Only update completion status for today
        // Don't automatically mark past dates as missed
        if (isToday) {
          updatedJournal[entryIndex] = {
            ...updatedJournal[entryIndex],
            completed: isCompleted,
            requiredTasks: {
              allTasks: isCompleted,
              mainQuest: isCompleted,
              sideQuest: isCompleted,
              dailyQuests: isCompleted,
              missionTasks: isCompleted
            }
          };
        }

        return {
          user: {
            ...state.user,
            rewardJournal: updatedJournal
          }
        };
      });
    }
  },

  getDailyCompletionDetails: (date: Date) => {
    const state = get();
    const { tasks = [], quests = [], missions = [], getDailyQuestCompletionStatus } = state;
    const dateKey = date.toDateString();

    // Get all tasks for the date (both completed and incomplete)
    const allTasksForToday = tasks.filter((task: any) => {
      const taskDate = task.scheduledFor ? new Date(task.scheduledFor) : new Date(task.createdAt);
      return taskDate.toDateString() === dateKey;
    });

    // Get completed tasks for the date
    const completedTasksForToday = allTasksForToday.filter((task: any) => task.completed);

    // Check if all tasks are completed
    const allTasksCompleted = allTasksForToday.length === 0 || allTasksForToday.every((task: any) => task.completed);

    // Check quest completion - only daily quests are required for daily rewards
    const questStatus = getDailyQuestCompletionStatus ? getDailyQuestCompletionStatus() : { mainQuestsCompleted: 0, sideQuestsCompleted: 0, dailyQuestsCompleted: 0 };
    const questsCompletion = {
      mainQuest: questStatus.mainQuestsCompleted >= 1, // Not required for daily rewards
      sideQuest: questStatus.sideQuestsCompleted >= 1, // Not required for daily rewards
      dailyQuests: questStatus.dailyQuestsCompleted >= 5 // Required: 5 daily quests
    };

    // Check mission completion - require at least 3 missions completed
    const completedMissionsToday = missions.filter((mission: any) => {
      if (!mission.completed || !mission.completedAt) return false;
      const completedDate = new Date(mission.completedAt);
      return completedDate.toDateString() === dateKey;
    });
    const missionRequirementMet = completedMissionsToday.length >= 3;

    // Check for missed items (auto-completed with penalties)
    const missedItems = {
      tasks: completedTasksForToday.filter((task: any) => task.missed).length,
      quests: quests.filter((quest: any) => {
        const questDate = quest.createdAt ? new Date(quest.createdAt) : new Date();
        return questDate.toDateString() === dateKey && quest.completed && quest.missed;
      }).length,
      missions: completedMissionsToday.filter((mission: any) => mission.missed).length
    };

    // Check if any tasks or missions are missed
    const noMissedTasks = allTasksForToday.every((task: any) => !task.missed);
    const noMissedMissions = completedMissionsToday.every((mission: any) => !mission.missed);

    // Overall completion for daily rewards: all tasks + 5 daily quests + 3 missions + NO missed items
    // Main and side quests are NOT required for daily rewards
    const overall = allTasksCompleted && noMissedTasks && questsCompletion.dailyQuests && missionRequirementMet && noMissedMissions;

    return {
      dailyWins: { completed: [], missing: [] }, // Not used for daily rewards anymore
      attributes: { completed: [], missing: [] }, // Not used for daily rewards anymore
      quests: questsCompletion,
      missions: missionRequirementMet,
      missedItems,
      overall
    };
  },

  // Weekly Reward Functions
  setWeeklyReward: (weekStart: Date, customReward: string) => {
    const { user } = get();

    // Ensure weeklyRewards exists
    if (!user.weeklyRewards) {
      user.weeklyRewards = [];
    }

    // Calculate week end (Saturday)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const weekKey = weekStart.toDateString();

    // Check if entry already exists for this week
    const existingEntryIndex = user.weeklyRewards.findIndex(
      (entry: WeeklyRewardEntry) => new Date(entry.weekStart).toDateString() === weekKey
    );

    const newEntry: WeeklyRewardEntry = {
      id: uuidv4(),
      weekStart: new Date(weekStart),
      weekEnd: new Date(weekEnd),
      customReward: customReward.trim(),
      completed: false,
      claimed: false,
      dailyProgress: {}
    };

    set((state: any) => {
      // Ensure weeklyRewards exists in state
      if (!state.user.weeklyRewards) {
        state.user.weeklyRewards = [];
      }
      const updatedWeeklyRewards = [...state.user.weeklyRewards];

      if (existingEntryIndex >= 0) {
        // Update existing entry
        updatedWeeklyRewards[existingEntryIndex] = {
          ...updatedWeeklyRewards[existingEntryIndex],
          customReward: customReward.trim(),
          completed: false,
          claimed: false,
          claimedAt: undefined
        };
      } else {
        // Add new entry
        updatedWeeklyRewards.push(newEntry);
      }

      return {
        user: {
          ...state.user,
          weeklyRewards: updatedWeeklyRewards
        }
      };
    });

    toast({
      title: "Weekly Reward Set!",
      description: `Your weekly reward: "${customReward}"`,
      variant: "default"
    });
  },

  getWeeklyRewardEntry: (weekStart: Date) => {
    const { user } = get();
    const weekKey = weekStart.toDateString();

    // Ensure weeklyRewards exists
    if (!user.weeklyRewards) {
      return undefined;
    }

    return user.weeklyRewards.find(
      (entry: WeeklyRewardEntry) => new Date(entry.weekStart).toDateString() === weekKey
    );
  },

  checkWeeklyCompletion: (weekStart: Date) => {
    const state = get();
    const { tasks = [], quests = [], missions = [] } = state;

    // Calculate week end (Saturday)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    // Get all dates in the week
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      weekDates.push(date);
    }

    // Check if week is in the future
    const today = new Date();
    if (weekStart > today) {
      return false;
    }

    // Count weekly totals
    let totalDailyTasks = 0;
    let completedDailyTasks = 0;
    let totalDailyQuests = 0;
    let totalMainQuests = 0;
    let totalSideQuests = 0;
    let totalMissions = 0;

    // Check each day in the week
    for (const date of weekDates) {
      const dateKey = date.toDateString();

      // Skip future dates
      if (date > today) continue;

      // Count daily tasks (without deadlines)
      const dailyTasks = tasks.filter((task: any) => {
        const taskDate = task.scheduledFor ? new Date(task.scheduledFor) : new Date(task.createdAt);
        return taskDate.toDateString() === dateKey && !task.deadline;
      });
      totalDailyTasks += dailyTasks.length;
      completedDailyTasks += dailyTasks.filter((task: any) => task.completed).length;

      // Count daily quests for this date
      const dailyQuests = quests.filter((quest: any) => {
        const questDate = quest.createdAt ? new Date(quest.createdAt) : new Date();
        return questDate.toDateString() === dateKey && quest.type === 'daily' && quest.completed;
      });
      totalDailyQuests += dailyQuests.length;

      // Count main and side quests for this date
      const mainQuests = quests.filter((quest: any) => {
        const questDate = quest.createdAt ? new Date(quest.createdAt) : new Date();
        return questDate.toDateString() === dateKey && quest.type === 'main' && quest.completed;
      });
      totalMainQuests += mainQuests.length;

      const sideQuests = quests.filter((quest: any) => {
        const questDate = quest.createdAt ? new Date(quest.createdAt) : new Date();
        return questDate.toDateString() === dateKey && quest.type === 'side' && quest.completed;
      });
      totalSideQuests += sideQuests.length;

      // Count missions for this date
      const dailyMissions = missions.filter((mission: any) => {
        if (!mission.completed || !mission.completedAt) return false;
        const completedDate = new Date(mission.completedAt);
        return completedDate.toDateString() === dateKey;
      });
      totalMissions += dailyMissions.length;
    }

    // Check strict weekly requirements
    const allDailyTasksCompleted = totalDailyTasks === 0 || completedDailyTasks === totalDailyTasks;
    const dailyQuestsMet = totalDailyQuests >= 30;
    const mainQuestsMet = totalMainQuests >= 5;
    const sideQuestsMet = totalSideQuests >= 5;
    const missionsMet = totalMissions >= 18;

    const fullRequirementsMet = allDailyTasksCompleted && dailyQuestsMet && mainQuestsMet && sideQuestsMet && missionsMet;

    // If full requirements are met, return true
    if (fullRequirementsMet) {
      return true;
    }

    // Otherwise, check reduced requirements
    return get().checkWeeklyReducedCompletion(weekStart);
  },

  getWeeklyCompletionDetails: (weekStart: Date) => {
    const state = get();
    const { tasks = [], quests = [], missions = [] } = state;

    // Calculate week end (Saturday)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    // Get all dates in the week
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      weekDates.push(date);
    }

    const today = new Date();

    // Count weekly totals
    let totalDailyTasks = 0;
    let completedDailyTasks = 0;
    let totalDailyQuests = 0;
    let totalMainQuests = 0;
    let totalSideQuests = 0;
    let totalMissions = 0;

    // Check each day in the week
    for (const date of weekDates) {
      const dateKey = date.toDateString();

      // Skip future dates
      if (date > today) continue;

      // Count daily tasks (without deadlines)
      const dailyTasks = tasks.filter((task: any) => {
        const taskDate = task.scheduledFor ? new Date(task.scheduledFor) : new Date(task.createdAt);
        return taskDate.toDateString() === dateKey && !task.deadline;
      });
      totalDailyTasks += dailyTasks.length;
      completedDailyTasks += dailyTasks.filter((task: any) => task.completed).length;

      // Count daily quests for this date
      const dailyQuests = quests.filter((quest: any) => {
        const questDate = quest.createdAt ? new Date(quest.createdAt) : new Date();
        return questDate.toDateString() === dateKey && quest.type === 'daily' && quest.completed;
      });
      totalDailyQuests += dailyQuests.length;

      // Count main and side quests for this date
      const mainQuests = quests.filter((quest: any) => {
        const questDate = quest.createdAt ? new Date(quest.createdAt) : new Date();
        return questDate.toDateString() === dateKey && quest.type === 'main' && quest.completed;
      });
      totalMainQuests += mainQuests.length;

      const sideQuests = quests.filter((quest: any) => {
        const questDate = quest.createdAt ? new Date(quest.createdAt) : new Date();
        return questDate.toDateString() === dateKey && quest.type === 'side' && quest.completed;
      });
      totalSideQuests += sideQuests.length;

      // Count missions for this date
      const dailyMissions = missions.filter((mission: any) => {
        if (!mission.completed || !mission.completedAt) return false;
        const completedDate = new Date(mission.completedAt);
        return completedDate.toDateString() === dateKey;
      });
      totalMissions += dailyMissions.length;
    }

    // Calculate completion status
    const allDailyTasksCompleted = totalDailyTasks === 0 || completedDailyTasks === totalDailyTasks;
    const dailyQuestsMet = totalDailyQuests >= 30;
    const mainQuestsMet = totalMainQuests >= 5;
    const sideQuestsMet = totalSideQuests >= 5;
    const missionsMet = totalMissions >= 18;

    const overall = allDailyTasksCompleted && dailyQuestsMet && mainQuestsMet && sideQuestsMet && missionsMet;

    // Calculate reduced requirements for weekly planner tasks
    const weeklyPlannerTasks = tasks.filter((task: any) => {
      if (!task.scheduledFor) return false;
      const taskDate = new Date(task.scheduledFor);
      return taskDate >= weekStart && taskDate <= weekEnd && task.isWeeklyPlannerTask;
    });
    const completedWeeklyPlannerTasks = weeklyPlannerTasks.filter((task: any) => task.completed);
    const allWeeklyPlannerTasksCompleted = weeklyPlannerTasks.length === 0 || weeklyPlannerTasks.every((task: any) => task.completed);

    // Reduced requirements (half of original)
    const reducedDailyQuestsMet = totalDailyQuests >= 15;
    const reducedMainQuestsMet = totalMainQuests >= 2;
    const reducedSideQuestsMet = totalSideQuests >= 2;
    const reducedMissionsMet = totalMissions >= 11;

    const reducedOverall = allWeeklyPlannerTasksCompleted && reducedDailyQuestsMet && reducedMainQuestsMet && reducedSideQuestsMet && reducedMissionsMet;

    return {
      dailyTasks: { completed: completedDailyTasks, total: totalDailyTasks, allCompleted: allDailyTasksCompleted },
      dailyQuests: { completed: totalDailyQuests, required: 30, met: dailyQuestsMet },
      mainQuests: { completed: totalMainQuests, required: 5, met: mainQuestsMet },
      sideQuests: { completed: totalSideQuests, required: 5, met: sideQuestsMet },
      missions: { completed: totalMissions, required: 18, met: missionsMet },
      overall,
      reducedRequirements: {
        weeklyPlannerTasks: { completed: completedWeeklyPlannerTasks.length, total: weeklyPlannerTasks.length, allCompleted: allWeeklyPlannerTasksCompleted },
        dailyQuests: { completed: totalDailyQuests, required: 15, met: reducedDailyQuestsMet },
        mainQuests: { completed: totalMainQuests, required: 2, met: reducedMainQuestsMet },
        sideQuests: { completed: totalSideQuests, required: 2, met: reducedSideQuestsMet },
        missions: { completed: totalMissions, required: 11, met: reducedMissionsMet },
        overall: reducedOverall
      }
    };
  },

  checkWeeklyReducedCompletion: (weekStart: Date) => {
    const state = get();
    const { tasks = [], quests = [], missions = [] } = state;

    // Calculate week end (Saturday)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    // Check if week is in the future
    const today = new Date();
    if (weekStart > today) {
      return false;
    }

    // Get weekly planner tasks for this week
    const weeklyPlannerTasks = tasks.filter((task: any) => {
      if (!task.scheduledFor) return false;
      const taskDate = new Date(task.scheduledFor);
      return taskDate >= weekStart && taskDate <= weekEnd && task.isWeeklyPlannerTask;
    });
    const allWeeklyPlannerTasksCompleted = weeklyPlannerTasks.length === 0 || weeklyPlannerTasks.every((task: any) => task.completed);

    // Count weekly totals (same logic as full requirements)
    let totalDailyQuests = 0;
    let totalMainQuests = 0;
    let totalSideQuests = 0;
    let totalMissions = 0;

    // Get all dates in the week
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      weekDates.push(date);
    }

    // Check each day in the week
    for (const date of weekDates) {
      const dateKey = date.toDateString();

      // Skip future dates
      if (date > today) continue;

      // Count daily quests for this date
      const dailyQuests = quests.filter((quest: any) => {
        const questDate = quest.createdAt ? new Date(quest.createdAt) : new Date();
        return questDate.toDateString() === dateKey && quest.type === 'daily' && quest.completed;
      });
      totalDailyQuests += dailyQuests.length;

      // Count main and side quests for this date
      const mainQuests = quests.filter((quest: any) => {
        const questDate = quest.createdAt ? new Date(quest.createdAt) : new Date();
        return questDate.toDateString() === dateKey && quest.type === 'main' && quest.completed;
      });
      totalMainQuests += mainQuests.length;

      const sideQuests = quests.filter((quest: any) => {
        const questDate = quest.createdAt ? new Date(quest.createdAt) : new Date();
        return questDate.toDateString() === dateKey && quest.type === 'side' && quest.completed;
      });
      totalSideQuests += sideQuests.length;

      // Count missions for this date
      const dailyMissions = missions.filter((mission: any) => {
        if (!mission.completed || !mission.completedAt) return false;
        const completedDate = new Date(mission.completedAt);
        return completedDate.toDateString() === dateKey;
      });
      totalMissions += dailyMissions.length;
    }

    // Check reduced weekly requirements
    const reducedDailyQuestsMet = totalDailyQuests >= 15;
    const reducedMainQuestsMet = totalMainQuests >= 2;
    const reducedSideQuestsMet = totalSideQuests >= 2;
    const reducedMissionsMet = totalMissions >= 11;

    return allWeeklyPlannerTasksCompleted && reducedDailyQuestsMet && reducedMainQuestsMet && reducedSideQuestsMet && reducedMissionsMet;
  }
});
