import React, { useState, useEffect } from 'react';
import { Task } from '@/lib/types';
import { getDifficultyColor, getCategoryColor } from '@/lib/utils';
import { Edit, Trash2, CheckCircle, AlertCircle, Clock, CalendarClock } from 'lucide-react';
import { useSoloLevelingStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Difficulty, DailyWinCategory } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { getExpForDifficulty } from '@/lib/utils/calculations';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { areAllDailyWinsCompleted } from '@/lib/utils';
import { DateTimePicker } from '@/components/ui/date-time-picker';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const completeTask = useSoloLevelingStore(state => state.completeTask);
  const deleteTask = useSoloLevelingStore(state => state.deleteTask);
  const addTask = useSoloLevelingStore(state => state.addTask);
  const user = useSoloLevelingStore(state => state.user);

  // State for the edit dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [editDifficulty, setEditDifficulty] = useState<Difficulty>(task.difficulty);
  const [categoryType, setCategoryType] = useState<'dailyWin' | 'attribute'>('dailyWin');
  const [editCategory, setEditCategory] = useState<string>(task.category);
  const [editDeadline, setEditDeadline] = useState<Date | undefined>(task.deadline);

  // Daily win categories and attribute categories
  const dailyWinCategories = ["mental", "physical", "spiritual", "intelligence"];
  const attributeCategories = ["physical", "cognitive", "emotional", "spiritual", "social"];

  // Check if all daily wins are completed
  const allDailyWinsCompleted = areAllDailyWinsCompleted(user.dailyWins);

  // Determine the initial category type
  useEffect(() => {
    if (isEditDialogOpen) {
      if (dailyWinCategories.includes(task.category)) {
        setCategoryType('dailyWin');
      } else {
        setCategoryType('attribute');
      }
    }
  }, [isEditDialogOpen, task.category]);

  // Reset category when category type changes
  useEffect(() => {
    if (categoryType === 'dailyWin') {
      if (!dailyWinCategories.includes(editCategory)) {
        setEditCategory('mental');
      }
    } else {
      if (!attributeCategories.includes(editCategory) || dailyWinCategories.includes(editCategory)) {
        setEditCategory('physical');
      }
    }
  }, [categoryType, editCategory]);

  // Function to handle opening the edit dialog
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    setIsEditDialogOpen(true);
  };

  // Function to handle saving edits
  const handleSaveEdit = () => {
    // Delete the old task
    deleteTask(task.id);

    // Create a new task with the updated values
    const updatedTask: Task = {
      id: uuidv4(),
      title: editTitle,
      description: editDescription,
      completed: false,
      category: editCategory as DailyWinCategory,
      difficulty: editDifficulty,
      expReward: getExpForDifficulty(editDifficulty),
      createdAt: task.createdAt,
      scheduledFor: task.scheduledFor,
      deadline: editDeadline
    };

    // Add the updated task
    addTask(updatedTask);
    setIsEditDialogOpen(false);
  };

  // Function to handle task completion
  const handleCompleteTask = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click from triggering
    // Ensure the task completion happens
    if (!task.completed) {
      completeTask(task.id);

      // Add a small delay to close the dialog if it's open
      if (isEditDialogOpen) {
        setTimeout(() => {
          setIsEditDialogOpen(false);
        }, 100);
      }
    }
  };

  // Format deadline for display
  const formatDeadline = (deadline: Date | undefined) => {
    if (!deadline) return null;

    const now = new Date();
    const deadlineDate = new Date(deadline);

    // Check if deadline is past
    const isPast = deadlineDate < now;

    // Calculate time remaining
    const timeRemaining = deadlineDate.getTime() - now.getTime();
    const hoursRemaining = timeRemaining / (1000 * 60 * 60);

    // Determine urgency level
    let urgencyLevel = "";
    if (isPast) {
      urgencyLevel = "overdue";
    } else if (hoursRemaining < 2) {
      urgencyLevel = "critical"; // Less than 2 hours
    } else if (hoursRemaining < 6) {
      urgencyLevel = "urgent"; // Less than 6 hours
    } else if (hoursRemaining < 24) {
      urgencyLevel = "warning"; // Less than 24 hours
    }

    // If deadline is today, show time only
    const isToday =
      deadlineDate.getDate() === now.getDate() &&
      deadlineDate.getMonth() === now.getMonth() &&
      deadlineDate.getFullYear() === now.getFullYear();

    if (isToday) {
      return {
        text: `Today at ${deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        isPast,
        urgencyLevel
      };
    }

    // If deadline is tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow =
      deadlineDate.getDate() === tomorrow.getDate() &&
      deadlineDate.getMonth() === tomorrow.getMonth() &&
      deadlineDate.getFullYear() === tomorrow.getFullYear();

    if (isTomorrow) {
      return {
        text: `Tomorrow at ${deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        isPast,
        urgencyLevel
      };
    }

    // Otherwise, show date and time
    return {
      text: `${deadlineDate.toLocaleDateString()} at ${deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      isPast,
      urgencyLevel
    };
  };

  const deadlineInfo = formatDeadline(task.deadline);

  return (
    <>
      <div
        className={cn(
          `relative rounded-xl border bg-solo-dark p-4 transition-all cursor-pointer flex flex-col shadow-md overflow-hidden ${task.completed ? 'opacity-60' : 'hover:border-solo-primary hover:shadow-lg'}`
        )}
        onClick={handleEditClick}
      >
        {/* Colored left accent bar */}
        <div className={`absolute left-0 top-0 h-full w-2.5 ${getDifficultyColor(task.difficulty)}`}></div>

        {/* Header row with title and controls */}
        <div className="flex justify-between items-start">
          {/* Title with gradient and shadow */}
          <h3 className={cn(
            "font-extrabold text-2xl bg-gradient-to-r from-solo-primary to-solo-secondary bg-clip-text text-transparent drop-shadow-glow pl-1",
            task.completed ? "line-through text-gray-500 opacity-60" : ""
          )}>
            {task.title}
          </h3>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Are you sure you want to delete this task?')) {
                  deleteTask(task.id);
                }
              }}
              className="p-1 rounded-full hover:bg-red-500/20 text-red-500 transition-colors"
              aria-label="Delete task"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-base text-gray-400 mt-1 mb-2 italic pl-1">{task.description}</p>
        )}

        {/* Deadline display at bottom right */}
        <div className="flex justify-end mt-auto">
          {deadlineInfo && !task.completed && (
            <span className={cn(
              "flex items-center text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-600/20 text-yellow-400",
            )}>
              <Clock className="h-3 w-3 mr-1" />
              {deadlineInfo.text}
            </span>
          )}
        </div>

        {/* Mark as Complete Button */}
        {!task.completed && (
          <div className="mt-4 border-t border-gray-800 pt-2">
            <div className="flex justify-center">
              <button
                onClick={handleCompleteTask}
                className="flex-1 flex items-center justify-center gap-2 py-1.5 rounded bg-green-600/20 hover:bg-green-600/30 text-green-500 transition-colors text-sm"
              >
                <CheckCircle size={16} />
                <span>Mark as Complete</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent
          className="
            glassmorphism
            text-solo-text sm:max-w-[380px] w-[90%] p-3 sm:p-4 max-h-[80vh] overflow-y-auto rounded-xl
            before:!absolute before:!inset-0 before:!rounded-xl
            before:!bg-gradient-to-br before:!from-indigo-500/10 before:!to-purple-500/5
            before:!backdrop-blur-xl before:!-z-10
          "
        >
          <DialogHeader>
            <DialogTitle className="font-semibold text-white/90 tracking-wide text-base">Edit Task</DialogTitle>
          </DialogHeader>

          {allDailyWinsCompleted && categoryType === 'dailyWin' && (
            <Alert className="bg-green-500/20 border-green-500/30 text-green-500 mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>All Daily Wins Completed!</AlertTitle>
              <AlertDescription>
                You've completed all daily wins for today. Consider switching to attribute tasks.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2.5 sm:space-y-3 pt-2 sm:pt-3 relative z-10">
            <div className="space-y-1 sm:space-y-1.5">
              <Label htmlFor="edit-title" className="text-white/80 font-medium text-sm">Title</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Enter task title"
                className="border-indigo-500/20 bg-gray-800/90 h-8 sm:h-9 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
            </div>

            <div className="space-y-1 sm:space-y-1.5">
              <Label htmlFor="edit-description" className="text-white/80 font-medium text-sm">Description (optional)</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Enter task description"
                className="border-indigo-500/20 bg-gray-800/90 min-h-[60px] focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
            </div>

            <div className="space-y-1 sm:space-y-1.5">
              <Label className="text-white/80 font-medium text-sm">Category</Label>
              <div className="grid grid-cols-2 gap-0 rounded-md overflow-hidden border border-indigo-500/20 bg-gray-800/80">
                <button
                  type="button"
                  onClick={() => setCategoryType('attribute')}
                  className={cn(
                    "py-1.5 px-3 text-center transition-all duration-200 text-sm",
                    categoryType === 'attribute'
                      ? "bg-indigo-500/10 border-b-2 border-indigo-500 font-medium text-indigo-300"
                      : "text-gray-400 hover:bg-gray-800/50 border-b-2 border-transparent"
                  )}
                >
                  Attribute
                </button>
                <button
                  type="button"
                  onClick={() => !allDailyWinsCompleted && setCategoryType('dailyWin')}
                  disabled={allDailyWinsCompleted && categoryType !== 'dailyWin'}
                  className={cn(
                    "py-1.5 px-3 text-center transition-all duration-200 text-sm",
                    categoryType === 'dailyWin'
                      ? "bg-indigo-500/10 border-b-2 border-indigo-500 font-medium text-indigo-300"
                      : "text-gray-400 hover:bg-gray-800/50 border-b-2 border-transparent",
                    allDailyWinsCompleted && categoryType !== 'dailyWin' && "opacity-50 cursor-not-allowed hover:bg-transparent"
                  )}
                >
                  Daily Win
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 sm:space-y-1.5">
                <Label htmlFor="edit-difficulty" className="text-white/80 font-medium text-sm">Difficulty</Label>
                <Select
                  value={editDifficulty}
                  onValueChange={(value) => setEditDifficulty(value as Difficulty)}
                >
                  <SelectTrigger id="edit-difficulty" className="border-indigo-500/20 bg-gray-800/90 h-8 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent className="border-indigo-500/20 bg-gray-800/90">
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                    <SelectItem value="boss">Boss</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 sm:space-y-1.5">
                <Label htmlFor="edit-category" className="text-white/80 font-medium text-sm">Type</Label>
                <Select
                  value={editCategory}
                  onValueChange={(value) => setEditCategory(value)}
                >
                  <SelectTrigger id="edit-category" className="border-indigo-500/20 bg-gray-800/90 h-8 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="border-indigo-500/20 bg-gray-800/90">
                    {categoryType === 'dailyWin' ? (
                      // Daily Win Categories
                      <>
                        <SelectItem value="mental">Mental</SelectItem>
                        <SelectItem value="physical">Physical</SelectItem>
                        <SelectItem value="spiritual">Spiritual</SelectItem>
                        <SelectItem value="intelligence">Intelligence</SelectItem>
                      </>
                    ) : (
                      // Attribute Categories
                      <>
                        <SelectItem value="physical">Physical</SelectItem>
                        <SelectItem value="cognitive">Cognitive</SelectItem>
                        <SelectItem value="emotional">Emotional</SelectItem>
                        <SelectItem value="spiritual">Spiritual</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1 sm:space-y-1.5">
              <Label className="text-white/80 font-medium text-sm">Deadline</Label>
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-indigo-300 flex items-center">
                  <CalendarClock className="h-3 w-3 mr-1" /> Automatic deadline enforcement
                </div>
              </div>
              <DateTimePicker
                date={editDeadline || new Date()} // Default to today
                setDate={setEditDeadline}
                className="mt-1"
              />
              <p className="text-xs text-gray-400 mt-0.5">
                Missing a deadline will automatically apply Shadow Penalty, reducing EXP reward by 50%.
              </p>
            </div>

            <div className="pt-1.5">
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="border-indigo-500/20 hover:bg-indigo-500/10 text-indigo-300 text-sm h-8"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium h-8 text-sm"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
