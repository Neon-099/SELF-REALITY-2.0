import React from 'react';
import { Star, CheckCircle, CalendarClock, Sunrise } from 'lucide-react';
import { Button } from './ui/button';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

interface DailyQuestCardProps {
  quest: any;
  onComplete: (id: string) => void;
}

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

const DailyQuestCard: React.FC<DailyQuestCardProps> = ({ quest, onComplete }) => {
  const isMobile = useIsMobile();
  const categoryStyle = (quest.category && quest.category !== '') ? categoryColors[quest.category] : {
    bg: 'bg-gray-700',
    text: 'text-gray-300',
    border: 'border-gray-500'
  };

  // Remove day text from quest title for display
  const displayTitle = quest.title.replace(/\s*\(Day \d+\)$/, '');

  // Check if quest is available for completion (only today's quests)
  const isAvailableForCompletion = quest.deadline ?
    new Date().toDateString() === new Date(quest.deadline).toDateString() : true;

  return (
    <div
      id={`daily-quest-${quest.id}`}
      className={
        `relative bg-gradient-to-br from-solo-dark via-gray-900 to-solo-dark border-2 rounded-xl p-5 shadow-lg transition-all duration-200
        ${quest.completed ? 'border-green-400/60 opacity-60' : 'border-green-500/40 hover:border-green-500/80 hover:scale-[1.025]'}
        `
      }
    >
      {/* Decorative Daily Icon */}
      <div className="absolute -top-4 -left-4 bg-green-500/10 rounded-full p-2 shadow-md">
        <Sunrise className="text-green-500" size={28} />
      </div>
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col gap-1">
          <h3 className={`font-bold text-lg tracking-tight ${quest.completed ? 'line-through text-gray-400' : 'text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 drop-shadow-sm'}`}>{displayTitle}</h3>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            {quest.category && quest.category !== '' && quest.category !== 'none' && !quest.category.toLowerCase().includes('select') && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border shadow-sm font-medium ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}>
                {quest.category.charAt(0).toUpperCase() + quest.category.slice(1)}
              </span>
            )}
            <span className={`text-green-500 font-bold flex items-center gap-1 bg-gradient-to-r from-green-500/10 to-green-500/20 px-2 py-0.5 rounded-md shadow-sm ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
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
      {!quest.completed && isAvailableForCompletion && (
        <Button
          variant="outline"
          onClick={() => onComplete(quest.id)}
          size="sm"
          className="w-full flex justify-center items-center gap-2 mt-2 border-green-500/40 hover:border-green-500 bg-gradient-to-r from-green-500/5 to-green-500/10 hover:bg-gradient-to-r hover:from-green-500/10 hover:to-green-500/20 text-green-500 hover:text-green-500 transition-all shadow-sm"
        >
          <CheckCircle size={16} className="drop-shadow-sm" />
          <span className="font-medium tracking-wide">Complete Quest</span>
        </Button>
      )}
      {!quest.completed && !isAvailableForCompletion && (
        <div className="w-full flex justify-center items-center gap-2 mt-2 p-2 bg-gray-700/30 border border-gray-600/40 rounded-md">
          <span className="text-gray-400 text-sm font-medium">Available on quest day</span>
        </div>
      )}
      {quest.completed && (
        <div className="flex items-center justify-center gap-2 mt-2 text-green-400 text-xs font-medium">
          <CheckCircle size={14} className="drop-shadow-sm" /> Completed
        </div>
      )}
    </div>
  );
};

export default DailyQuestCard;