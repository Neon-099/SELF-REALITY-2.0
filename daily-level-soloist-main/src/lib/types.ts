// Type definitions for the Solo Leveling app

export type Difficulty = 'easy' | 'medium';

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
  category: DailyWinCategory;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  expReward: number;
  createdAt: Date;
  completedAt?: Date;
  rank?: string;
  day?: number;
  releaseDate?: Date;
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
}
