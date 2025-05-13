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
  onSelectRank?: (index: number) => void;
}

export default function RankBadgesTimeline({ 
  rankBadges, 
  currentRankIndex,
  onPrevRank,
  onNextRank,
  onSelectRank
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

  // Handle direct rank selection with debugging
  const handleRankClick = (index: number, rankId: string) => {
    console.log(`Rank clicked: ${rankId} at visible index ${index}, actual index: ${startIdx + index}`);
    if (onSelectRank && index >= 0 && (startIdx + index) < rankBadges.length) {
      const actualIndex = startIdx + index;
      console.log(`Selecting rank: ${rankId} at index ${actualIndex}`);
      onSelectRank(actualIndex);
    }
  };
  
  return (
    <div className="flex items-center justify-center gap-2 md:gap-4 py-8">
      <Button 
        variant="outline" 
        size="icon" 
        onClick={onPrevRank}
        disabled={currentRankIndex === 0}
        className="text-gray-400 hover:text-white rounded-full w-12 h-12 md:w-14 md:h-14 p-0 flex items-center justify-center touch-manipulation"
      >
        <ChevronLeft className="h-8 w-8 md:h-10 md:w-10" />
      </Button>
      
      <div className="relative flex-1 overflow-visible">
        <div className="flex items-center justify-center space-x-4 md:space-x-8 lg:space-x-12 px-2 py-4 relative">
          {visibleRanks.map((rank, idx) => {
            const actualIndex = startIdx + idx;
            const isActive = actualIndex === currentRankIndex;
            const isLast = actualIndex === rankBadges.length - 1;
            const isClickable = !rank.isLocked;
            
            return (
              <div 
                key={rank.id}
                className={`relative transition-all duration-300`}
                style={getPositionStyle(idx, actualIndex)}
              >
                <button 
                  type="button"
                  onClick={() => handleRankClick(idx, rank.id)}
                  aria-label={`Select ${rank.name}`}
                  className={`w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br ${rank.color} 
                    flex items-center justify-center relative shadow-lg border-2 transition-all duration-300 ${
                      isActive ? 'border-white scale-[1.18] opacity-80' : 'border-transparent opacity-100'
                    } cursor-pointer hover:border-white/70 active:scale-95 touch-manipulation group`}
                >
                  <div className="text-white text-center">
                    <div className="text-xl md:text-2xl font-bold">{rank.id}{rank.id !== 'F' && ' Rank'}</div>
                    <div className="text-xs md:text-sm mt-1">{rank.daysRequired} days</div>
                    {isClickable && !isActive && (
                      <div className="text-xs mt-1 opacity-80 hidden md:block">Tap to select</div>
                    )}
                  </div>
                  {rank.isLocked && (
                    <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center backdrop-blur-sm hover:bg-black/50 transition-all">
                      <Lock className="text-white h-8 w-8" />
                      <div className="text-xs text-white mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Tap to view
                      </div>
                    </div>
                  )}
                </button>
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
        className="text-gray-400 hover:text-white rounded-full w-12 h-12 md:w-14 md:h-14 p-0 flex items-center justify-center border-2 hover:border-solo-primary hover:bg-solo-dark/50 transition-all duration-200 shadow-lg touch-manipulation"
      >
        <ChevronRight className="h-8 w-8 md:h-10 md:w-10" />
      </Button>
    </div>
  );
}
