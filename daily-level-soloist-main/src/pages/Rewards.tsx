import React, { useState, useEffect } from 'react';
import { useSoloLevelingStore } from '@/lib/store';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Gift,
  Calendar,
  Trophy,
  Star,
  CheckCircle,
  XCircle,
  Plus,
  TrendingUp,
  Award,
  Clock,
  Target,
  HelpCircle
} from 'lucide-react';
import { format, isToday, isPast, isFuture } from 'date-fns';
import { toast } from '@/hooks/use-toast';

const Rewards = () => {
  const isMobile = useIsMobile();
  const [
    user,
    setDailyReward,
    checkDailyCompletion,
    claimDailyReward,
    getDailyRewardEntry,
    getRewardJournalStats,
    getDailyCompletionDetails
  ] = useSoloLevelingStore(state => [
    state.user,
    state.setDailyReward,
    state.checkDailyCompletion,
    state.claimDailyReward,
    state.getDailyRewardEntry,
    state.getRewardJournalStats,
    state.getDailyCompletionDetails
  ]);

  const [isSetRewardDialogOpen, setIsSetRewardDialogOpen] = useState(false);
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [rewardText, setRewardText] = useState('');

  const stats = getRewardJournalStats();
  const todayEntry = getDailyRewardEntry(new Date());
  const selectedEntry = getDailyRewardEntry(selectedDate);
  const todayDetails = getDailyCompletionDetails(new Date());

  // No automatic updates - only manual updates when needed

  const handleSetReward = () => {
    if (!rewardText.trim()) {
      toast({
        title: "Empty Reward",
        description: "Please enter a reward description.",
        variant: "destructive"
      });
      return;
    }

    setDailyReward(selectedDate, rewardText);
    setRewardText('');
    setIsSetRewardDialogOpen(false);
  };

  const handleClaimReward = () => {
    claimDailyReward(selectedDate);
  };

  const getCompletionStatus = (date: Date) => {
    const entry = getDailyRewardEntry(date);
    if (!entry) return 'no-reward';

    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const isFutureDate = date > today;

    if (entry.claimed) return 'claimed';

    // For future dates, show as scheduled
    if (isFutureDate) return 'scheduled';

    // For today and past dates, check completion
    const isCompleted = checkDailyCompletion(date);
    if (isCompleted) return 'ready';
    if (isPast(date) && !isCompleted) return 'missed';
    return 'pending';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'claimed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'ready': return <Gift className="h-5 w-5 text-yellow-500 animate-pulse" />;
      case 'missed': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending': return <Clock className="h-5 w-5 text-blue-500" />;
      case 'scheduled': return <Calendar className="h-5 w-5 text-purple-500" />;
      default: return <Plus className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'claimed': return 'Reward Claimed!';
      case 'ready': return 'Ready to Claim!';
      case 'missed': return 'Missed';
      case 'pending': return 'In Progress';
      case 'scheduled': return 'Scheduled';
      default: return 'Set Reward';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'claimed': return 'border-green-500/50 bg-green-500/10';
      case 'ready': return 'border-yellow-500/50 bg-yellow-500/10';
      case 'missed': return 'border-red-500/50 bg-red-500/10';
      case 'pending': return 'border-blue-500/50 bg-blue-500/10';
      case 'scheduled': return 'border-purple-500/50 bg-purple-500/10';
      default: return 'border-gray-500/50 bg-gray-500/10';
    }
  };

  // Generate today + 4 days in advance for dynamic rolling window
  const recentDays = Array.from({ length: 5 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i); // Today (i=0) + next 4 days
    return date;
  });

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-solo-text flex items-center gap-2">
            <Gift className="h-8 w-8 text-solo-primary" />
            Custom Reward Journal
          </h1>
          <Button
            variant="outline"
            size={isMobile ? "sm" : "default"}
            onClick={() => setIsHelpDialogOpen(true)}
            className="flex items-center gap-1"
          >
            <HelpCircle className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
            {!isMobile && "How it Works"}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-gray-800/50 bg-solo-dark/90">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="text-sm text-gray-400">Total Rewards</span>
            </div>
            <div className="text-2xl font-bold text-solo-primary">{stats.totalRewards}</div>
          </CardContent>
        </Card>

        <Card className="border-gray-800/50 bg-solo-dark/90">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm text-gray-400">Claimed</span>
            </div>
            <div className="text-2xl font-bold text-green-500">{stats.claimedRewards}</div>
          </CardContent>
        </Card>

        <Card className="border-gray-800/50 bg-solo-dark/90">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-gray-400">Current Streak</span>
            </div>
            <div className="text-2xl font-bold text-blue-500">{stats.currentStreak}</div>
          </CardContent>
        </Card>

        <Card className="border-gray-800/50 bg-solo-dark/90">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-purple-500" />
              <span className="text-sm text-gray-400">Best Streak</span>
            </div>
            <div className="text-2xl font-bold text-purple-500">{stats.longestStreak}</div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Reward */}
      <Card className="border-gray-800/50 bg-solo-dark/90">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-6 w-6 text-solo-primary" />
            Today's Reward
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayEntry ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-gray-700 bg-gray-800/50">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(getCompletionStatus(new Date()))}
                  <span className="font-medium">{getStatusText(getCompletionStatus(new Date()))}</span>
                </div>
                <p className="text-lg text-gray-300">"{todayEntry.customReward}"</p>
              </div>

              {getCompletionStatus(new Date()) === 'ready' && (
                <Button
                  onClick={handleClaimReward}
                  className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500"
                >
                  <Gift className="h-4 w-4 mr-2" />
                  Claim Your Reward!
                </Button>
              )}

              {getCompletionStatus(new Date()) === 'pending' && (
                <div className="space-y-3">
                  <div className="text-sm text-gray-400">
                    Complete all requirements to unlock your reward:
                  </div>

                  {/* Daily Wins Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Daily Wins ({todayDetails?.dailyWins?.completed?.length || 0}/4)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {['mental', 'physical', 'spiritual', 'intelligence'].map(category => (
                        <div key={category} className={`flex items-center gap-1 ${
                          todayDetails?.dailyWins?.completed?.includes(category) ? 'text-green-400' : 'text-gray-500'
                        }`}>
                          {todayDetails?.dailyWins?.completed?.includes(category) ?
                            <CheckCircle className="h-3 w-3" /> :
                            <XCircle className="h-3 w-3" />
                          }
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Attributes Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">Attributes ({todayDetails?.attributes?.completed?.length || 0}/5)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {['physical', 'cognitive', 'emotional', 'spiritual', 'social'].map(category => (
                        <div key={category} className={`flex items-center gap-1 ${
                          todayDetails?.attributes?.completed?.includes(category) ? 'text-green-400' : 'text-gray-500'
                        }`}>
                          {todayDetails?.attributes?.completed?.includes(category) ?
                            <CheckCircle className="h-3 w-3" /> :
                            <XCircle className="h-3 w-3" />
                          }
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quests & Missions Progress */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="font-medium text-gray-300">Quests</div>
                      <div className={`flex items-center gap-1 ${todayDetails?.quests?.mainQuest ? 'text-green-400' : 'text-gray-500'}`}>
                        {todayDetails?.quests?.mainQuest ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        Main Quest
                      </div>
                      <div className={`flex items-center gap-1 ${todayDetails?.quests?.sideQuest ? 'text-green-400' : 'text-gray-500'}`}>
                        {todayDetails?.quests?.sideQuest ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        Side Quest
                      </div>
                      <div className={`flex items-center gap-1 ${todayDetails?.quests?.dailyQuests ? 'text-green-400' : 'text-gray-500'}`}>
                        {todayDetails?.quests?.dailyQuests ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        Daily Quests
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium text-gray-300">Missions</div>
                      <div className={`flex items-center gap-1 ${todayDetails?.missions ? 'text-green-400' : 'text-gray-500'}`}>
                        {todayDetails?.missions ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        All Missions
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {getCompletionStatus(new Date()) === 'scheduled' && (
                <div className="text-sm text-gray-400 text-center py-4">
                  <Calendar className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  This reward is scheduled for today. Complete your tasks to unlock it!
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Gift className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No reward set for today</p>
              <Dialog open={isSetRewardDialogOpen} onOpenChange={setIsSetRewardDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setSelectedDate(new Date());
                      setRewardText('');
                    }}
                    className="bg-gradient-to-r from-solo-primary to-solo-secondary"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Set Today's Reward
                  </Button>
                </DialogTrigger>
                <DialogContent className={isMobile ? "w-[90vw] max-w-[350px]" : ""}>
                  <DialogHeader>
                    <DialogTitle>Set Your Daily Reward</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="reward">What will you reward yourself with?</Label>
                      <Textarea
                        id="reward"
                        placeholder="e.g., Watch a movie, Buy that book, 1 hour of gaming..."
                        value={rewardText}
                        onChange={(e) => setRewardText(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSetReward} className="flex-1">
                        Set Reward
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsSetRewardDialogOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Days */}
      <Card className="border-gray-800/50 bg-solo-dark/90">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-6 w-6 text-solo-primary" />
            Today & Upcoming Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentDays.map((date, index) => {
              const entry = getDailyRewardEntry(date);
              const status = getCompletionStatus(date);
              const isCurrentDay = isToday(date);

              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border transition-all cursor-pointer hover:border-solo-primary/50 ${
                    getStatusColor(status)
                  } ${isCurrentDay ? 'ring-2 ring-solo-primary/30' : ''}`}
                  onClick={() => {
                    setSelectedDate(date);
                    if (!entry) {
                      setRewardText('');
                      setIsSetRewardDialogOpen(true);
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">
                      {(() => {
                        const today = new Date();
                        const tomorrow = new Date(today);
                        tomorrow.setDate(today.getDate() + 1);
                        const dayAfterTomorrow = new Date(today);
                        dayAfterTomorrow.setDate(today.getDate() + 2);

                        if (isCurrentDay) return 'Today';
                        if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
                        if (date.toDateString() === dayAfterTomorrow.toDateString()) return 'Day After Tomorrow';
                        return format(date, 'MMM dd');
                      })()}
                    </div>
                    {getStatusIcon(status)}
                  </div>

                  {entry ? (
                    <div>
                      <p className="text-sm text-gray-300 truncate mb-2">
                        "{entry.customReward}"
                      </p>
                      <div className="text-xs text-gray-500">
                        {getStatusText(status)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      Click to set reward
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Help Dialog */}
      <Dialog open={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen}>
        <DialogContent className={isMobile ? "w-[90vw] max-w-[400px]" : "max-w-[500px]"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-solo-primary" />
              How the Custom Reward Journal Works
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold text-solo-primary mb-2">🎯 Set Your Daily Reward</h4>
              <p className="text-gray-300">
                Each day, set a personal reward for completing ALL your tasks and quests.
                This creates a motivational contract with yourself.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-solo-primary mb-2">✅ Complete Everything (Strict Rules)</h4>
              <p className="text-gray-300">
                To unlock your reward, you must complete ALL of the following:
              </p>
              <ul className="list-disc list-inside text-gray-400 mt-2 space-y-1">
                <li><strong>All 4 Daily Wins:</strong> Mental, Physical, Spiritual, Intelligence (1 task each)</li>
                <li><strong>All 5 Attributes:</strong> Physical, Cognitive, Emotional, Spiritual, Social (1 task each)</li>
                <li>1 Main Quest</li>
                <li>1 Side Quest</li>
                <li>All Daily Quests</li>
                <li>All Mission Tasks for the day</li>
              </ul>
              <p className="text-yellow-300 text-sm mt-2">
                <strong>Total:</strong> 9 specific tasks (4 daily wins + 5 attributes) + quests + missions
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-solo-primary mb-2">🎁 Claim Your Reward</h4>
              <p className="text-gray-300">
                When you complete everything, your reward becomes claimable.
                The system will celebrate your achievement!
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-solo-primary mb-2">📊 Track Your Progress</h4>
              <p className="text-gray-300">
                Build streaks, track your success rate, and see your reward history.
                Use this data to understand what motivates you most.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setIsHelpDialogOpen(false)}>
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Set Reward Dialog */}
      <Dialog open={isSetRewardDialogOpen} onOpenChange={setIsSetRewardDialogOpen}>
        <DialogContent className={isMobile ? "w-[90vw] max-w-[350px]" : ""}>
          <DialogHeader>
            <DialogTitle>
              Set Reward for {format(selectedDate, 'MMMM dd, yyyy')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reward-input">What will you reward yourself with?</Label>
              <Textarea
                id="reward-input"
                placeholder="e.g., Watch a movie, Buy that book, 1 hour of gaming, Treat myself to dinner..."
                value={rewardText}
                onChange={(e) => setRewardText(e.target.value)}
                className="mt-2"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                Make it something you genuinely look forward to!
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSetReward} className="flex-1">
                Set Reward
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsSetRewardDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Rewards;
