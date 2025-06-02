import React from 'react';
import { useSoloLevelingStore } from '@/lib/store';
import { useIsMobile } from '@/hooks/use-mobile';
import { Award, Calendar, Trophy } from 'lucide-react';

const Milestones = () => {
  const isMobile = useIsMobile();
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
    <div className={`${isMobile ? 'space-y-3' : 'space-y-6'}`}>
      <h1 className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-extrabold tracking-tight bg-gradient-to-r from-solo-primary to-solo-secondary bg-clip-text text-transparent drop-shadow-glow mb-2 flex items-center gap-2`}>
        <Trophy className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-yellow-400 drop-shadow-glow`} />
        Milestones
      </h1>

      {/* Streak Section */}
      <div className={`bg-solo-dark border border-gray-800 rounded-lg ${isMobile ? 'p-3' : 'p-6'} shadow-lg`}>
        <div className={`flex items-center ${isMobile ? 'gap-2 mb-3' : 'gap-3 mb-6'}`}>
          <div className={`${isMobile ? 'h-8 w-8' : 'h-12 w-12'} rounded-full bg-gradient-to-br from-solo-primary/30 to-indigo-500/30 flex items-center justify-center text-solo-primary shadow-md`}>
            <Calendar size={isMobile ? 16 : 24} />
          </div>
          <div>
            <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold bg-gradient-to-r from-solo-primary to-solo-secondary bg-clip-text text-transparent drop-shadow-glow`}>Streak Tracker</h2>
            <p className={`text-gray-400 ${isMobile ? 'text-sm' : 'text-base'} italic`}>Keep showing up every day!</p>
          </div>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 ${isMobile ? 'gap-3' : 'gap-6'}`}>
          <div className={`bg-gray-800/40 rounded-lg ${isMobile ? 'p-3' : 'p-6'} flex flex-col items-center shadow`}>
            <div className={`${isMobile ? 'text-3xl' : 'text-5xl'} font-extrabold bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-glow mb-2`}>{user.streakDays}</div>
            <div className={`text-gray-300 ${isMobile ? 'text-sm' : 'text-lg'} font-semibold text-center`}>Current Streak (days)</div>
          </div>

          <div className={`bg-gray-800/40 rounded-lg ${isMobile ? 'p-3' : 'p-6'} flex flex-col items-center shadow`}>
            <div className={`${isMobile ? 'text-3xl' : 'text-5xl'} font-extrabold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-glow mb-2`}>{user.longestStreak}</div>
            <div className={`text-gray-300 ${isMobile ? 'text-sm' : 'text-lg'} font-semibold text-center`}>Longest Streak (days)</div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className={`bg-solo-dark border border-gray-800 rounded-lg ${isMobile ? 'p-3' : 'p-6'} shadow-lg`}>
        <div className={`flex items-center ${isMobile ? 'gap-2 mb-3' : 'gap-3 mb-6'}`}>
          <div className={`${isMobile ? 'h-8 w-8' : 'h-12 w-12'} rounded-full bg-gradient-to-br from-yellow-400/30 to-amber-500/30 flex items-center justify-center text-yellow-400 shadow-md`}>
            <Trophy size={isMobile ? 16 : 24} />
          </div>
          <div>
            <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow-glow`}>Achievements</h2>
            <p className={`text-gray-400 ${isMobile ? 'text-sm' : 'text-base'} italic`}>Track your progress</p>
          </div>
        </div>

        <div className={`grid grid-cols-1 ${isMobile ? 'gap-2' : 'md:grid-cols-3 gap-4'}`}>
          <div className={`bg-gray-800/40 rounded-lg ${isMobile ? 'p-3' : 'p-6'} flex flex-col items-center justify-center shadow`}>
            <div className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-extrabold bg-gradient-to-r from-solo-primary to-solo-secondary bg-clip-text text-transparent drop-shadow-glow mb-2`}>{completedTotalQuests}</div>
            <div className={`text-gray-300 ${isMobile ? 'text-sm' : 'text-lg'} font-semibold mb-1`}>Quests</div>
            <div className={`flex ${isMobile ? 'gap-3 text-xs' : 'gap-6 text-base'} mt-1 justify-center w-full`}>
              <div className="flex flex-col items-center">
                <span className="text-gray-400">Side</span>
                <span className={`text-solo-primary font-bold ${isMobile ? 'text-sm' : 'text-lg'}`}>{completedSideQuests}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-gray-400">Main</span>
                <span className={`text-solo-primary font-bold ${isMobile ? 'text-sm' : 'text-lg'}`}>{completedMainQuests}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-gray-400">Daily</span>
                <span className={`text-solo-primary font-bold ${isMobile ? 'text-sm' : 'text-lg'}`}>{completedDailyQuests}</span>
              </div>
            </div>
          </div>
          <div className={`bg-gray-800/40 rounded-lg ${isMobile ? 'p-3' : 'p-6'} flex flex-col items-center shadow`}>
            <div className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-glow mb-2`}>{completedTasks}</div>
            <div className={`text-gray-300 ${isMobile ? 'text-sm' : 'text-lg'} font-semibold text-center`}>Tasks Completed</div>
          </div>
          <div className={`bg-gray-800/40 rounded-lg ${isMobile ? 'p-3' : 'p-6'} flex flex-col items-center shadow`}>
            <div className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-extrabold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-glow mb-2`}>{completedMissions}</div>
            <div className={`text-gray-300 ${isMobile ? 'text-sm' : 'text-lg'} font-semibold text-center`}>Missions Completed</div>
          </div>
        </div>
      </div>

      {/* Level Milestones */}
      <div className={`bg-solo-dark border border-gray-800 rounded-lg ${isMobile ? 'p-3' : 'p-6'} shadow-lg`}>
        <div className={`flex items-center ${isMobile ? 'gap-2 mb-3' : 'gap-3 mb-6'}`}>
          <div className={`${isMobile ? 'h-8 w-8' : 'h-12 w-12'} rounded-full bg-gradient-to-br from-solo-primary/30 to-indigo-500/30 flex items-center justify-center text-solo-primary shadow-md`}>
            <Award size={isMobile ? 16 : 24} />
          </div>
          <div>
            <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold bg-gradient-to-r from-solo-primary to-solo-secondary bg-clip-text text-transparent drop-shadow-glow`}>Level Milestones</h2>
            <p className={`text-gray-400 ${isMobile ? 'text-sm' : 'text-base'} italic`}>Your journey so far</p>
          </div>
        </div>

        {/* Progress toward max level */}
        <div className={`${isMobile ? 'mb-4' : 'mb-8'}`}>
          <div className={`flex justify-between ${isMobile ? 'text-sm' : 'text-base'} font-semibold mb-2 text-gray-300`}>
            <span>Level {user.level}</span>
            <span>Max Level: 365</span>
          </div>
          <div className={`w-full ${isMobile ? 'h-2' : 'h-3'} bg-gray-800 rounded-full overflow-hidden shadow-inner`}>
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg"
              style={{ width: `${Math.min((user.level / 365) * 100, 100)}%` }}
            />
          </div>
          <div className={`flex justify-center mt-2 ${isMobile ? 'text-sm' : 'text-base'} font-bold bg-gradient-to-r from-solo-primary to-solo-secondary bg-clip-text text-transparent drop-shadow-glow`}>
            {Math.round((user.level / 365) * 100)}% complete
          </div>
        </div>

        <div className="relative">
          <div className={`absolute ${isMobile ? 'left-2' : 'left-4'} h-full w-0.5 bg-gray-800`}></div>

          <div className={`${isMobile ? 'space-y-3' : 'space-y-6'} relative`}>
            {/* Current Level */}
            <div className={`${isMobile ? 'ml-6' : 'ml-10'} relative`}>
              <div className={`absolute ${isMobile ? '-left-8 w-6 h-6' : '-left-14 w-10 h-10'} top-0 rounded-full bg-gradient-to-br from-solo-primary to-solo-secondary flex items-center justify-center shadow-lg`}>
                <span className={`text-white font-extrabold ${isMobile ? 'text-xs' : 'text-lg'} drop-shadow-glow`}>{user.level}</span>
              </div>
              <div className={`bg-gray-800/40 ${isMobile ? 'p-3' : 'p-5'} rounded-lg shadow`}>
                <h3 className={`${isMobile ? 'text-sm' : 'text-xl'} font-bold bg-gradient-to-r from-solo-primary to-solo-secondary bg-clip-text text-transparent drop-shadow-glow`}>Current Level: {user.level}</h3>
                <p className={`text-gray-300 ${isMobile ? 'text-xs' : 'text-base'} font-semibold`}>
                  {user.exp} / {user.expToNextLevel} XP to next level
                </p>
              </div>
            </div>

            {/* Milestone Levels */}
            {[
              { level: 1, rank: 'F', title: 'Novice Hunter' },
              { level: 31, rank: 'E', title: 'Beginner Hunter' },
              { level: 61, rank: 'D', title: 'Skilled Hunter' },
              { level: 91, rank: 'C', title: 'Advanced Hunter' },
              { level: 121, rank: 'B', title: 'Elite Hunter' },
              { level: 151, rank: 'A', title: 'Master Hunter' },
              { level: 181, rank: 'S', title: 'Grand Master Hunter' },
              { level: 271, rank: 'SS', title: 'Legendary Hunter' },
              { level: 366, rank: 'SSS', title: 'Mythical Hunter' }
            ].map(({ level, rank, title }) => {
              const achieved = user.level >= level;
              const milestoneText = `Rank ${rank} - ${title}`;

              return (
                <div key={level} className={`${isMobile ? 'ml-6' : 'ml-10'} relative`}>
                  <div className={`absolute ${isMobile ? '-left-8 w-6 h-6' : '-left-14 w-10 h-10'} top-0 rounded-full flex items-center justify-center shadow-lg
                    ${achieved ? 'bg-gradient-to-br from-solo-primary to-solo-secondary' : 'bg-gray-700'}`}>
                    <span className={`text-white font-extrabold ${isMobile ? 'text-xs' : 'text-lg'} drop-shadow-glow`}>{level}</span>
                  </div>
                  <div className={`bg-gray-800/40 ${isMobile ? 'p-3' : 'p-5'} rounded-lg shadow transition-colors duration-300
                    ${achieved ? 'border border-solo-primary/20 hover:bg-solo-primary/10' : 'border border-gray-800 hover:bg-gray-800/50'}`}>
                    <h3 className={`${isMobile ? 'text-sm' : 'text-xl'} font-bold transition-colors duration-300
                      ${achieved ? 'bg-gradient-to-r from-solo-primary to-solo-secondary bg-clip-text text-transparent drop-shadow-glow' : 'text-gray-400'}`}>
                      {milestoneText}
                    </h3>
                    <p className={`${isMobile ? 'text-xs' : 'text-base'} font-semibold transition-colors duration-300
                      ${achieved ? 'text-gray-300' : 'text-gray-500'}`}>
                      Level {level} Required
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