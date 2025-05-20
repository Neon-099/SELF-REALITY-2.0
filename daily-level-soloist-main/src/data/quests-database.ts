import { Quest, Task, DailyWinCategory, Difficulty } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Quests Database
 * 
 * This file contains predefined main and side quests for the game.
 * Main quests advance the main storyline, while side quests provide additional challenges and rewards.
 */

// Helper function to create a new quest
const createQuest = (
  title: string,
  description: string,
  expReward: number,
  isMainQuest: boolean,
  difficulty: Difficulty = 'normal',
  category: DailyWinCategory | '' = '',
  tasks: Task[] = [],
  deadline?: Date,
  isDaily?: boolean
): Quest => ({
  id: uuidv4(),
  title,
  description,
  expReward,
  completed: false,
  started: false,
  isMainQuest,
  tasks,
  createdAt: new Date(),
  deadline,
  difficulty,
  category,
  isDaily
});

// Helper function to create a task for a quest
const createTask = (
  title: string,
  description: string,
  category: DailyWinCategory,
  difficulty: Difficulty = 'normal',
  expReward: number = 10
): Task => ({
  id: uuidv4(),
  title,
  description,
  completed: false,
  category,
  difficulty,
  expReward,
  createdAt: new Date()
});

// Main Quests
export const mainQuests: Quest[] = [
  createQuest(
    "Awakening",
    "Begin your journey of self-discovery and improvement. Complete your first daily challenge.",
    100,
    true,
    'normal',
    'mental',
    [
      createTask("Set Your First Goal", "Define a simple, achievable goal for today", 'mental', 'normal', 25),
      createTask("Complete Your First Task", "Take action and complete the goal you set", 'mental', 'normal', 25),
      createTask("Reflect on Your Success", "Take a moment to reflect on how it feels to complete your first task", 'mental', 'normal', 25),
      createTask("Plan For Tomorrow", "Set an intention for what you'll accomplish tomorrow", 'mental', 'normal', 25)
    ]
  ),
  
  createQuest(
    "Building Foundations",
    "Establish daily routines that support your growth and development.",
    150,
    true,
    'normal',
    'physical',
    [
      createTask("Morning Ritual", "Create a morning routine that energizes you", 'physical', 'normal', 35),
      createTask("Physical Movement", "Incorporate 20 minutes of physical activity into your day", 'physical', 'normal', 35),
      createTask("Mindful Eating", "Pay attention to what you eat and how it makes you feel", 'physical', 'normal', 35),
      createTask("Evening Wind-Down", "Develop a relaxing evening routine for better sleep", 'physical', 'normal', 45)
    ]
  ),
  
  createQuest(
    "Mind Expansion",
    "Challenge yourself intellectually and expand your knowledge base.",
    200,
    true,
    'normal',
    'intelligence',
    [
      createTask("Learn Something New", "Spend 30 minutes learning about a new topic", 'intelligence', 'normal', 50),
      createTask("Apply Your Knowledge", "Find a way to apply what you've learned", 'intelligence', 'normal', 50),
      createTask("Share Your Insights", "Teach someone else what you've learned", 'intelligence', 'normal', 50),
      createTask("Reflect and Connect", "Journal about how this new knowledge connects to other areas of your life", 'intelligence', 'normal', 50)
    ]
  ),
  
  createQuest(
    "Inner Harmony",
    "Connect with your inner self and develop spiritual awareness.",
    250,
    true,
    'boss',
    'spiritual',
    [
      createTask("Mindful Meditation", "Practice 10 minutes of mindful meditation", 'spiritual', 'normal', 60),
      createTask("Gratitude Practice", "List five things you're grateful for today", 'spiritual', 'normal', 60),
      createTask("Nature Connection", "Spend time in nature and observe its beauty", 'spiritual', 'normal', 60),
      createTask("Value Reflection", "Identify and reflect on your core values", 'spiritual', 'boss', 70)
    ]
  ),
  
  createQuest(
    "Master of Balance",
    "Achieve balance across all areas of your life.",
    300,
    true,
    'boss',
    '',
    [
      createTask("Physical Balance", "Complete a challenging physical goal", 'physical', 'boss', 75),
      createTask("Mental Balance", "Practice stress management and emotional regulation", 'mental', 'boss', 75),
      createTask("Intellectual Balance", "Solve a complex problem using critical thinking", 'intelligence', 'boss', 75),
      createTask("Spiritual Balance", "Connect your daily actions with your deeper purpose", 'spiritual', 'boss', 75)
    ]
  )
];

