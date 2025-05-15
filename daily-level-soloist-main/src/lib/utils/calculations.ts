import { Difficulty, Rank } from '../types';

/**
 * Calculates experience required to reach the next level using the formula:
 * XP_n = BaseXP × n^GrowthRate
 * Where:
 * - n = current level
 * - BaseXP = 100 (starting XP per level)
 * - GrowthRate = 1.5 (how fast difficulty increases)
 * @param level The current level
 * @returns The XP required to reach the next level
 */
export const calculateExpToNextLevel = (level: number) => Math.floor(100 * Math.pow(1.5, level - 1));

export const getExpForDifficulty = (difficulty: Difficulty): number => {
  const rewards = {
    easy: 15,
    medium: 30,
    hard: 60,
    normal: 30,
    boss: 100
  };
  return rewards[difficulty as keyof typeof rewards] || 30;
};

/**
 * Applies an EXP modifier (such as from Shadow Fatigue or Curse)
 * @param baseExp The original EXP amount
 * @param modifier The modifier to apply (e.g., 0.75 for 75% EXP)
 * @returns The modified EXP amount, rounded down to nearest integer
 */
export const applyExpModifier = (baseExp: number, modifier: number): number => {
  return Math.floor(baseExp * modifier);
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
