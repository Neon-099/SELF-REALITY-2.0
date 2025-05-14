import React from 'react';
import { Star, CheckCircle, CalendarClock, Sword } from 'lucide-react';
import { Button } from './ui/button';
import { format } from 'date-fns';

interface SideQuestCardProps {
  quest: any;
  onComplete: (id: string) => void;
}

const SideQuestCard: React.FC<SideQuestCardProps> = ({ quest, onComplete }) => {
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
          <h3 className={`font-bold text-lg tracking-tight ${quest.completed ? 'line-through text-gray-400' : 'text-white drop-shadow-sm'}`}>{quest.title}</h3>
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
          onClick={() => onComplete(quest.id)}
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

export default SideQuestCard; 