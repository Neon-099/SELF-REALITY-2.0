import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSoloLevelingStore } from '@/lib/store';
import { Star, Award, Sparkles, Gift } from 'lucide-react';
import { calculateProgress } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export function Header() {
  const user = useSoloLevelingStore(state => state.user);
  const tasks = useSoloLevelingStore(state => state.tasks);
  const quests = useSoloLevelingStore(state => state.quests);
  const missions = useSoloLevelingStore(state => state.missions);
  const checkDailyCompletion = useSoloLevelingStore(state => state.checkDailyCompletion);
  const checkDailyRequirementsMet = useSoloLevelingStore(state => state.checkDailyRequirementsMet);
  const checkWeeklyCompletion = useSoloLevelingStore(state => state.checkWeeklyCompletion);
  const checkWeeklyReducedCompletion = useSoloLevelingStore(state => state.checkWeeklyReducedCompletion);
  const getDailyRewardEntry = useSoloLevelingStore(state => state.getDailyRewardEntry);
  const getWeeklyRewardEntry = useSoloLevelingStore(state => state.getWeeklyRewardEntry);
  
  const [expPercentage, setExpPercentage] = useState(
    user ? calculateProgress(user.exp, user.expToNextLevel) : 0
  );
  const [hasRewardsReady, setHasRewardsReady] = useState(false);
  const prevExpRef = useRef(user?.exp || 0);
  const isMobile = useIsMobile();
  
  // Function to check if any rewards are ready to claim
  const checkRewardsReady = () => {
    const today = new Date();
    
    // Check daily reward - only show notification if requirements are met AND not already claimed
    const dailyEntry = getDailyRewardEntry(today);
    const isDailyReady = checkDailyRequirementsMet(today) && 
                        (!dailyEntry || !dailyEntry.claimed);
    
    // Check weekly reward (current week) - only if custom reward is set and not claimed
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const weeklyEntry = getWeeklyRewardEntry(startOfWeek);
    const isWeeklyReady = weeklyEntry && 
                         weeklyEntry.customReward && 
                         !weeklyEntry.claimed && 
                         checkWeeklyCompletion(startOfWeek);
    
    // Check weekly reduced reward - only if custom reward is set and not claimed
    const isWeeklyReducedReady = weeklyEntry && 
                                weeklyEntry.customReward && 
                                !weeklyEntry.claimed && 
                                !isWeeklyReady && // Don't show reduced if full weekly is already ready
                                checkWeeklyReducedCompletion(startOfWeek);
    
    // Only return true if at least one reward is actually ready to claim
    return isDailyReady || isWeeklyReady || isWeeklyReducedReady;
  };
  
  // Update progress bar when exp changes
  useEffect(() => {
    if (user && typeof user.exp === 'number') {
      // If exp changed, animate it
      if (prevExpRef.current !== user.exp) {
        console.log(`Header EXP update: ${prevExpRef.current} -> ${user.exp}`);
        
        // After a small delay, animate to the new value
        setTimeout(() => {
          setExpPercentage(calculateProgress(user.exp, user.expToNextLevel));
        }, 50);
        
        prevExpRef.current = user.exp;
      }
    }
  }, [user?.exp, user?.expToNextLevel, user?.lastUpdate]);
  
  // Check for rewards ready to claim
  useEffect(() => {
    setHasRewardsReady(checkRewardsReady());
  }, [user?.rewardJournal, user?.weeklyRewards, user?.lastUpdate, tasks, quests, missions]);
  
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-solo-dark/80 border-b border-gray-800/30 shadow-md">
      <div className="container flex justify-between items-center py-3 px-4">
        <div className="flex items-center">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            {isMobile ? (
              <div className="flex items-center gap-1">
                <Sparkles className="h-5 w-5 text-solo-primary" />
                <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-solo-primary to-solo-secondary glow-text">
                  Self Reality
                </h1>
                <Link to="/rewards" className="ml-2 hover:scale-110 transition-transform duration-200 relative">
                  <Gift className={`h-5 w-5 transition-all duration-300 ${
                    hasRewardsReady 
                      ? 'text-yellow-400 animate-gift-glow' 
                      : 'text-yellow-500 hover:text-yellow-400'
                  }`} />
                  {hasRewardsReady && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                  )}
                </Link>
              </div>
            ) : (
              <h1 className="text-2xl font-bold text-solo-primary glow-text">
                Self Reality Leveling
              </h1>
            )}
          </Link>
        </div>
        
        <div className="flex items-center">
          <div className={`flex flex-col ${isMobile ? 'w-[140px]' : 'min-w-[200px]'}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                {isMobile ? (
                  <div className="flex items-center justify-center h-5 w-5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 text-black text-xs font-bold">
                    {user?.level || 1}
                  </div>
                ) : (
                  <>
                    <Star className="h-4 w-4 text-yellow-400 stroke-2" />
                    <span className="text-sm font-medium">Level {user?.level || 1}</span>
                  </>
                )}
              </div>
            </div>
            <div className="exp-bar-bg h-1.5 rounded-full bg-gray-800 overflow-hidden">
              <div 
                className="exp-bar-fill h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-solo-primary to-solo-secondary" 
                style={{ width: `${expPercentage}%` }} 
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
