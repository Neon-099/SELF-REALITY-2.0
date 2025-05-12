import React from 'react';
import { useSoloLevelingStore } from '@/lib/store';
import { Award, Calendar, Trophy } from 'lucide-react';

const Milestones = () => {
  const user = useSoloLevelingStore(state => state.user);

  // Calculate stats
  const completedTasks = useSoloLevelingStore(
    state => state.tasks.filter(task => task.completed).length
  );
  
  const completedMainQuests = useSoloLevelingStore(
    state => state.quests.filter(quest => quest.completed && quest.isMainQuest).length
  );
  
  const completedSideQuests = useSoloLevelingStore(
    state => state.quests.filter(quest => quest.completed && !quest.isMainQuest).length
  );
  
  const completedMissions = useSoloLevelingStore(
    state => state.missions.filter(mission => mission.completed).length
  );

  // New: total completed quests
  const completedTotalQuests = completedMainQuests + completedSideQuests;

  // New: completed daily quests
  const completedDailyQuests = useSoloLevelingStore(
    state => state.quests.filter(quest => quest.completed && quest.isDaily).length
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-solo-text">Milestones</h1>

      {/* Streak Section */}
      <div className="bg-solo-dark border border-gray-800 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-solo-primary/20 flex items-center justify-center text-solo-primary">
            <Calendar size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Streak Tracker</h2>
            <p className="text-gray-400 text-sm">Keep showing up every day!</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800/30 rounded-lg p-4">
            <div className="text-4xl font-bold text-solo-primary mb-2">{user.streakDays}</div>
            <div className="text-gray-400">Current Streak (days)</div>
          </div>
          
          <div className="bg-gray-800/30 rounded-lg p-4">
            <div className="text-4xl font-bold text-solo-primary mb-2">{user.longestStreak}</div>
            <div className="text-gray-400">Longest Streak (days)</div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-solo-dark border border-gray-800 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-solo-primary/20 flex items-center justify-center text-solo-primary">
            <Trophy size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Achievements</h2>
            <p className="text-gray-400 text-sm">Track your progress</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/30 rounded-lg p-4 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-solo-primary mb-2">{completedTotalQuests}</div>
            <div className="text-gray-400 text-lg font-semibold mb-1">Quests</div>
            <div className="flex gap-6 text-base mt-1">
              <div className="flex flex-col items-center">
                <span className="text-gray-400">Side</span>
                <span className="text-solo-primary font-bold">{completedSideQuests}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-gray-400">Main</span>
                <span className="text-solo-primary font-bold">{completedMainQuests}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-gray-400">Daily</span>
                <span className="text-solo-primary font-bold">{completedDailyQuests}</span>
              </div>
            </div>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-4">
            <div className="text-3xl font-bold text-solo-primary mb-2">{completedTasks}</div>
            <div className="text-gray-400">Tasks Completed</div>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-4">
            <div className="text-3xl font-bold text-solo-primary mb-2">{completedMissions}</div>
            <div className="text-gray-400">Missions Completed</div>
          </div>
        </div>
      </div>

      {/* Level Milestones */}
      <div className="bg-solo-dark border border-gray-800 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-solo-primary/20 flex items-center justify-center text-solo-primary">
            <Award size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Level Milestones</h2>
            <p className="text-gray-400 text-sm">Your journey so far</p>
          </div>
        </div>
        
        {/* Progress toward max level */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span>Level {user.level}</span>
            <span>Max Level: 365</span>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600" 
              style={{ width: `${Math.min((user.level / 365) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-center mt-2 text-xs text-gray-400">
            {Math.round((user.level / 365) * 100)}% complete
          </div>
        </div>
        
        <div className="relative">
          <div className="absolute left-4 h-full w-0.5 bg-gray-800"></div>
          
          <div className="space-y-6 relative">
            {/* Current Level */}
            <div className="ml-10 relative">
              <div className="absolute -left-14 top-0 w-8 h-8 rounded-full bg-solo-primary flex items-center justify-center">
                <span className="text-white font-bold">{user.level}</span>
              </div>
              <div className="bg-gray-800/30 p-4 rounded-lg">
                <h3 className="text-lg font-bold">Current Level: {user.level}</h3>
                <p className="text-gray-400">
                  {user.exp} / {user.expToNextLevel} XP to next level
                </p>
              </div>
            </div>
            
            {/* Milestone Levels */}
            {[
              { level: 1, rank: 'F', title: 'Novice Hunter' },
              { level: 5, rank: 'F+', title: 'Aspiring Hunter' },
              { level: 10, rank: 'F++', title: 'Developing Hunter' },
              { level: 15, rank: 'E', title: 'Beginner Hunter' },
              { level: 20, rank: 'E+', title: 'Competent Hunter' },
              { level: 25, rank: 'D', title: 'Skilled Hunter' },
              { level: 35, rank: 'D+', title: 'Proficient Hunter' },
              { level: 40, rank: 'C', title: 'Advanced Hunter' },
              { level: 50, rank: 'C+', title: 'Expert Hunter' },
              { level: 60, rank: 'B', title: 'Elite Hunter' },
              { level: 75, rank: 'B+', title: 'Master Hunter' },
              { level: 90, rank: 'A', title: 'Grand Master Hunter' },
              { level: 105, rank: 'A+', title: 'Legendary Hunter' },
              { level: 120, rank: 'S', title: 'Mythical Hunter' },
              { level: 140, rank: 'S+', title: 'Transcendent Hunter' },
              { level: 160, rank: 'SS', title: 'Divine Hunter' },
              { level: 180, rank: 'SS+', title: 'Sovereign Hunter' },
              { level: 200, rank: 'SSS', title: 'Supreme Hunter' }
            ].map(({ level, rank, title }) => {
              const achieved = user.level >= level;
              const milestoneText = `Rank ${rank} - ${title}`;
              
              return (
                <div key={level} className="ml-10 relative">
                  <div className={`absolute -left-14 top-0 w-8 h-8 rounded-full flex items-center justify-center
                    ${achieved ? 'bg-green-500' : 'bg-gray-700'}`}>
                    {achieved ? (
                      <span className="text-white font-bold">{level}</span>
                    ) : (
                      <span className="text-gray-300 font-bold">{level}</span>
                    )}
                  </div>
                  <div className={`${
                    achieved ? 'bg-green-500/10 border border-green-500/30' : 'bg-gray-800/30'
                  } p-4 rounded-lg`}>
                    <h3 className="text-lg font-bold">
                      {achieved ? `Level ${level} - ${milestoneText} - Achieved!` : `Level ${level} - ${milestoneText}`}
                    </h3>
                    <p className="text-gray-400">
                      {achieved 
                        ? "You've reached this milestone! Keep going!" 
                        : `Reach level ${level} to unlock this milestone and rank up`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Milestones;
