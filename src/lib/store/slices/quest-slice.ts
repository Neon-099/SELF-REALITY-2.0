import { StateCreator } from 'zustand';
import { MongoDBService } from '../../services/mongodb-service';

export interface QuestTask {
  id?: string;
  description: string;
  title?: string;
  completed: boolean;
}

export interface Quest {
  id: string;
  isMainQuest: boolean;
  isDaily: boolean;
  title: string;
  description: string;
  completed: boolean;
  expReward: number;
  tasks: QuestTask[];
  started: boolean;
  createdAt: Date;
  deadline: Date | null;
  completedAt: Date | null;
  missed: boolean;
  isRecoveryQuest: boolean;
}

export interface QuestSlice {
  quests: Quest[];
  loadQuests: () => Promise<void>;
  addQuest: (quest: Omit<Quest, 'id'>) => Promise<void>;
  updateQuest: (id: string, updates: Partial<Quest>) => Promise<void>;
  deleteQuest: (id: string) => Promise<void>;
  completeQuestTask: (questId: string, taskId: string) => Promise<void>;
  addQuestTask: (questId: string, title: string, description?: string, category?: string, difficulty?: string, deadline?: Date) => Promise<void>;
}

// Some example quests to use if no quests exist
const sampleQuests: Omit<Quest, 'id'>[] = [
  {
    title: "Complete Your First Main Quest",
    description: "This is a tutorial quest to help you understand how main quests work. Start by completing the tasks below.",
    isMainQuest: true,
    isDaily: false,
    completed: false,
    expReward: 50,
    tasks: [
      { description: "Review the quest details", title: "Review quest", completed: false },
      { description: "Click the 'Start Quest' button", title: "Start quest", completed: false },
      { description: "Complete all tasks in the quest", title: "Complete tasks", completed: false }
    ],
    started: false,
    createdAt: new Date(),
    deadline: null,
    completedAt: null,
    missed: false,
    isRecoveryQuest: false
  },
  {
    title: "Daily Meditation",
    description: "Take 5 minutes to meditate and clear your mind. This is a daily quest that will help improve your mental focus.",
    isMainQuest: false,
    isDaily: true,
    completed: false,
    expReward: 15,
    tasks: [],
    started: false,
    createdAt: new Date(),
    deadline: new Date(new Date().setHours(23, 59, 59, 999)),
    completedAt: null,
    missed: false,
    isRecoveryQuest: false
  },
  {
    title: "Read a Chapter",
    description: "Read a chapter of your current book. This is a side quest that will help improve your knowledge.",
    isMainQuest: false,
    isDaily: false,
    completed: false,
    expReward: 20,
    tasks: [],
    started: false,
    createdAt: new Date(),
    deadline: null,
    completedAt: null,
    missed: false,
    isRecoveryQuest: false
  }
];

export const createQuestSlice = (
  dbService: MongoDBService
) => (set, get, _store) => ({
    quests: [],
    
    loadQuests: async () => {
      try {
        const quests = await dbService.getAllQuests();
        if (!Array.isArray(quests)) {
          console.error('Invalid quests data received:', quests);
          return;
        }

        // Set quests in the store
        set({ quests });

        // If there are no quests, create some sample quests
        if (quests.length === 0) {
          console.log('No quests found, creating sample quests');
          await Promise.all(sampleQuests.map(quest => get().addQuest(quest)));
          
          // Reload quests after creating samples
          const updatedQuests = await dbService.getAllQuests();
          if (Array.isArray(updatedQuests)) {
            set({ quests: updatedQuests });
          }
        }
      } catch (error) {
        console.error('Failed to load quests:', error);
        // Don't update state if there's an error
      }
    },

    addQuest: async (quest) => {
      try {
        const savedQuest = await dbService.createQuest(quest);
        set((state) => ({
          quests: [...state.quests, savedQuest]
        }));
      } catch (error) {
        console.error('Failed to add quest:', error);
      }
    },

    updateQuest: async (id, updates) => {
      try {
        const updatedQuest = await dbService.updateQuest(id, updates);
        if (updatedQuest) {
          set((state) => ({
            quests: state.quests.map(q => q.id === id ? updatedQuest : q)
          }));
        }
      } catch (error) {
        console.error('Failed to update quest:', error);
      }
    },

    deleteQuest: async (id) => {
      try {
        await dbService.deleteQuest(id);
        set((state) => ({
          quests: state.quests.filter(q => q.id !== id)
        }));
      } catch (error) {
        console.error('Failed to delete quest:', error);
      }
    },

    completeQuestTask: async (questId, taskId) => {
      try {
        const { quests } = get();
        const quest = quests.find(q => q.id === questId);
        
        if (!quest) {
          console.error('Quest not found:', questId);
          return;
        }
        
        const updatedTasks = quest.tasks.map(task => 
          (task.id === taskId || task.title === taskId) 
            ? { ...task, completed: true } 
            : task
        );
        
        await get().updateQuest(questId, { tasks: updatedTasks });
      } catch (error) {
        console.error('Failed to complete quest task:', error);
      }
    },

    addQuestTask: async (questId, title, description = '', category = '', difficulty = 'normal', deadline) => {
      try {
        const { quests } = get();
        const quest = quests.find(q => q.id === questId);
        
        if (!quest) {
          console.error('Quest not found:', questId);
          return;
        }
        
        const newTask = {
          id: crypto.randomUUID(),
          title,
          description,
          completed: false
        };
        
        const updatedTasks = [...quest.tasks, newTask];
        await get().updateQuest(questId, { tasks: updatedTasks });
      } catch (error) {
        console.error('Failed to add quest task:', error);
      }
    }
  });