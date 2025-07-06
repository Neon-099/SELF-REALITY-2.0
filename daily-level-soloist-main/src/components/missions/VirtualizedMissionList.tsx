import React, { useState, useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { ChevronLeft, ChevronRight, Star, Lock, Trophy, Calendar, Activity, Play, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { useSoloLevelingStore } from '@/lib/store';
import { PredefinedMission } from '@/data/predefined-missions';
import { Rank } from '@/lib/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface VirtualizedMissionListProps {
  missions: PredefinedMission[];
  rank: Rank;
  isLocked?: boolean;
  onViewMission: (mission: PredefinedMission) => void;
}

interface MissionItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    missions: PredefinedMission[];
    rank: Rank;
    isLocked: boolean;
    onViewMission: (mission: PredefinedMission) => void;
    completedMissionHistory: any[];
    dayUnlockStatus: Record<number, boolean>;
    isMobile: boolean;
  };
}

const ITEMS_PER_PAGE = 10;
const ITEM_HEIGHT = 280; // Height of each mission card

// Mission Item Component for virtualization
const MissionItem: React.FC<MissionItemProps> = ({ index, style, data }) => {
  const { missions, rank, isLocked, onViewMission, completedMissionHistory, dayUnlockStatus, isMobile } = data;
  const mission = missions[index];

  if (!mission) return null;

  const isCompleted = mission.completed || completedMissionHistory.some(cm => cm.id === mission.id);
  const isStarted = mission.started && !isCompleted;
  const isBoss = mission.difficulty === 'boss';
  const isDayUnlocked = dayUnlockStatus[mission.day] || false;

  // Get task completion progress
  const completedTaskCount = mission.completedTaskIndices?.length || 0;
  const totalTaskCount = mission.count || 1;
  const taskProgress = isStarted ? Math.round((completedTaskCount / totalTaskCount) * 100) : 0;

  // Helper to get rank colors
  const getRankColor = (rank: Rank) => {
    switch (rank) {
      case 'F': return 'from-gray-400 to-gray-600 border-gray-400';
      case 'E': return 'from-orange-400 to-orange-600 border-orange-400';
      case 'D': return 'from-blue-400 to-blue-600 border-blue-400';
      case 'C': return 'from-green-400 to-green-600 border-green-400';
      case 'B': return 'from-purple-400 to-purple-600 border-purple-400';
      case 'A': return 'from-red-400 to-red-600 border-red-400';
      case 'S': return 'from-yellow-400 to-yellow-600 border-yellow-400';
      case 'SS': return 'from-emerald-400 to-emerald-600 border-emerald-400';
      case 'SSS': return 'from-indigo-400 to-indigo-600 border-indigo-400';
      default: return 'from-gray-400 to-gray-600 border-gray-400';
    }
  };

  const getRankSolidColor = (rank: Rank) => {
    switch (rank) {
      case 'F': return 'bg-gray-500 text-white';
      case 'E': return 'bg-orange-500 text-white';
      case 'D': return 'bg-blue-500 text-white';
      case 'C': return 'bg-green-500 text-white';
      case 'B': return 'bg-purple-500 text-white';
      case 'A': return 'bg-red-500 text-white';
      case 'S': return 'bg-yellow-500 text-gray-900';
      case 'SS': return 'bg-emerald-500 text-white';
      case 'SSS': return 'bg-indigo-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRankBadgeColor = (rank: Rank) => {
    switch (rank) {
      case 'F': return 'border-gray-400 text-gray-500';
      case 'E': return 'border-orange-400 text-orange-500';
      case 'D': return 'border-blue-400 text-blue-500';
      case 'C': return 'border-green-400 text-green-500';
      case 'B': return 'border-purple-400 text-purple-500';
      case 'A': return 'border-red-400 text-red-500';
      case 'S': return 'border-yellow-400 text-yellow-500';
      case 'SS': return 'border-emerald-400 text-emerald-500';
      case 'SSS': return 'border-indigo-400 text-indigo-500';
      default: return 'border-gray-400 text-gray-500';
    }
  };

  const rankGradient = getRankColor(mission.rank as Rank);
  const rankSolid = getRankSolidColor(mission.rank as Rank);
  const rankBadge = getRankBadgeColor(mission.rank as Rank);

  // Glassmorphism and border classes
  const glassClasses = 'backdrop-blur-lg bg-card dark:bg-background/80';

  // Special styling for boss missions
  const borderClasses = isBoss
    ? `border-2 border-amber-500/60 ${isLocked ? 'border-opacity-30' : 'border-opacity-80'}`
    : `border-2 ${isLocked ? 'border-gray-300/40' : `border-${mission.rank.toLowerCase()}-400/60`}`;

  // Shadow and hover effects
  const shadowClasses = isCompleted
    ? isBoss
      ? 'shadow-md shadow-amber-500/10'
      : `shadow-md shadow-${mission.rank.toLowerCase()}-500/10`
    : isBoss
      ? 'shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 shadow-amber-500/20'
      : 'shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300';

  // Completion styles
  const completedClasses = isCompleted
    ? isBoss
      ? 'opacity-85 dark:opacity-75 bg-amber-950/5'
      : `opacity-85 dark:opacity-75 bg-${mission.rank.toLowerCase()}-950/5`
    : '';

  return (
    <div style={style} className="px-2">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: (index % ITEMS_PER_PAGE) * 0.1 }}
        className="w-full h-full"
      >
        <Card
          className={`relative overflow-hidden rounded-xl ${borderClasses} ${glassClasses} ${shadowClasses} ${completedClasses} group cursor-pointer max-w-full w-full h-[260px]`}
          onClick={() => onViewMission(mission)}
        >
          {/* Lock overlay for locked days */}
          {!isDayUnlocked && (
            <div className="absolute inset-0 z-40 backdrop-blur-[1px] bg-black/20 flex flex-col items-center justify-center">
              <div className="p-3 bg-black/60 rounded-full flex items-center justify-center">
                <Lock className="h-6 w-6 text-white/90" />
              </div>
              <div className="text-xs text-white mt-2 bg-black/60 px-2 py-1 rounded-md">
                Click to preview
              </div>
            </div>
          )}

          {/* Rank indicator strip */}
          <div className={`absolute top-0 left-0 w-2 h-full ${isBoss ? 'bg-amber-500/80' : rankSolid.split(' ')[0]} group-hover:w-3 transition-all duration-300`}></div>

          {/* Completed corner banner */}
          {isCompleted && (
            <div className="absolute top-0 right-0 z-20">
              <div className="w-20 h-20 overflow-hidden">
                <div className={`absolute transform rotate-45 bg-gradient-to-r ${isBoss ? 'from-amber-400 to-amber-600' : `from-${mission.rank.toLowerCase()}-400 to-${mission.rank.toLowerCase()}-600`} text-xs font-bold py-1 right-[-40px] top-[15px] w-[140px] text-center text-white shadow-md`}>
                  COMPLETED
                </div>
              </div>
            </div>
          )}

          {/* Boss indicator */}
          {isBoss && !isCompleted && (
            <div className="absolute top-0 right-0 z-10">
              <div className="w-16 h-16 overflow-hidden">
                <div className="absolute transform rotate-45 bg-gradient-to-r from-amber-400 to-amber-600 text-xs font-bold py-1 right-[-35px] top-[12px] w-[120px] text-center text-gray-900 shadow-md group-hover:from-amber-500 group-hover:to-amber-700 transition-colors duration-300">
                  BOSS
                </div>
              </div>
            </div>
          )}

          {/* Started indicator */}
          {isStarted && (
            <div className="absolute top-2 right-2">
              <Badge variant="outline" className="bg-blue-500/20 border-blue-400 text-blue-400">
                In Progress
              </Badge>
            </div>
          )}

          <CardContent className="p-0 h-full flex flex-col">
            {/* Mission header */}
            <div className={`p-3 sm:p-4 border-b bg-gradient-to-br ${isBoss ? 'from-amber-500/10 to-amber-800/20' : `from-${mission.rank.toLowerCase()}-400/5 to-${mission.rank.toLowerCase()}-600/10`} relative overflow-hidden`}>
              {/* Rank badge */}
              <div className="flex justify-between items-center mb-3 relative z-10">
                <Badge
                  className={`px-2 py-1 text-xs ${isBoss ? 'border-amber-400 text-amber-500 font-bold' : rankBadge} bg-transparent font-semibold backdrop-blur-sm border-2`}
                >
                  {mission.rank} Rank {isBoss && '• BOSS'}
                </Badge>
                <Badge
                  className={`flex items-center gap-1 bg-transparent border-2 font-semibold backdrop-blur-sm text-xs px-2 py-1 ${isBoss ? 'border-amber-500 text-amber-500' : `border-${mission.rank.toLowerCase()}-400 text-${mission.rank.toLowerCase()}-400`}`}
                >
                  <Star className={`h-3 w-3 ${isBoss ? 'fill-amber-500' : `fill-${mission.rank.toLowerCase()}-400`}`} />
                  +{mission.expReward} EXP
                </Badge>
              </div>

              {/* Mission title */}
              <div className="flex items-center gap-2 relative z-10">
                <h3
                  className={`font-bold text-lg ${isBoss
                    ? 'bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent'
                    : `bg-gradient-to-r ${rankGradient} bg-clip-text text-transparent`}
                    ${isCompleted ? 'opacity-70 line-through' : ''}
                    tracking-tight leading-tight group-hover:tracking-normal transition-all duration-300`}
                >
                  {mission.title}
                </h3>
              </div>
            </div>

            {/* Mission description */}
            <div className={`p-3 sm:p-4 flex-1 flex flex-col bg-gradient-to-br ${isBoss ? 'from-amber-500/5 to-amber-800/10' : `from-${mission.rank.toLowerCase()}-400/3 to-${mission.rank.toLowerCase()}-600/5`} border-t border-white/10`}>
              {!isStarted ? (
                <p className={`text-sm flex-grow ${isBoss ? 'text-amber-400/70' : `text-${mission.rank.toLowerCase()}-400/70`} leading-relaxed line-clamp-3`}>
                  {mission.description}
                </p>
              ) : (
                <div className="flex-1 flex flex-col">
                  <p className={`text-sm ${isBoss ? 'text-amber-400/70' : `text-${mission.rank.toLowerCase()}-400/70`} leading-relaxed line-clamp-2 mb-3`}>
                    {mission.description}
                  </p>
                  {/* Task Progress for started missions */}
                  {mission.count && mission.count > 1 && (
                    <div className="mt-auto space-y-2">
                      <div className="flex justify-center items-center text-xs">
                        <span className="text-xs font-medium">Progress: {taskProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${isBoss ? 'bg-amber-500' : `bg-${mission.rank.toLowerCase()}-500`} transition-all duration-300`}
                          style={{ width: `${taskProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Day indicator */}
              <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Day {mission.day}
              </div>
            </div>

            {/* Mission action button */}
            <div className="h-12" onClick={(e) => e.stopPropagation()}>
              {!isCompleted && !isLocked && !isStarted ? (
                <Button
                  className={`w-full rounded-none h-12 text-sm font-medium ${isBoss
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-900'
                    : `${rankSolid} hover:brightness-110`}`}
                  onClick={() => onViewMission(mission)}
                >
                  {isBoss ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-bounce">⚔️</div>
                      <span>View Boss Battle</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Play className="h-4 w-4" />
                      <span>View Mission</span>
                    </div>
                  )}
                </Button>
              ) : isStarted ? (
                <Button
                  className="w-full rounded-none h-12 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => onViewMission(mission)}
                >
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    <span>Continue Mission</span>
                  </div>
                </Button>
              ) : !isCompleted && !isDayUnlocked ? (
                <Button
                  className="w-full rounded-none h-12 text-sm font-medium bg-gradient-to-r from-gray-700 to-gray-800 text-gray-300 hover:brightness-110"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewMission(mission);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    <span>Preview Mission</span>
                  </div>
                </Button>
              ) : isCompleted ? (
                <div className={`w-full rounded-none h-12 flex items-center justify-center text-sm font-medium ${isBoss
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-gray-100'
                  : `bg-gradient-to-r from-${mission.rank.toLowerCase()}-600 to-${mission.rank.toLowerCase()}-700 text-white`}`}>
                  <span>Completed</span>
                </div>
              ) : (
                <div className="w-full rounded-none h-12 flex items-center justify-center text-sm font-medium bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300">
                  <Lock className="h-4 w-4 mr-2" />
                  <span>Locked</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export const VirtualizedMissionList: React.FC<VirtualizedMissionListProps> = ({
  missions,
  rank,
  isLocked = false,
  onViewMission
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const completedMissionHistory = useSoloLevelingStore(state => state.completedMissionHistory);
  const isMobile = useIsMobile();

  // Mock day unlock status - you should replace this with actual logic
  const dayUnlockStatus = useMemo(() => {
    const status: Record<number, boolean> = {};
    for (let day = 1; day <= 200; day++) {
      status[day] = !isLocked; // For now, unlock all days if rank is unlocked
    }
    return status;
  }, [isLocked]);

  // Sort missions for better UX
  const sortedMissions = useMemo(() => {
    return [...missions].sort((a, b) => {
      const aCompleted = a.completed || completedMissionHistory.some(cm => cm.id === a.id);
      const bCompleted = b.completed || completedMissionHistory.some(cm => cm.id === b.id);
      const aStarted = a.started && !aCompleted;
      const bStarted = b.started && !bCompleted;

      // First priority: completed missions go to the bottom
      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;

      // Second priority: started (in-progress) missions go to the top
      if (aStarted && !bStarted) return -1;
      if (!aStarted && bStarted) return 1;

      // Third priority: sort by day
      return a.day - b.day;
    });
  }, [missions, completedMissionHistory]);

  const totalPages = Math.ceil(sortedMissions.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, sortedMissions.length);
  const currentPageMissions = sortedMissions.slice(startIndex, endIndex);

  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  }, [totalPages]);

  const handlePageSelect = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Prepare data for virtualized list
  const itemData = useMemo(() => ({
    missions: currentPageMissions,
    rank,
    isLocked,
    onViewMission,
    completedMissionHistory,
    dayUnlockStatus,
    isMobile
  }), [currentPageMissions, rank, isLocked, onViewMission, completedMissionHistory, dayUnlockStatus, isMobile]);

  if (sortedMissions.length === 0) {
    return (
      <div className="text-center py-16 my-8 bg-muted/10 rounded-2xl border border-border flex flex-col items-center justify-center gap-4">
        <div className="p-4 rounded-full bg-muted/20">
          <Calendar className="h-10 w-10 text-muted-foreground opacity-70" />
        </div>
        <div>
          <p className="text-xl font-semibold text-muted-foreground">No missions available</p>
          <p className="text-sm text-muted-foreground/70 mt-2">Create some missions to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages - 1}
              className="flex items-center gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Page {currentPage + 1} of {totalPages}
            </span>
            {!isMobile && (
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageIndex;
                  if (totalPages <= 5) {
                    pageIndex = i;
                  } else if (currentPage < 3) {
                    pageIndex = i;
                  } else if (currentPage > totalPages - 4) {
                    pageIndex = totalPages - 5 + i;
                  } else {
                    pageIndex = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageIndex}
                      variant={currentPage === pageIndex ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageSelect(pageIndex)}
                      className="w-8 h-8 p-0"
                    >
                      {pageIndex + 1}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mission Stats */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {startIndex + 1}-{endIndex} of {sortedMissions.length} missions
        </span>
        <span>
          {completedMissionHistory.filter(cm => missions.some(m => m.id === cm.id)).length} completed
        </span>
      </div>

      {/* Virtualized Mission List */}
      <div className="border border-border/30 rounded-lg overflow-hidden">
      <List
          height={Math.min(currentPageMissions.length * ITEM_HEIGHT, 6 * ITEM_HEIGHT)} // Max 6 items visible
          itemCount={currentPageMissions.length}
          itemSize={ITEM_HEIGHT}
          width="100%"
          itemData={itemData}
          className="scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
        >
          {MissionItem}
        </List>
      </div>

      {/* Bottom Pagination (for mobile) */}
      {totalPages > 1 && isMobile && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground px-4">
            {currentPage + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default VirtualizedMissionList;