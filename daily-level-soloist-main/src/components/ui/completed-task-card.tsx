import React from 'react';
import { Task } from '@/lib/types';
import { getDifficultyColor, getCategoryColor } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompletedTaskCardProps {
  task: Task;
}

export function CompletedTaskCard({ task }: CompletedTaskCardProps) {
  if (!task.completed) {
    return null; // Only render for completed tasks
  }
  
  return (
    <div 
      className={cn(
        "rounded-lg border border-gray-800 bg-solo-dark p-4 transition-all",
        "opacity-80 hover:opacity-100",
        "border-green-800/20"
      )}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className={`h-2 w-2 rounded-full ${getDifficultyColor(task.difficulty)}`} />
            <span className="text-xs text-gray-400 uppercase">{task.difficulty}</span>
            <div className={`ml-2 px-2 py-0.5 text-xs rounded ${getCategoryColor(task.category)}`}>
              {task.category}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <h3 className="font-medium mb-1 line-through text-gray-500">
              {task.title}
            </h3>
            <CheckCircle size={14} className="text-green-500" />
          </div>
          
          {task.description && (
            <p className="text-sm text-gray-500 mb-3">{task.description}</p>
          )}
          
          <div className="text-xs text-solo-primary font-semibold opacity-70">
            +{task.expReward} EXP (earned)
          </div>
        </div>
      </div>
    </div>
  );
} 