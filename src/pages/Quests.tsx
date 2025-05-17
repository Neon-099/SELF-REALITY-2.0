import React, { useEffect, useState } from 'react';
import { useSoloLevelingStore } from '../lib/store';
import { MainQuestCard, DailyQuestCard, SideQuestCard } from '../components/Quests';
import type { Quest } from '../lib/store/slices/quest-slice';

const Quests: React.FC = () => {
  const store = useSoloLevelingStore();
  const quests = store.quests || [];
  const loadQuests = store.loadQuests;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeQuests = async () => {
      try {
        setIsLoading(true);
        await loadQuests();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load quests');
        console.error('Failed to load quests:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeQuests();
  }, [loadQuests]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading Quests...</h2>
          <p className="text-gray-500">Please wait while we fetch your quests.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-500 mb-2">Error Loading Quests</h2>
          <p className="text-gray-500">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const mainQuests = quests.filter(q => q.isMainQuest);
  const sideQuests = quests.filter(q => !q.isMainQuest && !q.isDaily);
  const dailyQuests = quests.filter(q => q.isDaily);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Quests</h1>
      
      {/* Main Quests Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Main Quests</h2>
        <div className="grid gap-4">
          {mainQuests.map(quest => (
            <MainQuestCard key={quest.id} quest={quest} />
          ))}
        </div>
      </section>

      {/* Daily Quests Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Daily Quests</h2>
        <div className="grid gap-4">
          {dailyQuests.map(quest => (
            <DailyQuestCard key={quest.id} quest={quest} />
          ))}
        </div>
      </section>

      {/* Side Quests Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Side Quests</h2>
        <div className="grid gap-4">
          {sideQuests.map(quest => (
            <SideQuestCard key={quest.id} quest={quest} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Quests;