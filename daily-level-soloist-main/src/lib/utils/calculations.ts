import { Difficulty, Rank } from '../types';

export const calculateExpToNextLevel = (level: number) => Math.floor(100 * Math.pow(1.2, level - 1));

export const getExpForDifficulty = (difficulty: Difficulty): number => {
  const rewards = {
    easy: 5,
    medium: 10
  };
  return rewards[difficulty];
};

export const calculateRank = (level: number): Rank => {
  if (level >= 360) return 'SSS';
  if (level >= 270) return 'SS';
  if (level >= 180) return 'S';
  if (level >= 150) return 'A';
  if (level >= 120) return 'B';
  if (level >= 90) return 'C';
  if (level >= 60) return 'D';
  if (level >= 30) return 'E';
  return 'F';
};
