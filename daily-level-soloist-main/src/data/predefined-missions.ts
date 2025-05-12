import { Rank } from '@/lib/types';

// Interface for predefined missions with scheduled release dates
export interface PredefinedMission {
  id: string;
  title: string;
  description: string;
  expReward: number;
  rank: Rank; // Required rank to see this mission
  day: number; // Day number for the mission
  releaseDate: Date; // Date when the mission becomes available
  expiryDate?: Date; // Optional: Date when the mission expires (null for permanent missions)
  isHidden?: boolean; // Whether to hide this mission until its release date
  isSpecial?: boolean; // For special event missions or featured missions
  requiredTasks?: string[]; // IDs of tasks that must be completed before this mission is available
  completed?: boolean; // Whether the mission has been completed
}

/**
 * Predefined Missions
 * 
 * Missions are now hardcoded here for offline/local use
 */
export const predefinedMissions: PredefinedMission[] = [
  // Example static missions
  // { id: '1', title: 'First Mission', description: 'Complete your first mission!', rank: 'F', day: 1, expReward: 10 },
];

/**
 * Get available missions for a user based on their rank and the current date
 */
export async function getAvailableMissions(userRank: Rank, day?: number): Promise<PredefinedMission[]> {
  // Filter local missions by rank and day
  if (day !== undefined) {
    return predefinedMissions.filter(m => m.rank === userRank && m.day === day);
  } else {
    return predefinedMissions.filter(m => m.rank === userRank);
  }
}

/**
 * Get available missions for a specific day (all ranks)
 */
export async function getMissionsByDay(day: number): Promise<PredefinedMission[]> {
  return predefinedMissions.filter(m => m.day === day);
}

/**
 * Get upcoming missions that aren't available yet (for previews)
 */
export async function getUpcomingMissions(userRank: Rank, currentDate: Date = new Date()): Promise<PredefinedMission[]> {
  // Filter for missions that are for a higher rank than the user's current rank
  const rankOrder: Rank[] = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
  const userRankIndex = rankOrder.indexOf(userRank);
  return predefinedMissions.filter(mission => {
    const missionRankIndex = rankOrder.indexOf(mission.rank);
    return missionRankIndex > userRankIndex;
  });
} 