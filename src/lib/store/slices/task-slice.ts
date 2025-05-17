import { StateCreator } from 'zustand';

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
  category?: string;
}

export interface TaskSlice {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'completed'>) => void;
  completeTask: (id: string) => void;
  deleteTask: (id: string) => void;
}

export const createTaskSlice: StateCreator<TaskSlice, [], [], TaskSlice> = (set) => ({
  tasks: [],
  
  addTask: (taskData) => {
    const task: Task = {
      id: crypto.randomUUID(),
      title: taskData.title,
      description: taskData.description || '',
      completed: false,
      createdAt: new Date(),
      category: taskData.category
    };
    
    set((state) => ({
      tasks: [...state.tasks, task]
    }));
  },
  
  completeTask: (id) => {
    set((state) => ({
      tasks: state.tasks.map(task => 
        task.id === id ? { ...task, completed: true, completedAt: new Date() } : task
      )
    }));
  },
  
  deleteTask: (id) => {
    set((state) => ({
      tasks: state.tasks.filter(task => task.id !== id)
    }));
  }
}); 