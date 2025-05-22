import React, { useState } from 'react';
import { Quest } from '@/lib/types';
import { Shield, Star, Clock, CheckCircle, X, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSoloLevelingStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface RecoveryQuestCardProps {
  quest: Quest;
  onComplete: (id: string) => void;
  canComplete?: (id: string) => boolean;
}

const CustomDialogContent = ({ children, className, ...props }: any) => (
  <DialogContent className={cn("bg-solo-dark border-gray-800", className)} {...props}>
    {children}
  </DialogContent>
);

const RecoveryQuestCard: React.FC<RecoveryQuestCardProps> = ({ quest, onComplete, canComplete }) => {
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const completeQuestTask = useSoloLevelingStore(state => state.completeQuestTask);
  const isMobile = useIsMobile();

  // Initialize tasks array if it doesn't exist
  if (!quest.tasks) {
    quest.tasks = [];
  }

  // Function to handle viewing the quest details
  const handleViewQuest = () => {
    setIsTaskDialogOpen(true);
  };

  // Function to handle card click to view tasks
  const handleCardClick = () => {
    if (quest.started && !quest.completed) {
      setIsTaskDialogOpen(true);
    }
  };

  // Check if all tasks are completed
  const areAllTasksCompleted = quest.tasks && quest.tasks.length > 0 &&
    quest.tasks.every(task => task.completed);

  const canCompleteQuest = canComplete ? canComplete(quest.id) : areAllTasksCompleted;

  return (
    <div
      id={`recovery-quest-${quest.id}`}
      className={
        `relative bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 border-2 rounded-xl p-5 shadow-lg transition-all duration-200
        ${quest.completed ? 'border-amber-400/60 opacity-60' : 'border-amber-600/80 hover:border-amber-500/90 hover:scale-[1.025]'}
        ${quest.started && !quest.completed ? 'cursor-pointer' : ''}
        `
      }
      onClick={handleCardClick}
    >
      {/* Decorative Shield Icon */}
      <div className="absolute -top-4 -left-4 bg-amber-500/20 rounded-full p-2 shadow-md">
        <Shield className="text-amber-500" size={28} />
      </div>

      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col gap-1">
          <h3 className={`font-bold text-lg tracking-tight ${quest.completed ? 'line-through text-gray-400' : 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 drop-shadow-sm'}`}>
            {quest.title}
          </h3>
          <div className="bg-amber-950/50 text-xs text-amber-500 px-2 py-1 rounded-sm w-fit">
            Recovery Quest
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            {quest.started && (
              <div className="bg-amber-500/20 text-amber-400 text-xs px-2 py-1 rounded-full">
                In Progress
              </div>
            )}
            <div className="flex items-center gap-1">
              <Star size={16} className="text-yellow-400" />
              <span className="text-amber-400 font-bold">+{quest.expReward} EXP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {quest.description && (
        <p className="text-gray-300/90 mb-3 text-sm">
          {quest.description}
        </p>
      )}

      {/* Deadline */}
      {quest.deadline && (
        <div className="flex items-center gap-2 my-3 p-2 bg-amber-950/30 rounded-md border border-amber-800/30">
          <Clock size={16} className="text-amber-500" />
          <div className="flex flex-col">
            <span className="text-xs text-amber-300 font-medium">Complete by end of day</span>
            <span className="text-xs text-amber-400/80">
              {format(new Date(quest.deadline), "MMMM d, yyyy")}
            </span>
          </div>
        </div>
      )}

      {/* Tasks Progress */}
      {quest.tasks && quest.tasks.length > 0 && (
        <div className="mb-3 p-2 bg-amber-950/20 rounded-md">
          <div className="flex items-center justify-between text-xs text-amber-300">
            <span>Tasks Progress</span>
            <span>{quest.tasks.filter(task => task.completed).length}/{quest.tasks.length}</span>
          </div>
          <div className="w-full bg-amber-900/30 h-1.5 rounded-full mt-1">
            <div
              className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${(quest.tasks.filter(task => task.completed).length / quest.tasks.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        {quest.started && !quest.completed && (
          <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-amber-500/30 hover:border-amber-500/60 text-amber-500"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewQuest();
                }}
              >
                <Eye size={14} className="mr-1" />
                View Tasks
              </Button>
            </DialogTrigger>
            <CustomDialogContent
              className="w-[70vw] max-w-[320px] p-2.5 sm:p-3 max-h-[75vh] overflow-hidden flex flex-col"
            >
              <DialogHeader className="border-b border-amber-500/20 pb-1.5 mb-1 relative">
                <div className="flex flex-col">
                  <DialogTitle className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-500 drop-shadow-sm text-sm">
                    {quest.title}
                  </DialogTitle>
                  <div className="flex items-center mt-1">
                    <span className="text-amber-400 font-bold flex items-center gap-1 bg-gradient-to-r from-amber-500/10 to-amber-600/20 px-2 py-0.5 rounded-md text-[10px] shadow-sm">
                      <Star size={12} className="text-yellow-400 stroke-2 drop-shadow-glow" />
                      +{quest.expReward} XP
                    </span>
                    <span className="bg-amber-950/50 text-xs text-amber-500 ml-2 px-1.5 py-0.5 rounded-sm">
                      Recovery Quest
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="absolute right-0 top-0 h-5 w-5 rounded-full bg-gradient-to-r from-amber-600/30 to-orange-700/30 hover:from-amber-600/50 hover:to-orange-700/50 transition-all p-0.5 border border-amber-500/20 flex items-center justify-center cursor-pointer z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsTaskDialogOpen(false);
                  }}
                  aria-label="Close dialog"
                >
                  <X className="h-3 w-3 text-amber-300" />
                </button>
              </DialogHeader>
              <div className="py-1 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {quest.description && (
                  <div className="mb-2 p-2 bg-amber-950/20 rounded-md">
                    <p className="text-amber-200/90 text-xs">{quest.description}</p>
                  </div>
                )}

                {quest.tasks && quest.tasks.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-semibold text-amber-400 mb-1">Tasks:</h4>
                    {quest.tasks.map((task, index) => (
                      <div key={task.id || index} className="flex items-start gap-2 p-1.5 bg-amber-950/10 rounded-md border border-amber-800/20">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => completeQuestTask(quest.id, task.id)}
                          className="mt-0.5 h-3 w-3 rounded border-amber-600 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium ${task.completed ? 'line-through text-gray-400' : 'text-amber-200'}`}>
                            {index + 1}. {task.title}
                          </p>
                          {task.description && (
                            <p className={`text-xs mt-0.5 ${task.completed ? 'line-through text-gray-500' : 'text-amber-300/70'}`}>
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CustomDialogContent>
          </Dialog>
        )}

        {quest.started && canCompleteQuest && !quest.completed && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onComplete(quest.id);
            }}
            className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white"
            size="sm"
          >
            <CheckCircle size={14} className="mr-1" />
            Complete Quest
          </Button>
        )}

        {!quest.started && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              // Start the recovery quest manually
              const startQuest = useSoloLevelingStore.getState().startQuest;
              startQuest(quest.id);
            }}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white"
            size="sm"
          >
            <Shield size={14} className="mr-1" />
            Start Recovery Quest
          </Button>
        )}
      </div>
    </div>
  );
};

export default RecoveryQuestCard;
