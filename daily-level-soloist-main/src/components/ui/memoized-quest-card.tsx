import React, { memo } from 'react';
import { MainQuestCard } from '../MainQuestCard';
import { SideQuestCard } from '../SideQuestCard';
import { DailyQuestCard } from '../DailyQuestCard';
import { RecoveryQuestCard } from '../RecoveryQuestCard';
import { Quest } from '@/lib/types';

interface MemoizedQuestCardProps {
  quest: Quest;
  onComplete?: (id: string) => void;
  onStart?: (id: string) => void;
  canComplete?: (quest: Quest) => boolean;
  canStart?: (quest: Quest) => boolean;
}

// Memoized quest card component to prevent unnecessary re-renders
const MemoizedQuestCard = memo(({
  quest,
  onComplete,
  onStart,
  canComplete,
  canStart
}: MemoizedQuestCardProps) => {
  // Determine quest type and render appropriate card
  if (quest.isRecoveryQuest) {
    return (
      <RecoveryQuestCard
        quest={quest}
        onComplete={onComplete || (() => {})}
        onStart={onStart || (() => {})}
        canComplete={canComplete || (() => true)}
        canStart={canStart || (() => true)}
      />
    );
  }

  if (quest.isDaily) {
    return (
      <DailyQuestCard
        quest={quest}
        onComplete={onComplete || (() => {})}
      />
    );
  }

  if (quest.isMainQuest) {
    return (
      <MainQuestCard
        quest={quest}
        onComplete={onComplete || (() => {})}
        onStart={onStart || (() => {})}
        canComplete={canComplete || (() => true)}
        canStart={canStart || (() => true)}
      />
    );
  }

  // Default to side quest
  return (
    <SideQuestCard
      quest={quest}
      onComplete={onComplete || (() => {})}
      onStart={onStart || (() => {})}
      canComplete={canComplete || (() => true)}
      canStart={canStart || (() => true)}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  return (
    prevProps.quest.id === nextProps.quest.id &&
    prevProps.quest.completed === nextProps.quest.completed &&
    prevProps.quest.started === nextProps.quest.started &&
    prevProps.quest.tasks?.length === nextProps.quest.tasks?.length &&
    JSON.stringify(prevProps.quest.tasks?.map(t => ({ id: t.id, completed: t.completed }))) ===
    JSON.stringify(nextProps.quest.tasks?.map(t => ({ id: t.id, completed: t.completed })))
  );
});

MemoizedQuestCard.displayName = 'MemoizedQuestCard';

export { MemoizedQuestCard };
