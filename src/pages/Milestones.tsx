import React from 'react';
import { useSoloLevelingStore } from '@/lib/store';
import { Award, Calendar, Trophy } from 'lucide-react';

const Milestones = () => {
  const store = useSoloLevelingStore();
  const { user, tasks = [], quests = [], missions = [] } = store;

  // Calculate stats
  const completedTasks = tasks.filter(task => task.completed).length;
  
  const completedMainQuests = quests.filter(quest => quest.completed && quest.isMainQuest).length;
  
  const completedSideQuests = quests.filter(quest => quest.completed && !quest.isMainQuest && !quest.isDaily).length;
  
  const completedMissions = missions.filter(mission => mission.completed).length;

  // New: total completed quests
  const completedTotalQuests = completedMainQuests + completedSideQuests;

  // New: completed daily quests
  const completedDailyQuests = quests.filter(quest => quest.completed && quest.isDaily).length;

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-solo-primary to-solo-secondary bg-clip-text text-transparent drop-shadow-glow mb-2 flex items-center gap-2">
        <Trophy className="h-8 w-8 text-yellow-400 drop-shadow-glow" />
        Milestones
      </h1>

      {/* Rest of your component code */}
      {/* ... */}
    </div>
  );
};

export default Milestones; 