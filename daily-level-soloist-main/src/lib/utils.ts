import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Difficulty, DailyWinCategory, DailyWinProgress } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format experience points display(ADD)
export function formatExp(exp: number | undefined | null): string {
  console.log("formatExp input:", exp, "type:", typeof exp);
  if (exp === undefined || exp === null || typeof exp !== 'number') {
    console.log("formatExp returning '0' for invalid input");
    return '0';
  }
  try {
    return exp.toLocaleString();
  } catch (error) {
    console.error("Error in formatExp:", error);
    return '0'; // Fallback value
  }
}

// Get difficulty color for UI elements
export function getDifficultyColor(difficulty: Difficulty): string {
  switch (difficulty) {
    case 'easy':
      return 'bg-green-500';
    case 'medium':
      return 'bg-yellow-500';
    default:
      return 'bg-blue-500';
  }
}

// Get category icon name for daily wins
export function getCategoryIcon(category: DailyWinCategory): string {
  switch (category) {
    case 'mental':
      return 'brain';
    case 'physical':
      return 'dumbbell';
    case 'spiritual':
      return 'heart';
    case 'intelligence':
      return 'book';
    default:
      return 'circle';
  }
}

// Get category color for UI elements
export function getCategoryColor(category: DailyWinCategory): string {
  switch (category) {
    case 'mental':
      return 'bg-purple-500';
    case 'physical':
      return 'bg-blue-500';
    case 'spiritual':
      return 'bg-teal-500';
    case 'intelligence':
      return 'bg-amber-500';
    default:
      return 'bg-gray-500';
  }
}

// Format date for display
export function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// Format relative time (e.g. "2 days ago")
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
  
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  
  return formatDate(date);
}

// Calculate progress percentage
export function calculateProgress(current: number, total: number): number {
  return Math.min(Math.floor((current / total) * 100), 100);
}

// Check if all daily wins are completed
export function areAllDailyWinsCompleted(dailyWins: Record<DailyWinCategory, DailyWinProgress | number>): boolean {
  return Object.values(dailyWins).every(win => {
    if (typeof win === 'object') {
      return win.isCompleted;
    }
    return win >= 1;
  });
}

// Check if a specific daily win category is completed
export function isDailyWinCompleted(dailyWins: Record<DailyWinCategory, DailyWinProgress | number>, category: DailyWinCategory): boolean {
  const win = dailyWins[category];
  if (typeof win === 'object') {
    return win.isCompleted;
  }
  return win >= 1;
}

// Get week dates for weekly planner
export function getWeekDates(): Date[] {
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday, 6 = Saturday
  const dates = [];
  
  // Start from Monday (1) of current week
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - day + i + (day === 0 ? -6 : 1)); // Adjust to start on Monday
    dates.push(date);
  }
  
  return dates;
}

// Check if two dates are the same day
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// Add this helper function to utils.ts
export const hasPendingDailyWinTask = (tasks: Task[], category: DailyWinCategory, date: Date) => {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  return tasks.some(task => {
    const taskDate = task.scheduledFor ? new Date(task.scheduledFor) : new Date(task.createdAt);
    taskDate.setHours(0, 0, 0, 0);
    
    return (
      !task.completed &&
      task.category === category &&
      taskDate.getTime() === targetDate.getTime()
    );
  });
};

// Count attribute tasks for a specific category and date
export const getAttributeTaskCount = (tasks: Task[], attributeCategory: string, date: Date) => {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  return tasks.filter(task => {
    const taskDate = task.scheduledFor ? new Date(task.scheduledFor) : new Date(task.createdAt);
    taskDate.setHours(0, 0, 0, 0);
    
    return (
      task.category === attributeCategory &&
      taskDate.getTime() === targetDate.getTime()
    );
  }).length;
};

// Check if attribute task limit is reached
export const isAttributeLimitReached = (tasks: Task[], attributeCategory: string, date: Date) => {
  const MAX_ATTRIBUTE_TASKS = 5;
  return getAttributeTaskCount(tasks, attributeCategory, date) >= MAX_ATTRIBUTE_TASKS;
};
