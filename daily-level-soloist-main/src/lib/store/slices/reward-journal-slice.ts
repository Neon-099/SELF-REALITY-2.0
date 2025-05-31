import { StateCreator } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { RewardJournalEntry } from '@/lib/types';
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
  getDailyCompletionDetails: (date: Date) => {
    dailyWins: { completed: string[]; missing: string[] };
    attributes: { completed: string[]; missing: string[] };
    quests: { mainQuest: boolean; sideQuest: boolean; dailyQuests: boolean };
    missions: boolean;
    overall: boolean;
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
      entry => new Date(entry.date).toDateString() === dateKey
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
    const { tasks = [], quests = [], missions = [], getDailyQuestCompletionStatus } = state;
    const dateKey = date.toDateString();
    const today = new Date().toDateString();

    // Only check completion for today or past dates
    // Future dates cannot be completed yet
    if (new Date(dateKey) > new Date(today)) {
      return false;
    }

    // For today, use real-time checking
    if (dateKey === today) {
      // STRICT RULE: Check for specific task completion requirements
      // Must complete all 4 daily wins AND 5 attributes (one task from each category)

      const tasksForToday = tasks.filter((task: any) => {
        const taskDate = task.scheduledFor ? new Date(task.scheduledFor) : new Date(task.createdAt);
        return taskDate.toDateString() === dateKey && task.completed;
      });

      // Define required categories
      const dailyWinCategories = ['mental', 'physical', 'spiritual', 'intelligence'];
      const attributeCategories = ['physical', 'cognitive', 'emotional', 'spiritual', 'social'];

      // Check if all 4 daily win categories have at least one completed task
      const completedDailyWins = dailyWinCategories.filter(category =>
        tasksForToday.some((task: any) => task.category === category)
      );

      // Check if all 5 attribute categories have at least one completed task
      const completedAttributes = attributeCategories.filter(category =>
        tasksForToday.some((task: any) => task.category === category)
      );

      const allDailyWinsCompleted = completedDailyWins.length === 4;
      const allAttributesCompleted = completedAttributes.length === 5;

      // Check quest completion for today
      const questStatus = getDailyQuestCompletionStatus ? getDailyQuestCompletionStatus() : { mainQuestsCompleted: 0, sideQuestsCompleted: 0, dailyQuestsCompleted: 0 };
      const mainQuestCompleted = questStatus.mainQuestsCompleted >= 1;
      const sideQuestCompleted = questStatus.sideQuestsCompleted >= 1;
      const dailyQuestsCompleted = questStatus.dailyQuestsCompleted > 0; // At least some daily quests

      // Check mission tasks for today
      const missionsForToday = missions.filter((mission: any) => {
        const missionDate = mission.createdAt ? new Date(mission.createdAt) : new Date();
        return missionDate.toDateString() === dateKey && mission.started;
      });
      const allMissionTasksCompleted = missionsForToday.length === 0 ||
        missionsForToday.every((mission: any) => mission.completed);

      return allDailyWinsCompleted && allAttributesCompleted && mainQuestCompleted &&
             sideQuestCompleted && dailyQuestsCompleted && allMissionTasksCompleted;
    }

    // For past dates, check if completion was recorded
    return false; // For now, only support today's completion checking
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
        description: "Complete all 4 daily wins, 5 attributes, quests, and missions to unlock your reward!",
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
    const claimedRewards = journal.filter(entry => entry.claimed).length;

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

    const weeklyEntries = journal.filter(entry => new Date(entry.date) >= weekAgo);
    const weeklyEarned = weeklyEntries.filter(entry => entry.claimed).length;
    const weeklyMissed = weeklyEntries.filter(entry => !entry.claimed && entry.customReward).length;

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

  getDailyCompletionDetails: (date: Date) => {
    const state = get();
    const { tasks = [], quests = [], missions = [], getDailyQuestCompletionStatus } = state;
    const dateKey = date.toDateString();

    // Get completed tasks for the date
    const tasksForToday = tasks.filter((task: any) => {
      const taskDate = task.scheduledFor ? new Date(task.scheduledFor) : new Date(task.createdAt);
      return taskDate.toDateString() === dateKey && task.completed;
    });

    // Define required categories
    const dailyWinCategories = ['mental', 'physical', 'spiritual', 'intelligence'];
    const attributeCategories = ['physical', 'cognitive', 'emotional', 'spiritual', 'social'];

    // Check daily wins completion
    const completedDailyWins = dailyWinCategories.filter(category =>
      tasksForToday.some((task: any) => task.category === category)
    );
    const missingDailyWins = dailyWinCategories.filter(category =>
      !tasksForToday.some((task: any) => task.category === category)
    );

    // Check attributes completion
    const completedAttributes = attributeCategories.filter(category =>
      tasksForToday.some((task: any) => task.category === category)
    );
    const missingAttributes = attributeCategories.filter(category =>
      !tasksForToday.some((task: any) => task.category === category)
    );

    // Check quest completion
    const questStatus = getDailyQuestCompletionStatus ? getDailyQuestCompletionStatus() : { mainQuestsCompleted: 0, sideQuestsCompleted: 0, dailyQuestsCompleted: 0 };
    const questsCompletion = {
      mainQuest: questStatus.mainQuestsCompleted >= 1,
      sideQuest: questStatus.sideQuestsCompleted >= 1,
      dailyQuests: questStatus.dailyQuestsCompleted > 0
    };

    // Check mission completion
    const missionsForToday = missions.filter((mission: any) => {
      const missionDate = mission.createdAt ? new Date(mission.createdAt) : new Date();
      return missionDate.toDateString() === dateKey && mission.started;
    });
    const missionsCompleted = missionsForToday.length === 0 || missionsForToday.every((mission: any) => mission.completed);

    // Overall completion
    const allDailyWinsCompleted = completedDailyWins.length === 4;
    const allAttributesCompleted = completedAttributes.length === 5;
    const overall = allDailyWinsCompleted && allAttributesCompleted &&
                   questsCompletion.mainQuest && questsCompletion.sideQuest &&
                   questsCompletion.dailyQuests && missionsCompleted;

    return {
      dailyWins: { completed: completedDailyWins, missing: missingDailyWins },
      attributes: { completed: completedAttributes, missing: missingAttributes },
      quests: questsCompletion,
      missions: missionsCompleted,
      overall
    };
  }
});
