import { StateCreator } from 'zustand';
import { Mission, Stat } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { calculateExpToNextLevel, calculateRank } from '../../utils/calculations';
import { toast } from '@/hooks/use-toast';

export interface CompletedMission {
  id: string;
  title: string;
  description: string;
  expReward: number;
  rank: string;
  day: number;
  completedAt: Date;
  expEarned: number;
}

export interface MissionSlice {
  missions: Mission[];
  completedMissionIds: string[]; // Store just the IDs of completed missions
  completedMissionHistory: CompletedMission[]; // Store completion history with dates
  addMission: (title: string, description: string, expReward: number, rank?: string, day?: number, difficulty?: string) => void;
  completeMission: (id: string) => Promise<void>;
  getMissionsByDay: (date: Date) => CompletedMission[];
  loadCompletedMissions: () => Promise<void>;
}

export const createMissionSlice: StateCreator<MissionSlice & any> = (set, get) => ({
  missions: [],
  completedMissionIds: [],
  completedMissionHistory: [],

  addMission: (title, description, expReward, rank = 'F', day = 1, difficulty = 'normal') => {
    set((state: MissionSlice) => ({
      missions: [
        ...state.missions,
        {
          id: uuidv4(),
          title,
          description,
          completed: false,
          expReward,
          createdAt: new Date(),
          rank,
          day,
          releaseDate: new Date(),
          difficulty
        }
      ]
    }));
  },

  completeMission: async (id) => {
    const state = get();
    const mission = state.missions.find((m: Mission) => m.id === id);
    if (!mission || mission.completed) {
      console.log("Mission not found or already completed", id);
      return;
    }

    // Get experience modifier from punishment system
    const expModifier = state.getExpModifier();
    
    // Calculate final exp with modifier
    const finalExpReward = Math.floor(mission.expReward * expModifier);

    // Create completed mission object with modified EXP
    const completedMission: CompletedMission = {
      id: mission.id,
      title: mission.title,
      description: mission.description,
      expReward: mission.expReward,
      rank: (mission as any).rank || 'F',
      day: (mission as any).day || 1,
      completedAt: new Date(),
      expEarned: finalExpReward, // Store the actual exp earned
    };

    try {
      // Check if the mission is overdue (should have a releaseDate property)
      let missedDeadline = false;
      const now = new Date();
      
      // TODO: Implement proper deadline checking if missions have deadline dates
      // For now, let's consider a mission overdue if it's from a previous day
      if (mission.releaseDate) {
        const releaseDate = new Date(mission.releaseDate);
        const releaseDateDay = releaseDate.setHours(0,0,0,0);
        const today = now.setHours(0,0,0,0);
        
        if (releaseDateDay < today) {
          missedDeadline = true;
          
          // Apply the missed deadline penalty
          const { applyMissedDeadlinePenalty } = get();
          applyMissedDeadlinePenalty('mission', id);
        }
      }

      // Update in-memory state with immediate change
      set((state: any) => {
        // Instead of removing, update the mission to mark it as completed
        const updatedMissions = state.missions.map((m: Mission) => 
          m.id === id ? { 
            ...m, 
            completed: true, 
            completedAt: new Date(),
            missed: missedDeadline
          } : m
        );
        
        // Add to completed history and IDs
        const updatedCompletedMissionIds = [...state.completedMissionIds, mission.id];
        const updatedCompletedMissionHistory = [...state.completedMissionHistory, completedMission];

        return {
          missions: updatedMissions,
          completedMissionIds: updatedCompletedMissionIds,
          completedMissionHistory: updatedCompletedMissionHistory
        };
      });

      // Add experience points with the modifier applied
      state.addExp(finalExpReward);
      
      // Calculate gold
      const goldReward = Math.floor(finalExpReward / 5) * 2;
      state.addGold(goldReward);
      
      // Set notification message based on status
      let title = "Mission Completed!";
      let description = `You earned ${finalExpReward} EXP and ${goldReward} Gold`;
      
      if (expModifier < 1) {
        description += ` (${Math.round(expModifier * 100)}% rate due to penalty)`;
      }
      
      if (missedDeadline) {
        title = "Mission Completed Late";
        description += " (Deadline missed)";
      }
      
      toast({
        title,
        description,
        variant: missedDeadline ? "destructive" : "default"
      });
      
    } catch (error) {
      console.error("Error completing mission:", error);
      toast({
        title: "Error",
        description: "Failed to complete mission. Please try again.",
        variant: "destructive"
      });
    }
  },

  getMissionsByDay: (date: Date) => {
    const { completedMissionHistory } = get();
    return completedMissionHistory.filter((mission) => {
      const missionDate = new Date(mission.completedAt);
      return (
        missionDate.getDate() === date.getDate() &&
        missionDate.getMonth() === date.getMonth() &&
        missionDate.getFullYear() === date.getFullYear()
      );
    });
  },

  loadCompletedMissions: async () => {
    // No need to load from a separate store anymore as everything is in the Zustand store
    // This function is kept for backward compatibility but doesn't need to do anything
    // If needed, you could implement migration from old database format here
    console.log("loadCompletedMissions called - no action needed as missions are now stored in the Zustand store");
  }
});
