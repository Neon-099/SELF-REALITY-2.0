import React from 'react';
import { Star, CheckCircle, CalendarClock, Swords, ListTodo, Sword } from 'lucide-react';
import { Button } from './ui/button';
import { format } from 'date-fns';
import { useSoloLevelingStore } from '@/lib/store';
import { toast } from '@/hooks/use-toast';

interface QuestCardProps {
  quest: any;
}

export const MainQuestCard: React.FC<QuestCardProps> = ({ quest }) => {
  const { completeQuest, startQuest } = useSoloLevelingStore(state => ({
    completeQuest: state.completeQuest,
    startQuest: state.startQuest
  }));

  const handleComplete = () => {
    completeQuest(quest.id);
    toast({
      title: "Quest Completed!",
      description: `Congratulations! You've completed "${quest.title}"`,
    });
  };

  const handleStart = async () => {
    try {
      await startQuest(quest.id);

      // Log for debugging
      console.log('Quest started from QuestCards:', quest.id);

      toast({
        title: "Quest Started!",
        description: `You've started "${quest.title}"`,
      });
    } catch (error) {
      console.error('Error starting quest:', error);
      toast({
        title: "Error Starting Quest",
        description: "There was an error starting the quest. Please try again.",
        variant: "destructive"
      });
    }
  };

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
          <h3 className={`font-bold text-lg tracking-tight ${quest.completed ? 'line-through text-gray-400' : 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 drop-shadow-sm'}`}>{quest.title}</h3>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            {quest.started && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-green-500/10 to-green-600/10 text-green-400 border border-green-500/20 shadow-sm font-medium">
                In Progress
              </span>
            )}
            <span className="text-yellow-400 font-bold flex items-center gap-1 bg-gradient-to-r from-yellow-500/10 to-yellow-600/20 px-2 py-0.5 rounded-md text-xs shadow-sm">
              <Star size={14} className="text-yellow-400 stroke-2 drop-shadow-glow" />
              +{quest.expReward} XP
            </span>
          </div>
        </div>
      </div>
      {/* Description */}
      {quest.description && (
        <p className="text-gray-300/90 mb-3 text-xs leading-relaxed">{quest.description}</p>
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
      {!quest.completed && !quest.started && (
        <Button
          variant="outline"
          onClick={handleStart}
          size="sm"
          className="w-full flex justify-center items-center gap-2 mt-2 border-yellow-500/40 hover:border-yellow-500 bg-gradient-to-r from-yellow-500/5 to-yellow-600/10 hover:bg-gradient-to-r hover:from-yellow-500/10 hover:to-yellow-600/20 text-yellow-400 hover:text-yellow-300 transition-all shadow-sm"
        >
          <ListTodo size={16} className="drop-shadow-sm" />
          <span className="font-medium tracking-wide">Start Quest</span>
        </Button>
      )}
      {!quest.completed && quest.started && (
        <Button
          variant="outline"
          onClick={handleComplete}
          size="sm"
          className="w-full flex justify-center items-center gap-2 mt-2 border-yellow-500/40 hover:border-yellow-500 bg-gradient-to-r from-yellow-500/5 to-yellow-600/10 hover:bg-gradient-to-r hover:from-yellow-500/10 hover:to-yellow-600/20 text-yellow-400 hover:text-yellow-300 transition-all shadow-sm"
        >
          <CheckCircle size={16} className="drop-shadow-sm" />
          <span className="font-medium tracking-wide">Complete Quest</span>
        </Button>
      )}
      {quest.completed && (
        <div className="flex items-center justify-center gap-2 mt-2 text-yellow-400 text-xs font-medium">
          <CheckCircle size={14} className="drop-shadow-sm" /> Completed
        </div>
      )}
    </div>
  );
};

