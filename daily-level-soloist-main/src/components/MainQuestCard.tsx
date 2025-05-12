import React from 'react';
import { Star, CheckCircle, CalendarClock, Swords, ListTodo, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { format } from 'date-fns';

interface MainQuestCardProps {
  quest: any;
  onComplete: (id: string) => void;
  onStart: (id: string) => void;
  canComplete: (id: string) => boolean;
}

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
          {canComplete(quest.id) && (
            <Button
              variant="outline"
              onClick={() => onComplete(quest.id)}
              size="sm"
              className="w-full flex justify-center items-center gap-2 border-yellow-500/40 hover:border-yellow-500 hover:bg-yellow-500/10 text-yellow-400 hover:text-yellow-300 transition-colors"
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