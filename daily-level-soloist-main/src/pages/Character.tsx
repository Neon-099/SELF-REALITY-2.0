import React, { useState, useEffect, useRef } from 'react';
import { useSoloLevelingStore } from '@/lib/store';
import { StatCard } from '@/components/ui/stat-card';
import { DumbbellIcon, BrainIcon, HeartIcon, SmileIcon, Clock3Icon, SparklesIcon, Coins, Star, Crown, Trophy, Info, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatExp } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { initialUser } from '@/lib/store/initial-state';
import { toast } from '@/hooks/use-toast';
import { predefinedMissions } from '@/data/predefined-missions';

const rankDetails = [
  {
    rank: 'SSS',
    levelReq: 200,
    icon: <Crown size={16} />,
    color: 'text-yellow-400',
    description: 'Ultimate hunter status - the pinnacle of achievement.',
    benefits: [
      'Triple EXP gain from all activities',
      'Access to legendary quests',
      'Unique titles and achievements',
      'Maximum gold conversion rate'
    ]
  },
  {
    rank: 'SS',
    levelReq: 160,
    icon: <Trophy size={16} />,
    color: 'text-purple-400',
    description: 'Elite hunter with increased rewards and rare quest access.',
    benefits: [
      'Double EXP gain from all activities',
      'Access to rare quests',
      'Special titles',
      'Improved gold conversion rate'
    ]
  },
  {
    rank: 'S',
    levelReq: 120,
    icon: <Star size={16} />,
    color: 'text-blue-400',
    description: 'Advanced hunter with bonus rewards and special missions.',
    benefits: [
      '50% bonus EXP gain',
      'Access to advanced quests',
      'Special missions',
      'Better gold conversion'
    ]
  },
  {
    rank: 'A',
    levelReq: 90,
    icon: 'A',
    color: 'text-green-400',
    description: 'Skilled hunter with improved rewards.',
    benefits: [
      '30% bonus EXP gain',
      'Access to skilled quests',
      'Improved mission rewards',
      'Standard gold conversion'
    ]
  },
  {
    rank: 'B',
    levelReq: 60,
    icon: 'B',
    color: 'text-emerald-400',
    description: 'Experienced hunter with decent rewards.',
    benefits: [
      '20% bonus EXP gain',
      'Access to intermediate quests',
      'Better mission variety',
      'Basic gold conversion'
    ]
  },
  {
    rank: 'C',
    levelReq: 40,
    icon: 'C',
    color: 'text-teal-400',
    description: 'Progressing hunter with standard rewards.',
    benefits: [
      '10% bonus EXP gain',
      'Access to regular quests',
      'Standard missions',
      'Basic rewards'
    ]
  },
  {
    rank: 'D',
    levelReq: 25,
    icon: 'D',
    color: 'text-cyan-400',
    description: 'Developing hunter with basic rewards.',
    benefits: [
      '5% bonus EXP gain',
      'Access to basic quests',
      'Simple missions',
      'Basic rewards'
    ]
  },
  {
    rank: 'E',
    levelReq: 15,
    icon: 'E',
    color: 'text-orange-500',
    description: 'Beginning hunter with standard rewards.',
    benefits: [
      'Standard EXP gain',
      'Access to beginner quests',
      'Basic missions',
      'Standard rewards'
    ]
  },
  {
    rank: 'F',
    levelReq: 1,
    icon: 'F',
    color: 'text-gray-500',
    description: 'Beginning hunter with standard rewards.',
    benefits: [
      'Standard EXP gain',
      'Access to beginner quests',
      'Basic missions',
      'Standard rewards'
    ]
  }
];

