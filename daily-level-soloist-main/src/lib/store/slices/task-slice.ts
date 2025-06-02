import { StateCreator } from 'zustand';
import { Task, Difficulty, DailyWinCategory, Stat } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { getExpForDifficulty } from '../../utils/calculations';
import { UserSlice } from './user-slice';
import { toast } from '@/hooks/use-toast';
import { getRankExpBonus } from '../../utils/calculations';

export interface TaskSlice {
  tasks: Task[];
  createTask: (title: string, description: string, difficulty: Difficulty, category: DailyWinCategory, deadline?: Date) => void;
  addTask: (task: Task) => void;
  completeTask: (taskId: string) => void;
  deleteTask: (id: string) => void;
  markTaskAsMissed: (id: string) => void;
  getExpModifier: () => number;
  applyMissedDeadlinePenalty: (itemType: string, itemId: string) => void;
  // Performance optimized selectors
  getTasksForDate: (date: Date) => Task[];
  getCompletedTasksForDate: (date: Date) => Task[];
  getIncompleteTasksForDate: (date: Date) => Task[];
}

export const createTaskSlice: StateCreator<
  TaskSlice & UserSlice,
  [],
  [],
  TaskSlice
> = (set, get) => ({
  tasks: [],
  createTask: (title, description, difficulty, category, deadline) => {
    const today = new Date();
    const task: Task = {
      id: uuidv4(),
      title,
      description,
      completed: false,
      difficulty,
      expReward: getExpForDifficulty(difficulty),
      category,
      createdAt: today,
      scheduledFor: today, // Always schedule for today when created from home page
      deadline
    };
    get().addTask(task);
  },
  addTask: (task) => {
    set((state) => ({
      tasks: [...state.tasks, task],
    }));
  },
  completeTask: (id) => {
    const { tasks, addExp, addStatExp, updateDailyWin, getExpModifier, user } = get();
    const task = tasks.find(t => t.id === id);

    if (!task || task.completed) return;

    // Check if deadline has passed (automatically apply missed deadline penalty)
    if (task.deadline && new Date(task.deadline) < new Date()) {
      // Task was completed after deadline passed
      const { markTaskAsMissed } = get();
      markTaskAsMissed(task.id);
      return;
    }

    // Get experience modifier from punishment system
    const expModifier = getExpModifier();
    
    // Get rank-based EXP bonus
    const rankBonus = getRankExpBonus(user.rank);

    // Calculate final exp with both modifiers
    const finalExpReward = Math.floor(task.expReward * expModifier * rankBonus);

    // Update task status
    set((state: TaskSlice) => ({
      tasks: state.tasks.map(t =>
        t.id === id ? { ...t, completed: true, completedAt: new Date() } : t
      )
    }));

    // Add experience points with modifiers applied
    addExp(finalExpReward);

    // Add stat experience
    let stat: Stat;
    switch (task.category) {
      case 'mental':
        stat = 'emotional';
        break;
      case 'physical':
        stat = 'physical';
        break;
      case 'spiritual':
        stat = 'spiritual';
        break;
      case 'intelligence':
        stat = 'cognitive';
        break;
      default:
        stat = 'emotional';
    }
    addStatExp(stat, Math.floor(finalExpReward / 2));

    // Update daily win progress
    updateDailyWin(task.category, task.id);

    // Show notification with exp modifier info if applicable
    if (expModifier < 1) {
      toast({
        title: `${task.title} Completed!`,
        description: `You earned ${finalExpReward} EXP (${Math.round(expModifier * 100)}% rate due to penalty)`,
      });
    } else {
      toast({
        title: `${task.title} Completed!`,
        description: `You earned ${finalExpReward} EXP`,
      });
    }
  },
  deleteTask: (id) => {
    set((state: TaskSlice) => ({
      tasks: state.tasks.filter(task => task.id !== id)
    }));
  },
  markTaskAsMissed: (id) => {
    const { tasks, applyMissedDeadlinePenalty } = get();
    const task = tasks.find(t => t.id === id);

    if (!task || task.completed) return;

    // Apply the missed deadline penalty through the punishment system
    applyMissedDeadlinePenalty('task', id);

    // Mark the task as completed but with a miss flag
    set((state: TaskSlice) => ({
      tasks: state.tasks.map(t =>
        t.id === id ? {
          ...t,
          completed: true,
          completedAt: new Date(),
          missed: true // Add a flag to indicate it was missed
        } : t
      )
    }));

    toast({
      title: "Task Marked as Missed",
      description: "The task has been marked as missed and penalties applied.",
      variant: "destructive"
    });
  },
  getExpModifier: () => {
    // This will be overridden by the punishment-slice implementation
    return 1;
  },
  applyMissedDeadlinePenalty: (itemType: string, itemId: string) => {
    // This will be overridden by the punishment-slice implementation
    console.log(`Missed deadline for ${itemType} ${itemId}`);
  },
  // Performance optimized selectors with memoization
  getTasksForDate: (date: Date) => {
    const { tasks } = get();
    return tasks.filter(task => {
      const taskDate = task.scheduledFor ?
        new Date(task.scheduledFor) :
        new Date(task.createdAt);
      return taskDate.toDateString() === date.toDateString();
    });
  },
  getCompletedTasksForDate: (date: Date) => {
    const { tasks } = get();
    return tasks.filter(task => {
      if (!task.completed || !task.completedAt) return false;
      const completedDate = new Date(task.completedAt);
      return completedDate.toDateString() === date.toDateString();
    });
  },
  getIncompleteTasksForDate: (date: Date) => {
    const { tasks } = get();
    return tasks.filter(task => {
      if (task.completed) return false;
      const taskDate = task.scheduledFor ?
        new Date(task.scheduledFor) :
        new Date(task.createdAt);
      return taskDate.toDateString() === date.toDateString();
    });
  }
});
