import { StateCreator, StoreApi } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Mission, Rank } from '@/lib/types';
import { MongoDBService } from '../../services/mongodb-service';
import { toast } from '@/hooks/use-toast';
import { StoreState } from '../index'; // Assuming StoreState is now correctly exported from ../index

export interface MissionSlice {
  missions: Mission[];
  completedMissionHistory: Mission[];
  addMission: (title: string, description: string, expReward: number, rank?: Rank, day?: number, difficulty?: 'normal' | 'boss', count?: number, taskNames?: string[]) => Promise<Mission>;
  startMission: (id: string) => Promise<void>;
  updateMissionTasks: (id: string, completedTaskIndices: number[]) => Promise<void>;
  completeMission: (id: string) => Promise<void>;
  loadMissions: () => Promise<void>;
  hasCompletedMissionToday: () => boolean;
  hasCompletedMissionRecently: (hours: number) => boolean;
}

export const createMissionSlice = (dbService: MongoDBService) => (
  set: (partial: MissionSlice | Partial<MissionSlice> | ((state: MissionSlice) => MissionSlice | Partial<MissionSlice>), replace?: boolean | undefined) => void,
  get: () => StoreState, 
  _store: StoreApi<StoreState>
) => ({
  missions: [],
  completedMissionHistory: [],

  loadMissions: async () => {
    try {
      const missionsFromDB = await dbService.getAllMissions();
      if (!Array.isArray(missionsFromDB)) {
        console.error('Failed to load missions: Expected an array, but received:', missionsFromDB);
        toast({
          title: "Error",
          description: "Failed to load missions data format error. Please try again.",
          variant: "destructive"
        });
        set({ missions: [], completedMissionHistory: [] });
        return;
      }

      const completedMissions = missionsFromDB.filter(m => m.completed);
      const activeMissions = missionsFromDB.filter(m => !m.completed);

      set({
        missions: activeMissions,
        completedMissionHistory: completedMissions
      });
    } catch (error) {
      console.error('Failed to load missions:', error);
      toast({
        title: "Error",
        description: "Failed to load missions. Please try again.",
        variant: "destructive"
      });
    }
  },

  addMission: async (title, description, expReward, rank = 'F', day = 1, difficulty = 'normal', count = 1, taskNames = []) => {
    const mission: Mission = {
      id: uuidv4(),
      title,
      description,
      completed: false,
      started: false,
      expReward,
      createdAt: new Date(),
      rank,
      day,
      difficulty,
      count,
      taskNames,
      completedTaskIndices: []
    };

    try {
      const savedMission = await dbService.createMission(mission);
      set((state: MissionSlice) => ({
        missions: [...state.missions, savedMission]
      }));
      return savedMission;
    } catch (error) {
      console.error('Failed to add mission:', error);
      toast({
        title: "Error",
        description: "Failed to create mission. Please try again.",
        variant: "destructive"
      });
      return mission;
    }
  },

  startMission: async (id) => {
    try {
      const updatedMission = await dbService.updateMission(id, { started: true });
      if (updatedMission) {
        set((state: MissionSlice) => ({
          missions: state.missions.map(m => m.id === id ? updatedMission : m)
        }));

        toast({
          title: "Mission Started!",
          description: `You've started the mission "${updatedMission.title}"`,
        });
      }
    } catch (error) {
      console.error('Failed to start mission:', error);
      toast({
        title: "Error",
        description: "Failed to start mission. Please try again.",
        variant: "destructive"
      });
    }
  },

  updateMissionTasks: async (id, completedTaskIndices) => {
    try {
      const updatedMission = await dbService.updateMission(id, { completedTaskIndices });
      if (updatedMission) {
        set((state: MissionSlice) => ({
          missions: state.missions.map(m => m.id === id ? updatedMission : m)
        }));
      }
    } catch (error) {
      console.error('Failed to update mission tasks:', error);
      toast({
        title: "Error",
        description: "Failed to update mission tasks. Please try again.",
        variant: "destructive"
      });
    }
  },

  completeMission: async (id) => {
    try {
      const { missions, addExp } = get();
      const mission = missions.find(m => m.id === id);
      
      if (!mission || mission.completed) return;

      const updatedMission = await dbService.updateMission(id, {
        completed: true,
        completedAt: new Date()
      });

      if (updatedMission) {
        set((state: MissionSlice) => ({
          missions: state.missions.filter(m => m.id !== id),
          completedMissionHistory: [...state.completedMissionHistory, updatedMission]
        }));

        // Award EXP for mission completion
        addExp(mission.expReward);

        toast({
          title: "Mission Completed!",
          description: `You earned ${mission.expReward} EXP for completing "${mission.title}"`,
        });
      }
    } catch (error) {
      console.error('Failed to complete mission:', error);
      toast({
        title: "Error",
        description: "Failed to complete mission. Please try again.",
        variant: "destructive"
      });
    }
  },

  hasCompletedMissionToday: () => {
    const { completedMissionHistory } = get();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return completedMissionHistory.some((mission: Mission) => {
      const completedDate = new Date(mission.completedAt as Date);
      completedDate.setHours(0, 0, 0, 0);
      return completedDate.getTime() === today.getTime();
    });
  },

  hasCompletedMissionRecently: (hours: number) => {
    const { completedMissionHistory } = get();
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hours);
    
    return completedMissionHistory.some((mission: Mission) => {
      return new Date(mission.completedAt as Date) > cutoff;
    });
  }
});