const RankCard = ({ rank, levelReq, isCurrentRank }: { rank: string; levelReq: number; isCurrentRank: boolean }) => {
  const rankInfo = rankDetails.find(r => r.rank === rank);
  
  // Calculate progress towards next rank (for current rank only)
  const user = useSoloLevelingStore(state => state.user);
  const nextRank = rankDetails
    .sort((a, b) => a.levelReq - b.levelReq)
    .find(r => r.levelReq > user.level);
  
  // Only calculate progress if this is the current rank
  const progressToNextRank = isCurrentRank && nextRank ? 
    Math.min(100, Math.round(((user.level - levelReq) / (nextRank.levelReq - levelReq)) * 100)) : 0;
  
  return (
    <div 
      className={cn(
        "flex flex-col p-3 rounded-lg transition-all duration-300 border cursor-pointer transform",
        isCurrentRank 
          ? "bg-solo-primary/10 border-solo-primary hover:bg-solo-primary/20 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:scale-[1.02] relative group" 
          : "bg-solo-dark border-gray-800 hover:border-gray-600 hover:bg-gray-800/80 hover:shadow-md hover:scale-[1.01]"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
              isCurrentRank 
                ? "bg-solo-primary text-white animate-pulse-slow" 
                : "bg-gray-800 text-gray-400 group-hover:scale-110"
            )}
          >
            {typeof rankInfo?.icon === 'string' ? (
              <div className="text-sm font-bold">{rankInfo.icon}</div>
            ) : (
              rankInfo?.icon
            )}
          </div>
          <div>
            <div className={cn(
              "font-bold transition-colors duration-300",
              isCurrentRank 
                ? "text-solo-primary" 
                : "text-gray-200 group-hover:text-solo-primary/80"
            )}>
              Rank {rank}
            </div>
            <p className="text-xs text-gray-400">
              Level {levelReq}+ Required
            </p>
          </div>
        </div>
        {isCurrentRank && (
          <span className="text-xs text-solo-primary bg-solo-primary/10 px-2 py-1 rounded flex items-center">
            <span className="animate-pulse mr-1 w-1.5 h-1.5 bg-solo-primary rounded-full"></span>
            Current
          </span>
        )}
      </div>
      
      {/* Progress bar for current rank only */}
      {isCurrentRank && nextRank && (
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Progress to {nextRank.rank}</span>
            <span>{progressToNextRank}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-solo-primary to-solo-secondary"
              style={{ width: `${progressToNextRank}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const RankDetailsDialog = () => {
  const user = useSoloLevelingStore(state => state.user);
  const currentRank = user?.rank || 'F';
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="mt-2 text-sm text-gray-400 hover:text-white w-full">
          View All Ranks <Info size={14} className="ml-1" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-solo-dark border-gray-800">
        <DialogHeader>
          <DialogTitle>Hunter Rank System</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="text-sm text-gray-400">Your current rank: <span className="font-bold text-solo-primary">{currentRank}</span></div>
          
          <div className="space-y-6">
            {rankDetails
              .sort((a, b) => b.levelReq - a.levelReq)
              .map(rank => {
                const isCurrentRank = rank.rank === currentRank;
                return (
                  <div 
                    key={rank.rank}
                    className={cn(
                      "p-4 rounded-lg border transition-all duration-300 cursor-pointer transform group",
                      isCurrentRank 
                        ? "border-solo-primary/50 bg-solo-primary/10 hover:border-solo-primary hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:scale-[1.02]" 
                        : "border-gray-800 bg-gray-900/50 hover:border-gray-500 hover:bg-gray-800/70 hover:shadow-lg hover:scale-[1.01]"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all duration-300",
                            rank.color,
                            isCurrentRank ? "animate-pulse-slow" : "group-hover:scale-110"
                          )}
                        >
                          {typeof rank.icon === 'string' ? rank.icon : rank.icon}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold group-hover:text-solo-primary transition-colors duration-300">Rank {rank.rank}</h3>
                          <p className="text-sm text-gray-400">Level {rank.levelReq}+</p>
                        </div>
                      </div>
                      {isCurrentRank && (
                        <div className="px-2 py-1 bg-solo-primary/20 text-solo-primary text-xs rounded">
                          Current
                        </div>
                      )}
                    </div>
                    
                    <span className="text-sm text-gray-300 mb-3">{rank.description}</span>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-300">Benefits:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {rank.benefits.map((benefit, index) => (
                          <div key={index} className="flex items-center gap-2 transition-transform duration-300 hover:translate-x-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${isCurrentRank ? 'bg-solo-primary' : 'bg-gray-500'} transition-colors duration-300`} />
                            <span className="text-sm text-gray-300 hover:text-white transition-colors duration-300">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Character = () => {
  const user = useSoloLevelingStore(state => state.user);
  const chanceCounter = useSoloLevelingStore(state => state.chanceCounter) || 0;
  const isCursed = useSoloLevelingStore(state => state.isCursed) || false;
  const hasShadowFatigue = useSoloLevelingStore(state => state.hasShadowFatigue) || false;
  const canUseRedemption = useSoloLevelingStore(state => state.canUseRedemption) || false;
  const attemptRedemption = useSoloLevelingStore(state => state.attemptRedemption);
  
  // State for redemption dialog
  const [showRedemptionDialog, setShowRedemptionDialog] = useState(false);
  
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [animatedExp, setAnimatedExp] = useState(user?.exp || 0);
  const [expPercentage, setExpPercentage] = useState(
    user ? Math.min(Math.floor((user.exp / user.expToNextLevel) * 100), 100) : 0
  );
  const prevExpRef = useRef(user?.exp || 0);

  // Force re-render when user state changes and animate the EXP bar
  useEffect(() => {
    if (user && typeof user.exp === 'number') {
      // If exp changed, animate it
      if (prevExpRef.current !== user.exp) {
        console.log(`EXP changed from ${prevExpRef.current} to ${user.exp}`);
        
        // Set the initial state to the previous value
        setAnimatedExp(prevExpRef.current);
        
        // After a small delay, animate to the new value
        setTimeout(() => {
          setAnimatedExp(user.exp);
          // Update exp percentage for the progress bar
          setExpPercentage(Math.min(Math.floor((user.exp / user.expToNextLevel) * 100), 100));
        }, 50);
        
        prevExpRef.current = user.exp;
      }
    }
    
    // Update timestamp if lastUpdate changed
    if (user?.lastUpdate && user.lastUpdate !== lastUpdate) {
      setLastUpdate(user.lastUpdate);
    }
  }, [user?.exp, user?.level, user?.lastUpdate, user?.expToNextLevel, lastUpdate]);

  if (!user) {
    return <div className="p-8 text-center">Loading character data...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-solo-text mb-2">Character Stats</h1>
        <p className="text-gray-400">Increase your stats to become stronger.</p>
      </div>
      
      {/* Character Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-solo-dark border-gray-800">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="relative inline-block">
                <div className="w-20 h-20 rounded-full bg-solo-primary/20 flex items-center justify-center mx-auto">
                  <span className="text-3xl font-bold text-solo-primary">{user.level}</span>
                </div>
                <div className="absolute -top-2 -right-2 bg-solo-primary text-white text-xs rounded-full px-2 py-1 animate-pulse">
                  {user.rank} Rank
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-gray-800 rounded p-2">
                  <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                    <Star size={12} className="text-yellow-400 stroke-2" />
                    <span>Experience</span>
                  </p>
                  <div className="font-semibold flex items-center justify-center gap-1">
                    <Star size={14} className="text-yellow-400 stroke-2" />
                    <span>{formatExp(user.exp)}</span>
                  </div>
                </div>
                <div className="bg-gray-800 rounded p-2">
                  <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                    <Coins size={12} className="text-yellow-400" />
                    <span>Gold</span>
                  </p>
                  <div className="font-semibold flex items-center justify-center gap-1">
                    <Coins size={14} className="text-yellow-400" />
                    <span>{user.gold}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-solo-dark border-gray-800 md:col-span-2">
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-400">Next Level</p>
                  <p className="font-semibold">Level {user.level + 1}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Required EXP</p>
                  <p className="font-semibold">{user.exp} / {user.expToNextLevel}</p>
                </div>
              </div>
              
              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-solo-primary to-solo-secondary h-full rounded-full transition-all duration-700 ease-out" 
                  style={{ width: `${expPercentage}%` }} 
                />
              </div>
              
              {/* Shadow Chance Counter */}
              <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1">
                    <p className="text-sm text-gray-400">Shadow Chances</p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="text-gray-500 hover:text-gray-300">
                          <Info size={14} />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-900 text-white max-w-md">
                        <DialogHeader>
                          <DialogTitle>Shadow Chance System</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 text-sm">
                          <p>You have 5 chances per week before becoming cursed. Each missed deadline uses one chance.</p>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>0-1 chance used:</span>
                              <span className="text-green-400">Safe</span>
                            </div>
                            <div className="flex justify-between">
                              <span>2-3 chances used:</span>
                              <span className="text-yellow-400">Warning</span>
                            </div>
                            <div className="flex justify-between">
                              <span>4-5 chances used:</span>
                              <span className="text-red-400">Danger</span>
                            </div>
                          </div>
                          <p className="mt-2 text-red-400">Once all 5 chances are used, you'll be cursed until the end of the week, receiving only 50% EXP from all activities.</p>
                          <p className="text-gray-400 text-xs mt-2">Chances reset every Sunday.</p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="flex items-center gap-1">
                    <p className={cn(
                      "text-xs font-medium",
                      chanceCounter === 0 ? "text-green-400" :
                      chanceCounter <= 2 ? "text-green-400" :
                      chanceCounter <= 3 ? "text-yellow-400" :
                      "text-red-400"
                    )}>
                      {chanceCounter}/5 used
                    </p>
                    {isCursed && (
                      <span className="bg-red-500/20 text-red-400 text-xs px-1.5 py-0.5 rounded animate-pulse">
                        CURSED
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  {isCursed ? (
                    <div className="h-full bg-red-500 w-full animate-pulse" />
                  ) : (
                    <div 
                      className={cn(
                        "h-full transition-all duration-500",
                        chanceCounter === 0 ? "bg-green-500" :
                        chanceCounter <= 2 ? "bg-green-500" :
                        chanceCounter <= 3 ? "bg-yellow-500" :
                        "bg-red-500"
                      )}
                      style={{ width: `${(chanceCounter / 5) * 100}%` }} 
                    />
                  )}
                </div>
                
                {hasShadowFatigue && (
                  <div className="mt-1 text-xs text-amber-400 flex items-center gap-1">
                    <AlertCircle size={12} />
                    <span>Shadow Fatigue active: 75% EXP from tasks</span>
                  </div>
                )}
                
                {/* Redemption Section */}
                {isCursed && canUseRedemption && (
                  <div className="mt-2 border-t border-gray-800 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-red-400">
                        <p>Curse active: 50% EXP penalty on all activities</p>
                      </div>
                      <Dialog open={showRedemptionDialog} onOpenChange={setShowRedemptionDialog}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            className="text-xs h-7 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20"
                          >
                            Attempt Redemption
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-900 text-white max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-red-400">Attempt Redemption?</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3 py-2">
                            <p>You can attempt to redeem yourself to lift the curse, but it's risky.</p>
                            <p className="text-red-400">If you fail the redemption challenge, you'll lose a level!</p>
                            <p>Success will lift the curse and give you one more chance this week.</p>
                          </div>
                          <div className="flex gap-2 justify-end pt-4">
                            <Button
                              variant="outline"
                              onClick={() => setShowRedemptionDialog(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => {
                                // 50% chance of success
                                const success = Math.random() > 0.5;
                                attemptRedemption(success);
                                setShowRedemptionDialog(false);
                              }}
                            >
                              Take the Risk
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-solo-primary/20 flex items-center justify-center text-solo-primary">
                    <Clock3Icon size={16} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Current Streak</p>
                    <p className="font-semibold">{user.streakDays} days</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-solo-primary/20 flex items-center justify-center text-solo-primary">
                    <HeartIcon size={16} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Longest Streak</p>
                    <p className="font-semibold">{user.longestStreak} days</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Stats Grid */}
      <div>
        <h2 className="text-xl font-bold text-solo-text mb-4">Attributes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard 
            name="physical" 
            value={user.stats.physical}
            icon={<DumbbellIcon size={16} />}
          />
          <StatCard 
            name="cognitive" 
            value={user.stats.cognitive}
            icon={<BrainIcon size={16} />}
          />
          <StatCard 
            name="emotional" 
            value={user.stats.emotional}
            icon={<HeartIcon size={16} />}
          />
          <StatCard 
            name="spiritual" 
            value={user.stats.spiritual}
            icon={<SparklesIcon size={16} />}
          />
          <StatCard 
            name="social" 
            value={user.stats.social}
            icon={<SmileIcon size={16} />}
          />
        </div>
      </div>
      
      {/* Rank System */}
      <div>
        <h2 className="text-xl font-bold text-solo-text mb-4 flex items-center gap-2">
          <Crown className="text-yellow-400" size={20} />
          Rank System
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="bg-solo-dark border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="text-solo-primary animate-pulse-slow">
                  <Crown size={18} />
                </div>
                Current Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">Current Rank</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-solo-primary/20 flex items-center justify-center text-solo-primary">
                        {typeof rankDetails.find(r => r.rank === user.rank)?.icon === 'string' ? (
                          <span className="font-bold">
                            {rankDetails.find(r => r.rank === user.rank)?.icon}
                          </span>
                        ) : (
                          rankDetails.find(r => r.rank === user.rank)?.icon || 'F'
                        )}
                      </div>
                      <span className="text-2xl font-bold text-solo-primary animate-pulse-slow">
                        {user.rank}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-sm text-gray-400">Current Level</p>
                    <div className="text-2xl font-bold flex items-center justify-end">
                      <span className="text-gray-300">{user.level}</span>
                      <div className="w-1.5 h-1.5 bg-solo-primary rounded-full ml-2 animate-pulse"></div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {rankDetails
                    .filter(r => ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'].includes(r.rank))
                    .sort((a, b) => b.levelReq - a.levelReq)
                    .slice(0, 4)
                    .map(rank => (
                      <RankCard 
                        key={rank.rank}
                        rank={rank.rank} 
                        levelReq={rank.levelReq} 
                        isCurrentRank={user.rank === rank.rank} 
                      />
                    ))}
                </div>
                
                <RankDetailsDialog />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-solo-dark border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="text-yellow-400">
                  <Trophy size={18} />
                </div>
                Current Rank Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800 mb-4">
                  <p className="text-sm text-gray-400 mb-1">Rank {user.rank} Benefits</p>
                  <div className="text-sm text-gray-300 italic">
                    {rankDetails.find(r => r.rank === user.rank)?.description || "Beginning hunter with standard rewards."}
                  </div>
                </div>
                
                {rankDetails.find(r => r.rank === user.rank)?.benefits.map((benefit, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-3 p-2 hover:bg-gray-800/50 rounded-md transition-all duration-300 hover:translate-x-1 group"
                  >
                    <div className="w-7 h-7 rounded-full bg-solo-primary/10 flex items-center justify-center text-solo-primary">
                      <Star size={14} className="transition-transform duration-300 group-hover:scale-110" />
                    </div>
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors duration-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Character;
