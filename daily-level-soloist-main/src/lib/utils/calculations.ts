import { Difficulty, Rank } from '../types';

export const calculateExpToNextLevel = (level: number) => Math.floor(100 * Math.pow(1.15, level - 1));

export const getExpForDifficulty = (difficulty: Difficulty): number => {
  const rewards = {
    easy: 15,
    medium: 30,
    hard: 60,
    boss: 100
  };
  return rewards[difficulty as keyof typeof rewards] || 15;
};

export const calculateRank = (level: number): Rank => {
  if (level >= 200) return 'SSS';
  if (level >= 160) return 'SS';
  if (level >= 120) return 'S';
  if (level >= 90) return 'A';
  if (level >= 60) return 'B';
  if (level >= 40) return 'C';
  if (level >= 25) return 'D';
  if (level >= 15) return 'E';
  return 'F';
};
