import { Quest, Task, DailyWinCategory, Difficulty } from '@/lib/types';

/**
 * Empty quests database file
 * 
 * This file is a placeholder for the original quests-database.ts that was deleted.
 * It provides empty arrays for mainQuests, sideQuests, and allQuests to prevent errors.
 */

// Export empty arrays
export const mainQuests: Quest[] = [];
export const sideQuests: Quest[] = [];
export const allQuests: Quest[] = [];

/**
 * Get all main quests
 */
export function getMainQuests(): Quest[] {
  return mainQuests;
}

/**
 * Get all side quests
 */
export function getSideQuests(): Quest[] {
  return sideQuests;
}

/**
 * Get a specific quest by ID
 */
export function getQuestById(id: string): Quest | undefined {
  return undefined;
}

/**
 * Get quests by category
 */
export function getQuestsByCategory(category: DailyWinCategory): Quest[] {
  return [];
}

/**
 * Get quests by difficulty
 */
export function getQuestsByDifficulty(difficulty: Difficulty): Quest[] {
  return [];
}
