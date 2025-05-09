import React from 'react';
import { DailyWinCategory, DailyWinProgress } from '@/lib/types';
import { getCategoryColor } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface DailyWinCardProps {
  category: DailyWinCategory;
  completed: DailyWinProgress | number;
  icon: React.ReactNode;
}

export function DailyWinCard({ category, completed, icon }: DailyWinCardProps) {
  // Handle both object and number formats
  const completedCount = typeof completed === 'object' ? completed.count : completed;
  const isCompleted = typeof completed === 'object' ? completed.isCompleted : completedCount >= 1;
  
  // Get category-specific classes
  const getCategoryClasses = () => {
    switch (category) {
      case 'mental':
        return {
          color: 'purple-500',
          bg: 'bg-purple-500',
          bgOpacity: 'bg-opacity-20 bg-purple-500',
          textColor: 'text-purple-500',
          hoverShadow: 'hover:shadow-purple-500/30',
          shadowColor: 'shadow-purple-500/30',
          dropShadow: 'drop-shadow-glow',
          hoverText: 'group-hover:text-purple-500'
        };
      case 'physical':
        return {
          color: 'blue-500',
          bg: 'bg-blue-500',
          bgOpacity: 'bg-opacity-20 bg-blue-500',
          textColor: 'text-blue-500',
          hoverShadow: 'hover:shadow-blue-500/30',
          shadowColor: 'shadow-blue-500/30',
          dropShadow: 'drop-shadow-glow-primary',
          hoverText: 'group-hover:text-blue-500'
        };
      case 'spiritual':
        return {
          color: 'teal-500',
          bg: 'bg-teal-500',
          bgOpacity: 'bg-opacity-20 bg-teal-500',
          textColor: 'text-teal-500',
          hoverShadow: 'hover:shadow-teal-500/30',
          shadowColor: 'shadow-teal-500/30',
          dropShadow: 'drop-shadow-glow-accent',
          hoverText: 'group-hover:text-teal-500'
        };
      case 'intelligence':
        return {
          color: 'amber-500',
          bg: 'bg-amber-500',
          bgOpacity: 'bg-opacity-20 bg-amber-500',
          textColor: 'text-amber-500',
          hoverShadow: 'hover:shadow-amber-500/30',
          shadowColor: 'shadow-amber-500/30',
          dropShadow: 'drop-shadow-glow',
          hoverText: 'group-hover:text-amber-500'
        };
      default:
        return {
          color: 'gray-500',
          bg: 'bg-gray-500',
          bgOpacity: 'bg-opacity-20 bg-gray-500',
          textColor: 'text-gray-500',
          hoverShadow: 'hover:shadow-gray-500/30',
          shadowColor: 'shadow-gray-500/30',
          dropShadow: 'drop-shadow-glow',
          hoverText: 'group-hover:text-gray-500'
        };
    }
  };

  const classes = getCategoryClasses();

  return (
    <div 
      className={cn(
        "group bg-solo-dark border border-gray-800 rounded-lg p-4",
        "transition-all duration-300 ease-in-out hover:scale-[1.02]",
        "hover:border-gray-700",
        isCompleted && "hover:shadow-md", 
        isCompleted && classes.hoverShadow
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <div 
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            "transition-all duration-300 ease-in-out hover:scale-110",
            classes.bgOpacity, classes.textColor,
            isCompleted ? "animate-pulse-subtle" : "hover:drop-shadow-md",
            `hover:shadow-inner hover:${classes.textColor}`,
          )}
        >
          <div className={cn(
            "transition-all duration-300",
            isCompleted && "drop-shadow-glow",
            isCompleted && classes.dropShadow
          )}>
            {icon}
          </div>
        </div>
        <div>
          <h3 className={cn(
            "font-medium capitalize text-solo-text",
            "transition-all duration-300 ease-in-out",
            isCompleted && classes.textColor,
            classes.hoverText
          )}>
            {category}
          </h3>
          <p className="text-xs text-gray-400 transition-all duration-300 group-hover:text-gray-300">
            Daily wins: {completedCount}/1
          </p>
        </div>
      </div>
      
      <div className="flex gap-1">
        {Array.from({ length: 1 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-2 flex-1 rounded-full transition-all duration-300 ease-in-out",
              isCompleted
                ? `${classes.bg} hover:brightness-110 shadow-inner shadow-black/20` 
                : "bg-gray-800 hover:bg-gray-700",
              isCompleted && "shadow-sm",
              isCompleted && classes.shadowColor
            )}
          />
        ))}
      </div>
    </div>
  );
}
