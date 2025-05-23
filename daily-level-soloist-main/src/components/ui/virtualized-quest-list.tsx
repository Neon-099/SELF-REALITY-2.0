import React, { useMemo, useState } from 'react';
import { MemoizedQuestCard } from './memoized-quest-card';
import { Quest } from '@/lib/types';
import { useIsMobile } from '@/hooks/use-mobile';

interface VirtualizedQuestListProps {
  quests: Quest[];
  onComplete?: (id: string) => void;
  onStart?: (id: string) => void;
  canComplete?: (id: string) => boolean;
  canStart?: (id: string) => boolean;
  itemsPerPage?: number;
  gridCols?: string;
}

export function VirtualizedQuestList({
  quests,
  onComplete,
  onStart,
  canComplete,
  canStart,
  itemsPerPage = 12,
  gridCols = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
}: VirtualizedQuestListProps) {
  const isMobile = useIsMobile();
  const [currentPage, setCurrentPage] = useState(0);

  // Adjust items per page for mobile
  const effectiveItemsPerPage = isMobile ? Math.max(4, itemsPerPage / 2) : itemsPerPage;

  // Paginate quests to avoid rendering too many at once
  const paginatedQuests = useMemo(() => {
    const startIndex = currentPage * effectiveItemsPerPage;
    const endIndex = startIndex + effectiveItemsPerPage;
    return quests.slice(startIndex, endIndex);
  }, [quests, currentPage, effectiveItemsPerPage]);

  const totalPages = Math.ceil(quests.length / effectiveItemsPerPage);
  const hasNextPage = currentPage < totalPages - 1;
  const hasPrevPage = currentPage > 0;

  // If we have few quests, render normally without pagination
  if (quests.length <= 8) {
    return (
      <div className={`grid ${gridCols} gap-4`}>
        {quests.map((quest) => (
          <MemoizedQuestCard
            key={quest.id}
            quest={quest}
            onComplete={onComplete}
            onStart={onStart}
            canComplete={canComplete}
            canStart={canStart}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Paginated quest list */}
      <div className={`grid ${gridCols} gap-4`}>
        {paginatedQuests.map((quest) => (
          <MemoizedQuestCard
            key={quest.id}
            quest={quest}
            onComplete={onComplete}
            onStart={onStart}
            canComplete={canComplete}
            canStart={canStart}
          />
        ))}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center px-4 py-2 bg-solo-dark/50 rounded-lg">
          <button
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={!hasPrevPage}
            className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed text-blue-400 rounded text-sm transition-colors"
          >
            Previous
          </button>

          <span className="text-sm text-gray-400">
            Page {currentPage + 1} of {totalPages} ({quests.length} total quests)
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            disabled={!hasNextPage}
            className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed text-blue-400 rounded text-sm transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
