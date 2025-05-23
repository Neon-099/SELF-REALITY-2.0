import React, { useMemo, useState } from 'react';
import { TaskCard } from './task-card';
import { CompletedTaskCard } from './completed-task-card';
import { Task } from '@/lib/types';
import { useIsMobile } from '@/hooks/use-mobile';

interface VirtualizedTaskListProps {
  tasks: Task[];
  isCompleted?: boolean;
  itemsPerPage?: number;
}

export function VirtualizedTaskList({
  tasks,
  isCompleted = false,
  itemsPerPage = 20
}: VirtualizedTaskListProps) {
  const isMobile = useIsMobile();
  const [currentPage, setCurrentPage] = useState(0);

  // Paginate tasks to avoid rendering too many at once
  const paginatedTasks = useMemo(() => {
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return tasks.slice(startIndex, endIndex);
  }, [tasks, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(tasks.length / itemsPerPage);
  const hasNextPage = currentPage < totalPages - 1;
  const hasPrevPage = currentPage > 0;

  // If we have few tasks, render normally without pagination
  if (tasks.length <= 10) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map((task) => (
          isCompleted ? (
            <CompletedTaskCard key={task.id} task={task} />
          ) : (
            <TaskCard key={task.id} task={task} />
          )
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Paginated task list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paginatedTasks.map((task) => (
          isCompleted ? (
            <CompletedTaskCard key={task.id} task={task} />
          ) : (
            <TaskCard key={task.id} task={task} />
          )
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
            Page {currentPage + 1} of {totalPages} ({tasks.length} total tasks)
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
