import { StateCreator } from 'zustand';
import { Task, Difficulty, DailyWinCategory, Stat } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { getExpForDifficulty, calculateExpToNextLevel, calculateRank } from '../../utils/calculations';
import { UserSlice } from './user-slice';
import { toast } from '@/hooks/use-toast';

export interface TaskSlice {
  tasks: Task[];
  createTask: (title: string, description: string, difficulty: Difficulty, category: DailyWinCategory) => void;
  addTask: (task: Task) => void;
  completeTask: (taskId: string) => void;
  deleteTask: (id: string) => void;
}

// Helper to map daily win categories to attribute stats
const categoryToStat = (category: DailyWinCategory): Stat => {
  switch(category) {
    case 'mental': return 'emotional';
    case 'physical': return 'physical';
    case 'spiritual': return 'spiritual';
    case 'intelligence': return 'cognitive';
    default: return 'emotional';
  }
};

// Helper to map attribute categories back to daily win categories
const attributeToDailyWin = (attributeCategory: string): DailyWinCategory | null => {
  switch(attributeCategory) {
    case 'physical': return 'physical';
    case 'cognitive': return 'intelligence';
    case 'emotional': return 'mental';
    case 'spiritual': return 'spiritual';
    case 'social': return 'mental'; // Default social to mental
    default: return null;
  }
};

export const createTaskSlice: StateCreator<
  TaskSlice & UserSlice,
  [],
  [],
  TaskSlice
> = (set, get) => ({
  tasks: [],
  createTask: (title, description, difficulty, category) => {
    const task: Task = {
      id: uuidv4(),
      title,
      description,
      completed: false,
      difficulty,
      expReward: getExpForDifficulty(difficulty),
      category,
      createdAt: new Date(),
    };
    get().addTask(task);
  },
  addTask: (task) => {
    set((state) => ({
      tasks: [...state.tasks, task],
    }));
  },
  completeTask: (taskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, completed: true, completedAt: new Date() } : t
      ),
    }));

    // Show completion toast
    toast({
      title: "Task Completed!",
      description: `${task.title} has been marked as complete.`,
      variant: "default",
      duration: 1000 // 1 second
    });

    // Determine if this is a daily win category or an attribute category
    const dailyWinCategories = ['mental', 'physical', 'spiritual', 'intelligence'];
    let dailyWinCategory: DailyWinCategory;
    let attributeStat: Stat;
    
    if (dailyWinCategories.includes(task.category)) {
      // It's a standard daily win category
      dailyWinCategory = task.category as DailyWinCategory;
      attributeStat = categoryToStat(dailyWinCategory);
    } else {
      // It's an attribute category, map it back to a daily win
      const mappedDailyWin = attributeToDailyWin(task.category);
      if (mappedDailyWin) {
        dailyWinCategory = mappedDailyWin;
        attributeStat = task.category as Stat;
      } else {
        // Default fallback if no mapping exists
        dailyWinCategory = 'mental';
        attributeStat = 'emotional';
      }
    }

    // Update daily win progress for the appropriate category
    get().updateDailyWin(dailyWinCategory, taskId);

    // Update experience points
    get().addExp(task.expReward);
    
    // Add EXP to the corresponding attribute
    get().addStatExp(attributeStat, 5);
  },
  deleteTask: (id) => {
    set((state: TaskSlice) => ({
      tasks: state.tasks.filter(task => task.id !== id)
    }));
  },
});
