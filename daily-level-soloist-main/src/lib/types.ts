// Type definitions for the Solo Leveling app

export type Difficulty = 'easy' | 'medium' | 'hard' | 'normal' | 'boss';

export type DailyWinCategory = 'mental' | 'physical' | 'spiritual' | 'intelligence';

export interface DailyWinProgress {
  count: number;
  lastUpdated: Date;
  completedTasks: string[]; // Array of task IDs that contributed to this win
  isCompleted: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: Date;
  category: DailyWinCategory;
  difficulty: Difficulty;
  expReward: number;
  createdAt?: Date;
  scheduledFor?: Date;
  missed?: boolean; // To track if the deadline was missed
  deadline?: Date; // To track task deadline for the Shadow Penalty system
  isWeeklyPlannerTask?: boolean; // To track if task was created in weekly planner for reduced requirements
}

export interface Quest {
  id: string;
  title: string;
  description?: string;
  expReward: number;
  completed: boolean;
  completedAt?: Date;
  isMainQuest: boolean;
  started: boolean;
  tasks: Task[];
  createdAt: Date;
  deadline?: Date;
  difficulty: Difficulty;
  category: DailyWinCategory | '';  // Allow empty string
  missed?: boolean; // To track if the deadline was missed
  isRecoveryQuest?: boolean; // To mark quests that are part of redemption challenges
  isDaily?: boolean; // To mark quests that are daily quests
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  started?: boolean;
  expReward: number;
  createdAt: Date;
  completedAt?: Date;
  rank?: Rank;  // Use the Rank type instead of string
  day?: number;
  releaseDate?: Date;
  deadline?: Date; // Add deadline property to match usage in ShadowPenalty.tsx
  missed?: boolean; // To track if the deadline was missed
  difficulty?: 'normal' | 'boss'; // Difficulty level of the mission
  expEarned?: number; // Added to track actual EXP earned (for compatibility with MissionBoard.tsx)
  count?: number; // Number of tasks to complete for this mission
  taskNames?: string[]; // Names of individual tasks to complete
  completedTaskIndices?: number[]; // Indices of completed tasks
}

export type Stat = 'physical' | 'cognitive' | 'emotional' | 'spiritual' | 'social';

export interface CharacterStats {
  [key: string]: number;
  physical: number;
  cognitive: number;
  emotional: number;
  spiritual: number;
  social: number;
  physicalExp: number;
  cognitiveExp: number;
  emotionalExp: number;
  spiritualExp: number;
  socialExp: number;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'reward' | 'boost' | 'cosmetic';
  purchased: boolean;
}

export type Rank = 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';

export interface WeeklyTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  date: Date;
  difficulty: Difficulty;
  expReward: number;
  category: DailyWinCategory;
}

export interface RewardJournalEntry {
  id: string;
  date: Date;
  customReward: string;
  completed: boolean;
  claimed: boolean;
  claimedAt?: Date;
  missed?: boolean;
  missedAt?: Date;
  requiredTasks: {
    allTasks: boolean;
    mainQuest: boolean;
    sideQuest: boolean;
    dailyQuests: boolean;
    missionTasks: boolean;
  };
}

export interface WeeklyRewardEntry {
  id: string;
  weekStart: Date; // Sunday of the week
  weekEnd: Date;   // Saturday of the week
  customReward: string;
  completed: boolean;
  claimed: boolean;
  claimedAt?: Date;
  missed?: boolean;
  missedAt?: Date;
  dailyProgress: {
    [dateString: string]: boolean; // Track completion for each day
  };
}

export interface User {
  id: string;
  name: string;
  level: number;
  exp: number;
  expToNextLevel: number;
  stats: CharacterStats;
  gold: number;
  dailyWins: Record<DailyWinCategory, DailyWinProgress>;
  streakDays: number;
  longestStreak: number;
  lastActive: Date;
  rank: Rank;
  lastUpdate?: number;
  // Shadow Penalty System Properties
  chanceCounter?: number;
  isCursed?: boolean;
  hasShadowFatigue?: boolean;
  // Reward Journal System
  rewardJournal: RewardJournalEntry[];
  weeklyRewards: WeeklyRewardEntry[];
}