export const DailyQuestCard: React.FC<QuestCardProps> = ({ quest }) => {
  const completeQuest = useSoloLevelingStore(state => state.completeQuest);

  const handleComplete = () => {
    completeQuest(quest.id);
    toast({
      title: "Daily Quest Completed!",
      description: `Congratulations! You've completed your daily quest "${quest.title}"`,
    });
  };

  const categoryColors: Record<string, { bg: string, text: string, border: string }> = {
    mental: {
      bg: 'bg-gradient-to-r from-blue-500/10 to-blue-600/10',
      text: 'text-blue-400',
      border: 'border-blue-500/20'
    },
    physical: {
      bg: 'bg-gradient-to-r from-red-500/10 to-red-600/10',
      text: 'text-red-400',
      border: 'border-red-500/20'
    },
    spiritual: {
      bg: 'bg-gradient-to-r from-purple-500/10 to-purple-600/10',
      text: 'text-purple-400',
      border: 'border-purple-500/20'
    },
    intelligence: {
      bg: 'bg-gradient-to-r from-yellow-500/10 to-yellow-600/10',
      text: 'text-yellow-400',
      border: 'border-yellow-500/20'
    },
  };

  const categoryStyle = quest.category ? categoryColors[quest.category] : {
    bg: 'bg-gray-700',
    text: 'text-gray-300',
    border: 'border-gray-500'
  };

  return (
    <div
      className={
        `relative bg-gradient-to-br from-solo-dark via-gray-900 to-solo-dark border-2 rounded-xl p-5 shadow-lg transition-all duration-200
        ${quest.completed ? 'border-green-400/60 opacity-60' : 'border-green-500/40 hover:border-green-500/80 hover:scale-[1.025]'}
        `
      }
    >
      {/* Decorative Daily Icon */}
      <div className="absolute -top-4 -left-4 bg-green-500/10 rounded-full p-2 shadow-md">
        <ListTodo className="text-green-500" size={28} />
      </div>
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col gap-1">
          <h3 className={`font-bold text-lg tracking-tight ${quest.completed ? 'line-through text-gray-400' : 'text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 drop-shadow-sm'}`}>{quest.title}</h3>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            {quest.category && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border shadow-sm font-medium ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}>
                {quest.category.charAt(0).toUpperCase() + quest.category.slice(1)}
              </span>
            )}
            <span className="text-green-500 font-bold flex items-center gap-1 bg-gradient-to-r from-green-500/10 to-green-500/20 px-2 py-0.5 rounded-md text-xs shadow-sm">
              <Star size={14} className="text-yellow-400 stroke-2 drop-shadow-glow" />
              +{quest.expReward} XP
            </span>
          </div>
        </div>
      </div>
      {/* Description */}
      {quest.description && (
        <p className="text-gray-300/90 mb-3 text-xs leading-relaxed">{quest.description}</p>
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
      {/* Complete Button */}
      {!quest.completed && (
        <Button
          variant="outline"
          onClick={handleComplete}
          size="sm"
          className="w-full flex justify-center items-center gap-2 mt-2 border-green-500/40 hover:border-green-500 bg-gradient-to-r from-green-500/5 to-green-500/10 hover:bg-gradient-to-r hover:from-green-500/10 hover:to-green-500/20 text-green-500 hover:text-green-500 transition-all shadow-sm"
        >
          <CheckCircle size={16} className="drop-shadow-sm" />
          <span className="font-medium tracking-wide">Complete Quest</span>
        </Button>
      )}
      {quest.completed && (
        <div className="flex items-center justify-center gap-2 mt-2 text-green-400 text-xs font-medium">
          <CheckCircle size={14} className="drop-shadow-sm" /> Completed
        </div>
      )}
    </div>
  );
};

export const SideQuestCard: React.FC<QuestCardProps> = ({ quest }) => {
  const completeQuest = useSoloLevelingStore(state => state.completeQuest);

  const handleComplete = () => {
    completeQuest(quest.id);
    toast({
      title: "Side Quest Completed!",
      description: `Congratulations! You've completed "${quest.title}"`,
    });
  };

  return (
    <div
      className={
        `relative bg-gradient-to-br from-solo-dark via-gray-900 to-solo-dark border-2 rounded-xl p-5 shadow-lg transition-all duration-200
        ${quest.completed ? 'border-green-400/60 opacity-60' : 'border-solo-primary/40 hover:border-solo-primary/80 hover:scale-[1.025]'}
        `
      }
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
          <div className="flex items-center gap-1">
            <span className="text-solo-primary font-bold flex items-center gap-1 bg-gradient-to-r from-solo-primary/10 to-solo-primary/20 px-2 py-0.5 rounded-md text-xs shadow-sm">
              <Star size={14} className="text-yellow-400 stroke-2 drop-shadow-glow" />
              +{quest.expReward} XP
            </span>
          </div>
        </div>
      </div>
      {/* Description */}
      {quest.description && (
        <p className="text-gray-300/90 mb-3 text-xs leading-relaxed">{quest.description}</p>
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
      {/* Complete Button */}
      {!quest.completed && (
        <Button
          variant="outline"
          onClick={handleComplete}
          size="sm"
          className="w-full flex justify-center items-center gap-2 mt-2 border-solo-primary/40 hover:border-solo-primary bg-gradient-to-r from-solo-primary/5 to-solo-primary/10 hover:bg-gradient-to-r hover:from-solo-primary/10 hover:to-solo-primary/20 text-solo-primary hover:text-solo-primary transition-all shadow-sm"
        >
          <CheckCircle size={16} className="drop-shadow-sm" />
          <span className="font-medium tracking-wide">Complete Quest</span>
        </Button>
      )}
      {quest.completed && (
        <div className="flex items-center justify-center gap-2 mt-2 text-green-400 text-xs font-medium">
          <CheckCircle size={14} className="drop-shadow-sm" /> Completed
        </div>
      )}
    </div>
  );
};