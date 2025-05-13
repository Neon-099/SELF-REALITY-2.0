import React from 'react';
import { Star, CheckCircle, CalendarClock, Swords, ListTodo, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { format } from 'date-fns';
import { useSoloLevelingStore } from '@/lib/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
          <option value="boss">Boss</option>
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
  return (
    <div
      className={
        `relative bg-gradient-to-br from-solo-dark via-gray-900 to-solo-dark border-2 rounded-xl p-5 shadow-lg transition-all duration-200
        ${quest.completed ? 'border-yellow-400/60 opacity-60' : 'border-yellow-500/40 hover:border-yellow-500/80 hover:scale-[1.025]'}
        `
      }
    >
      {/* Decorative Swords Icon */}
      <div className="absolute -top-4 -left-4 bg-yellow-500/10 rounded-full p-2 shadow-md">
        <Swords className="text-yellow-500" size={28} />
      </div>
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col gap-1">
          <h3 className={`font-bold text-lg ${quest.completed ? 'line-through text-gray-400' : 'text-yellow-50'}`}>{quest.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 w-max">
              Main Quest
            </span>
            {quest.started && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                In Progress
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-yellow-400 font-bold flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-md">
            <Star size={16} className="text-yellow-400 stroke-2" />
            +{quest.expReward} EXP
          </span>
          {quest.started && quest.tasks && (
            <span className="text-xs text-gray-400">
              {quest.tasks.filter((t: any) => t.completed).length}/{quest.tasks.length} Tasks
            </span>
          )}
        </div>
      </div>
      {/* Description */}
      {quest.description && (
        <div className="mb-4">
          <p className="text-gray-300 text-sm">{quest.description}</p>
          {quest.started && quest.tasks && quest.tasks.length > 0 && (
            <div className="mt-2 h-1 w-full bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-yellow-500/50 rounded-full transition-all duration-300"
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
        <div className="flex items-center gap-2 my-2 p-2 bg-amber-950/30 rounded-md border border-amber-800/30">
          <CalendarClock size={16} className="text-amber-400" />
          <span className="text-xs text-amber-300 font-medium">
            Due: {format(new Date(quest.deadline), 'MMM d, h:mm a')}
          </span>
        </div>
      )}
      {/* Quest Actions */}
      {!quest.started ? (
        <Button
          variant="outline"
          onClick={() => onStart(quest.id)}
          size="sm"
          className="w-full flex justify-center items-center gap-2 border-yellow-500/40 hover:border-yellow-500 hover:bg-yellow-500/10 text-yellow-400 hover:text-yellow-300 transition-colors"
        >
          <ListTodo size={16} />
          Start Quest
        </Button>
      ) : (
        <>
          {/* Display Quest Tasks when the quest is started */}
          <QuestTasks quest={quest} />
          
          {canComplete(quest.id) && (
            <Button
              variant="outline"
              onClick={() => onComplete(quest.id, quest.title, quest.expReward)}
              size="sm"
              className="w-full flex justify-center items-center gap-2 mt-4 border-yellow-500/40 hover:border-yellow-500 hover:bg-yellow-500/10 text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              <CheckCircle size={16} />
              Complete Quest
            </Button>
          )}
        </>
      )}
      {/* Quest Footer */}
      {quest.started && (
        <div className="mt-3 pt-3 border-t border-yellow-500/10">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>Started {format(new Date(quest.createdAt), 'MMM d, h:mm a')}</span>
            </div>
            {quest.deadline && (
              <div className="flex items-center gap-1">
                <CalendarClock size={12} />
                <span>Due {format(new Date(quest.deadline), 'MMM d')}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MainQuestCard; 