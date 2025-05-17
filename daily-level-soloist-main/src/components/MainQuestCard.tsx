import React from 'react';
import { Star, CheckCircle, CalendarClock, Swords, ListTodo, Clock, X, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { format } from 'date-fns';
import { useSoloLevelingStore } from '@/lib/store';
import { Dialog, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogContent } from '@/components/ui/dialog';
import { CustomDialogContent } from '@/components/ui/custom-dialog';
import { useState } from 'react';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { DailyWinCategory, Difficulty, Quest } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

interface MainQuestCardProps {
  quest: Quest;
  onComplete: (id: string, title: string, expReward: number) => void;
  onStart: (id: string) => void;
  canComplete: (id: string) => boolean;
}

// Import QuestTasks component as a local component for clean integration
const QuestTasks = ({ quest }: { quest: Quest }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const completeQuestTask = useSoloLevelingStore(state => state.completeQuestTask);
  
  return (
    <div className="mt-4 space-y-2">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-semibold text-gray-400">Quest Tasks</h4>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
            </DialogHeader>
            <AddTaskDialog questId={quest.id} onClose={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      
      {quest.tasks.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No tasks added yet. Break down your quest into smaller tasks.</p>
      ) : (
        <div className="space-y-2">
          {quest.tasks.map((task) => (
            <div 
              key={task.id}
              className="flex items-center justify-between p-2 bg-gray-800/50 rounded-md"
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${task.completed ? 'bg-green-500' : 'bg-gray-500'}`} />
                <span className={`text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-200'}`}>
                  {task.title}
                </span>
              </div>
              {!task.completed && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => completeQuestTask(quest.id, task.id)}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// We need to include AddTaskDialog component as well
const AddTaskDialog = ({ questId, onClose }: { questId: string; onClose: () => void }) => {
  const addQuestTask = useSoloLevelingStore(state => state.addQuestTask);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [deadline, setDeadline] = useState<Date>(new Date(Date.now() + 24 * 60 * 60 * 1000));

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

const MainQuestCard: React.FC<MainQuestCardProps> = ({ quest, onComplete, onStart, canComplete }) => {
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const completeQuestTask = useSoloLevelingStore(state => state.completeQuestTask);

  // Function to handle starting the quest and opening the task dialog
  const handleStartQuest = () => {
    onStart(quest.id);
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

  return (
    <div
      className={
        `relative bg-gradient-to-br from-solo-dark via-gray-900 to-solo-dark border-2 rounded-xl p-5 shadow-lg transition-all duration-200
        ${quest.completed ? 'border-yellow-400/60 opacity-60' : 'border-yellow-500/40 hover:border-yellow-500/80 hover:scale-[1.025]'}
        ${quest.started && !quest.completed ? 'cursor-pointer' : ''}
        `
      }
      onClick={handleCardClick}
    >
      {/* Decorative Swords Icon */}
      <div className="absolute -top-4 -left-4 bg-yellow-500/10 rounded-full p-2 shadow-md">
        <Swords className="text-yellow-500" size={28} />
      </div>
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col gap-1">
          <h3 className={`font-bold text-lg tracking-tight ${quest.completed ? 'line-through text-gray-400' : 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 drop-shadow-sm'}`}>{quest.title}</h3>
          <div className="flex items-center gap-2 mt-1">
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            {quest.started && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-green-500/10 to-green-600/10 text-green-400 border border-green-500/20 shadow-sm font-medium">
                In Progress
              </span>
            )}
            {!quest.started && (
              <span className="text-yellow-400 font-bold flex items-center gap-1 bg-gradient-to-r from-yellow-500/10 to-yellow-600/20 px-2 py-0.5 rounded-md text-xs shadow-sm">
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
                className="h-full bg-gradient-to-r from-yellow-500/50 to-amber-500/50 rounded-full transition-all duration-300"
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
          <CalendarClock size={12} className="text-amber-400 drop-shadow-sm" />
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
              onClick={handleStartQuest}
          size="sm"
              className="w-full flex justify-center items-center gap-2 border-yellow-500/40 hover:border-yellow-500 bg-gradient-to-r from-yellow-500/5 to-yellow-600/10 hover:bg-gradient-to-r hover:from-yellow-500/10 hover:to-yellow-600/20 text-yellow-400 hover:text-yellow-300 transition-all shadow-sm"
            >
              <ListTodo size={16} className="drop-shadow-sm" />
              <span className="font-medium tracking-wide">Start Quest</span>
            </Button>
          </DialogTrigger>
          <CustomDialogContent 
            className="w-[70vw] max-w-[320px] p-2.5 sm:p-3 max-h-[75vh] overflow-hidden flex flex-col"
        >
            <DialogHeader className="border-b border-yellow-500/20 pb-1.5 mb-1 relative">
              <div className="flex flex-col">
                <DialogTitle className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 drop-shadow-sm text-sm">
                  {quest.title} - Tasks
                </DialogTitle>
                <div className="flex items-center mt-1">
                  <span className="text-yellow-400 font-bold flex items-center gap-1 bg-gradient-to-r from-yellow-500/10 to-yellow-600/20 px-2 py-0.5 rounded-md text-[10px] shadow-sm">
                    <Star size={12} className="text-yellow-400 stroke-2 drop-shadow-glow" />
                    +{quest.expReward} XP
                  </span>
                </div>
              </div>
              <button 
                type="button"
                className="absolute right-0 top-0 h-5 w-5 rounded-full bg-gradient-to-r from-yellow-600/30 to-amber-700/30 hover:from-yellow-600/50 hover:to-amber-700/50 transition-all p-0.5 border border-yellow-500/20 flex items-center justify-center cursor-pointer z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setIsTaskDialogOpen(false);
                }}
                aria-label="Close dialog"
              >
                <X className="h-3 w-3 text-yellow-300" />
              </button>
            </DialogHeader>
            <div className="py-1.5 flex-1 overflow-hidden flex flex-col">
              <p className="text-[10px] text-amber-200/70 mb-2">Check off tasks as you complete them to progress in this quest.</p>
              
              {quest.tasks && quest.tasks.length > 0 ? (
                <div className="space-y-1.5 flex-1 overflow-y-auto pr-1.5 custom-scrollbar">
                  {quest.tasks.map((task) => (
                    <div 
                      key={task.id}
                      className={`flex items-center justify-between p-1.5 sm:p-2.5 rounded-lg transition-all duration-200 shadow-md ${task.completed ? 'bg-yellow-900/20 border border-yellow-500/30' : 'bg-gradient-to-r from-gray-800/60 to-gray-800/40 border border-gray-700/30 hover:border-yellow-500/20'}`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {task.completed ? (
                          <div className="h-5 w-5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="h-3.5 w-3.5 text-black" />
                          </div>
                        ) : (
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              if(!task.completed) completeQuestTask(quest.id, task.id);
                            }}
                            className="h-5 w-5 rounded-full border-2 border-yellow-500/50 bg-yellow-900/20 hover:bg-yellow-900/40 cursor-pointer flex-shrink-0 flex items-center justify-center"
                          />
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className={`text-xs sm:text-sm font-medium truncate ${task.completed ? 'text-yellow-400' : 'text-gray-200'}`}>
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
                <div className="text-center py-6 rounded-lg bg-gradient-to-r from-yellow-950/20 to-amber-950/20 border border-yellow-900/20">
                  <p className="text-amber-300/60 text-xs">No tasks found for this quest.</p>
                </div>
              )}
              
              {quest.tasks && quest.tasks.length > 0 && quest.tasks.every(task => task.completed) ? (
                <div className="flex justify-center mt-2">
                  <Button
                    variant="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      onComplete(quest.id, quest.title, quest.expReward);
                      setIsTaskDialogOpen(false);
                    }}
                    className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black font-medium h-8 text-xs"
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                    Complete Quest
        </Button>
                </div>
              ) : null}
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
              <DialogHeader className="border-b border-yellow-500/20 pb-1.5 mb-1 relative">
                <div className="flex flex-col">
                  <DialogTitle className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 drop-shadow-sm text-sm">
                    {quest.title} - Tasks
                  </DialogTitle>
                  <div className="flex items-center mt-1">
                    <span className="text-yellow-400 font-bold flex items-center gap-1 bg-gradient-to-r from-yellow-500/10 to-yellow-600/20 px-2 py-0.5 rounded-md text-[10px] shadow-sm">
                      <Star size={12} className="text-yellow-400 stroke-2 drop-shadow-glow" />
                      +{quest.expReward} XP
                    </span>
                  </div>
                </div>
                <button 
                  type="button"
                  className="absolute right-0 top-0 h-5 w-5 rounded-full bg-gradient-to-r from-yellow-600/30 to-amber-700/30 hover:from-yellow-600/50 hover:to-amber-700/50 transition-all p-0.5 border border-yellow-500/20 flex items-center justify-center cursor-pointer z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsTaskDialogOpen(false);
                  }}
                  aria-label="Close dialog"
                >
                  <X className="h-3 w-3 text-yellow-300" />
                </button>
              </DialogHeader>
              <div className="py-1.5 flex-1 overflow-hidden flex flex-col">
                <p className="text-[10px] text-amber-200/70 mb-2">Check off tasks as you complete them to progress in this quest.</p>
                
                {quest.tasks && quest.tasks.length > 0 ? (
                  <div className="space-y-1.5 flex-1 overflow-y-auto pr-1.5 custom-scrollbar">
                    {quest.tasks.map((task) => (
                      <div 
                        key={task.id}
                        className={`flex items-center justify-between p-1.5 sm:p-2.5 rounded-lg transition-all duration-200 shadow-md ${task.completed ? 'bg-yellow-900/20 border border-yellow-500/30' : 'bg-gradient-to-r from-gray-800/60 to-gray-800/40 border border-gray-700/30 hover:border-yellow-500/20'}`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {task.completed ? (
                            <div className="h-5 w-5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 flex items-center justify-center flex-shrink-0">
                              <CheckCircle className="h-3.5 w-3.5 text-black" />
                            </div>
                          ) : (
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                if(!task.completed) completeQuestTask(quest.id, task.id);
                              }}
                              className="h-5 w-5 rounded-full border-2 border-yellow-500/50 bg-yellow-900/20 hover:bg-yellow-900/40 cursor-pointer flex-shrink-0 flex items-center justify-center"
                            />
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className={`text-xs sm:text-sm font-medium truncate ${task.completed ? 'text-yellow-400' : 'text-gray-200'}`}>
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
                  <div className="text-center py-6 rounded-lg bg-gradient-to-r from-yellow-950/20 to-amber-950/20 border border-yellow-900/20">
                    <p className="text-amber-300/60 text-xs">No tasks found for this quest.</p>
                  </div>
                )}
                
                {quest.tasks && quest.tasks.length > 0 && quest.tasks.every(task => task.completed) ? (
                  <div className="flex justify-center mt-2">
                    <Button
                      variant="default"
                      onClick={(e) => {
                        e.stopPropagation();
                        onComplete(quest.id, quest.title, quest.expReward);
                        setIsTaskDialogOpen(false);
                      }}
                      className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black font-medium h-8 text-xs"
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
          {areAllTasksCompleted && canComplete(quest.id) && (
            <Button
              variant="outline"
              onClick={() => onComplete(quest.id, quest.title, quest.expReward)}
              size="sm"
              className="w-full flex justify-center items-center gap-2 mt-4 border-yellow-500/40 hover:border-yellow-500 bg-gradient-to-r from-yellow-500/5 to-yellow-600/10 hover:bg-gradient-to-r hover:from-yellow-500/10 hover:to-yellow-600/20 text-yellow-400 hover:text-yellow-300 transition-all shadow-sm"
            >
              <CheckCircle size={16} className="drop-shadow-sm" />
              <span className="font-medium tracking-wide">Complete Quest</span>
            </Button>
          )}
        </>
      )}
      {/* Quest Footer */}
      {quest.started && (
        <div className="mt-3 pt-3 border-t border-yellow-500/10">
          <div className="flex items-center justify-between text-[10px] text-gray-400/90">
            <div className="flex items-center gap-1">
              <Clock size={10} className="text-gray-500" />
              <span>Started {format(new Date(quest.createdAt), 'MMM d, h:mm a')}</span>
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
      
      {/* Completion indicator */}
      {quest.completed && (
        <div className="flex items-center justify-center gap-2 mt-2 text-yellow-400 text-xs font-medium">
          <ChevronDown size={14} className="drop-shadow-sm" /> Completed
        </div>
      )}
    </div>
  );
};

export default MainQuestCard; 