// Side Quests
export const sideQuests: Quest[] = [
  createQuest(
    "Digital Detox",
    "Take a break from technology and reconnect with the physical world.",
    80,
    false,
    'normal',
    'mental',
    [
      createTask("Screen-Free Morning", "Avoid screens for the first hour after waking", 'mental', 'normal', 20),
      createTask("Midday Pause", "Take a 30-minute break from all devices", 'mental', 'normal', 20),
      createTask("Evening Disconnect", "Turn off all devices 1 hour before bedtime", 'mental', 'normal', 40)
    ]
  ),
  
  createQuest(
    "Fitness Explorer",
    "Try three different types of physical activities this week.",
    90,
    false,
    'normal',
    'physical',
    [
      createTask("Cardio Challenge", "Complete a cardio workout", 'physical', 'normal', 30),
      createTask("Strength Building", "Do a strength training session", 'physical', 'normal', 30),
      createTask("Flexibility Focus", "Practice yoga or stretching for 20 minutes", 'physical', 'normal', 30)
    ]
  ),
  
  createQuest(
    "Creative Spark",
    "Reignite your creativity through artistic expression.",
    85,
    false,
    'normal',
    'intelligence',
    [
      createTask("Visual Art", "Draw, paint, or create visual art for 30 minutes", 'intelligence', 'normal', 28),
      createTask("Written Expression", "Write a short story, poem, or journal entry", 'intelligence', 'normal', 28),
      createTask("Musical Exploration", "Listen to or create music that inspires you", 'intelligence', 'normal', 29)
    ]
  ),
  
  createQuest(
    "Connection Quest",
    "Strengthen your relationships with others.",
    95,
    false,
    'normal',
    'spiritual',
    [
      createTask("Meaningful Conversation", "Have a deep conversation with someone you care about", 'spiritual', 'normal', 30),
      createTask("Act of Kindness", "Do something helpful for someone without expecting anything in return", 'spiritual', 'normal', 30),
      createTask("Express Appreciation", "Tell someone specifically what you appreciate about them", 'spiritual', 'normal', 35)
    ]
  ),
  
  createQuest(
    "Mindful Eating Challenge",
    "Transform your relationship with food through mindful awareness.",
    70,
    false,
    'normal',
    'physical',
    [
      createTask("Slow Dining", "Eat one meal without distractions, savoring each bite", 'physical', 'normal', 23),
      createTask("Conscious Cooking", "Prepare a meal from scratch with full attention", 'physical', 'normal', 23),
      createTask("Gratitude for Nourishment", "Express gratitude for your food before eating", 'physical', 'normal', 24)
    ]
  ),
  
  createQuest(
    "Knowledge Explorer",
    "Expand your knowledge in an unfamiliar subject area.",
    75,
    false,
    'normal',
    'intelligence',
    [
      createTask("Research Dive", "Spend 30 minutes researching a new topic", 'intelligence', 'normal', 25),
      createTask("Learning Application", "Find a practical way to apply your new knowledge", 'intelligence', 'normal', 25),
      createTask("Knowledge Sharing", "Explain what you've learned to someone else", 'intelligence', 'normal', 25)
    ]
  ),
  
  createQuest(
    "Declutter Challenge",
    "Create more physical and mental space in your life.",
    65,
    false,
    'normal',
    'mental',
    [
      createTask("Physical Space Clearing", "Clear clutter from one area of your home", 'mental', 'normal', 20),
      createTask("Digital Declutter", "Organize your digital files and delete unnecessary items", 'mental', 'normal', 20),
      createTask("Mental Clearing", "Practice a mind-clearing meditation or journaling session", 'mental', 'normal', 25)
    ]
  ),
  
  createQuest(
    "Nature Connection",
    "Strengthen your bond with the natural world.",
    85,
    false,
    'normal',
    'spiritual',
    [
      createTask("Outdoor Exploration", "Spend at least 30 minutes in nature", 'spiritual', 'normal', 28),
      createTask("Nature Observation", "Observe and document plants, animals, or natural phenomena", 'spiritual', 'normal', 28),
      createTask("Environmental Action", "Take an action that benefits the environment", 'spiritual', 'normal', 29)
    ]
  ),
  
  createQuest(
    "Sleep Optimization",
    "Improve your sleep quality and establish healthy sleep patterns.",
    80,
    false,
    'normal',
    'physical',
    [
      createTask("Sleep Environment", "Optimize your bedroom for better sleep", 'physical', 'normal', 25),
      createTask("Evening Routine", "Create a calming pre-sleep routine", 'physical', 'normal', 25),
      createTask("Sleep Consistency", "Maintain consistent sleep and wake times", 'physical', 'normal', 30)
    ]
  ),
  
  createQuest(
    "Emotional Intelligence",
    "Develop greater awareness and regulation of your emotional states.",
    90,
    false,
    'normal',
    'mental',
    [
      createTask("Emotion Tracking", "Track your emotions throughout the day", 'mental', 'normal', 30),
      createTask("Trigger Identification", "Identify what triggers specific emotional responses", 'mental', 'normal', 30),
      createTask("Emotional Regulation", "Practice a technique to manage a difficult emotion", 'mental', 'normal', 30)
    ]
  )
];

// Combine all quests for easy access
export const allQuests: Quest[] = [...mainQuests, ...sideQuests];

/**
 * Get all main quests
 */
export function getMainQuests(): Quest[] {
  return mainQuests;
}

/**
 * Get all side quests
 */
export function getSideQuests(): Quest[] {
  return sideQuests;
}

/**
 * Get a specific quest by ID
 */
export function getQuestById(id: string): Quest | undefined {
  return allQuests.find(quest => quest.id === id);
}

/**
 * Get quests by category
 */
export function getQuestsByCategory(category: DailyWinCategory): Quest[] {
  return allQuests.filter(quest => quest.category === category);
}

/**
 * Get quests by difficulty
 */
export function getQuestsByDifficulty(difficulty: Difficulty): Quest[] {
  return allQuests.filter(quest => quest.difficulty === difficulty);
} 