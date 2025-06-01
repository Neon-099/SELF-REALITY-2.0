import React from 'react';
import { XCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface MissedRewardCardProps {
  date: Date;
  customReward?: string;
  missedAt?: Date;
  className?: string;
}

export const MissedRewardCard: React.FC<MissedRewardCardProps> = ({
  date,
  customReward,
  missedAt,
  className
}) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const getDateLabel = () => {
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    if (date.toDateString() === today.toDateString()) return 'Today';
    return format(date, 'EEEE'); // Day of week for other dates
  };

  const getDateColor = () => {
    if (date.toDateString() === yesterday.toDateString()) return 'text-gray-400';
    if (date.toDateString() === today.toDateString()) return 'text-solo-primary';
    return 'text-gray-400';
  };

  return (
    <div className={cn(
      "p-4 rounded-lg border border-red-500/50 bg-red-500/10 cursor-not-allowed opacity-75",
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">
          <div className="flex flex-col">
            <span>{format(date, 'MMM dd, yyyy')}</span>
            <span className={cn("text-xs font-normal", getDateColor())}>
              {getDateLabel()}
            </span>
          </div>
        </div>
        <XCircle className="h-5 w-5 text-red-500" />
      </div>

      {customReward ? (
        <div>
          <p className="text-sm text-gray-300 truncate mb-2">
            "{customReward}"
          </p>
          <div className="text-xs text-red-400 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Missed {missedAt ? format(missedAt, 'MMM dd, yyyy') : 'reward'}
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500">
          No reward was set
        </div>
      )}
    </div>
  );
}; 