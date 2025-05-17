import { StateCreator } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { MongoDBService } from '../../services/mongodb-service';

export interface Mission {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  started: boolean;
  expReward: number;
  createdAt: Date;
  rank: string;
  day: number;
  difficulty: string;
  count: number;
  taskNames: string[];
  completedTaskIndices: number[];
  completedAt?: Date;
}

export interface MissionSlice {
  missions: Mission[];
  completedMissionHistory: Mission[];
  addMission: (title: string, description: string, expReward: number, rank?: string, day?: number, difficulty?: string, count?: number, taskNames?: string[]) => Promise<void>;
  startMission: (id: string) => Promise<void>;
  updateMissionTasks: (id: string, completedTaskIndices: number[]) => Promise<void>;
  completeMission: (id: string) => Promise<void>;
  loadMissions: () => Promise<void>;
  hasCompletedMissionToday: () => boolean;
}

export const createMissionSlice = (
  dbService: MongoDBService
): StateCreator<MissionSlice, [], [], MissionSlice> => 
  (set, get) => ({
    missions: [],
    completedMissionHistory: [],

    loadMissions: async () => {
      try {
        const missions = await dbService.getAllMissions();
        
        if (!Array.isArray(missions)) {
          console.error('Invalid missions data received:', missions);
          return;
        }
        
        const completedMissions = missions.filter(m => m.completed);
        const activeMissions = missions.filter(m => !m.completed);

        set({
          missions: activeMissions,
          completedMissionHistory: completedMissions
        });
      } catch (error) {
        console.error('Failed to load missions:', error);
      }
    },

    addMission: async (title, description, expReward, rank = 'F', day = 1, difficulty = 'normal', count = 1, taskNames = []) => {
      try {
        const mission: Omit<Mission, 'id'> = {
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

        const savedMission = await dbService.createMission(mission);
        
        set((state) => ({
          missions: [...state.missions, savedMission]
        }));
      } catch (error) {
        console.error('Failed to add mission:', error);
      }
    },

    startMission: async (id) => {
      try {
        const updatedMission = await dbService.updateMission(id, { started: true });
        
        if (updatedMission) {
          set((state) => ({
            missions: state.missions.map(m => m.id === id ? updatedMission : m)
          }));
        }
      } catch (error) {
        console.error('Failed to start mission:', error);
      }
    },

    updateMissionTasks: async (id, completedTaskIndices) => {
      try {
        const updatedMission = await dbService.updateMission(id, { completedTaskIndices });
        
        if (updatedMission) {
          set((state) => ({
            missions: state.missions.map(m => m.id === id ? updatedMission : m)
          }));
        }
      } catch (error) {
        console.error('Failed to update mission tasks:', error);
      }
    },

    completeMission: async (id) => {
      try {
        const updatedMission = await dbService.updateMission(id, {
          completed: true,
          completedAt: new Date()
        });

        if (updatedMission) {
          set((state) => ({
            missions: state.missions.filter(m => m.id !== id),
            completedMissionHistory: [...state.completedMissionHistory, updatedMission]
          }));
        }
      } catch (error) {
        console.error('Failed to complete mission:', error);
      }
    },

    hasCompletedMissionToday: () => {
      const { completedMissionHistory } = get();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return completedMissionHistory.some((mission) => {
        if (!mission.completedAt) return false;
        const completedDate = new Date(mission.completedAt);
        completedDate.setHours(0, 0, 0, 0);
        return completedDate.getTime() === today.getTime();
      });
    }
  }); 