import { StateCreator } from 'zustand';
import { Mission, Stat } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { calculateExpToNextLevel, calculateRank } from '../../utils/calculations';
import { toast } from '@/hooks/use-toast';
import { addCompletedMission, getCompletedMissions, deleteMission } from '@/lib/db';

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
  addMission: (title: string, description: string, expReward: number) => void;
  completeMission: (id: string) => Promise<void>;
  getMissionsByDay: (date: Date) => CompletedMission[];
  loadCompletedMissions: () => Promise<void>;
}

export const createMissionSlice: StateCreator<MissionSlice & any> = (set, get) => ({
  missions: [],
  completedMissionIds: [],
  completedMissionHistory: [],

  addMission: (title, description, expReward) => {
    set((state: MissionSlice) => ({
      missions: [
        ...state.missions,
        {
          id: uuidv4(),
          title,
          description,
          completed: false,
          expReward,
          createdAt: new Date()
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

    // First mark the mission as completed
    const updatedMission = {
      ...mission,
      completed: true,
      completedAt: new Date()
    };

    // Create completed mission object
    const completedMission: CompletedMission = {
      id: mission.id,
      title: mission.title,
      description: mission.description,
      expReward: mission.expReward,
      rank: mission.rank,
      day: mission.day,
      completedAt: new Date(),
      expEarned: mission.expReward,
    };

    try {
      console.log("Starting mission completion for:", mission.title);
      
      // Save to completedMissions and remove from missions (DB)
      await addCompletedMission(completedMission);
      await deleteMission(mission.id);

      // Update in-memory state with immediate change
      set((state: any) => {
        console.log("Current user state:", state.user);
        
        // Remove from pending missions
        const updatedMissions = state.missions.filter((m: Mission) => m.id !== id);
        
        // Add to completed history and IDs
        const updatedCompletedMissionIds = [...state.completedMissionIds, mission.id];
        const updatedCompletedMissionHistory = [...state.completedMissionHistory, completedMission];

        // Update user exp/gold/level directly
        const currentExp = state.user.exp || 0;
        const currentLevel = state.user.level || 1;
        const currentExpToNextLevel = state.user.expToNextLevel || 100;
        
        let exp = currentExp + mission.expReward;
        let level = currentLevel;
        let expToNextLevel = currentExpToNextLevel;
        const goldReward = Math.floor(mission.expReward / 5) * 2;
        let leveledUp = false;

        // Level up if enough exp
        while (exp >= expToNextLevel) {
          level++;
          exp -= expToNextLevel;
          expToNextLevel = calculateExpToNextLevel(level);
          leveledUp = true;
        }

        console.log("New exp state:", { 
          oldExp: currentExp, 
          newExp: exp, 
          oldLevel: currentLevel, 
          newLevel: level, 
          reward: mission.expReward 
        });

        // Show notifications
        toast({
          title: "Mission Completed!",
          description: `You earned ${mission.expReward} EXP and ${goldReward} Gold`,
          variant: "default"
        });

        if (leveledUp) {
          setTimeout(() => {
            toast({
              title: "Level Up!",
              description: `You reached level ${level}!`,
              variant: "default"
            });
          }, 500);
        }

        // Add attribute experience
        setTimeout(() => {
          ['physical', 'cognitive', 'emotional', 'spiritual', 'social'].forEach(stat => {
            get().addStatExp(stat as Stat, 7);
          });
          toast({
            title: `+7 EXP to All Attributes`,
            description: `You gained experience for completing a mission!`,
            variant: "default"
          });
        }, 1000);

        // Return updated state with a timestamp to force re-render
        return {
          missions: updatedMissions,
          completedMissionIds: updatedCompletedMissionIds,
          completedMissionHistory: updatedCompletedMissionHistory,
          user: {
            ...state.user,
            exp,
            level,
            expToNextLevel,
            gold: state.user.gold + goldReward,
            rank: calculateRank(level),
            lastUpdate: Date.now() // Add timestamp to force re-render
          }
        };
      });

      // Force a second update to ensure UI refresh
      setTimeout(() => {
        set((state: any) => ({
          user: {
            ...state.user,
            lastUpdate: Date.now()
          }
        }));
      }, 100);
      
      console.log("Mission completion finished");
    } catch (error) {
      console.error('Error completing mission:', error);
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
    const completedMissions = await getCompletedMissions();
    set((state: any) => ({
      completedMissionHistory: completedMissions,
      completedMissionIds: completedMissions.map(m => m.id)
    }));
  }
});
