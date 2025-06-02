import { Difficulty, Rank } from '../types';

/**
 * Calculates experience required to reach the next level using a piecewise function that increases EXP required per level
 * by simulating a quadratic curve in each tier.
 * 
 * EXP formula (Hard Scaling):
 * EXP(L) = {
 *   20L² if 1 ≤ L ≤ 30
 *   18(L−30)² + 18,000 if 31 ≤ L ≤ 60
 *   22(L−60)² + 45,000 if 61 ≤ L ≤ 90
 *   25(L−90)² + 90,000 if 91 ≤ L ≤ 120
 *   30(L−120)² + 180,000 if 121 ≤ L ≤ 150
 *   35(L−150)² + 315,000 if 151 ≤ L ≤ 180
 *   40(L−180)² + 495,000 if 181 ≤ L ≤ 270
 *   45(L−270)² + 720,000 if 271 ≤ L ≤ 365
 *   50(L−365)² + 990,000 if 366 ≤ L
 * }
 * 
 * Players earn 1,000–2,000 EXP per day (average: 1,500 EXP/day).
 * Weekly boss fights grant bonus EXP (e.g., +3,000 EXP/week).
 * 
 * @param level The current level
 * @returns The XP required to reach the next level
 */
export const calculateExpToNextLevel = (level: number) => {
  if (level <= 30) {
    return Math.floor(20 * Math.pow(level, 2));
  } else if (level <= 60) {
    return Math.floor(18 * Math.pow(level - 30, 2) + 18000);
  } else if (level <= 90) {
    return Math.floor(22 * Math.pow(level - 60, 2) + 45000);
  } else if (level <= 120) {
    return Math.floor(25 * Math.pow(level - 90, 2) + 90000);
  } else if (level <= 150) {
    return Math.floor(30 * Math.pow(level - 120, 2) + 180000);
  } else if (level <= 180) {
    return Math.floor(35 * Math.pow(level - 150, 2) + 315000);
  } else if (level <= 270) {
    return Math.floor(40 * Math.pow(level - 180, 2) + 495000);
  } else if (level <= 365) {
    return Math.floor(45 * Math.pow(level - 270, 2) + 720000);
  } else {
    return Math.floor(50 * Math.pow(level - 365, 2) + 990000);
  }
};

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

/**
 * Calculates the rank based on the level using the updated rank brackets:
 * 
 * Rank Brackets & Durations:
 * F    1–30     (Levels 1-30)
 * E    31–60    (Levels 31-60)
 * D    61–90    (Levels 61-90)
 * C    91–120   (Levels 91-120)
 * B    121–150  (Levels 121-150)
 * A    151–180  (Levels 151-180)
 * S    181–270  (Levels 181-270)
 * SS   271–365  (Levels 271-365)
 * SSS  366–500+ (Levels 366+)
 */
export const calculateRank = (level: number): Rank => {
  if (level >= 366) return 'SSS';
  if (level >= 271) return 'SS';
  if (level >= 181) return 'S';
  if (level >= 151) return 'A';
  if (level >= 121) return 'B';
  if (level >= 91) return 'C';
  if (level >= 61) return 'D';
  if (level >= 31) return 'E';
  return 'F';
};

/**
 * Calculates the EXP bonus multiplier based on rank
 * @param rank The current rank
 * @returns The EXP bonus multiplier (e.g., 1.1 for 10% bonus)
 */
export const getRankExpBonus = (rank: Rank): number => {
  const bonusMultipliers: Record<Rank, number> = {
    'F': 1.0,    // No bonus
    'E': 1.1,    // 10% bonus
    'D': 1.2,    // 20% bonus
    'C': 1.3,    // 30% bonus
    'B': 1.4,    // 40% bonus
    'A': 1.5,    // 50% bonus
    'S': 1.6,    // 60% bonus
    'SS': 1.7,   // 70% bonus
    'SSS': 1.8   // 80% bonus
  };
  return bonusMultipliers[rank] || 1.0;
};
