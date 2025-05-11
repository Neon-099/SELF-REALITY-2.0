import React, { useState, useEffect, useRef } from 'react';
import { useSoloLevelingStore } from '@/lib/store';
import { StatCard } from '@/components/ui/stat-card';
import { DumbbellIcon, BrainIcon, HeartIcon, SmileIcon, Clock3Icon, SparklesIcon, Coins, Star, Crown, Trophy, Info, AlertCircle, CheckCircle, Database, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatExp } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { initialUser } from '@/lib/store/initial-state';
import { toast } from '@/hooks/use-toast';
import { predefinedMissions } from '@/data/predefined-missions';
import { endOfDay } from 'date-fns';
import { getDB } from '@/lib/db';

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
  const [
    user, 
    addExp, 
    chanceCounter, 
    isCursed, 
    hasShadowFatigue, 
    addQuest,
    addQuestTask,
    canUseRedemption,
    quests,
    deleteQuest,
    missions
  ] = useSoloLevelingStore(state => [
      state.user, 
      state.addExp, 
      state.chanceCounter, 
      state.isCursed, 
      state.hasShadowFatigue, 
      state.addQuest,
      state.addQuestTask,
      state.canUseRedemption,
      state.quests,
      state.deleteQuest,
      state.missions
    ]);
  
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [animatedExp, setAnimatedExp] = useState(user?.exp || 0);
  const [expPercentage, setExpPercentage] = useState(
    user ? Math.min(Math.floor((user.exp / user.expToNextLevel) * 100), 100) : 0
  );
  const prevExpRef = useRef(user?.exp || 0);
  const [showDbDebug, setShowDbDebug] = useState(false);
  const [dbContents, setDbContents] = useState<any>(null);
  const [isLoadingDb, setIsLoadingDb] = useState(false);

  // Function to load and display IndexedDB data
  const loadDbData = async () => {
    try {
      setIsLoadingDb(true);
      const db = await getDB();
      
      // Get the raw data from the database
      const storeData = await db.get('store', 'soloist-store');
      
      // Get direct quest data if available
      let questsData = [];
      try {
        const questStore = db.transaction('quests').objectStore('quests');
        questsData = await questStore.getAll();
      } catch (error) {
        console.error('Error fetching quests directly:', error);
      }
      
      // Get shop items data
      let shopItemsData = [];
      try {
        const shopStore = db.transaction('shop').objectStore('shop');
        shopItemsData = await shopStore.getAll();
      } catch (error) {
        console.error('Error fetching shop items directly:', error);
      }
      
      setDbContents({
        zustandStore: storeData ? JSON.parse(storeData) : null,
        directQuests: questsData,
        shopItems: shopItemsData
      });
      
      toast({
        title: "Database Loaded",
        description: "IndexedDB data has been retrieved successfully.",
      });
    } catch (error) {
      console.error('Error loading IndexedDB data:', error);
      toast({
        title: "Database Error",
        description: `Failed to load IndexedDB: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoadingDb(false);
    }
  };

  // Load database data when debug panel is opened
  useEffect(() => {
    if (showDbDebug) {
      loadDbData();
    }
  }, [showDbDebug]);

  useEffect(() => {
    if (user && typeof user.exp === 'number') {
      if (user.exp !== prevExpRef.current) {
        setAnimatedExp(user.exp);
        setExpPercentage(Math.min(Math.floor((user.exp / user.expToNextLevel) * 100), 100));
        prevExpRef.current = user.exp;
        setLastUpdate(Date.now());
      }
    }
  }, [user]);

  // Function to handle quest deletion
  const handleDeleteQuest = (questId: string) => {
    try {
      deleteQuest(questId);
      toast({
        title: "Quest Deleted",
        description: "The quest has been successfully removed.",
      });
      
      // Refresh data to show updated state
      loadDbData();
    } catch (error) {
      console.error('Error deleting quest:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete quest. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Function to handle mission deletion directly through IndexedDB
  // Since deleteMission isn't available in the store yet
  // TODO: This is a temporary solution - it would be better to implement a proper deleteMission 
  // function in the mission-slice.ts file to maintain consistent architecture
  const handleDeleteMission = async (missionId: string) => {
    try {
      // Get the DB connection
      const db = await getDB();
      
      // Get current store data
      const storeData = await db.get('store', 'soloist-store');
      
      if (storeData) {
        // Parse store data
        const parsedStore = JSON.parse(storeData);
        
        if (parsedStore.state && Array.isArray(parsedStore.state.missions)) {
          // Filter out the mission to delete
          parsedStore.state.missions = parsedStore.state.missions.filter(
            (m: any) => m.id !== missionId
          );
          
          // Save the updated data back to IndexedDB
          await db.put('store', JSON.stringify(parsedStore), 'soloist-store');
          
          // Now update our UI state by refreshing
          await loadDbData();
          
          toast({
            title: "Mission Deleted",
            description: "The mission has been successfully removed.",
          });
        }
      }
    } catch (error) {
      console.error('Error deleting mission:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete mission. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteShopItem = async (itemId: string) => {
    try {
      const db = await getDB();
      const storeData = await db.get('store', 'soloist-store');
      if (storeData) {
        const parsedStore = JSON.parse(storeData);
        if (parsedStore.state && Array.isArray(parsedStore.state.shopItems)) {
          parsedStore.state.shopItems = parsedStore.state.shopItems.filter(
            (item: any) => item.id !== itemId
          );
          await db.put('store', JSON.stringify(parsedStore), 'soloist-store');
          await loadDbData();
          toast({
            title: "Shop Item Deleted",
            description: "The shop item has been successfully removed.",
          });
        }
      }
    } catch (error) {
      console.error('Error deleting shop item:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete shop item. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return <div className="p-8 text-center">Loading character data...</div>;
  }

  const currentRankInfo = rankDetails.find(r => r.rank === user.rank);

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

      {/* Database Debug Button */}
      <div className="mt-8 flex justify-end">
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-1"
          onClick={() => setShowDbDebug(!showDbDebug)}
        >
          <Database className="h-4 w-4" />
          {showDbDebug ? 'Hide DB' : 'Show DB'}
        </Button>
      </div>

      {/* IndexedDB Debug Panel */}
      {showDbDebug && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 relative mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-400" />
              IndexedDB Contents
            </h2>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadDbData} 
                disabled={isLoadingDb}
              >
                Refresh Data
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDbDebug(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {isLoadingDb ? (
            <div className="text-center py-4">
              <p>Loading database contents...</p>
            </div>
          ) : dbContents ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-md font-semibold mb-2">Zustand Store (from IndexedDB)</h3>
                <div className="bg-gray-800 p-3 rounded max-h-60 overflow-auto">
                  {dbContents.zustandStore ? (
                    <>
                      <p className="text-green-400 mb-2">✓ IndexedDB is working correctly</p>
                      <details>
                        <summary className="cursor-pointer text-blue-400 hover:text-blue-300">
                          View Quests in Store (Total: {dbContents.zustandStore.state?.quests?.length || 0})
                        </summary>
                        <div className="mt-2 space-y-2 text-xs p-2 bg-gray-900 rounded">
                          {dbContents.zustandStore.state?.quests?.length > 0 ? (
                            dbContents.zustandStore.state.quests.map((quest: any, index: number) => (
                              <div key={index} className="p-2 border border-gray-700 rounded bg-gray-800/50">
                                <div className="flex justify-between items-start mb-1">
                                  <h4 className="text-sm text-white font-medium truncate max-w-[80%]">{quest.title}</h4>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => handleDeleteQuest(quest.id)}
                                  >
                                    Delete
                                  </Button>
                                </div>
                                <p className="text-xs text-gray-400">ID: {quest.id}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-400">No quests available in store.</p>
                          )}
                        </div>
                      </details>
                      
                      <details className="mt-2">
                        <summary className="cursor-pointer text-blue-400 hover:text-blue-300">
                          View Missions in Store (Total: {dbContents.zustandStore.state?.missions?.length || 0})
                        </summary>
                        <div className="mt-2 space-y-2 text-xs p-2 bg-gray-900 rounded">
                          {dbContents.zustandStore.state?.missions?.length > 0 ? (
                            dbContents.zustandStore.state.missions.map((mission: any, index: number) => (
                              <div key={index} className="p-2 border border-gray-700 rounded bg-gray-800/50">
                                <div className="flex justify-between items-start mb-1">
                                  <h4 className="text-sm text-white font-medium truncate max-w-[80%]">{mission.title}</h4>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => handleDeleteMission(mission.id)}
                                  >
                                    Delete
                                  </Button>
                                </div>
                                <p className="text-xs text-gray-400">ID: {mission.id}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-400">No missions available in store.</p>
                          )}
                        </div>
                      </details>
                      
                      <details className="mt-2">
                        <summary className="cursor-pointer text-blue-400 hover:text-blue-300">
                          View Completed Missions in Store (Total: {dbContents.zustandStore.state?.completedMissionHistory?.length || 0})
                        </summary>
                        <pre className="text-xs mt-2 p-2 bg-gray-900 rounded overflow-x-auto">
                          {JSON.stringify(dbContents.zustandStore.state?.completedMissionHistory || [], null, 2)}
                        </pre>
                      </details>

                      <details className="mt-2">
                        <summary className="cursor-pointer text-blue-400 hover:text-blue-300">
                          View Shop Items in Store (Total: {dbContents.zustandStore.state?.shopItems?.length || 0})
                        </summary>
                        <div className="mt-2 space-y-2 text-xs p-2 bg-gray-900 rounded">
                          {dbContents.zustandStore.state?.shopItems?.length > 0 ? (
                            dbContents.zustandStore.state.shopItems.map((item: any, index: number) => (
                              <div key={index} className="p-2 border border-gray-700 rounded bg-gray-800/50">
                                <div className="flex justify-between items-start mb-1">
                                  <h4 className="text-sm text-white font-medium truncate max-w-[80%]">{item.name}</h4>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => handleDeleteShopItem(item.id)}
                                  >
                                    Delete
                                  </Button>
                                </div>
                                <p className="text-xs text-gray-400">ID: {item.id} | Cost: {item.cost}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-400">No shop items available in store.</p>
                          )}
                        </div>
                      </details>
                    </>
                  ) : (
                    <p className="text-red-400">No Zustand store data found in IndexedDB</p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-semibold mb-2">Direct Quests ObjectStore</h3>
                <div className="bg-gray-800 p-3 rounded max-h-60 overflow-auto">
                  {dbContents.directQuests && dbContents.directQuests.length > 0 ? (
                    <>
                      <p className="text-green-400 mb-2">✓ Found {dbContents.directQuests.length} quests in direct ObjectStore</p>
                      <details>
                        <summary className="cursor-pointer text-blue-400 hover:text-blue-300">
                          View Direct Quest Data
                        </summary>
                        <pre className="text-xs mt-2 p-2 bg-gray-900 rounded overflow-x-auto">
                          {JSON.stringify(dbContents.directQuests, null, 2)}
                        </pre>
                      </details>
                    </>
                  ) : (
                    <p className="text-amber-400">
                      No quests found in direct ObjectStore. This app primarily uses the 'store' 
                      ObjectStore which contains the serialized Zustand state.
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-semibold mb-2">Direct ShopItems ObjectStore</h3>
                <div className="bg-gray-800 p-3 rounded max-h-60 overflow-auto">
                  {dbContents.shopItems && dbContents.shopItems.length > 0 ? (
                    <>
                      <p className="text-green-400 mb-2">✓ Found {dbContents.shopItems.length} items in direct ObjectStore</p>
                      <details>
                        <summary className="cursor-pointer text-blue-400 hover:text-blue-300">
                          View Direct Shop Items Data
                        </summary>
                        <pre className="text-xs mt-2 p-2 bg-gray-900 rounded overflow-x-auto">
                          {JSON.stringify(dbContents.shopItems, null, 2)}
                        </pre>
                      </details>
                    </>
                  ) : (
                    <p className="text-amber-400">
                      No shop items found in direct ObjectStore. Shop items are primarily managed via Zustand.
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-semibold mb-2">Current State (in memory)</h3>
                <div className="bg-gray-800 p-3 rounded max-h-60 overflow-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-bold text-blue-400">Quests</p>
                      <p className="text-sm mt-1">
                        Total: <span className="font-bold">{quests.length}</span>
                      </p>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-blue-400 hover:text-blue-300 text-sm">
                          View Quest Types
                        </summary>
                        <div className="mt-2 space-y-1 text-sm">
                          <p>
                            Main Quests: <span className="font-bold text-yellow-400">
                              {quests.filter(q => q.isMainQuest).length}
                            </span>
                          </p>
                          <p>
                            Side Quests: <span className="font-bold text-solo-primary">
                              {quests.filter(q => !q.isMainQuest && !q.isDaily).length}
                            </span>
                          </p>
                          <p>
                            Daily Quests: <span className="font-bold text-green-400">
                              {quests.filter(q => q.isDaily).length}
                            </span>
                          </p>
                          <p>
                            Completed Quests: <span className="font-bold text-green-400">
                              {quests.filter(q => q.completed).length}
                            </span>
                          </p>
                        </div>
                      </details>
                    </div>
                    
                    <div>
                      <p className="font-bold text-blue-400">Missions</p>
                      <p className="text-sm mt-1">
                        Total Missions: <span className="font-bold">
                          {dbContents.zustandStore?.state?.missions?.length || 0}
                        </span>
                      </p>
                      <p className="text-sm mt-1">
                        Completed Missions: <span className="font-bold text-green-400">
                          {dbContents.zustandStore?.state?.completedMissionHistory?.length || 0}
                        </span>
                      </p>
                      <p className="text-xs text-green-400 mt-2">
                        ✓ Missions are now stored in the main Zustand store!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center py-4 text-gray-400">
              Click "Refresh Data" to load IndexedDB contents
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Character;

