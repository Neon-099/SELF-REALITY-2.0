import React, { useState } from 'react';
import { Star, CheckCircle, CalendarClock, Sword, ListTodo, Clock, X } from 'lucide-react';
import { Button } from './ui/button';
import { format } from 'date-fns';
import { useSoloLevelingStore } from '@/lib/store';
import { Dialog, DialogHeader, DialogTitle, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { CustomDialogContent } from '@/components/ui/custom-dialog';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { DailyWinCategory, Difficulty } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

interface SideQuestCardProps {
  quest: any;
  onComplete: (id: string) => void;
  onStart?: (id: string) => void;
  canComplete?: (id: string) => boolean;
  canStart?: (id: string) => boolean;
}

// Add Task Dialog Component
const AddTaskDialog = ({ questId, onClose }: { questId: string; onClose: () => void }) => {
  const addQuestTask = useSoloLevelingStore(state => state.addQuestTask);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [deadline, setDeadline] = useState<Date>(new Date());

  const handleAddTask = () => {
    if (!taskTitle.trim()) {
      toast({
        title: "Task title required",
        description: "Please provide a title for your task.",
        variant: "destructive"
      });
      return;
    }

    // Default category to 'mental' since it's not selectable but required by the function
    const defaultCategory: DailyWinCategory = 'mental';
    addQuestTask(questId, taskTitle, taskDescription, defaultCategory, difficulty, deadline);
    setTaskTitle('');
    setTaskDescription('');
    onClose();

    toast({
      title: "Task added",
      description: "Your new task has been added to the quest!",
    });
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Task Title</label>
        <input
          type="text"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-gray-800 bg-solo-dark"
          placeholder="Task title"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <textarea
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-gray-800 bg-solo-dark min-h-[100px]"
          placeholder="Task description"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Difficulty</label>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          className="w-full px-3 py-2 rounded-md border border-gray-800 bg-solo-dark"
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Deadline</label>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-indigo-300 flex items-center">
            <CalendarClock className="h-3 w-3 mr-1" /> Automatic deadline enforcement
          </div>
        </div>

        <DateTimePicker
          date={deadline}
          setDate={setDeadline}
          className="mt-2"
        />
        <p className="text-xs text-gray-400 mt-1">
          Missing a deadline will automatically apply Shadow Penalty, reducing EXP reward by 50%.
        </p>
      </div>
      <Button onClick={handleAddTask} className="w-full">
        Add Task
      </Button>
    </div>
  );
};

const SideQuestCard: React.FC<SideQuestCardProps> = ({ quest, onComplete, onStart, canComplete, canStart }) => {
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const completeQuestTask = useSoloLevelingStore(state => state.completeQuestTask);

  // Initialize tasks array if it doesn't exist
  if (!quest.tasks) {
    quest.tasks = [];
  }

  // Function to handle viewing the quest details
  const handleViewQuest = () => {
    setIsTaskDialogOpen(true);
  };

  // Function to handle starting the quest
  const handleStartQuest = () => {
    if (onStart && canStart && canStart(quest.id)) {
      onStart(quest.id);
      // Close the dialog after starting the quest
      setIsTaskDialogOpen(false);

      // Show toast notification
      toast({
        title: "Quest Started!",
        description: `You've started the quest "${quest.title}"`,
      });
    }
  };

  // Function to handle card click to view tasks
  const handleCardClick = () => {
    if (quest.started && !quest.completed) {
      setIsTaskDialogOpen(true);
    }
  };

  // Check if all tasks are completed
  const areAllTasksCompleted = quest.tasks && quest.tasks.length > 0 &&
    quest.tasks.every((task: any) => task.completed);

  return (
    <div
      id={`side-quest-${quest.id}`}
      className={
        `relative bg-gradient-to-br from-solo-dark via-gray-900 to-solo-dark border-2 rounded-xl p-5 shadow-lg transition-all duration-200
        ${quest.completed ? 'border-green-400/60 opacity-60' : 'border-solo-primary/40 hover:border-solo-primary/80 hover:scale-[1.025]'}
        ${quest.started && !quest.completed ? 'cursor-pointer' : ''}
        `
      }
      onClick={handleCardClick}
    >
      {/* Decorative Sword Icon */}
      <div className="absolute -top-4 -left-4 bg-solo-primary/10 rounded-full p-2 shadow-md">
        <Sword className="text-solo-primary" size={28} />
      </div>
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col gap-1">
          <h3 className={`font-bold text-lg tracking-tight ${quest.completed ? 'line-through text-gray-400' : 'text-transparent bg-clip-text bg-gradient-to-r from-solo-primary to-purple-400 drop-shadow-sm'}`}>{quest.title}</h3>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            {quest.started && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-green-500/10 to-green-600/10 text-green-400 border border-green-500/20 shadow-sm font-medium">
                In Progress
              </span>
            )}
            {!quest.started && (
            <span className="text-solo-primary font-bold flex items-center gap-1 bg-gradient-to-r from-solo-primary/10 to-solo-primary/20 px-2 py-0.5 rounded-md text-xs shadow-sm">
              <Star size={14} className="text-yellow-400 stroke-2 drop-shadow-glow" />
              +{quest.expReward} XP
            </span>
            )}
          </div>
          {quest.started && quest.tasks && (
            <span className="text-[10px] text-gray-400/90 font-medium">
              {quest.tasks.filter((t: any) => t.completed).length}/{quest.tasks.length} Tasks
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {quest.description && (
        <div className="mb-4">
          <p className="text-gray-300/90 text-xs leading-relaxed">{quest.description}</p>
          {quest.started && quest.tasks && quest.tasks.length > 0 && (
            <div className="mt-2 h-1 w-full bg-gray-800 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-indigo-500/50 to-purple-500/50 rounded-full transition-all duration-300"
                style={{
                  width: `${(quest.tasks.filter((t: any) => t.completed).length / quest.tasks.length) * 100}%`
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Deadline */}
      {quest.deadline && (
        <div className="flex items-center gap-1 my-1 p-1.5 bg-gradient-to-r from-amber-950/20 to-amber-900/20 rounded-md border border-amber-800/30 shadow-sm">
          <CalendarClock size={12} className="text-amber-500 drop-shadow-sm" />
          <span className="text-xs text-amber-300 font-medium">
            Due: {format(new Date(quest.deadline), 'MMM d, h:mm a')}
          </span>
        </div>
      )}

      {/* Quest Actions */}
      {!quest.started ? (
        <Dialog
          open={isTaskDialogOpen}
          modal={true}
          onOpenChange={(open) => setIsTaskDialogOpen(open)}
        >
          <DialogTrigger asChild>
            <Button
              variant="outline"
              onClick={handleViewQuest}
              size="sm"
              className="w-full flex justify-center items-center gap-2 mt-2 border-solo-primary/40 hover:border-solo-primary bg-gradient-to-r from-solo-primary/5 to-solo-primary/10 hover:bg-gradient-to-r hover:from-solo-primary/10 hover:to-solo-primary/20 text-solo-primary hover:text-solo-primary transition-all shadow-sm"
            >
              <ListTodo size={16} className="drop-shadow-sm" />
              <span className="font-medium tracking-wide">View Quest</span>
            </Button>
          </DialogTrigger>

          <CustomDialogContent
            className="w-[70vw] max-w-[320px] p-2.5 sm:p-3 max-h-[75vh] overflow-hidden flex flex-col"
          >
            <DialogHeader className="border-b border-indigo-500/20 pb-1.5 mb-1 relative">
              <div className="flex flex-col">
                <DialogTitle className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-500 drop-shadow-sm text-sm">
                  {quest.title}
                </DialogTitle>
                <div className="flex items-center mt-1">
                  <span className="text-indigo-400 font-bold flex items-center gap-1 bg-gradient-to-r from-indigo-500/10 to-indigo-600/20 px-2 py-0.5 rounded-md text-[10px] shadow-sm">
                    <Star size={12} className="text-yellow-400 stroke-2 drop-shadow-glow" />
                    +{quest.expReward} XP
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="absolute right-0 top-0 h-5 w-5 rounded-full bg-gradient-to-r from-indigo-600/30 to-purple-700/30 hover:from-indigo-600/50 hover:to-purple-700/50 transition-all p-0.5 border border-indigo-500/20 flex items-center justify-center cursor-pointer z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setIsTaskDialogOpen(false);
                }}
                aria-label="Close dialog"
              >
                <X className="h-3 w-3 text-indigo-300" />
              </button>
            </DialogHeader>

            <div className="py-1.5 flex-1 overflow-hidden flex flex-col">
              {/* Quest Description */}
              {quest.description && (
                <div className="mb-3 p-2 bg-gray-800/30 rounded-md">
                  <p className="text-gray-300/90 text-sm">{quest.description}</p>
                </div>
              )}

              {/* Quest Tasks */}
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-indigo-400 mb-2">
                  <span>Tasks:</span>
                </h4>
                {quest.tasks && quest.tasks.length > 0 ? (
                  <div className="space-y-1.5 flex-1 overflow-y-auto pr-1.5 custom-scrollbar">
                    {quest.tasks.map((task: any, index: number) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-1.5 sm:p-2.5 rounded-lg transition-all duration-200 shadow-md bg-gradient-to-r from-gray-800/60 to-gray-800/40 border border-gray-700/30"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-indigo-400 text-xs font-medium w-5 text-center flex-shrink-0">
                            {index + 1}.
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs sm:text-sm font-medium truncate text-gray-200">
                              {task.title}
                            </span>
                            {task.description && (
                              <span className="text-[10px] sm:text-xs text-gray-400/80 truncate">{task.description}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 rounded-lg bg-gradient-to-r from-indigo-950/20 to-purple-950/20 border border-indigo-900/20">
                    <p className="text-indigo-300/60 text-xs">No tasks found for this quest.</p>
                  </div>
                )}
              </div>

              {/* Start Quest Button */}
              <div className="flex justify-center mt-3">
                <Button
                  variant="default"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartQuest();
                  }}
                  disabled={canStart ? !canStart(quest.id) : false}
                  className={`w-full ${
                    canStart && !canStart(quest.id)
                      ? 'bg-gray-600 hover:bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white'
                  }`}
                >
                  {canStart && !canStart(quest.id) ? 'Daily Limit Reached' : 'Start Quest'}
                </Button>
              </div>
            </div>
          </CustomDialogContent>
        </Dialog>
      ) : (
        <>
          {/* Dialog for viewing tasks (shown when card is clicked) */}
          <Dialog
            open={isTaskDialogOpen}
            modal={true}
            onOpenChange={(open) => setIsTaskDialogOpen(open)}
          >
            <CustomDialogContent
              className="w-[70vw] max-w-[320px] p-2.5 sm:p-3 max-h-[75vh] overflow-hidden flex flex-col"
            >
              <DialogHeader className="border-b border-indigo-500/20 pb-1.5 mb-1 relative">
                <div className="flex flex-col">
                  <DialogTitle className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-500 drop-shadow-sm text-sm">
                    {quest.title}
                  </DialogTitle>
                  <div className="flex items-center mt-1">
                    <span className="text-indigo-400 font-bold flex items-center gap-1 bg-gradient-to-r from-indigo-500/10 to-indigo-600/20 px-2 py-0.5 rounded-md text-[10px] shadow-sm">
                      <Star size={12} className="text-yellow-400 stroke-2 drop-shadow-glow" />
                      +{quest.expReward} XP
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="absolute right-0 top-0 h-5 w-5 rounded-full bg-gradient-to-r from-indigo-600/30 to-purple-700/30 hover:from-indigo-600/50 hover:to-purple-700/50 transition-all p-0.5 border border-indigo-500/20 flex items-center justify-center cursor-pointer z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsTaskDialogOpen(false);
                  }}
                  aria-label="Close dialog"
                >
                  <X className="h-3 w-3 text-indigo-300" />
                </button>
              </DialogHeader>

              <div className="py-1.5 flex-1 overflow-hidden flex flex-col">
                {/* Quest Description */}
                {quest.description && (
                  <div className="mb-3 p-2 bg-gray-800/30 rounded-md">
                    <p className="text-gray-300/90 text-sm">{quest.description}</p>
                  </div>
                )}

                {/* Quest Tasks */}
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-indigo-400 mb-2">
                    <span>Tasks:</span>
                  </h4>
                  <p className="text-[10px] text-indigo-200/70 mb-2">Check off tasks as you complete them to progress in this quest.</p>
                  {quest.tasks && quest.tasks.length > 0 ? (
                    <div className="space-y-1.5 flex-1 overflow-y-auto pr-1.5 custom-scrollbar">
                      {quest.tasks.map((task: any, index: number) => (
                        <div
                          key={task.id}
                          className={`flex items-center justify-between p-1.5 sm:p-2.5 rounded-lg transition-all duration-200 shadow-md ${task.completed ? 'bg-indigo-900/20 border border-indigo-500/30' : 'bg-gradient-to-r from-gray-800/60 to-gray-800/40 border border-gray-700/30 hover:border-indigo-500/20'}`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {task.completed ? (
                              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-medium flex-shrink-0">
                                <CheckCircle className="h-3 w-3" />
                              </div>
                            ) : (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if(!task.completed) completeQuestTask(quest.id, task.id);
                                }}
                                className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-indigo-500/50 bg-indigo-900/20 hover:bg-indigo-900/40 cursor-pointer flex-shrink-0 text-indigo-400"
                              >
                              </div>
                            )}
                            <div className="flex flex-col min-w-0">
                              <span className={`text-xs sm:text-sm font-medium truncate ${task.completed ? 'text-indigo-400' : 'text-gray-200'}`}>
                                {task.title}
                              </span>
                              {task.description && (
                                <span className="text-[10px] sm:text-xs text-gray-400/80 truncate">{task.description}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 rounded-lg bg-gradient-to-r from-indigo-950/20 to-purple-950/20 border border-indigo-900/20">
                      <p className="text-indigo-300/60 text-xs">No tasks found for this quest.</p>
                    </div>
                  )}
                </div>

                {quest.tasks && quest.tasks.length > 0 && quest.tasks.every((task: any) => task.completed) ? (
                  <div className="flex justify-center mt-2">
                    <Button
                      variant="default"
                      onClick={(e) => {
                        e.stopPropagation();
                        onComplete(quest.id);
                        setIsTaskDialogOpen(false);
                      }}
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium h-8 text-xs"
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                      Complete Quest
                    </Button>
                  </div>
                ) : null}
              </div>
            </CustomDialogContent>
          </Dialog>

          {/* Progress indicator when not all tasks are completed */}
          {!areAllTasksCompleted && (
            <div className="w-full mt-4 text-center text-xs text-gray-400">
              <p className="font-medium">Complete all tasks to finish this quest</p>
              <p className="text-[10px] mt-1 text-gray-500/90">(Click card to view tasks)</p>
            </div>
          )}

          {/* Complete Quest Button - Only show when all tasks are completed and the user can complete the quest */}
          {areAllTasksCompleted && (!canComplete || canComplete(quest.id)) && (
        <Button
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            onComplete(quest.id);
            setIsTaskDialogOpen(false);
          }}
          size="sm"
            className="w-full flex justify-center items-center gap-2 mt-4 border-indigo-500/40 hover:border-indigo-500 bg-gradient-to-r from-indigo-500/5 to-indigo-600/10 hover:bg-gradient-to-r hover:from-indigo-500/10 hover:to-indigo-600/20 text-indigo-400 hover:text-indigo-300 transition-all shadow-sm"
        >
          <CheckCircle size={16} className="drop-shadow-sm" />
          <span className="font-medium tracking-wide">Complete Quest</span>
        </Button>
      )}
        </>
      )}

      {/* Quest Footer */}
      {quest.started && (
        <div className="mt-3 pt-3 border-t border-indigo-500/10">
          <div className="flex items-center justify-between text-[10px] text-gray-400/90">
            <div className="flex items-center gap-1">
              <Clock size={10} className="text-gray-500" />
              <span>Started {format(new Date(quest.createdAt || Date.now()), 'MMM d, h:mm a')}</span>
            </div>
            {quest.deadline && (
              <div className="flex items-center gap-1">
                <CalendarClock size={10} className="text-amber-500/80" />
                <span className="text-amber-400/80">Due {format(new Date(quest.deadline), 'MMM d')}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SideQuestCard;