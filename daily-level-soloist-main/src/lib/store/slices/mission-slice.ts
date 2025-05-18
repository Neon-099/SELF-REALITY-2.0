import { StateCreator } from 'zustand';
import { Mission, Rank } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { differenceInDays, differenceInHours, addDays } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { getDB } from '../../db';

export interface MissionSlice {
  missions: Mission[];
  completedMissionHistory: Mission[];
  addMission: (title: string, description: string, expReward: number, rank?: Rank, day?: number, difficulty?: 'normal' | 'boss', count?: number, taskNames?: string[]) => void;
  completeMission: (id: string) => Promise<void>;
  startMission: (id: string) => Promise<void>;
  updateMissionTasks: (id: string, completedTaskIndices: number[]) => Promise<void>;
  hasCompletedMissionToday: () => boolean;
  hasCompletedMissionRecently: (hours: number) => boolean;
  getAvailableMissions: () => Mission[];
  getNextMissionRelease: () => Date | null;
  calculateMissionsCompleted: () => { today: number, total: number };
  getMissionStats: () => { completed: number, streak: number, total: number };
}

export const createMissionSlice: StateCreator<MissionSlice & any> = (set, get) => ({
  missions: [],
  completedMissionHistory: [],
  
  addMission: (title: string, description: string, expReward: number, rank: Rank = 'F', day: number = 1, difficulty: 'normal' | 'boss' = 'normal', count: number = 1, taskNames: string[] = []) => {
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
    
    set((state: MissionSlice) => ({
      missions: [...state.missions, mission]
    }));
    
    return mission;
  },
  
  startMission: async (id: string) => {
    const { missions } = get();
    const mission = missions.find((m: Mission) => m.id === id);
    
    if (!mission || mission.completed || mission.started) return;
    
    const updatedMissions = missions.map((m: Mission) => 
      m.id === id ? { ...m, started: true } : m
    );
    
    set((state: MissionSlice) => ({
      missions: updatedMissions
    }));
    
    toast({
      title: "Mission Started!",
      description: `You've started the mission "${mission.title}"`,
    });
    
    // Try to also save to IndexedDB for extra persistence
    try {
      const db = await getDB();
      await db.put('store', { ...mission, started: true }, `mission_${mission.id}`);
    } catch (error) {
      console.error('Error saving started mission to IndexedDB:', error);
    }
  },
  
  updateMissionTasks: async (id: string, completedTaskIndices: number[]) => {
    const { missions } = get();
    const mission = missions.find((m: Mission) => m.id === id);
    
    if (!mission || mission.completed) return;
    
    const isAllTasksCompleted = mission.count && completedTaskIndices.length >= mission.count;
    
    const updatedMissions = missions.map((m: Mission) => 
      m.id === id ? { 
        ...m, 
        completedTaskIndices,
        completed: isAllTasksCompleted,
        completedAt: isAllTasksCompleted ? new Date() : undefined
      } : m
    );
    
    set((state: MissionSlice) => ({
      missions: updatedMissions
    }));
    
    // If all tasks are completed, add to completed history and award exp
    if (isAllTasksCompleted) {
      const { addExp } = get();
      const completedMission = { ...mission, completed: true, completedAt: new Date(), completedTaskIndices };
      
      set((state: MissionSlice) => ({
        completedMissionHistory: [...state.completedMissionHistory, completedMission]
      }));
      
      // Award EXP for mission completion
      addExp(mission.expReward);
      
      // Show toast
      toast({
        title: "Mission Completed!",
        description: `You earned ${mission.expReward} EXP for completing "${mission.title}"`,
      });
      
      // Try to also save to IndexedDB for extra persistence
      try {
        const db = await getDB();
        await db.put('store', completedMission, `mission_${completedMission.id}`);
      } catch (error) {
        console.error('Error saving completed mission to IndexedDB:', error);
      }
    } else {
      // Try to also save to IndexedDB for extra persistence
      try {
        const db = await getDB();
        await db.put('store', { ...mission, completedTaskIndices }, `mission_${mission.id}`);
      } catch (error) {
        console.error('Error saving mission task updates to IndexedDB:', error);
      }
    }
  },
  
  completeMission: async (id: string) => {
    const { missions, addExp } = get();
    const mission = missions.find((m: Mission) => m.id === id);
    
    if (!mission || mission.completed) return;
    
    const updatedMissions = missions.map((m: Mission) => 
      m.id === id ? { ...m, completed: true, completedAt: new Date() } : m
    );
    
    // Add to completed history
    const completedMission = { ...mission, completed: true, completedAt: new Date() };
    
    set((state: MissionSlice) => ({
      missions: updatedMissions,
      completedMissionHistory: [...state.completedMissionHistory, completedMission]
    }));
    
    // Award EXP for mission completion
    addExp(mission.expReward);
    
    // Show toast
    toast({
      title: "Mission Completed!",
      description: `You earned ${mission.expReward} EXP for completing "${mission.title}"`,
    });
    
    // Try to also save to IndexedDB for extra persistence
    try {
      const db = await getDB();
      await db.put('store', completedMission, `mission_${completedMission.id}`);
    } catch (error) {
      console.error('Error saving completed mission to IndexedDB:', error);
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
  },
  
  getAvailableMissions: () => {
    const { missions } = get();
    return missions.filter((mission: Mission) => !mission.completed);
  },
  
  getNextMissionRelease: () => {
    const { completedMissionHistory } = get();
    
    if (completedMissionHistory.length === 0) {
      return null;
    }
    
    // Find the most recently completed mission
    const sortedHistory = [...completedMissionHistory].sort((a, b) => {
      return new Date(b.completedAt as Date).getTime() - new Date(a.completedAt as Date).getTime();
    });
    
    // Get the completion time of the most recent mission
    const lastCompletion = new Date(sortedHistory[0].completedAt as Date);
    
    // Add 24 hours to the completion time
    const nextRelease = new Date(lastCompletion);
    nextRelease.setHours(nextRelease.getHours() + 24);
    
    return nextRelease;
  },
  
  calculateMissionsCompleted: () => {
    const { completedMissionHistory } = get();
    
    // Filter for missions completed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const completedToday = completedMissionHistory.filter((mission: Mission) => {
      const completedDate = new Date(mission.completedAt as Date);
      completedDate.setHours(0, 0, 0, 0);
      return completedDate.getTime() === today.getTime();
    });
    
    return {
      today: completedToday.length,
      total: completedMissionHistory.length
    };
  },
  
  getMissionStats: () => {
    const { completedMissionHistory } = get();
    
    // Calculate the streak
    let streak = 0;
    let today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if we have a mission completed today
    const hasCompletedToday = completedMissionHistory.filter((mission: Mission) => {
      const completedDate = new Date(mission.completedAt as Date);
      completedDate.setHours(0, 0, 0, 0);
      return completedDate.getTime() === today.getTime();
    }).length > 0;
    
    if (hasCompletedToday) {
      streak = 1;
      let checkDate = new Date(today);
      let keepGoing = true;
      
      while (keepGoing) {
        // Move back one day
        checkDate.setDate(checkDate.getDate() - 1);
        
        // Check if we have a mission completed on this day
        const completedOnThisDay = completedMissionHistory.filter((mission: Mission) => {
          const completedDate = new Date(mission.completedAt as Date);
          completedDate.setHours(0, 0, 0, 0);
          return completedDate.getTime() === checkDate.getTime();
        }).length > 0;
        
        if (completedOnThisDay) {
          streak++;
        } else {
          keepGoing = false;
        }
      }
    }
    
    return {
      completed: completedMissionHistory.length,
      streak,
      total: completedMissionHistory.length + get().missions.length
    };
  }
});
