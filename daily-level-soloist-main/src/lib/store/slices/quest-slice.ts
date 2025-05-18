import { StateCreator } from 'zustand';
import { Quest, Task, DailyWinCategory, Difficulty, Stat } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { calculateExpToNextLevel, calculateRank } from '../../utils/calculations';
import { toast } from '@/hooks/use-toast';
import { StoreState } from '../index';
import { expRewards } from '@/data/exp-rewards';
import { MongoDBService } from '../../services/mongodb-service';

export interface QuestSlice {
  quests: Quest[];
  addQuest: (title: string, description: string, isMainQuest?: boolean, expRewardOrDifficulty?: number | Difficulty, deadline?: Date, difficulty?: Difficulty, category?: DailyWinCategory, isDaily?: boolean) => Promise<Quest>;
  completeQuest: (id: string) => void;
  startQuest: (id: string) => Promise<void>;
  addQuestTask: (questId: string, taskTitle: string, taskDescription?: string, category?: DailyWinCategory, difficulty?: Difficulty, deadline?: Date) => Promise<void>;
  completeQuestTask: (questId: string, taskId: string) => Promise<void>;
  canCompleteQuest: (id: string) => boolean;
  updateQuest: (id: string, updates: Partial<Quest>) => Promise<void>;
  deleteQuest: (id: string) => Promise<void>;
  loadQuests: () => Promise<void>;
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

// Use StoreState instead of listing all dependencies for better compatibility
export const createQuestSlice = (dbService: MongoDBService) => (set, get, _store) => ({
  quests: [],

  loadQuests: async () => {
    try {
      const quests = await dbService.getAllQuests();
      set({ quests });
    } catch (error) {
      console.error('Failed to load quests:', error);
    }
  },

  addQuest: async (title: string, description: string, isMainQuest: boolean = false, expRewardOrDifficulty: number | Difficulty = 'normal', deadline?: Date, difficulty: Difficulty = 'normal', category?: DailyWinCategory, isDaily: boolean = false) => {
    // If first expReward parameter is a number, use it as custom exp reward, otherwise use mapping
    const isCustomExp = typeof expRewardOrDifficulty === 'number';
    const expReward = isCustomExp ? expRewardOrDifficulty : expRewards[expRewardOrDifficulty as Difficulty];
    const effectiveDifficulty = isCustomExp ? difficulty : expRewardOrDifficulty as Difficulty;

    const quest: Quest = {
      id: uuidv4(),
      title,
      description,
      isMainQuest,
      isDaily,
      difficulty: effectiveDifficulty,
      createdAt: new Date(),
      completed: false,
      expReward,
      tasks: [],
      started: false,
      deadline: deadline || null,
      completedAt: null,
      missed: false,
      isRecoveryQuest: false,
      category
    };

    try {
      const savedQuest = await dbService.createQuest(quest);
      set((state: QuestSlice) => ({
        quests: [...state.quests, savedQuest]
      }));
      return savedQuest;
    } catch (error) {
      console.error('Failed to add quest:', error);
      return quest;
    }
  },

  completeQuest: async (id: string) => {
    try {
      // Get the quest before updating it
      const quest = get().quests.find(q => q.id === id);
      if (!quest) {
        console.error('Quest not found:', id);
        return;
      }

      // Get the EXP reward from the quest
      const expReward = quest.expReward || 0;

      // Update the quest in the database
      const updatedQuest = await dbService.updateQuest(id, {
        completed: true,
        completedAt: new Date()
      });

      if (updatedQuest) {
        // Update the quest in the state
        set((state: QuestSlice) => ({
          quests: state.quests.map(q => q.id === id ? updatedQuest : q)
        }));

        // Directly add EXP to the user
        if (expReward > 0) {
          const { addExp } = get();
          if (addExp) {
            addExp(expReward);

            // Show toast notification for quest completion
            toast({
              title: "Quest Completed!",
              description: `${quest.title} completed! You earned ${expReward} XP.`,
              variant: "default"
            });
          }
        }

        console.log('Quest completed:', updatedQuest.title);
      }

      return updatedQuest;
    } catch (error) {
      console.error('Failed to complete quest:', error);
    }
  },

  deleteQuest: async (id: string) => {
    try {
      await dbService.deleteQuest(id);
      set((state: QuestSlice) => ({
        quests: state.quests.filter(q => q.id !== id)
      }));
    } catch (error) {
      console.error('Failed to delete quest:', error);
    }
  },

  updateQuest: async (id: string, updates: Partial<Quest>) => {
    try {
      const updatedQuest = await dbService.updateQuest(id, updates);
      if (updatedQuest) {
        set((state: QuestSlice) => ({
          quests: state.quests.map(q => q.id === id ? updatedQuest : q)
        }));
      }
    } catch (error) {
      console.error('Failed to update quest:', error);
    }
  },

  addQuestTask: async (questId: string, taskTitle: string, taskDescription: string = '', category?: DailyWinCategory, difficulty: Difficulty = 'normal', deadline?: Date) => {
    try {
      const quest = get().quests.find(q => q.id === questId);
      if (quest) {
        // Create a new task with a unique ID
        const newTask = {
          id: uuidv4(), // Generate a unique ID for the task
          title: taskTitle,
          description: taskDescription,
          completed: false,
          category: category || 'mental',
          difficulty: difficulty || 'normal',
          deadline: deadline || null
        };

        // Make sure we have an array of tasks
        const currentTasks = Array.isArray(quest.tasks) ? quest.tasks : [];
        const updatedTasks = [...currentTasks, newTask];

        // Update the quest with the new tasks array
        const updatedQuest = await dbService.updateQuest(questId, { tasks: updatedTasks });

        if (updatedQuest) {
          // Update the state with the updated quest
          set((state: QuestSlice) => ({
            quests: state.quests.map(q => q.id === questId ? updatedQuest : q)
          }));

          // Log success for debugging
          console.log('Task added successfully:', newTask);
          console.log('Updated quest tasks:', updatedTasks);
        }
      } else {
        console.error('Quest not found with ID:', questId);
      }
    } catch (error) {
      console.error('Failed to add quest task:', error);
    }
  },

  completeQuestTask: async (questId: string, taskId: string) => {
    try {
      const quest = get().quests.find(q => q.id === questId);
      if (quest && Array.isArray(quest.tasks)) {
        const updatedTasks = quest.tasks.map(task =>
          task.id === taskId ? { ...task, completed: true } : task
        );

        const updatedQuest = await dbService.updateQuest(questId, { tasks: updatedTasks });

        if (updatedQuest) {
          set((state: QuestSlice) => ({
            quests: state.quests.map(q => q.id === questId ? updatedQuest : q)
          }));
        }
      }
    } catch (error) {
      console.error('Failed to complete quest task:', error);
    }
  },

  startQuest: async (id) => {
    try {
      // First update the quest in the database
      const updatedQuest = await dbService.updateQuest(id, { started: true });

      if (updatedQuest) {
        // Get the latest quest data with all tasks
        const latestQuest = await dbService.getQuest(id);

        if (latestQuest) {
          // Then update the state with the latest quest data
          set((state: QuestSlice) => ({
            quests: state.quests.map(quest =>
              quest.id === id ? latestQuest : quest
            )
          }));

          // Log for debugging
          console.log('Quest started successfully:', latestQuest);
          console.log('Tasks in started quest:', latestQuest.tasks);

          return latestQuest;
        } else {
          // Fallback to using the updatedQuest if getQuest fails
          set((state: QuestSlice) => ({
            quests: state.quests.map(quest =>
              quest.id === id ? updatedQuest : quest
            )
          }));

          console.log('Using updatedQuest as fallback:', updatedQuest);
          return updatedQuest;
        }
      }
    } catch (error) {
      console.error('Failed to start quest:', error);

      // Fallback to just updating the state if database update fails
      const quest = get().quests.find(q => q.id === id);
      if (quest) {
        const updatedQuest = { ...quest, started: true };
        set((state: QuestSlice) => ({
          quests: state.quests.map(q =>
            q.id === id ? updatedQuest : q
          )
        }));

        return updatedQuest;
      }
    }
  },

  canCompleteQuest: (id) => {
    const { quests, areSideQuestsLocked } = get();
    const quest = quests.find(q => q.id === id);

    // Quest not found
    if (!quest) return false;

    // Check if side quests are locked (only if this is a side quest)
    if (!quest.isMainQuest && areSideQuestsLocked()) {
      toast({
        title: "Side Quests Locked",
        description: "You must complete main quests first to unlock side quests.",
        variant: "destructive"
      });
      return false;
    }

    // Already completed
    if (quest.completed) return false;

    // If quest has tasks, all tasks must be completed
    if (quest.tasks.length > 0) {
      return quest.tasks.every(task => task.completed);
    }

    // Quest with no tasks can be completed
    return true;
  }
});