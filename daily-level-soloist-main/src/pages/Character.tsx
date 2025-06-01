import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSoloLevelingStore } from '@/lib/store';
import { useIsMobile } from '@/hooks/use-mobile';
import { StatCard } from '@/components/ui/stat-card';
import { DumbbellIcon, BrainIcon, HeartIcon, SmileIcon, Clock3Icon, SparklesIcon, Coins, Star, Crown, Trophy, Info, AlertCircle, CheckCircle, Database, X, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatExp } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { initialUser } from '@/lib/store/initial-state';
import { toast } from '@/hooks/use-toast';
import { predefinedMissions } from '@/data/predefined-missions';
import { endOfDay } from 'date-fns';
import { getDB, SoloistDB } from '@/lib/db';
import { Quest, ShopItem } from '@/lib/types';
import ShadowPenalty from '@/components/punishment/ShadowPenalty';

const rankDetails = [
  {
    rank: 'SSS',
    levelReq: 360,
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
    levelReq: 270,
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
    levelReq: 180,
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
    levelReq: 150,
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
    levelReq: 120,
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
    levelReq: 90,
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
    levelReq: 60,
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
    levelReq: 30,
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
    levelReq: 0,
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
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [
    user,
    addExp,
    chanceCounter,
    isCursed,
    hasShadowFatigue,
    shadowFatigueUntil,
    cursedUntil,
    lockedSideQuestsUntil,
    getExpModifier,
    areSideQuestsLocked,
    checkCurseStatus,
    resetWeeklyChances,
    addQuest,
    addQuestTask,
    canUseRedemption,
    quests,
    deleteQuest,
    missions,
    resetAllData
  ] = useSoloLevelingStore(state => [
      state.user,
      state.addExp,
      state.chanceCounter,
      state.isCursed,
      state.hasShadowFatigue,
      state.shadowFatigueUntil,
      state.cursedUntil,
      state.lockedSideQuestsUntil,
      state.getExpModifier,
      state.areSideQuestsLocked,
      state.checkCurseStatus,
      state.resetWeeklyChances,
      state.addQuest,
      state.addQuestTask,
      state.canUseRedemption,
      state.quests,
      state.deleteQuest,
      state.missions,
      state.resetAllData
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

  // Type the specific data arrays appropriately
  const [questsData, setQuestsData] = useState<Quest[]>([]);
  const [shopItemsData, setShopItemsData] = useState<ShopItem[]>([]);

  // Function to load and display IndexedDB data
  const loadDbData = async () => {
    try {
      setIsLoadingDb(true);
      const db = await getDB();

      // Get the raw data from the database
      const storeData = await db.get('store', 'soloist-store');

      // Get direct quest data if available
      let questsDataArray: Quest[] = [];
      try {
        const questStore = db.transaction('quests').objectStore('quests');
        const rawQuestsData = await questStore.getAll();
        questsDataArray = rawQuestsData as Quest[];
      } catch (error) {
        console.error('Error fetching quests directly:', error);
      }

      // Get shop items data
      let shopItemsDataArray: ShopItem[] = [];
      try {
        const shopStore = db.transaction('shop').objectStore('shop');
        const rawShopData = await shopStore.getAll();
        // Cast through unknown first
        shopItemsDataArray = rawShopData as unknown as ShopItem[];
      } catch (error) {
        console.error('Error fetching shop items directly:', error);
      }

      setQuestsData(questsDataArray);
      setShopItemsData(shopItemsDataArray);

      setDbContents({
        zustandStore: storeData ? JSON.parse(storeData) : null,
        directQuests: questsDataArray,
        shopItems: shopItemsDataArray
      });

      toast({
        title: "Database Loaded",
        description: "IndexedDB data has been retrieved successfully.",
      });
    } catch (error) {
      console.error('Error loading IndexedDB data:', error);
      toast({
        title: "Database Error",
        description: `Failed to load IndexedDB: ${error instanceof Error ? error.message : String(error)}`,
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

  // Check curse status and reset weekly chances on component mount and periodically
  useEffect(() => {
    checkCurseStatus();
    resetWeeklyChances();

    // Set up interval to check curse status every minute
    const interval = setInterval(() => {
      checkCurseStatus();
      resetWeeklyChances();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [checkCurseStatus, resetWeeklyChances]);

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

  // Function to reset character data and IndexedDB
  const handleCharacterRefresh = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to reset your character? This will:\n\n" +
      "• Reset your character to level 1\n" +
      "• Reset all stats to initial values\n" +
      "• Reset your name\n" +
      "• Keep your quests, rewards, and missions\n\n" +
      "This action cannot be undone!"
    );

    if (!confirmed) return;

    try {
      // Get the database connection
      const db = await getDB();

      // Get current store data
      const storeData = await db.get('store', 'soloist-store');
      if (storeData) {
        const parsedStore = JSON.parse(storeData);
        
        // Preserve quests, missions, and rewards
        const preservedQuests = parsedStore.state?.quests || [];
        const preservedMissions = parsedStore.state?.missions || [];
        const preservedRewards = parsedStore.state?.user?.rewardJournal || [];
        const preservedWeeklyRewards = parsedStore.state?.user?.weeklyRewards || [];

      // Reset all data in the store first
      resetAllData();

        // Get the updated store data after reset
        const updatedStoreData = await db.get('store', 'soloist-store');
        if (updatedStoreData) {
          const updatedStore = JSON.parse(updatedStoreData);
          
          // Restore preserved data
          updatedStore.state.quests = preservedQuests;
          updatedStore.state.missions = preservedMissions;
          updatedStore.state.user.rewardJournal = preservedRewards;
          updatedStore.state.user.weeklyRewards = preservedWeeklyRewards;

          // Save the updated store back to IndexedDB
          await db.put('store', JSON.stringify(updatedStore), 'soloist-store');
        }
      }

      toast({
        title: "Character Reset Complete",
        description: "Your character has been reset to initial state. Redirecting to landing page...",
      });

      // Redirect to landing page to allow character name re-entry
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error('Error resetting character data:', error);
      toast({
        title: "Reset Failed",
        description: `Failed to reset character data: ${error instanceof Error ? error.message : String(error)}`,
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
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-solo-primary to-blue-500 bg-clip-text text-transparent mb-2">Character Stats</h1>
        <p className="text-gray-400">Increase your stats to become stronger.</p>
      </div>

      {/* Character Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
        <Card className="bg-solo-dark border-gray-800 hover:shadow-lg hover:shadow-solo-primary/5 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-solo-primary to-blue-500"></div>
          <CardContent className="pt-5 sm:pt-6 px-3 sm:px-6">
            <div className="text-center space-y-4">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-solo-primary/20 to-blue-500/20 flex items-center justify-center mx-auto backdrop-blur-sm p-1 shadow-inner">
                  <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
                    <span className="text-3xl font-extrabold bg-gradient-to-r from-solo-primary to-blue-500 bg-clip-text text-transparent">{user.level}</span>
                  </div>
                </div>
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-solo-primary to-blue-500 text-white text-xs font-bold rounded-full px-2.5 py-1 animate-pulse shadow-lg shadow-solo-primary/20">
                  {user.rank} Rank
                </div>
              </div>

              <div className="text-center">
                <div className="bg-gray-800/80 rounded-xl p-4 backdrop-blur-sm shadow-inner">
                  <p className="text-xs text-gray-400 flex items-center justify-center gap-1 mb-2">
                    <Star size={14} className="text-yellow-400 stroke-2" />
                    <span className="uppercase tracking-wider font-medium">Experience</span>
                  </p>
                  <div className="font-bold flex items-center justify-center gap-1 text-lg">
                    <Star size={16} className="text-yellow-400 stroke-2" />
                    <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">{formatExp(user.exp)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-solo-dark border-gray-800 md:col-span-2 hover:shadow-lg hover:shadow-solo-primary/5 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-solo-primary to-blue-500"></div>
          <CardHeader className="px-3 sm:px-6 py-4 sm:py-6">
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-solo-primary to-blue-500 bg-clip-text text-transparent">Status</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="space-y-4">
              <div className="flex justify-between p-3 bg-gray-850/30 rounded-lg backdrop-blur-sm">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Next Level</p>
                  <p className="font-bold text-lg">Level {user.level + 1}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400 mb-1">Required EXP</p>
                  <p className="font-bold text-lg">
                    <span className="text-solo-primary">{user.exp}</span>
                    <span className="text-gray-500"> / </span>
                    <span>{user.expToNextLevel}</span>
                  </p>
                </div>
              </div>

              <div className="w-full bg-gray-800/50 h-3 rounded-full overflow-hidden backdrop-blur-sm shadow-inner">
                <div
                  className="bg-gradient-to-r from-solo-primary to-blue-500 h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${expPercentage}%` }}
                />
              </div>

              {/* Shadow Chance Counter */}
              <div className="mt-4 p-4 bg-gray-850/30 rounded-lg backdrop-blur-sm">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-300">Shadow Chances</p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="text-gray-500 hover:text-gray-300 transition-colors">
                          <Info size={14} />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-900 text-white max-w-md border-gray-700">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-solo-primary to-blue-500 bg-clip-text text-transparent">Shadow Chance System</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 text-sm">
                          <p className="leading-relaxed">You have 5 chances per week before becoming cursed. Each missed deadline uses one chance.</p>
                          <div className="space-y-2 p-3 bg-gray-800/50 rounded-lg">
                            <div className="flex justify-between">
                              <span>0-1 chance used:</span>
                              <span className="text-green-400 font-semibold">Safe</span>
                            </div>
                            <div className="flex justify-between">
                              <span>2-3 chances used:</span>
                              <span className="text-yellow-400 font-semibold">Warning</span>
                            </div>
                            <div className="flex justify-between">
                              <span>4-5 chances used:</span>
                              <span className="text-red-400 font-semibold">Danger</span>
                            </div>
                          </div>
                          <p className="mt-2 text-red-400 font-medium">Once all 5 chances are used, you'll be cursed until the end of the week, receiving only 50% EXP from all activities.</p>
                          <p className="text-gray-400 text-xs mt-2">Chances reset every Sunday.</p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      "text-xs font-semibold px-2 py-1 rounded-full",
                      chanceCounter === 0 ? "bg-green-500/20 text-green-400" :
                      chanceCounter <= 2 ? "bg-green-500/20 text-green-400" :
                      chanceCounter <= 3 ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-red-500/20 text-red-400"
                    )}>
                      {Math.min(chanceCounter, 5)}/5 used
                    </p>
                    {isCursed && (
                      <span className="bg-red-500/20 text-red-400 text-xs font-semibold px-2.5 py-1 rounded-full animate-pulse">
                        CURSED
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-full bg-gray-800/70 h-2 rounded-full overflow-hidden shadow-inner">
                  {isCursed ? (
                    <div className="h-full bg-red-500 w-full animate-pulse" />
                  ) : (
                    <div
                      className={cn(
                        "h-full transition-all duration-500",
                        chanceCounter === 0 ? "bg-gradient-to-r from-green-400 to-green-500" :
                        chanceCounter <= 2 ? "bg-gradient-to-r from-green-400 to-green-500" :
                        chanceCounter <= 3 ? "bg-gradient-to-r from-yellow-400 to-yellow-500" :
                        "bg-gradient-to-r from-red-400 to-red-500"
                      )}
                      style={{ width: `${(chanceCounter / 5) * 100}%` }}
                    />
                  )}
                </div>

                {(hasShadowFatigue || isCursed) && (
                  <div className={cn(
                    "mt-2 text-xs flex items-center gap-1 p-2 rounded-md",
                    isCursed
                      ? "text-red-400 bg-red-500/10"
                      : "text-amber-400 bg-amber-500/10"
                  )}>
                    <AlertCircle size={14} />
                    <span className="font-medium">
                      {isCursed
                        ? `Cursed: ${Math.round(getExpModifier() * 100)}% EXP from all activities`
                        : `Shadow Fatigue: ${Math.round(getExpModifier() * 100)}% EXP from all activities`
                      }
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="flex items-center gap-3 p-3 bg-gray-850/30 rounded-lg backdrop-blur-sm hover:bg-gray-800/50 transition-colors duration-300">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-solo-primary/20 to-blue-500/20 flex items-center justify-center text-solo-primary shadow-lg shadow-solo-primary/5">
                    <Clock3Icon size={18} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Current Streak</p>
                    <p className="font-bold text-lg">{user.streakDays} days</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-850/30 rounded-lg backdrop-blur-sm hover:bg-gray-800/50 transition-colors duration-300">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-solo-primary/20 to-blue-500/20 flex items-center justify-center text-solo-primary shadow-lg shadow-solo-primary/5">
                    <HeartIcon size={18} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Longest Streak</p>
                    <p className="font-bold text-lg">{user.longestStreak} days</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile attributes dialog button and milestone button */}
      <div className="sm:hidden flex justify-center gap-3">
        <Dialog>
          <DialogTrigger asChild>
            <Button
              className="bg-gradient-to-r from-solo-primary to-blue-500 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 px-4 py-2.5"
            >
              <SparklesIcon className="mr-2 h-4 w-4" />
              View Attributes
            </Button>
          </DialogTrigger>
          <DialogContent className={`bg-solo-dark border-gray-800 ${isMobile ? 'p-2 max-w-[95vw] max-h-[85vh] overflow-y-auto' : 'p-4 max-w-[90vw] mx-auto'} rounded-xl`}>
            <DialogHeader className={`${isMobile ? 'pb-1' : 'pb-2'} border-b border-gray-800`}>
              <DialogTitle className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold bg-gradient-to-r from-solo-primary to-blue-500 bg-clip-text text-transparent flex items-center`}>
                <SparklesIcon className={`mr-1 ${isMobile ? 'h-3 w-3' : 'h-5 w-5'} text-solo-primary`} />
                Your Attributes
              </DialogTitle>
            </DialogHeader>

            <div className={`${isMobile ? 'pt-1' : 'pt-3'}`}>
              <div className={`grid grid-cols-1 ${isMobile ? 'gap-2' : 'gap-3'}`}>
                {/* Physical Stat - Enhanced mobile version */}
                <div className={`${isMobile ? 'p-2' : 'p-3'} bg-gray-800/40 rounded-lg border border-gray-800/80 hover:bg-gray-800/60 transition-all duration-300 hover:border-gray-700`}>
                  <div className={`flex items-center justify-between ${isMobile ? 'mb-1' : 'mb-2'}`}>
                    <div className="flex items-center gap-2">
                      <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-gradient-to-br from-red-500/20 to-red-700/20 flex items-center justify-center shadow-inner`}>
                        <DumbbellIcon size={isMobile ? 12 : 16} className="text-red-400" />
                      </div>
                      <h3 className={`capitalize ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-200`}>Physical</h3>
                    </div>
                    <span className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold text-red-400`}>{user.stats.physical}</span>
                  </div>

                  {/* Hide EXP progress text and numbers in mobile version */}
                  {!isMobile && (
                    <div className={`w-full mb-1 ${isMobile ? 'text-xs' : 'text-xs'} text-gray-400 flex justify-between`}>
                      <span>EXP Progress</span>
                      <span>{user.stats.physicalExp || 0}/100</span>
                    </div>
                  )}

                  <div className={`w-full ${isMobile ? 'h-1.5' : 'h-2'} bg-gray-900/70 rounded-full overflow-hidden`}>
                    <div className="bg-gradient-to-r from-red-500 to-red-700 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, ((user.stats.physicalExp || 0) / 100) * 100)}%` }} />
                  </div>
                </div>

                {/* Cognitive Stat - Enhanced mobile version */}
                <div className={`${isMobile ? 'p-2' : 'p-3'} bg-gray-800/40 rounded-lg border border-gray-800/80 hover:bg-gray-800/60 transition-all duration-300 hover:border-gray-700`}>
                  <div className={`flex items-center justify-between ${isMobile ? 'mb-1' : 'mb-2'}`}>
                    <div className="flex items-center gap-2">
                      <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-gradient-to-br from-blue-500/20 to-blue-700/20 flex items-center justify-center shadow-inner`}>
                        <BrainIcon size={isMobile ? 12 : 16} className="text-blue-400" />
                      </div>
                      <h3 className={`capitalize ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-200`}>Cognitive</h3>
                    </div>
                    <span className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold text-blue-400`}>{user.stats.cognitive}</span>
                  </div>

                  {/* Hide EXP progress text and numbers in mobile version */}
                  {!isMobile && (
                    <div className={`w-full mb-1 ${isMobile ? 'text-xs' : 'text-xs'} text-gray-400 flex justify-between`}>
                      <span>EXP Progress</span>
                      <span>{user.stats.cognitiveExp || 0}/100</span>
                    </div>
                  )}

                  <div className={`w-full ${isMobile ? 'h-1.5' : 'h-2'} bg-gray-900/70 rounded-full overflow-hidden`}>
                    <div className="bg-gradient-to-r from-blue-500 to-blue-700 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, ((user.stats.cognitiveExp || 0) / 100) * 100)}%` }} />
                  </div>
                </div>

                {/* Emotional Stat - Enhanced mobile version */}
                <div className={`${isMobile ? 'p-2' : 'p-3'} bg-gray-800/40 rounded-lg border border-gray-800/80 hover:bg-gray-800/60 transition-all duration-300 hover:border-gray-700`}>
                  <div className={`flex items-center justify-between ${isMobile ? 'mb-1' : 'mb-2'}`}>
                    <div className="flex items-center gap-2">
                      <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-gradient-to-br from-pink-500/20 to-pink-700/20 flex items-center justify-center shadow-inner`}>
                        <HeartIcon size={isMobile ? 12 : 16} className="text-pink-400" />
                      </div>
                      <h3 className={`capitalize ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-200`}>Emotional</h3>
                    </div>
                    <span className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold text-pink-400`}>{user.stats.emotional}</span>
                  </div>

                  {/* Hide EXP progress text and numbers in mobile version */}
                  {!isMobile && (
                    <div className={`w-full mb-1 ${isMobile ? 'text-xs' : 'text-xs'} text-gray-400 flex justify-between`}>
                      <span>EXP Progress</span>
                      <span>{user.stats.emotionalExp || 0}/100</span>
                    </div>
                  )}

                  <div className={`w-full ${isMobile ? 'h-1.5' : 'h-2'} bg-gray-900/70 rounded-full overflow-hidden`}>
                    <div className="bg-gradient-to-r from-pink-500 to-pink-700 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, ((user.stats.emotionalExp || 0) / 100) * 100)}%` }} />
                  </div>
                </div>

                {/* Spiritual Stat - Enhanced mobile version */}
                <div className={`${isMobile ? 'p-2' : 'p-3'} bg-gray-800/40 rounded-lg border border-gray-800/80 hover:bg-gray-800/60 transition-all duration-300 hover:border-gray-700`}>
                  <div className={`flex items-center justify-between ${isMobile ? 'mb-1' : 'mb-2'}`}>
                    <div className="flex items-center gap-2">
                      <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-gradient-to-br from-purple-500/20 to-purple-700/20 flex items-center justify-center shadow-inner`}>
                        <SparklesIcon size={isMobile ? 12 : 16} className="text-purple-400" />
                      </div>
                      <h3 className={`capitalize ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-200`}>Spiritual</h3>
                    </div>
                    <span className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold text-purple-400`}>{user.stats.spiritual}</span>
                  </div>

                  {/* Hide EXP progress text and numbers in mobile version */}
                  {!isMobile && (
                    <div className={`w-full mb-1 ${isMobile ? 'text-xs' : 'text-xs'} text-gray-400 flex justify-between`}>
                      <span>EXP Progress</span>
                      <span>{user.stats.spiritualExp || 0}/100</span>
                    </div>
                  )}

                  <div className={`w-full ${isMobile ? 'h-1.5' : 'h-2'} bg-gray-900/70 rounded-full overflow-hidden`}>
                    <div className="bg-gradient-to-r from-purple-500 to-purple-700 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, ((user.stats.spiritualExp || 0) / 100) * 100)}%` }} />
                  </div>
                </div>

                {/* Social Stat - Enhanced mobile version */}
                <div className={`${isMobile ? 'p-2' : 'p-3'} bg-gray-800/40 rounded-lg border border-gray-800/80 hover:bg-gray-800/60 transition-all duration-300 hover:border-gray-700`}>
                  <div className={`flex items-center justify-between ${isMobile ? 'mb-1' : 'mb-2'}`}>
                    <div className="flex items-center gap-2">
                      <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-gradient-to-br from-green-500/20 to-green-700/20 flex items-center justify-center shadow-inner`}>
                        <SmileIcon size={isMobile ? 12 : 16} className="text-green-400" />
                      </div>
                      <h3 className={`capitalize ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-200`}>Social</h3>
                    </div>
                    <span className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold text-green-400`}>{user.stats.social}</span>
                  </div>

                  {/* Hide EXP progress text and numbers in mobile version */}
                  {!isMobile && (
                    <div className={`w-full mb-1 ${isMobile ? 'text-xs' : 'text-xs'} text-gray-400 flex justify-between`}>
                      <span>EXP Progress</span>
                      <span>{user.stats.socialExp || 0}/100</span>
                    </div>
                  )}

                  <div className={`w-full ${isMobile ? 'h-1.5' : 'h-2'} bg-gray-900/70 rounded-full overflow-hidden`}>
                    <div className="bg-gradient-to-r from-green-500 to-green-700 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, ((user.stats.socialExp || 0) / 100) * 100)}%` }} />
                  </div>
                </div>
              </div>

              <div className={`${isMobile ? 'mt-2 pt-1' : 'mt-4 pt-3'} border-t border-gray-800 text-center`}>
                <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-gray-400`}>Increase attributes by completing quests and missions</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Milestone button */}
        <Button
          onClick={() => navigate('/milestones')}
          className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 px-4 py-2.5"
        >
          <Trophy className="mr-2 h-4 w-4" />
          Milestones
        </Button>
      </div>

      {/* Attributes Section - Desktop Only */}
      <div className="hidden md:block">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <SparklesIcon className="text-solo-primary" size={24} />
          <span className="bg-gradient-to-r from-solo-primary to-blue-500 bg-clip-text text-transparent">Character Attributes</span>
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <StatCard
            name="physical"
            value={user.stats.physical}
            icon={<DumbbellIcon size={20} />}
          />
          <StatCard
            name="cognitive"
            value={user.stats.cognitive}
            icon={<BrainIcon size={20} />}
          />
          <StatCard
            name="emotional"
            value={user.stats.emotional}
            icon={<HeartIcon size={20} />}
          />
          <StatCard
            name="spiritual"
            value={user.stats.spiritual}
            icon={<SparklesIcon size={20} />}
          />
          <StatCard
            name="social"
            value={user.stats.social}
            icon={<SmileIcon size={20} />}
          />
        </div>
      </div>

      {/* Rank System - Stacked on mobile, side-by-side on desktop */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Crown className="text-yellow-400" size={24} />
          <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">Rank System</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
          <Card className="bg-solo-dark border-gray-800 hover:shadow-lg hover:shadow-solo-primary/5 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-solo-primary to-blue-500"></div>
            <CardHeader className="px-3 sm:px-6 py-4 sm:py-6">
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="text-solo-primary animate-pulse-slow">
                  <Crown size={20} />
                </div>
                <span className="bg-gradient-to-r from-solo-primary to-blue-500 bg-clip-text text-transparent">Current Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-850/30 rounded-lg border border-gray-800/50 backdrop-blur-sm">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">Current Rank</p>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-solo-primary/20 to-blue-500/20 flex items-center justify-center text-solo-primary shadow-lg shadow-solo-primary/10">
                        {typeof rankDetails.find(r => r.rank === user.rank)?.icon === 'string' ? (
                          <span className="font-bold">
                            {rankDetails.find(r => r.rank === user.rank)?.icon}
                          </span>
                        ) : (
                          rankDetails.find(r => r.rank === user.rank)?.icon || 'F'
                        )}
                      </div>
                      <span className="text-3xl font-bold bg-gradient-to-r from-solo-primary to-blue-500 bg-clip-text text-transparent">
                        {user.rank}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 text-right">
                    <p className="text-sm text-gray-400">Current Level</p>
                    <div className="text-3xl font-bold flex items-center justify-end">
                      <span className="bg-gradient-to-r from-gray-200 to-gray-400 bg-clip-text text-transparent">{user.level}</span>
                      <div className="w-2 h-2 bg-solo-primary rounded-full ml-2 animate-pulse"></div>
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

          <Card className="bg-solo-dark border-gray-800 hover:shadow-lg hover:shadow-solo-primary/5 transition-all duration-300 overflow-hidden hidden md:block">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-amber-500"></div>
            <CardHeader className="px-3 sm:px-6 py-4 sm:py-6">
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="text-yellow-400">
                  <Trophy size={20} />
                </div>
                <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">Current Rank Benefits</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="space-y-4">
                <div className="p-4 bg-gray-850/30 rounded-lg border border-gray-800/50 backdrop-blur-sm mb-4">
                  <p className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Rank {user.rank} Benefits</p>
                  <div className="text-sm text-gray-300 italic leading-relaxed">
                    {rankDetails.find(r => r.rank === user.rank)?.description || "Beginning hunter with standard rewards."}
                  </div>
                </div>

                {rankDetails.find(r => r.rank === user.rank)?.benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 hover:bg-gray-800/50 rounded-md transition-all duration-300 hover:translate-x-1 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-solo-primary/20 to-blue-500/20 flex items-center justify-center text-solo-primary shadow-lg shadow-solo-primary/10 group-hover:shadow-solo-primary/20 transition-all duration-300">
                      <Star size={16} className="transition-transform duration-300 group-hover:scale-110" />
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
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 sm:p-4 relative mt-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3 sm:gap-0">
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Database className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
              <span className="text-sm sm:text-base">IndexedDB Contents</span>
            </h2>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="destructive"
                size="sm"
                className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                onClick={handleCharacterRefresh}
              >
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Character Refresh</span>
                <span className="sm:hidden">Reset</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                onClick={loadDbData}
                disabled={isLoadingDb}
              >
                <span className="hidden sm:inline">Refresh Data</span>
                <span className="sm:hidden">Refresh</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="px-2 sm:px-3 py-1.5 sm:py-2"
                onClick={() => setShowDbDebug(false)}
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>

          {isLoadingDb ? (
            <div className="text-center py-4">
              <p className="text-sm sm:text-base">Loading database contents...</p>
            </div>
          ) : dbContents ? (
            <div className="space-y-3 sm:space-y-4">
              <div>
                <h3 className="text-sm sm:text-md font-semibold mb-2">Zustand Store (from IndexedDB)</h3>
                <div className="bg-gray-800 p-2 sm:p-3 rounded max-h-48 sm:max-h-60 overflow-auto text-xs sm:text-sm">
                  {dbContents.zustandStore ? (
                    <>
                      <p className="text-green-400 mb-2">✓ IndexedDB is working correctly</p>
                      <details>
                        <summary className="cursor-pointer text-blue-400 hover:text-blue-300 text-xs sm:text-sm">
                          View Quests in Store (Total: {dbContents.zustandStore.state?.quests?.length || 0})
                        </summary>
                        <div className="mt-2 space-y-2 text-xs p-2 bg-gray-900 rounded">
                          {dbContents.zustandStore.state?.quests?.length > 0 ? (
                            dbContents.zustandStore.state.quests.map((quest: any, index: number) => (
                              <div key={index} className="p-2 border border-gray-700 rounded bg-gray-800/50">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-1 mb-1">
                                  <h4 className="text-xs sm:text-sm text-white font-medium truncate">{quest.title}</h4>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-5 sm:h-6 px-1.5 sm:px-2 text-[10px] sm:text-xs self-start sm:self-auto"
                                    onClick={() => handleDeleteQuest(quest.id)}
                                  >
                                    Del
                                  </Button>
                                </div>
                                <p className="text-[10px] sm:text-xs text-gray-400">ID: {quest.id}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs sm:text-sm text-gray-400">No quests available in store.</p>
                          )}
                        </div>
                      </details>

                      <details className="mt-2">
                        <summary className="cursor-pointer text-blue-400 hover:text-blue-300 text-xs sm:text-sm">
                          View Missions in Store (Total: {dbContents.zustandStore.state?.missions?.length || 0})
                        </summary>
                        <div className="mt-2 space-y-2 text-xs p-2 bg-gray-900 rounded">
                          {dbContents.zustandStore.state?.missions?.length > 0 ? (
                            dbContents.zustandStore.state.missions.map((mission: any, index: number) => (
                              <div key={index} className="p-2 border border-gray-700 rounded bg-gray-800/50">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-1 mb-1">
                                  <h4 className="text-xs sm:text-sm text-white font-medium truncate">{mission.title}</h4>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-5 sm:h-6 px-1.5 sm:px-2 text-[10px] sm:text-xs self-start sm:self-auto"
                                    onClick={() => handleDeleteMission(mission.id)}
                                  >
                                    Del
                                  </Button>
                                </div>
                                <p className="text-[10px] sm:text-xs text-gray-400">ID: {mission.id}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs sm:text-sm text-gray-400">No missions available in store.</p>
                          )}
                        </div>
                      </details>

                      <details className="mt-2">
                        <summary className="cursor-pointer text-blue-400 hover:text-blue-300 text-xs sm:text-sm">
                          View Completed Missions in Store (Total: {dbContents.zustandStore.state?.completedMissionHistory?.length || 0})
                        </summary>
                        <pre className="text-[10px] sm:text-xs mt-2 p-2 bg-gray-900 rounded overflow-x-auto">
                          {JSON.stringify(dbContents.zustandStore.state?.completedMissionHistory || [], null, 2)}
                        </pre>
                      </details>

                      <details className="mt-2">
                        <summary className="cursor-pointer text-blue-400 hover:text-blue-300 text-xs sm:text-sm">
                          View Shop Items in Store (Total: {dbContents.zustandStore.state?.shopItems?.length || 0})
                        </summary>
                        <div className="mt-2 space-y-2 text-xs p-2 bg-gray-900 rounded">
                          {dbContents.zustandStore.state?.shopItems?.length > 0 ? (
                            dbContents.zustandStore.state.shopItems.map((item: any, index: number) => (
                              <div key={index} className="p-2 border border-gray-700 rounded bg-gray-800/50">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-1 mb-1">
                                  <h4 className="text-xs sm:text-sm text-white font-medium truncate">{item.name}</h4>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-5 sm:h-6 px-1.5 sm:px-2 text-[10px] sm:text-xs self-start sm:self-auto"
                                    onClick={() => handleDeleteShopItem(item.id)}
                                  >
                                    Del
                                  </Button>
                                </div>
                                <p className="text-[10px] sm:text-xs text-gray-400">ID: {item.id} | Cost: {item.cost}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs sm:text-sm text-gray-400">No shop items available in store.</p>
                          )}
                        </div>
                      </details>
                    </>
                  ) : (
                    <p className="text-red-400 text-xs sm:text-sm">No Zustand store data found in IndexedDB</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm sm:text-md font-semibold mb-2">Current State (in memory)</h3>
                <div className="bg-gray-800 p-2 sm:p-3 rounded max-h-48 sm:max-h-60 overflow-auto text-xs sm:text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="font-bold text-blue-400 text-xs sm:text-sm">Quests</p>
                      <p className="text-xs sm:text-sm mt-1">
                        Total: <span className="font-bold">{quests.length}</span>
                      </p>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-blue-400 hover:text-blue-300 text-xs sm:text-sm">
                          View Quest Types
                        </summary>
                        <div className="mt-2 space-y-1 text-xs sm:text-sm">
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
                      <p className="font-bold text-blue-400 text-xs sm:text-sm">Missions</p>
                      <p className="text-xs sm:text-sm mt-1">
                        Total Missions: <span className="font-bold">
                          {dbContents.zustandStore?.state?.missions?.length || 0}
                        </span>
                      </p>
                      <p className="text-xs sm:text-sm mt-1">
                        Completed Missions: <span className="font-bold text-green-400">
                          {dbContents.zustandStore?.state?.completedMissionHistory?.length || 0}
                        </span>
                      </p>
                      <p className="text-[10px] sm:text-xs text-green-400 mt-2">
                        ✓ Missions are now stored in the main Zustand store!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center py-4 text-gray-400 text-sm sm:text-base">
              Click "Refresh" to load IndexedDB contents
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Character;


