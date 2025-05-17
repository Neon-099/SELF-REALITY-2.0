export type Difficulty = 'easy' | 'normal' | 'hard' | 'boss';

export type DailyWinCategory = 'physical' | 'mental' | 'spiritual' | 'intelligence';

export type Stat = 'physical' | 'cognitive' | 'emotional' | 'spiritual' | 'social';

export interface Task {
  description: string;
  completed: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  isMainQuest: boolean;
  difficulty: Difficulty;
  createdAt: Date;
  completed: boolean;
  expReward: number;
  tasks: Task[];
  started: boolean;
  category?: string;
  deadline?: Date;
  completedAt?: Date;
  missed?: boolean;
  isRecoveryQuest?: boolean;
  isDaily?: boolean;
}

export interface User {
  id: string;
  name: string;
  level: number;
  exp: number;
  expToNextLevel: number;
  gold: number;
  rank: string;
  streakDays: number;
  longestStreak: number;
  stats: Record<Stat, number>;
  createdAt: Date;
  lastLogin: Date;
  lastActive: Date;
  dailyWins: Record<DailyWinCategory, DailyWinProgress>;
  
  // Character creation data
  completedCharacterCreation?: boolean;
  characterClass?: string;
  surveyResults?: Record<string, number>;
  surveyAnswers?: Record<string, number[]>;
  strengths?: string[];
  weaknesses?: string[];
  
  // Auth-related fields
  authUserId?: string;
  email?: string;
  username?: string;
  usingLocalStorageOnly?: boolean;
} 