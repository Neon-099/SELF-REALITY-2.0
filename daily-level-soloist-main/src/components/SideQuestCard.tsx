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
          <h3 className={`font-bold text-lg ${quest.completed ? 'line-through text-gray-400' : 'text-solo-text'}`}>{quest.title}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-solo-primary/10 text-solo-primary border border-solo-primary/20 w-max">
            Side Quest
          </span>
        </div>
        <span className="text-solo-primary font-bold flex items-center gap-1 bg-solo-primary/10 px-2 py-1 rounded-md">
          <Star size={16} className="text-yellow-400 stroke-2" />
          +{quest.expReward} EXP
        </span>
      </div>
      {/* Description */}
      {quest.description && (
        <p className="text-gray-300 mb-3 text-sm">{quest.description}</p>
      )}
      {/* Deadline */}
      {quest.deadline && (
        <div className="flex items-center gap-2 my-2 p-2 bg-amber-950/30 rounded-md border border-amber-800/30">
          <CalendarClock size={16} className="text-amber-500" />
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
          className="w-full flex justify-center items-center gap-2 mt-2 border-solo-primary/40 hover:border-solo-primary hover:bg-solo-primary/10 text-solo-primary hover:text-solo-primary/90 transition-colors"
        >
          <CheckCircle size={16} />
          Complete Quest
        </Button>
      )}
      {quest.completed && (
        <div className="flex items-center justify-center gap-2 mt-2 text-green-400 text-sm">
          <CheckCircle size={16} /> Completed
        </div>
      )}
    </div>
  );
};

export default SideQuestCard; 