import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';

interface RankBadge {
  id: string;
  name: string;
  color: string;
  daysRequired: number;
  isLocked: boolean;
}

interface RankBadgesTimelineProps {
  rankBadges: RankBadge[];
  currentRankIndex: number;
  onPrevRank: () => void;
  onNextRank: () => void;
}

export default function RankBadgesTimeline({ 
  rankBadges, 
  currentRankIndex,
  onPrevRank,
  onNextRank
}: RankBadgesTimelineProps) {
  
  // Show only three ranks at a time
  const showRanks = 3;
  const halfShow = Math.floor(showRanks / 2);
  
  // Calculate the range of ranks to display
  let startIdx = Math.max(0, currentRankIndex - 1);
  let endIdx = Math.min(rankBadges.length, startIdx + showRanks);
  
  // Adjust start if we're near the end
  if (endIdx === rankBadges.length) {
    startIdx = Math.max(0, endIdx - showRanks);
  }
  
  // Get the visible ranks
  const visibleRanks = rankBadges.slice(startIdx, endIdx);

  // Calculate position adjustments based on selection
  const getPositionStyle = (idx: number, actualIndex: number) => {
    const isLast = actualIndex === rankBadges.length - 1;
    const baseTransform = 'translateY(-50%)';
    
    if (actualIndex < currentRankIndex) {
      return { transform: `${baseTransform} translateX(-12px)` };
    } else if (actualIndex > currentRankIndex && !isLast) {
      return { transform: `${baseTransform} translateX(12px)` };
    }
    return { transform: baseTransform };
  };
  
  return (
    <div className="flex items-center justify-center gap-4 py-8">
      <Button 
        variant="outline" 
        size="icon" 
        onClick={onPrevRank}
        disabled={currentRankIndex === 0}
        className="text-gray-400 hover:text-white rounded-full w-14 h-14 p-0 flex items-center justify-center"
      >
        <ChevronLeft className="h-10 w-10" />
      </Button>
      
      <div className="relative flex-1 overflow-visible">
        <div className="flex items-center justify-center space-x-8 md:space-x-12 px-2 py-4 relative">
          {visibleRanks.map((rank, idx) => {
            const actualIndex = startIdx + idx;
            const isActive = actualIndex === currentRankIndex;
            const isLast = actualIndex === rankBadges.length - 1;
            
            return (
              <div 
                key={rank.id}
                className={`relative transition-all duration-300`}
                style={getPositionStyle(idx, actualIndex)}
              >
                <div 
                  className={`w-28 h-28 rounded-full bg-gradient-to-br ${rank.color} 
                    flex items-center justify-center relative shadow-lg border-2 transition-all duration-300 ${
                      isActive ? 'border-white scale-[1.18] opacity-80' : 'border-transparent opacity-100'
                    }`}
                >
                  <div className="text-white text-center">
                    <div className="text-2xl font-bold">{rank.id}{rank.id !== 'F' && ' Rank'}</div>
                    <div className="text-sm mt-1">{rank.daysRequired} days</div>
                  </div>
                  {rank.isLocked && (
                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                      <Lock className="text-white h-8 w-8" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <Button 
        variant="outline" 
        size="icon"
        onClick={onNextRank}
        disabled={currentRankIndex >= rankBadges.length - 1}
        className="text-gray-400 hover:text-white rounded-full w-14 h-14 p-0 flex items-center justify-center border-2 hover:border-solo-primary hover:bg-solo-dark/50 transition-all duration-200 shadow-lg"
      >
        <ChevronRight className="h-10 w-10" />
      </Button>
    </div>
  );
}
