import React from 'react';
import { Task } from '@/lib/types';
import { getDifficultyColor, getCategoryColor } from '@/lib/utils';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface CompletedTaskCardProps {
  task: Task;
}

export function CompletedTaskCard({ task }: CompletedTaskCardProps) {
  const isMobile = useIsMobile();

  if (!task.completed) {
    return null; // Only render for completed tasks
  }

  // Check if the task was missed (failed) or completed after deadline
  const isMissed = task.missed === true;
  const isLate = task.deadline && task.completedAt
    ? new Date(task.completedAt) > new Date(task.deadline)
    : false;

  // Format deadline for display
  const formatDeadline = (deadline: Date | undefined) => {
    if (!deadline) return null;
    return `Due: ${new Date(deadline).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`;
  };

  // Format completion time
  const formatCompletionTime = (completedAt: Date | undefined) => {
    if (!completedAt) return null;
    return `Completed: ${new Date(completedAt).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`;
  };

  return (
    <div
      className={cn(
        "rounded-lg border transition-all opacity-80 hover:opacity-100",
        isMobile ? "p-2" : "p-4",
        isMissed
          ? "border-red-800/20 bg-red-950/10"
          : isLate
            ? "border-orange-800/20 bg-orange-950/10"
            : "border-green-800/20 bg-green-950/10"
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

            {/* Status indicator */}
            <div className={cn(
              "ml-auto px-2 py-0.5 rounded-full text-xs flex items-center",
              isMissed
                ? "bg-red-500/20 text-red-400"
                : isLate
                  ? "bg-orange-500/20 text-orange-400"
                  : "bg-green-500/20 text-green-400"
            )}>
              {isMissed && (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  <span>Missed</span>
                </>
              )}
              {isLate && !isMissed && (
                <>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  <span>Late</span>
                </>
              )}
              {!isLate && !isMissed && (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  <span>On time</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <h3 className={cn(
              "font-medium mb-1 line-through text-gray-500",
              isMobile ? "text-sm" : "text-base"
            )}>
              {task.title}
            </h3>
          </div>

          {task.description && (
            <p className={cn(
              "text-gray-500 mb-2",
              isMobile ? "text-[10px]" : "text-sm"
            )}>{task.description}</p>
          )}

          {/* Deadline and completion time */}
          {task.deadline && (
            <div className={cn(
              "text-gray-400 mb-2 flex gap-4",
              isMobile ? "text-[10px]" : "text-xs"
            )}>
              <span className="flex items-center">
                <Clock className={isMobile ? "h-2.5 w-2.5 mr-0.5" : "h-3 w-3 mr-1"} />
                {formatDeadline(task.deadline)}
              </span>

              {task.completedAt && (
                <span className={cn(
                  "flex items-center",
                  isLate && !isMissed ? "text-orange-400" : ""
                )}>
                  {isLate && !isMissed ?
                    <AlertTriangle className={isMobile ? "h-2.5 w-2.5 mr-0.5" : "h-3 w-3 mr-1"} /> :
                    <CheckCircle className={isMobile ? "h-2.5 w-2.5 mr-0.5" : "h-3 w-3 mr-1"} />
                  }
                  {formatCompletionTime(task.completedAt)}
                </span>
              )}
            </div>
          )}

          <div className={cn(
            "font-semibold",
            isMobile ? "text-xs" : "text-xs"
          )}>
            {isMissed ? (
              <span className="text-red-400">+{Math.floor(task.expReward * 0.5)} EXP (penalty applied)</span>
            ) : isLate ? (
              <span className="text-orange-400">+{Math.floor(task.expReward * 0.75)} EXP (late penalty applied)</span>
            ) : (
              <span className="text-green-400">+{task.expReward} EXP (earned)</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}