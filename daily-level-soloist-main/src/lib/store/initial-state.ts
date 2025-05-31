import { v4 as uuidv4 } from 'uuid';
import { User, CharacterStats } from '../types';
import { calculateExpToNextLevel } from '../utils/calculations';

const initialStats: CharacterStats = {
  physical: 1,
  cognitive: 1,
  emotional: 1,
  spiritual: 1,
  social: 1,
  physicalExp: 0,
  cognitiveExp: 0,
  emotionalExp: 0,
  spiritualExp: 0,
  socialExp: 0
};

export const initialUser: User = {
  id: uuidv4(),
  name: "Hunter",
  level: 1,
  exp: 0,
  expToNextLevel: calculateExpToNextLevel(1),
  stats: initialStats,
  gold: 100,
  dailyWins: {
    mental: { count: 0, lastUpdated: new Date(), completedTasks: [], isCompleted: false },
    physical: { count: 0, lastUpdated: new Date(), completedTasks: [], isCompleted: false },
    spiritual: { count: 0, lastUpdated: new Date(), completedTasks: [], isCompleted: false },
    intelligence: { count: 0, lastUpdated: new Date(), completedTasks: [], isCompleted: false }
  },
  streakDays: 0,
  longestStreak: 0,
  lastActive: new Date(),
  rank: 'F',
  rewardJournal: [],
  weeklyRewards: []
};
