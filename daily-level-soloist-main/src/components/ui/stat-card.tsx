import React from 'react';
import { cn } from '@/lib/utils';
import { useSoloLevelingStore } from '@/lib/store';
import { useIsMobile } from '@/hooks/use-mobile';
import { Stat } from '@/lib/types';

interface StatCardProps {
  name: Stat;
  value: number;
  icon: React.ReactNode;
}

export function StatCard({ name, value, icon }: StatCardProps) {
  // Get current stat EXP from the store
  const user = useSoloLevelingStore(state => state.user);
  const isMobile = useIsMobile();
  
  // Check if user and user.stats exist before proceeding
  if (!user || !user.stats) {
    return (
      <div className="bg-solo-dark rounded-lg p-4 border border-gray-800 hover:border-solo-primary/50 transition-all animate-pulse">
        <div className="h-20 flex items-center justify-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }
  
  const statExpKey = `${name}Exp` as keyof typeof user.stats;
  
  // Ensure statExp is a valid number, default to 0 if undefined or NaN
  const statExp = typeof user.stats[statExpKey] === 'number' && !isNaN(user.stats[statExpKey]) 
    ? user.stats[statExpKey] 
    : 0;
  
  // Use a fixed value of 100 for EXP needed to level up
  const expToNextLevel = 100;
  const progressPercentage = Math.min(100, (statExp / expToNextLevel) * 100);
  
  return (
    <div className="bg-solo-dark rounded-lg p-4 border border-gray-800 hover:border-solo-primary/50 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-solo-primary/20 flex items-center justify-center text-solo-primary">
            {icon}
          </div>
          <h3 className="font-medium capitalize">{name}</h3>
        </div>
        
        <div className="text-xl font-bold text-solo-primary">{value}</div>
      </div>
      
      {/* Hide EXP progress text and numbers in mobile version */}
      {!isMobile && (
        <div className="w-full mb-2 text-xs text-gray-400 flex justify-between">
          <span>EXP Progress</span>
          <span>{statExp}/{expToNextLevel}</span>
        </div>
      )}
      
      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-600" 
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
}
