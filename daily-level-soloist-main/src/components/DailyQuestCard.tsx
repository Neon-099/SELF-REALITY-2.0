import React from 'react';
import { Star, CheckCircle, CalendarClock, ListTodo } from 'lucide-react';
import { Button } from './ui/button';
import { format } from 'date-fns';

interface DailyQuestCardProps {
  quest: any;
  onComplete: (id: string) => void;
}

const categoryColors: Record<string, string> = {
  mental: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  physical: 'bg-red-500/10 text-red-400 border-red-500/20',
  spiritual: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  intelligence: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

const DailyQuestCard: React.FC<DailyQuestCardProps> = ({ quest, onComplete }) => {
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
          <h3 className={`font-bold text-lg ${quest.completed ? 'line-through text-gray-400' : 'text-solo-text'}`}>{quest.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 w-max">
              Daily Quest
            </span>
            {quest.category && (
              <span className={`text-xs px-2 py-0.5 rounded-full border ${categoryColors[quest.category] || 'bg-gray-700 text-gray-300 border-gray-500'}`}> 
                {quest.category.charAt(0).toUpperCase() + quest.category.slice(1)}
              </span>
            )}
          </div>
        </div>
        <span className="text-green-500 font-bold flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded-md">
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
          <CalendarClock size={16} className="text-amber-400" />
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
          className="w-full flex justify-center items-center gap-2 mt-2 border-green-500/40 hover:border-green-500 hover:bg-green-500/10 text-green-500 hover:text-green-500/90 transition-colors"
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

export default DailyQuestCard; 