import React, { useState, useEffect } from 'react';
import { useSoloLevelingStore } from '@/lib/store';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { CustomDialogContent } from '@/components/ui/custom-dialog';
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
  Award,
  Clock,
  Target,
  HelpCircle,
  Lightbulb,
  Coffee,
  GamepadIcon,
  ShoppingBag,
  Music,
  BookOpen,
  Utensils,
  Tv,
  Headphones,
  Heart,
  Sparkles,
  MapPin,
  Dumbbell,
  Palette,
  Camera,
  Users,
  Home,
  Zap,
  Crown,
  CalendarDays,
  Sword,
  Eye,
  EyeOff,
  Info,
  Bed,
  PenTool,
  Power,
  Smartphone,
  Wallet,
  TrendingUp
} from 'lucide-react';
import { format, isToday, addDays } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { MissedRewardCard } from '@/components/ui/missed-reward-card';

// Reward suggestions with icons and categories
const rewardSuggestions = [
  { id: 1, text: "Watch one episode of your favorite series guilt-free", icon: Tv, category: "Entertainment" },
  { id: 2, text: "Enjoy a fancy homemade smoothie or favorite snack", icon: Utensils, category: "Food" },
  { id: 3, text: "Take a long, relaxing shower with music or candles", icon: Music, category: "Self-care" },
  { id: 4, text: "Spend 30 minutes on a hobby (art, gaming, reading)", icon: Palette, category: "Hobby" },
  { id: 5, text: "Go for a sunset walk or solo nature moment", icon: MapPin, category: "Nature" },
  { id: 6, text: "Buy a small digital good (game skin, music, app)", icon: ShoppingBag, category: "Shopping" },
  { id: 7, text: "Put on comfy clothes and do nothing for 20 minutes", icon: Home, category: "Self-care" },
  { id: 8, text: "Try a new coffee/tea drink from your favorite spot", icon: Coffee, category: "Food" },
  { id: 9, text: "Play a short nostalgic video game", icon: GamepadIcon, category: "Entertainment" },
  { id: 10, text: "Listen to a podcast or playlist with no multitasking", icon: Headphones, category: "Entertainment" },
  { id: 11, text: "Rearrange or clean your favorite workspace nook", icon: Home, category: "Productivity" },
  { id: 12, text: "Journal with stickers, prompts, or doodles", icon: BookOpen, category: "Reflection" },
  { id: 13, text: "Guilt-free 1-hour nap or sleep in the next morning", icon: Bed, category: "Rest" },
  { id: 14, text: "Watch a YouTube documentary on a topic you love", icon: Tv, category: "Learning" },
  { id: 15, text: "Take aesthetic pictures of your room, setup, or journal", icon: Camera, category: "Creativity" },
  { id: 16, text: "Try out a new app or tool you've been curious about", icon: Smartphone, category: "Tech" },
  { id: 17, text: "Buy a ₱50–₱100 item just for fun", icon: ShoppingBag, category: "Shopping" },
  { id: 18, text: "Create a victory playlist and jam to 2–3 songs", icon: Music, category: "Music" },
  { id: 19, text: "20-minute digital detox + lie down and do nothing", icon: Power, category: "Rest" },
  { id: 20, text: "Doodle, write a poem, or sketch something silly", icon: PenTool, category: "Creativity" },
];

// Weekly reward suggestions - more substantial rewards for completing a full week
const weeklyRewardSuggestions = [
  { id: 1, text: "Buy something from your wishlist (₱500–₱1500 range)", icon: ShoppingBag, category: "Shopping" },
  { id: 2, text: "Go on a solo date (coffee shop, bookstore, park)", icon: Coffee, category: "Self-care" },
  { id: 3, text: "Take a half-day adventure (museum, hike, beach, mall)", icon: MapPin, category: "Experience" },
  { id: 4, text: "Order your favorite meal guilt-free", icon: Utensils, category: "Food" },
  { id: 5, text: "Plan a fun group activity or hangout with close friends", icon: Users, category: "Social" },
  { id: 6, text: "Book a massage, haircut, or self-care appointment", icon: Heart, category: "Self-care" },
  { id: 7, text: "Buy a new book, journal, or skill-building resource", icon: BookOpen, category: "Learning" },
  { id: 8, text: "Upgrade your workspace or room (plant, light, etc.)", icon: Home, category: "Lifestyle" },
  { id: 9, text: "Enroll in a short course or challenge yourself with a new skill", icon: Award, category: "Learning" },
  { id: 10, text: "Buy a tool, app, or software that boosts productivity", icon: Zap, category: "Productivity" },
  { id: 11, text: "Take a \"Play Day\" — all rest, no guilt", icon: Heart, category: "Rest" },
  { id: 12, text: "Have a themed movie night with snacks and lights", icon: Tv, category: "Entertainment" },
  { id: 13, text: "Print or design a \"badge\" for completing the week", icon: Award, category: "Achievement" },
  { id: 14, text: "Save ₱200–₱500 into a \"Victory Vault\" for bigger rewards", icon: Wallet, category: "Finance" },
  { id: 15, text: "Have a sleep-in Saturday with no alarms or tasks", icon: Bed, category: "Rest" },
  { id: 16, text: "Invest in something future-you will thank you for", icon: TrendingUp, category: "Growth" },
  { id: 17, text: "Get a new outfit piece or accessory", icon: ShoppingBag, category: "Shopping" },
  { id: 18, text: "Take a solo journaling and reflection trip with coffee", icon: BookOpen, category: "Reflection" },
  { id: 19, text: "Claim a \"Power Token\" — redeemable later for big prizes", icon: Sparkles, category: "Achievement" },
  { id: 20, text: "Create a physical or digital reward wall with photos and notes", icon: Camera, category: "Creativity" },
];

// Reduced weekly reward suggestions - smaller, easier rewards for reduced requirements
const reducedWeeklyRewardSuggestions = [
  { id: 1, text: "Buy a small snack or drink you love", icon: Utensils, category: "Food" },
  { id: 2, text: "Take a 20-minute walk or stretch session to reset", icon: Dumbbell, category: "Self-care" },
  { id: 3, text: "Listen to an album or curated playlist start to finish", icon: Headphones, category: "Entertainment" },
  { id: 4, text: "Take a 30-minute guilt-free break with no screen multitasking", icon: Clock, category: "Rest" },
  { id: 5, text: "Call or text someone positive in your life", icon: Users, category: "Social" },
  { id: 6, text: "Do a mini room clean-up to symbolically refresh", icon: Sparkles, category: "Productivity" },
  { id: 7, text: "Watch one short film or documentary (15–30 min)", icon: Tv, category: "Entertainment" },
  { id: 8, text: "Have a warm drink and write down 3 things you did well", icon: Coffee, category: "Reflection" },
  { id: 9, text: "Create a reflection page: \"What went wrong, and what's next?\"", icon: BookOpen, category: "Reflection" },
  { id: 10, text: "Light a candle and just sit with calm music for 10 minutes", icon: Music, category: "Self-care" },
  { id: 11, text: "Read one inspiring article, essay, or chapter", icon: BookOpen, category: "Learning" },
  { id: 12, text: "Watch 1–2 motivational videos to reset your mindset", icon: Zap, category: "Motivation" },
  { id: 13, text: "Redeem a \"half reward\" from your personal reward stash", icon: Gift, category: "Reward" },
  { id: 14, text: "Treat yourself to a ₱50 or lower item just for showing up", icon: ShoppingBag, category: "Shopping" },
  { id: 15, text: "Postpone a bigger reward and bank it as a \"Next Week Bonus\"", icon: CalendarDays, category: "Planning" },
  { id: 16, text: "Doodle or create something unstructured to relax", icon: PenTool, category: "Creativity" },
  { id: 17, text: "Make your bed and tidy your zone — small effort, big reset", icon: Home, category: "Productivity" },
  { id: 18, text: "Set a \"soft goal\" for the next week and design a low-stress plan", icon: Target, category: "Planning" },
  { id: 19, text: "Gift yourself a 1-hour creative or learning block", icon: Award, category: "Self-improvement" },
  { id: 20, text: "Go somewhere new in your city for a fresh experience (short trip)", icon: MapPin, category: "Experience" },
];

const Rewards = () => {
  const isMobile = useIsMobile();
  const [
    setDailyReward,
    checkDailyCompletion,
    claimDailyReward,
    getDailyRewardEntry,
    getRewardJournalStats,
    getDailyCompletionDetails,
    setWeeklyReward,
    getWeeklyRewardEntry,
    checkWeeklyReducedCompletion,
    getWeeklyCompletionDetails,
    tasks,
    quests,
    missions,
    completedMissionHistory
  ] = useSoloLevelingStore(state => [
    state.setDailyReward,
    state.checkDailyCompletion,
    state.claimDailyReward,
    state.getDailyRewardEntry,
    state.getRewardJournalStats,
    state.getDailyCompletionDetails,
    state.setWeeklyReward,
    state.getWeeklyRewardEntry,
    state.checkWeeklyReducedCompletion,
    state.getWeeklyCompletionDetails,
    state.tasks,
    state.quests,
    state.missions,
    state.completedMissionHistory
  ]);

  const [isSetRewardDialogOpen, setIsSetRewardDialogOpen] = useState(false);
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [isSuggestionsDialogOpen, setIsSuggestionsDialogOpen] = useState(false);
  const [isWeeklySuggestionsDialogOpen, setIsWeeklySuggestionsDialogOpen] = useState(false);
  const [isReducedWeeklySuggestionsDialogOpen, setIsReducedWeeklySuggestionsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [rewardText, setRewardText] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);
  const [selectedWeeklySuggestion, setSelectedWeeklySuggestion] = useState<any>(null);
  const [selectedReducedWeeklySuggestion, setSelectedReducedWeeklySuggestion] = useState<any>(null);
  const [suggestionTargetDate, setSuggestionTargetDate] = useState<Date>(new Date());
  const [weeklyTargetDate, setWeeklyTargetDate] = useState<Date>(new Date());
  const [reducedWeeklyTargetDate, setReducedWeeklyTargetDate] = useState<Date>(new Date());
  const [customWeeklyReward, setCustomWeeklyReward] = useState('');
  const [customReducedWeeklyReward, setCustomReducedWeeklyReward] = useState('');
  const [showWeeklyRewards, setShowWeeklyRewards] = useState(false);
  const [showRecentDays, setShowRecentDays] = useState(false);
  const [isEditDailyRewardDialogOpen, setIsEditDailyRewardDialogOpen] = useState(false);
  const [editingDailyReward, setEditingDailyReward] = useState('');
  const [showReducedRequirements, setShowReducedRequirements] = useState(false);

  const stats = getRewardJournalStats();
  const todayEntry = getDailyRewardEntry(new Date());

  // Force re-render when tasks, quests, or missions change to update weekly tracking
  const [forceUpdate, setForceUpdate] = useState(0);

  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [tasks, quests, missions, completedMissionHistory]);

  // Memoized weekly details that updates when dependencies change
  const getCurrentWeeklyDetails = () => {
    const today = new Date();
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);
    return getWeeklyCompletionDetails(currentWeekStart);
  };

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
    const completionDetails = getDailyCompletionDetails(selectedDate);
    const totalMissed = completionDetails.missedItems.tasks + completionDetails.missedItems.quests + completionDetails.missedItems.missions;

    if (totalMissed > 0) {
      toast({
        title: "⚠️ Reward Claimed with Penalties",
        description: `You completed ${totalMissed} item(s) with deadline penalties, but still earned your reward!`,
        variant: "default"
      });
    }

    claimDailyReward(selectedDate);
  };

  const handleSuggestionSelect = (suggestion: any, targetDate: Date) => {
    setDailyReward(targetDate, suggestion.text);
    setIsSuggestionsDialogOpen(false);
    setSelectedSuggestion(null);

    toast({
      title: "Reward Set from Suggestion!",
      description: `Set "${suggestion.text}" for ${format(targetDate, 'MMM dd, yyyy')}`,
      variant: "default"
    });
  };

  const openSuggestionDialog = (suggestion: any) => {
    setSelectedSuggestion(suggestion);
    setSuggestionTargetDate(new Date()); // Default to today
    setIsSuggestionsDialogOpen(true);
  };

  const handleWeeklySuggestionSelect = (suggestion: any, targetDate: Date) => {
    setWeeklyReward(targetDate, suggestion.text);
    setIsWeeklySuggestionsDialogOpen(false);
    setSelectedWeeklySuggestion(null);

    toast({
      title: "Weekly Reward Set!",
      description: `Set "${suggestion.text}" for the week of ${format(targetDate, 'MMM dd, yyyy')}`,
      variant: "default"
    });
  };

  const openWeeklySuggestionDialog = (suggestion: any) => {
    setSelectedWeeklySuggestion(suggestion);
    // Default to next Sunday (end of current week)
    const nextSunday = new Date();
    const daysUntilSunday = 7 - nextSunday.getDay();
    nextSunday.setDate(nextSunday.getDate() + daysUntilSunday);
    setWeeklyTargetDate(nextSunday);
    setIsWeeklySuggestionsDialogOpen(true);
  };

  const handleReducedWeeklySuggestionSelect = (suggestion: any, targetDate: Date) => {
    setWeeklyReward(targetDate, suggestion.text);
    setIsReducedWeeklySuggestionsDialogOpen(false);
    setSelectedReducedWeeklySuggestion(null);

    toast({
      title: "Reduced Weekly Reward Set!",
      description: `Set "${suggestion.text}" for the week of ${format(targetDate, 'MMM dd, yyyy')} (Reduced Requirements)`,
      variant: "default"
    });
  };

  const openReducedWeeklySuggestionDialog = (suggestion: any) => {
    setSelectedReducedWeeklySuggestion(suggestion);
    // Default to next Sunday (end of current week)
    const nextSunday = new Date();
    const daysUntilSunday = 7 - nextSunday.getDay();
    nextSunday.setDate(nextSunday.getDate() + daysUntilSunday);
    setReducedWeeklyTargetDate(nextSunday);
    setIsReducedWeeklySuggestionsDialogOpen(true);
  };

  const getCompletionStatus = (date: Date) => {
    const entry = getDailyRewardEntry(date);
    if (!entry) return 'no-reward';

    const today = new Date();
    const isFutureDate = date > today;
    const isPastDate = date < today;

    if (entry.claimed) return 'claimed';

    // Check if explicitly marked as missed
    if (entry.missed) return 'missed';

    // For future dates, show as scheduled
    if (isFutureDate) return 'scheduled';

    // For past dates, check if they should be marked as missed
    if (isPastDate) {
      // Only mark as missed if it's been more than 1 day and not completed
      // This prevents immediate marking of yesterday as missed
      const daysDifference = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

      // If it's been more than 1 day and not completed, mark as missed
      if (daysDifference > 1 && !entry.completed) {
        return 'missed';
      }

      // For yesterday and recent past dates, check if completed
      if (entry.completed) {
        return 'ready'; // Past date that was completed but not claimed
      }

      // For recent past dates that aren't completed yet, show as pending
      return 'pending';
    }

    // For today, check completion status
    const isCompleted = checkDailyCompletion(date);
    if (isCompleted) return 'ready';
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

  // Generate yesterday, today, and tomorrow for rolling 3-day window
  const recentDays = Array.from({ length: 3 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + (i - 1)); // Yesterday (i=0), Today (i=1), Tomorrow (i=2)
    return date;
  });

  // Generate weekly periods (current week and next week)
  const getWeekDates = (startDate: Date) => {
    const week = [];
    const start = new Date(startDate);
    start.setDate(start.getDate() - start.getDay()); // Start from Sunday

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      week.push(date);
    }
    return week;
  };

  const getCurrentWeekStart = () => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay()); // Start from Sunday
    return start;
  };

  const currentWeekStart = getCurrentWeekStart();
  const nextWeekStart = new Date(currentWeekStart);
  nextWeekStart.setDate(currentWeekStart.getDate() + 7);

  const recentWeeks = [
    { start: currentWeekStart, dates: getWeekDates(currentWeekStart), label: 'This Week' },
    { start: nextWeekStart, dates: getWeekDates(nextWeekStart), label: 'Next Week' }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className={isMobile ? "text-xl font-bold text-solo-text flex items-center gap-2" : "text-3xl font-bold text-solo-text flex items-center gap-2"}>
            <Gift className={isMobile ? "h-5 w-5 text-solo-primary" : "h-8 w-8 text-solo-primary"} />
            Custom Reward Journal
          </h1>
          <Button
            variant="outline"
            size={isMobile ? "sm" : "default"}
            onClick={() => setIsHelpDialogOpen(true)}
            className={isMobile ? "flex items-center gap-1 text-xs px-2 py-1 h-7" : "flex items-center gap-1"}
          >
            <HelpCircle className={isMobile ? 'h-3 w-3' : 'h-5 w-5'} />
            {!isMobile && "How it Works"}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-2 lg:grid-cols-4 gap-4'}`}>
        <Card className={isMobile ? 'border-gray-800/50 bg-solo-dark/90 p-2 rounded-md' : 'border-gray-800/50 bg-solo-dark/90'}>
          <CardContent className={isMobile ? 'p-2' : 'p-4'}>
            <div className="flex items-center gap-2 mb-2">
              <Trophy className={isMobile ? 'h-4 w-4 text-yellow-500' : 'h-5 w-5 text-yellow-500'} />
              <span className={isMobile ? 'text-xs text-gray-400' : 'text-sm text-gray-400'}>Total Rewards</span>
            </div>
            <div className={isMobile ? 'text-lg font-bold text-solo-primary' : 'text-2xl font-bold text-solo-primary'}>{stats.totalRewards}</div>
          </CardContent>
        </Card>

        <Card className={isMobile ? 'border-gray-800/50 bg-solo-dark/90 p-2 rounded-md' : 'border-gray-800/50 bg-solo-dark/90'}>
          <CardContent className={isMobile ? 'p-2' : 'p-4'}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className={isMobile ? 'h-4 w-4 text-green-500' : 'h-5 w-5 text-green-500'} />
              <span className={isMobile ? 'text-xs text-gray-400' : 'text-sm text-gray-400'}>Claimed</span>
            </div>
            <div className={isMobile ? 'text-lg font-bold text-green-500' : 'text-2xl font-bold text-green-500'}>{stats.claimedRewards}</div>
          </CardContent>
        </Card>
        {!isMobile && (
          <>
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
          </>
        )}
      </div>

      {/* Reward Suggestions */}
      <Card className={isMobile ? "border-gray-800/50 bg-solo-dark/90 rounded-md" : "border-gray-800/50 bg-solo-dark/90"}>
        <CardHeader className={isMobile ? 'pb-2' : ''}>
          <CardTitle className={isMobile ? 'flex items-center gap-2 text-base' : 'flex items-center gap-2 text-xl'}>
            <Lightbulb className={isMobile ? 'h-4 w-4 text-yellow-500' : 'h-6 w-6 text-yellow-500'} />
            Reward Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className={isMobile ? 'px-2 py-2' : 'px-3 sm:px-6'}>
          {isMobile ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedSuggestion(null);
                  setSuggestionTargetDate(new Date());
                  setIsSuggestionsDialogOpen(true);
                }}
                className="flex-1 flex items-center gap-1 text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/10 text-xs px-2 py-1 h-7"
              >
                <Lightbulb className="h-3 w-3" />
                Daily Rewards
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedWeeklySuggestion(null);
                  const nextSunday = new Date();
                  const daysUntilSunday = 7 - nextSunday.getDay();
                  nextSunday.setDate(nextSunday.getDate() + daysUntilSunday);
                  setWeeklyTargetDate(nextSunday);
                  setIsWeeklySuggestionsDialogOpen(true);
                }}
                className="flex-1 flex items-center gap-1 text-purple-500 border-purple-500/30 hover:bg-purple-500/10 text-xs px-2 py-1 h-7"
              >
                <CalendarDays className="h-3 w-3" />
                Weekly Rewards
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Daily Suggestions */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Daily Reward Ideas
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {rewardSuggestions.slice(0, 6).map((suggestion) => {
                    const IconComponent = suggestion.icon;
                    return (
                      <div
                        key={suggestion.id}
                        onClick={() => openSuggestionDialog(suggestion)}
                        className="p-3 rounded-lg border border-gray-700 bg-gray-800/30 hover:bg-gray-700/50 cursor-pointer transition-all hover:border-solo-primary/50 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <IconComponent className="h-5 w-5 text-solo-primary group-hover:text-solo-secondary transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                              {suggestion.text}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {suggestion.category}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedSuggestion(null);
                      setSuggestionTargetDate(new Date());
                      setIsSuggestionsDialogOpen(true);
                    }}
                    className="text-solo-primary border-solo-primary/30 hover:bg-solo-primary/10"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    View All Daily Suggestions
                  </Button>
                </div>
              </div>

              {/* Weekly Suggestions */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-purple-500" />
                  Weekly Reward Ideas
                </h3>
                <div className="mb-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <p className={`text-purple-200 mb-4 ${isMobile ? "text-[11px]" : "text-sm"}`}>
                    <Crown className="h-4 w-4 mr-2 inline-block" />
                    Weekly rewards are <span className="font-semibold">bigger, more meaningful</span> rewards for completing an entire week of goals.
                    Perfect for maintaining long-term motivation!
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {weeklyRewardSuggestions.slice(0, 6).map((suggestion) => {
                    const IconComponent = suggestion.icon;
                    return (
                      <div
                        key={suggestion.id}
                        onClick={() => openWeeklySuggestionDialog(suggestion)}
                        className="p-3 rounded-lg border border-gray-700 bg-gray-800/30 hover:bg-gray-700/50 cursor-pointer transition-all hover:border-purple-500/50 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <IconComponent className="h-5 w-5 text-purple-500 group-hover:text-purple-400 transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                              {suggestion.text}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {suggestion.category}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedWeeklySuggestion(null);
                      const nextSunday = new Date();
                      const daysUntilSunday = 7 - nextSunday.getDay();
                      nextSunday.setDate(nextSunday.getDate() + daysUntilSunday);
                      setWeeklyTargetDate(nextSunday);
                      setIsWeeklySuggestionsDialogOpen(true);
                    }}
                    className="text-purple-500 border-purple-500/30 hover:bg-purple-500/10"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    View All Weekly Suggestions
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Reward */}
      <Card className="border-gray-800/50 bg-solo-dark/90">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-yellow-500" />
              <Calendar className="h-6 w-6 text-solo-primary" />
            </div>
            Today's Reward
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
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
                    Complete these requirements to unlock your reward:
                  </div>

                  <div className="space-y-3">
                    {/* Tasks Progress */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                        <div>
                          <span className="text-sm font-medium">All Scheduled Tasks</span>
                          <div className="text-xs text-gray-400">Complete all your daily tasks</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-blue-400">
                          {(() => {
                            const today = new Date();
                            const { tasks = [] } = useSoloLevelingStore.getState();
                            const todayTasks = tasks.filter((task: any) => {
                              const taskDate = task.scheduledFor ? new Date(task.scheduledFor) : new Date(task.createdAt);
                              return taskDate.toDateString() === today.toDateString();
                            });
                            const completedTasks = todayTasks.filter((task: any) => task.completed);
                            return `${Math.min(completedTasks.length, todayTasks.length)}/${todayTasks.length}`;
                          })()}
                        </div>
                        <div className="text-xs text-gray-500">completed</div>
                      </div>
                    </div>

                    {/* Daily Quests Progress */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <div>
                          <span className="text-sm font-medium">5 Daily Quests</span>
                          <div className="text-xs text-gray-400">Complete 5 daily quests</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-yellow-400">
                          {(() => {
                            const { getDailyQuestCompletionStatus } = useSoloLevelingStore.getState();
                            const questStatus = getDailyQuestCompletionStatus ? getDailyQuestCompletionStatus() : { dailyQuestsCompleted: 0 };
                            return `${Math.min(questStatus.dailyQuestsCompleted, 5)}/5`;
                          })()}
                        </div>
                        <div className="text-xs text-gray-500">completed</div>
                      </div>
                    </div>

                    {/* Missions Progress */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-purple-500" />
                        <div>
                          <span className="text-sm font-medium">3+ Missions</span>
                          <div className="text-xs text-gray-400">Complete at least 3 missions</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-purple-400">
                          {(() => {
                            const today = new Date();
                            const { missions = [] } = useSoloLevelingStore.getState();
                            const completedMissionsToday = missions.filter((mission: any) => {
                              if (!mission.completed || !mission.completedAt) return false;
                              const completedDate = new Date(mission.completedAt);
                              return completedDate.toDateString() === today.toDateString();
                            });
                            return `${Math.min(completedMissionsToday.length, 3)}/3+`;
                          })()}
                        </div>
                        <div className="text-xs text-gray-500">completed</div>
                      </div>
                    </div>

                    {/* Good News Message */}
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-green-400" />
                        <span className="text-sm font-medium text-green-300">Good News!</span>
                      </div>
                      <p className="text-xs text-green-200 mt-1">
                        Main and Side quests are no longer required for daily rewards!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {getCompletionStatus(new Date()) === 'scheduled' && (
                <div className="text-sm text-gray-400 text-center py-4">
                  <Calendar className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  Complete your tasks, 5 daily quests, and 3 missions without any missed items to unlock your reward!
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

      {/* Weekly Reward Requirements */}
      <Card className="border-gray-800/50 bg-solo-dark/90">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Crown className="h-6 w-6 text-purple-500" />
            Weekly Reward Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <p className="text-sm text-purple-200 mb-4">
              <span className="font-semibold">Strict Weekly Requirements:</span> To earn weekly rewards, you must complete ALL of the following within a single week:
            </p>

            {(() => {
              // Get current weekly details with forced update dependency
              const weeklyDetails = getCurrentWeeklyDetails();

              return (
                <div className="space-y-3">
                  {/* Daily Tasks */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`h-4 w-4 ${weeklyDetails.dailyTasks.allCompleted ? 'text-green-500' : 'text-gray-500'}`} />
                      <div>
                        <span className="text-sm font-medium">All Daily Tasks (No Deadlines)</span>
                        <div className="text-xs text-gray-400">Complete every daily task without missing any</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-medium ${weeklyDetails.dailyTasks.allCompleted ? 'text-green-400' : 'text-gray-400'}`}>{`${Math.min(weeklyDetails.dailyTasks.completed, weeklyDetails.dailyTasks.total)}/${weeklyDetails.dailyTasks.total}`}</div>
                      <div className="text-xs text-gray-500">completed</div>
                    </div>
                  </div>

                  {/* Daily Quests */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div className="flex items-center gap-2">
                      <Star className={`h-4 w-4 ${weeklyDetails.dailyQuests.met ? 'text-green-500' : 'text-yellow-500'}`} />
                      <div>
                        <span className="text-sm font-medium">30+ Daily Quests</span>
                        <div className="text-xs text-gray-400">Complete at least 30 daily quests this week</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-medium ${weeklyDetails.dailyQuests.met ? 'text-green-400' : 'text-yellow-400'}`}>{`${Math.min(weeklyDetails.dailyQuests.completed, weeklyDetails.dailyQuests.required)}/${weeklyDetails.dailyQuests.required}`}</div>
                      <div className="text-xs text-gray-500">completed</div>
                      <Progress
                        value={(weeklyDetails.dailyQuests.completed / weeklyDetails.dailyQuests.required) * 100}
                        className="w-16 h-1 mt-1"
                        indicatorClassName={weeklyDetails.dailyQuests.met ? "bg-green-500" : "bg-yellow-500"}
                      />
                    </div>
                  </div>

                  {/* Main Quests */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div className="flex items-center gap-2">
                      <Sword className={`h-4 w-4 ${weeklyDetails.mainQuests.met ? 'text-green-500' : 'text-blue-500'}`} />
                      <div>
                        <span className="text-sm font-medium">5+ Main Quests</span>
                        <div className="text-xs text-gray-400">Complete at least 5 main quests this week</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-medium ${weeklyDetails.mainQuests.met ? 'text-green-400' : 'text-blue-400'}`}>{`${Math.min(weeklyDetails.mainQuests.completed, weeklyDetails.mainQuests.required)}/${weeklyDetails.mainQuests.required}`}</div>
                      <div className="text-xs text-gray-500">completed</div>
                      <Progress
                        value={(weeklyDetails.mainQuests.completed / weeklyDetails.mainQuests.required) * 100}
                        className="w-16 h-1 mt-1"
                        indicatorClassName={weeklyDetails.mainQuests.met ? "bg-green-500" : "bg-blue-500"}
                      />
                    </div>
                  </div>

                  {/* Side Quests */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div className="flex items-center gap-2">
                      <Zap className={`h-4 w-4 ${weeklyDetails.sideQuests.met ? 'text-green-500' : 'text-orange-500'}`} />
                      <div>
                        <span className="text-sm font-medium">5+ Side Quests</span>
                        <div className="text-xs text-gray-400">Complete at least 5 side quests this week</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-medium ${weeklyDetails.sideQuests.met ? 'text-green-400' : 'text-orange-400'}`}>{`${Math.min(weeklyDetails.sideQuests.completed, weeklyDetails.sideQuests.required)}/${weeklyDetails.sideQuests.required}`}</div>
                      <div className="text-xs text-gray-500">completed</div>
                      <Progress
                        value={(weeklyDetails.sideQuests.completed / weeklyDetails.sideQuests.required) * 100}
                        className="w-16 h-1 mt-1"
                        indicatorClassName={weeklyDetails.sideQuests.met ? "bg-green-500" : "bg-orange-500"}
                      />
                    </div>
                  </div>

                  {/* Missions */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div className="flex items-center gap-2">
                      <Target className={`h-4 w-4 ${weeklyDetails.missions.met ? 'text-green-500' : 'text-purple-500'}`} />
                      <div>
                        <span className="text-sm font-medium">18+ Missions</span>
                        <div className="text-xs text-gray-400">Complete at least 18 missions this week</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-medium ${weeklyDetails.missions.met ? 'text-green-400' : 'text-purple-400'}`}>{`${Math.min(weeklyDetails.missions.completed, weeklyDetails.missions.required)}/${weeklyDetails.missions.required}`}</div>
                      <div className="text-xs text-gray-500">completed</div>
                      <Progress
                        value={(weeklyDetails.missions.completed / weeklyDetails.missions.required) * 100}
                        className="w-16 h-1 mt-1"
                        indicatorClassName={weeklyDetails.missions.met ? "bg-green-500" : "bg-purple-500"}
                      />
                    </div>
                  </div>

                  {/* Overall Status */}
                  <div className={`p-3 rounded-lg border ${
                    weeklyDetails.overall
                      ? 'bg-green-500/10 border-green-500/20'
                      : 'bg-red-500/10 border-red-500/20'
                  }`}>
                    <div className="flex items-center gap-2">
                      {weeklyDetails.overall ? (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                      <span className={`text-sm font-medium ${
                        weeklyDetails.overall ? 'text-green-300' : 'text-red-300'
                      }`}>
                        {weeklyDetails.overall
                          ? '🎉 Weekly Requirements Met!'
                          : 'Keep Going!'
                        }
                      </span>
                    </div>
                    <p className={`text-xs mt-1 ${
                      weeklyDetails.overall ? 'text-green-200' : 'text-red-200'
                    }`}>
                      {weeklyDetails.overall
                        ? 'You can claim weekly rewards when available!'
                        : (
                          <>
                            You didn't meet all the strict weekly requirements this time, but don't give up!<br />
                            <span className="block mt-1">You can still earn a reward by meeting the <button className="text-blue-400 underline hover:text-blue-300 transition px-0 py-0 text-xs font-semibold" onClick={() => setShowReducedRequirements(true)}>Reduced Requirements</button>.</span>
                          </>
                        )
                      }
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Reduced Requirements Section */}
          <div className="mt-6">
            <button
              className="text-xs text-blue-400 underline hover:text-blue-300 transition mb-2"
              onClick={() => setShowReducedRequirements((prev) => !prev)}
            >
              {showReducedRequirements ? 'Hide Reduced Requirements' : 'Show Reduced Requirements'}
            </button>
            {showReducedRequirements && (
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm text-blue-200 mb-4">
              <span className="font-semibold">Alternative: Reduced Weekly Requirements</span> - If you can't meet the full requirements, you can still earn weekly rewards with these reduced goals:
            </p>
            {(() => {
              // Get current weekly details with forced update dependency
              const weeklyDetails = getCurrentWeeklyDetails();
              const reduced = weeklyDetails.reducedRequirements;
              return (
                <div className="space-y-3">
                  {/* Weekly Planner Tasks */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`h-4 w-4 ${reduced.weeklyPlannerTasks.allCompleted ? 'text-green-500' : 'text-gray-500'}`} />
                      <div>
                        <span className="text-sm font-medium">All Weekly Tasks</span>
                        <div className="text-xs text-gray-400">Complete all tasks scheduled for this week</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-medium ${reduced.weeklyPlannerTasks.allCompleted ? 'text-green-400' : 'text-gray-400'}`}>{`${Math.min(reduced.weeklyPlannerTasks.completed, reduced.weeklyPlannerTasks.total)}/${reduced.weeklyPlannerTasks.total}`}</div>
                      <div className="text-xs text-gray-500">completed</div>
                      {reduced.weeklyPlannerTasks.total > 0 && (
                        <Progress
                          value={(reduced.weeklyPlannerTasks.completed / reduced.weeklyPlannerTasks.total) * 100}
                          className="w-16 h-1 mt-1"
                          indicatorClassName={reduced.weeklyPlannerTasks.allCompleted ? "bg-green-500" : "bg-gray-500"}
                        />
                      )}
                    </div>
                  </div>
                  {/* Reduced Daily Quests */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div className="flex items-center gap-2">
                      <Star className={`h-4 w-4 ${reduced.dailyQuests.met ? 'text-green-500' : 'text-yellow-500'}`} />
                      <div>
                        <span className="text-sm font-medium">15+ Daily Quests</span>
                        <div className="text-xs text-gray-400">Complete at least 15 daily quests this week (half of full requirement)</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-medium ${reduced.dailyQuests.met ? 'text-green-400' : 'text-yellow-400'}`}>{`${Math.min(reduced.dailyQuests.completed, reduced.dailyQuests.required)}/${reduced.dailyQuests.required}`}</div>
                      <div className="text-xs text-gray-500">completed</div>
                      <Progress
                        value={(reduced.dailyQuests.completed / reduced.dailyQuests.required) * 100}
                        className="w-16 h-1 mt-1"
                        indicatorClassName={reduced.dailyQuests.met ? "bg-green-500" : "bg-yellow-500"}
                      />
                    </div>
                  </div>
                  {/* Reduced Main Quests */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div className="flex items-center gap-2">
                      <Sword className={`h-4 w-4 ${reduced.mainQuests.met ? 'text-green-500' : 'text-blue-500'}`} />
                      <div>
                        <span className="text-sm font-medium">2+ Main Quests</span>
                        <div className="text-xs text-gray-400">Complete at least 2 main quests this week (half of full requirement)</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-medium ${reduced.mainQuests.met ? 'text-green-400' : 'text-blue-400'}`}>{`${Math.min(reduced.mainQuests.completed, reduced.mainQuests.required)}/${reduced.mainQuests.required}`}</div>
                      <div className="text-xs text-gray-500">completed</div>
                      <Progress
                        value={(reduced.mainQuests.completed / reduced.mainQuests.required) * 100}
                        className="w-16 h-1 mt-1"
                        indicatorClassName={reduced.mainQuests.met ? "bg-green-500" : "bg-blue-500"}
                      />
                    </div>
                  </div>
                  {/* Reduced Side Quests */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div className="flex items-center gap-2">
                      <Zap className={`h-4 w-4 ${reduced.sideQuests.met ? 'text-green-500' : 'text-orange-500'}`} />
                      <div>
                        <span className="text-sm font-medium">2+ Side Quests</span>
                        <div className="text-xs text-gray-400">Complete at least 2 side quests this week (half of full requirement)</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-medium ${reduced.sideQuests.met ? 'text-green-400' : 'text-orange-400'}`}>{`${Math.min(reduced.sideQuests.completed, reduced.sideQuests.required)}/${reduced.sideQuests.required}`}</div>
                      <div className="text-xs text-gray-500">completed</div>
                      <Progress
                        value={(reduced.sideQuests.completed / reduced.sideQuests.required) * 100}
                        className="w-16 h-1 mt-1"
                        indicatorClassName={reduced.sideQuests.met ? "bg-green-500" : "bg-orange-500"}
                      />
                    </div>
                  </div>
                  {/* Reduced Missions */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div className="flex items-center gap-2">
                      <Target className={`h-4 w-4 ${reduced.missions.met ? 'text-green-500' : 'text-purple-500'}`} />
                      <div>
                        <span className="text-sm font-medium">11+ Missions</span>
                        <div className="text-xs text-gray-400">Complete at least 11 missions this week (reduced requirement)</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-medium ${reduced.missions.met ? 'text-green-400' : 'text-purple-400'}`}>{`${Math.min(reduced.missions.completed, reduced.missions.required)}/${reduced.missions.required}`}</div>
                      <div className="text-xs text-gray-500">completed</div>
                      <Progress
                        value={(reduced.missions.completed / reduced.missions.required) * 100}
                        className="w-16 h-1 mt-1"
                        indicatorClassName={reduced.missions.met ? "bg-green-500" : "bg-purple-500"}
                      />
                    </div>
                  </div>
                  {/* Reduced Overall Status */}
                  <div className={`p-3 rounded-lg border ${
                    reduced.overall
                      ? 'bg-green-500/10 border-green-500/20'
                      : 'bg-blue-500/10 border-blue-500/20'
                  }`}>
                    <div className="flex items-center gap-2">
                      {reduced.overall ? (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      ) : (
                        <Clock className="h-4 w-4 text-blue-400" />
                      )}
                      <span className={`text-sm font-medium ${
                        reduced.overall ? 'text-green-300' : 'text-blue-300'
                      }`}>
                        {reduced.overall
                          ? '🎉 Reduced Requirements Met!'
                          : '⏳ Working on Reduced Requirements'
                        }
                      </span>
                    </div>
                    <p className={`text-xs mt-1 ${
                      reduced.overall ? 'text-green-200' : 'text-blue-200'
                    }`}>
                      {reduced.overall
                        ? 'You can claim weekly rewards with the reduced requirements!'
                        : 'Complete the reduced requirements above to unlock weekly rewards.'
                      }
                    </p>
                  </div>
                </div>
              );
            })()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Days */}
      <Card className="border-gray-800/50 bg-solo-dark/90">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Calendar className="h-6 w-6 text-solo-primary" />
              Daily Rewards
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-gray-400 hover:text-white"
              onClick={() => setShowRecentDays(!showRecentDays)}
            >
              {showRecentDays ? (
                <>
                <EyeOff className="h-4 w-4" />
                {!isMobile && "Hide"}
                </>
              ) : (
                <>
                <Eye className="h-4 w-4" />
                {!isMobile && "Show"}
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        {showRecentDays && (
          <CardContent className="px-3 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentDays.map((date, index) => {
              const entry = getDailyRewardEntry(date);
              const status = getCompletionStatus(date);
              const isCurrentDay = isToday(date);
              const today = new Date();
              const yesterday = new Date(today);
              yesterday.setDate(today.getDate() - 1);
              const isYesterday = date.toDateString() === yesterday.toDateString();

              // Show MissedRewardCard ONLY for yesterday if missed or not set and the day has passed
              if (isYesterday && (status === 'missed' || (!entry && date < today))) {
                return (
                  <MissedRewardCard
                    key={index}
                    date={date}
                    customReward={entry?.customReward}
                    missedAt={entry?.missedAt}
                  />
                );
              }

              // If claimed, make card uneditable
              if (status === 'claimed') {
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border transition-all cursor-not-allowed opacity-70 ${getStatusColor(status)} ${isCurrentDay ? 'ring-2 ring-solo-primary/30' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium">
                        <div className="flex flex-col">
                          <span>{format(date, 'MMM dd, yyyy')}</span>
                          <span className={`text-xs font-normal ${
                            (() => {
                              const today = new Date();
                              const yesterday = new Date(today);
                              yesterday.setDate(today.getDate() - 1);
                              const tomorrow = new Date(today);
                              tomorrow.setDate(today.getDate() + 1);

                              if (date.toDateString() === yesterday.toDateString()) return 'text-gray-400';
                              if (isCurrentDay) return 'text-solo-primary';
                              if (date.toDateString() === tomorrow.toDateString()) return 'text-blue-400';
                              return 'text-gray-400';
                            })()
                          }`}>
                            {(() => {
                              const today = new Date();
                              const yesterday = new Date(today);
                              yesterday.setDate(today.getDate() - 1);
                              const tomorrow = new Date(today);
                              tomorrow.setDate(today.getDate() + 1);

                              if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
                              if (isCurrentDay) return 'Today';
                              if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
                              return format(date, 'EEEE'); // Day of week for other dates
                            })()}
                          </span>
                        </div>
                      </div>
                      {getStatusIcon(status)}
                    </div>

                    {entry ? (
                      <div>
                        <p className="text-sm text-gray-300 truncate mb-2">
                          "{entry.customReward}"
                        </p>
                        <div className="text-xs text-green-500 font-semibold">Already claimed</div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        Click to set reward
                      </div>
                    )}
                  </div>
                );
              }

              // Default card logic for today and tomorrow (and yesterday if not missed/claimed)
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border transition-all cursor-pointer hover:border-solo-primary/50 ${getStatusColor(status)} ${isCurrentDay ? 'ring-2 ring-solo-primary/30' : ''}`}
                  onClick={() => {
                    setSelectedDate(date);
                    if (!entry) {
                      setRewardText('');
                      setIsSetRewardDialogOpen(true);
                    } else {
                      setEditingDailyReward(entry.customReward);
                      setIsEditDailyRewardDialogOpen(true);
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">
                      <div className="flex flex-col">
                        <span>{format(date, 'MMM dd, yyyy')}</span>
                        <span className={`text-xs font-normal ${
                          (() => {
                            const today = new Date();
                            const yesterday = new Date(today);
                            yesterday.setDate(today.getDate() - 1);
                            const tomorrow = new Date(today);
                            tomorrow.setDate(today.getDate() + 1);

                            if (date.toDateString() === yesterday.toDateString()) return 'text-gray-400';
                            if (isCurrentDay) return 'text-solo-primary';
                            if (date.toDateString() === tomorrow.toDateString()) return 'text-blue-400';
                            return 'text-gray-400';
                          })()
                        }`}>
                          {(() => {
                            const today = new Date();
                            const yesterday = new Date(today);
                            yesterday.setDate(today.getDate() - 1);
                            const tomorrow = new Date(today);
                            tomorrow.setDate(today.getDate() + 1);

                            if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
                            if (isCurrentDay) return 'Today';
                            if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
                            return format(date, 'EEEE'); // Day of week for other dates
                          })()}
                        </span>
                      </div>
                    </div>
                    {getStatusIcon(status)}
                  </div>

                  {entry ? (
                    <div>
                      <p className="text-sm text-gray-300 truncate mb-2">
                        "{entry.customReward}"
                      </p>
                      <div className="text-xs text-gray-500">
                        {getStatusText(status)} • Click to edit
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
        )}
      </Card>

      {/* Weekly Rewards */}
      <Card className="border-gray-800/50 bg-solo-dark/90">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-xl">
              <CalendarDays className="h-6 w-6 text-purple-500" />
              Weekly Rewards
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-gray-400 hover:text-white"
              onClick={() => setShowWeeklyRewards(!showWeeklyRewards)}
            >
              {showWeeklyRewards ? (
                <>
                <EyeOff className="h-4 w-4" />
                {!isMobile && "Hide"}
                </>
              ) : (
                <>
                <Eye className="h-4 w-4" />
                {!isMobile && "Show"}
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        {showWeeklyRewards && (
          <CardContent className="px-3 sm:px-6">
            <div className="animate-in fade-in-50 slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentWeeks.map((week, weekIndex) => {
              const isCurrentWeek = weekIndex === 0;

              return (
                <div
                  key={weekIndex}
                  className={`p-4 rounded-lg border transition-all ${
                    isCurrentWeek
                      ? 'border-purple-500/50 bg-purple-500/10 ring-2 ring-purple-500/30'
                      : 'border-gray-700 bg-gray-800/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium">
                      <div className="flex flex-col">
                        <span className="text-purple-300">{week.label}</span>
                        <span className="text-xs text-gray-400">
                          {format(week.dates[0], 'MMM dd')} - {format(week.dates[6], 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                    <CalendarDays className="h-5 w-5 text-purple-500" />
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs text-gray-400">Week Progress</div>
                    <div className="grid grid-cols-7 gap-1">
                      {week.dates.map((date, dayIndex) => {
                        const isToday = date.toDateString() === new Date().toDateString();
                        const dayStatus = getCompletionStatus(date);

                        return (
                          <div
                            key={dayIndex}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border ${
                              isToday
                                ? 'border-purple-400 bg-purple-400/20 text-purple-300'
                                : dayStatus === 'claimed'
                                ? 'border-green-500 bg-green-500/20 text-green-300'
                                : dayStatus === 'ready'
                                ? 'border-yellow-500 bg-yellow-500/20 text-yellow-300'
                                : dayStatus === 'missed'
                                ? 'border-red-500 bg-red-500/20 text-red-300'
                                : 'border-gray-600 bg-gray-600/20 text-gray-400'
                            }`}
                          >
                            {date.getDate()}
                          </div>
                        );
                      })}
                    </div>

                    <div className="text-xs text-gray-500 mt-2">
                      {isCurrentWeek ? 'Current week progress' : 'Upcoming week'}
                    </div>
                  </div>

                  {/* Weekly Reward Status */}
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <div className="text-xs text-gray-400 mb-1">Weekly Reward</div>
                    {(() => {
                      const weeklyEntry = getWeeklyRewardEntry(week.start);
                      if (weeklyEntry) {
                        return (
                          <div
                            className="space-y-1 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => {
                              setSelectedWeeklySuggestion(null);
                              setWeeklyTargetDate(week.start);
                              setCustomWeeklyReward(weeklyEntry.customReward);
                              setIsWeeklySuggestionsDialogOpen(true);
                            }}
                          >
                            <div className="text-sm text-purple-300 font-medium">
                              {weeklyEntry.customReward}
                            </div>
                            <div className="text-xs text-gray-500">
                              {isCurrentWeek ? 'Complete 7 days to unlock' : 'Planned reward'} • Click to change
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div
                            className="text-sm text-purple-300 cursor-pointer hover:text-purple-200 transition-colors"
                            onClick={() => {
                              setSelectedWeeklySuggestion(null);
                              setWeeklyTargetDate(week.start);
                              setCustomWeeklyReward('');
                              setIsWeeklySuggestionsDialogOpen(true);
                            }}
                          >
                            {isCurrentWeek ? '+ Set weekly reward' : '+ Plan weekly reward'}
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              );
            })}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Help Dialog */}
      <Dialog open={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen}>
        <CustomDialogContent className={
          [
            "glassmorphism flex flex-col text-solo-text rounded-xl",
            "before:!absolute before:!inset-0 before:!rounded-xl",
            "before:!bg-gradient-to-br before:!from-yellow-500/10 before:!to-amber-500/5",
            "before:!backdrop-blur-xl before:!-z-10",
            isMobile ? "w-[90vw] max-w-[350px] p-3 max-h-[80vh]" : "max-w-md max-h-[85vh] p-6"
          ].join(' ')
        }>
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className={`font-semibold tracking-wide flex items-center gap-2 ${isMobile ? "text-lg" : "text-xl"} text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 drop-shadow-sm`}>
              <HelpCircle className="w-5 h-5 text-yellow-400" />
              Reward Journal Help
            </DialogTitle>
          </DialogHeader>
          <div className={`flex-1 overflow-y-auto space-y-4 ${isMobile ? "text-sm" : "text-base"}`}>
            <div className="space-y-3">
            <div>
                <h3 className="font-semibold text-white/90 mb-2">What is the Reward Journal?</h3>
                <p className="text-gray-300 leading-relaxed">
                  The Reward Journal helps you stay motivated by letting you set daily and weekly rewards for completing your goals. Track your progress, celebrate your wins, and build positive habits!
              </p>
            </div>
            <div>
                <h3 className="font-semibold text-white/90 mb-2">How to Use</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li><span className="font-medium text-yellow-400">Set Daily Rewards:</span> Choose a reward for each day to motivate yourself to complete all your tasks and quests.</li>
                  <li><span className="font-medium text-purple-400">Set Weekly Rewards:</span> Plan a bigger reward for completing a full week of goals.</li>
                  <li><span className="font-medium text-green-400">Claim Rewards:</span> When you complete everything, claim your reward and celebrate!</li>
                  <li><span className="font-medium text-blue-400">Track Progress:</span> Build streaks and see your reward history to stay motivated.</li>
              </ul>
            </div>
            <div>
                <h3 className="font-semibold text-white/90 mb-2">Tips for Success</h3>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  <li>Pick rewards that genuinely excite you.</li>
                  <li>Be consistent—set your rewards in advance for the week.</li>
                  <li>Don't be too hard on yourself if you miss a day—use reduced requirements to stay on track!</li>
                </ul>
            </div>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 border-t border-gray-700 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsHelpDialogOpen(false)}
              className={isMobile ? "w-full h-9 text-sm" : "w-full h-10 text-base"}
            >
              Got it!
            </Button>
          </DialogFooter>
        </CustomDialogContent>
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

      {/* Suggestions Dialog */}
      <Dialog open={isSuggestionsDialogOpen} onOpenChange={setIsSuggestionsDialogOpen}>
        <DialogContent className={isMobile ? "w-[90vw] max-w-[350px] p-4" : "max-w-[600px]"}>
          <DialogHeader className={isMobile ? "pb-2" : ""}>
            <DialogTitle className={`flex items-center gap-2 ${isMobile ? "text-base" : ""}`}>
              <Lightbulb className={isMobile ? "h-4 w-4" : "h-5 w-5"} text-yellow-500 />
              {selectedSuggestion ? 'Set Reward' : 'Daily Reward Suggestions'}
            </DialogTitle>
          </DialogHeader>

          {selectedSuggestion ? (
            // Individual suggestion selection
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-gray-700 bg-gray-800/50">
                <div className="flex items-center gap-3 mb-3">
                  {React.createElement(selectedSuggestion.icon, { className: `${isMobile ? "h-5 w-5" : "h-6 w-6"} text-solo-primary` })}
                  <div>
                    <p className={`font-medium text-gray-200 ${isMobile ? "text-sm" : ""}`}>{selectedSuggestion.text}</p>
                    <p className={`text-gray-500 ${isMobile ? "text-xs" : "text-sm"}`}>{selectedSuggestion.category}</p>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="target-date" className={isMobile ? "text-sm" : ""}>When would you like this reward?</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Button
                    variant={suggestionTargetDate.toDateString() === new Date().toDateString() ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSuggestionTargetDate(new Date())}
                    className="text-xs"
                  >
                    Today
                  </Button>
                  <Button
                    variant={suggestionTargetDate.toDateString() === addDays(new Date(), 1).toDateString() ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSuggestionTargetDate(addDays(new Date(), 1))}
                    className="text-xs"
                  >
                    Tomorrow
                  </Button>
                  <Button
                    variant={suggestionTargetDate.toDateString() === addDays(new Date(), 2).toDateString() ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSuggestionTargetDate(addDays(new Date(), 2))}
                    className="text-xs"
                  >
                    Day After
                  </Button>
                </div>
                <p className={`text-gray-500 mt-2 ${isMobile ? "text-xs" : "text-sm"}`}>
                  Selected: {format(suggestionTargetDate, 'MMMM dd, yyyy')}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleSuggestionSelect(selectedSuggestion, suggestionTargetDate)}
                  className="flex-1"
                >
                  Set This Reward
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedSuggestion(null)}
                  className="flex-1"
                >
                  Back
                </Button>
              </div>
            </div>
          ) : (
            // All suggestions view
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto">
                {rewardSuggestions.map((suggestion) => {
                  const IconComponent = suggestion.icon;
                  return (
                    <div
                      key={suggestion.id}
                      onClick={() => setSelectedSuggestion(suggestion)}
                      className="p-3 rounded-lg border border-gray-700 bg-gray-800/30 hover:bg-gray-700/50 cursor-pointer transition-all hover:border-solo-primary/50 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <IconComponent className="h-5 w-5 text-solo-primary group-hover:text-solo-secondary transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                            {suggestion.text}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {suggestion.category}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsSuggestionsDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Weekly Suggestions Dialog */}
      <Dialog open={isWeeklySuggestionsDialogOpen} onOpenChange={setIsWeeklySuggestionsDialogOpen}>
        <DialogContent className={isMobile ? "w-[90vw] max-w-[350px] p-4" : "max-w-[600px]"}>
          <DialogHeader className={isMobile ? "pb-2" : ""}>
            <DialogTitle className={`flex items-center gap-2 ${isMobile ? "text-base" : ""}`}>
              <CalendarDays className={isMobile ? "h-4 w-4" : "h-5 w-5"} text-purple-500 />
              {selectedWeeklySuggestion ? 'Set Weekly Reward' : 'Weekly Reward Suggestions'}
            </DialogTitle>
          </DialogHeader>

          {selectedWeeklySuggestion ? (
            // Individual weekly suggestion selection
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-purple-500/30 bg-purple-500/10">
                <div className="flex items-center gap-3 mb-3">
                  {React.createElement(selectedWeeklySuggestion.icon, { className: `${isMobile ? "h-5 w-5" : "h-6 w-6"} text-purple-500` })}
                  <div>
                    <p className={`font-medium text-gray-200 ${isMobile ? "text-sm" : ""}`}>{selectedWeeklySuggestion.text}</p>
                    <p className={`text-gray-500 ${isMobile ? "text-xs" : "text-sm"}`}>{selectedWeeklySuggestion.category}</p>
                  </div>
                </div>
                <div className={`text-purple-200 ${isMobile ? "text-xs" : "text-sm"}`}>
                  <Crown className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} mr-1 inline-block`} />
                  This is a <span className="font-semibold">weekly reward</span> - perfect for completing 7 days of consistent progress!
                </div>
              </div>

              <div>
                <Label htmlFor="weekly-target-date" className={isMobile ? "text-sm" : ""}>Which week would you like this reward for?</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button
                    variant={weeklyTargetDate.toDateString() === currentWeekStart.toDateString() ? "default" : "outline"}
                    size="sm"
                    onClick={() => setWeeklyTargetDate(currentWeekStart)}
                    className="text-xs"
                  >
                    This Week
                  </Button>
                  <Button
                    variant={weeklyTargetDate.toDateString() === nextWeekStart.toDateString() ? "default" : "outline"}
                    size="sm"
                    onClick={() => setWeeklyTargetDate(nextWeekStart)}
                    className="text-xs"
                  >
                    Next Week
                  </Button>
                </div>
                <p className={`text-gray-500 mt-2 ${isMobile ? "text-xs" : "text-sm"}`}>
                  Selected: {format(weeklyTargetDate, 'MMM dd')} - {format(new Date(weeklyTargetDate.getTime() + 6 * 24 * 60 * 60 * 1000), 'MMM dd, yyyy')}
                </p>
                <p className={`text-gray-300 mt-1 ${isMobile ? "text-xs" : "text-sm"}`}>
                  💡 Complete all your daily goals for the week to earn this reward!
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleWeeklySuggestionSelect(selectedWeeklySuggestion, weeklyTargetDate)}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600"
                >
                  Set Weekly Reward
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedWeeklySuggestion(null)}
                  className="flex-1"
                >
                  Back
                </Button>
              </div>
            </div>
          ) : (
            // All weekly suggestions view
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <p className={`text-purple-200 mb-4 ${isMobile ? "text-[11px]" : "text-sm"}`}>
                  <Crown className="h-4 w-4 mr-2 inline-block" />
                  Weekly rewards are <span className="font-semibold">bigger, more meaningful</span> rewards for completing an entire week of goals.
                  Perfect for maintaining long-term motivation!
                </p>
              </div>

              <div className="space-y-4">
                {/* Custom Reward Option */}
                <div className="p-3 rounded-lg border border-purple-500/30 bg-purple-500/10">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4 text-purple-400" />
                      <span className="text-sm font-medium text-purple-300">Create Custom Weekly Reward</span>
                    </div>
                    <Textarea
                      placeholder={isMobile ? "e.g., Spa day, Game, Dinner out..." : "e.g., Weekend spa day, New video game, Special dinner out..."}
                      value={customWeeklyReward}
                      onChange={(e) => setCustomWeeklyReward(e.target.value)}
                      className={`bg-gray-800/50 border-gray-600 text-gray-200 ${isMobile ? "text-xs placeholder:text-[11px]" : ""}`}
                      rows={2}
                    />
                    {customWeeklyReward.trim() && (
                      <Button
                        onClick={() => {
                          setWeeklyReward(weeklyTargetDate, customWeeklyReward.trim());
                          setCustomWeeklyReward('');
                          setIsWeeklySuggestionsDialogOpen(false);
                          toast({
                            title: "Weekly Reward Set!",
                            description: `Set "${customWeeklyReward.trim()}" for the week of ${format(weeklyTargetDate, 'MMM dd, yyyy')}`,
                            variant: "default"
                          });
                        }}
                        size="sm"
                        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600"
                      >
                        Set Custom Weekly Reward
                      </Button>
                    )}
                  </div>
                </div>

                {/* Suggested Rewards */}
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Or choose from suggestions:</h4>
                  <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto">
                    {weeklyRewardSuggestions.map((suggestion) => {
                      const IconComponent = suggestion.icon;
                      return (
                        <div
                          key={suggestion.id}
                          onClick={() => setSelectedWeeklySuggestion(suggestion)}
                          className="p-3 rounded-lg border border-gray-700 bg-gray-800/30 hover:bg-gray-700/50 cursor-pointer transition-all hover:border-purple-500/50 group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              <IconComponent className="h-5 w-5 text-purple-500 group-hover:text-purple-400 transition-colors" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                                {suggestion.text}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {suggestion.category}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsWeeklySuggestionsDialogOpen(false);
                    setIsReducedWeeklySuggestionsDialogOpen(true);
                  }}
                  className="text-blue-500 border-blue-500/30 hover:bg-blue-500/10"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Reduced Weekly Rewards
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsWeeklySuggestionsDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Daily Reward Dialog */}
      <Dialog open={isEditDailyRewardDialogOpen} onOpenChange={setIsEditDailyRewardDialogOpen}>
        <DialogContent className={isMobile ? "w-[90vw] max-w-[350px] p-4" : "max-w-[600px]"}>
          <DialogHeader className={isMobile ? "pb-2" : ""}>
            <DialogTitle className={`flex items-center gap-2 ${isMobile ? "text-base" : ""}`}>
              <Gift className={isMobile ? "h-4 w-4" : "h-5 w-5"} text-solo-primary />
              Edit Daily Reward for {format(selectedDate, 'MMMM dd, yyyy')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Custom Reward Option */}
            <div className="p-3 rounded-lg border border-solo-primary/30 bg-solo-primary/10">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-solo-primary" />
                  <span className="text-sm font-medium text-solo-primary">Edit Custom Daily Reward</span>
                </div>
                <Textarea
                  placeholder="e.g., Watch a movie, Buy that book, 1 hour of gaming, Treat myself to dinner..."
                  value={editingDailyReward}
                  onChange={(e) => setEditingDailyReward(e.target.value)}
                  className="bg-gray-800/50 border-gray-600 text-gray-200"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (editingDailyReward.trim()) {
                        setDailyReward(selectedDate, editingDailyReward.trim());
                        setEditingDailyReward('');
                        setIsEditDailyRewardDialogOpen(false);
                        toast({
                          title: "Daily Reward Updated!",
                          description: `Updated reward for ${format(selectedDate, 'MMM dd, yyyy')}`,
                          variant: "default"
                        });
                      }
                    }}
                    disabled={!editingDailyReward.trim()}
                    className="flex-1"
                  >
                    Update Reward
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditDailyRewardDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>

            {/* Suggested Rewards */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">Or choose from suggestions:</h4>
              <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto">
                {rewardSuggestions.map((suggestion) => {
                  const IconComponent = suggestion.icon;
                  return (
                    <div
                      key={suggestion.id}
                      onClick={() => {
                        setDailyReward(selectedDate, suggestion.text);
                        setEditingDailyReward('');
                        setIsEditDailyRewardDialogOpen(false);
                        toast({
                          title: "Daily Reward Updated!",
                          description: `Set "${suggestion.text}" for ${format(selectedDate, 'MMM dd, yyyy')}`,
                          variant: "default"
                        });
                      }}
                      className="p-3 rounded-lg border border-gray-700 bg-gray-800/30 hover:bg-gray-700/50 cursor-pointer transition-all hover:border-solo-primary/50 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <IconComponent className="h-5 w-5 text-solo-primary group-hover:text-solo-secondary transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                            {suggestion.text}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {suggestion.category}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reduced Weekly Suggestions Dialog */}
      <Dialog open={isReducedWeeklySuggestionsDialogOpen} onOpenChange={setIsReducedWeeklySuggestionsDialogOpen}>
        <DialogContent className={isMobile ? "w-[90vw] max-w-[350px] p-4" : "max-w-[600px]"}>
          <DialogHeader className={isMobile ? "pb-2" : ""}>
            <DialogTitle className={`flex items-center gap-2 ${isMobile ? "text-base" : ""}`}>
              <Target className={isMobile ? "h-4 w-4" : "h-5 w-5"} text-blue-500 />
              {selectedReducedWeeklySuggestion ? 'Set Reduced Weekly Reward' : 'Reduced Weekly Reward Suggestions'}
            </DialogTitle>
          </DialogHeader>

          {selectedReducedWeeklySuggestion ? (
            // Individual reduced weekly suggestion selection
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-blue-500/30 bg-blue-500/10">
                <div className="flex items-center gap-3 mb-3">
                  {React.createElement(selectedReducedWeeklySuggestion.icon, { className: `${isMobile ? "h-5 w-5" : "h-6 w-6"} text-blue-500` })}
                  <div>
                    <p className={`font-medium text-gray-200 ${isMobile ? "text-sm" : ""}`}>{selectedReducedWeeklySuggestion.text}</p>
                    <p className={`text-gray-500 ${isMobile ? "text-xs" : "text-sm"}`}>{selectedReducedWeeklySuggestion.category}</p>
                  </div>
                </div>
                <div className={`text-blue-200 ${isMobile ? "text-xs" : "text-sm"}`}>
                  <Target className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} mr-1 inline-block`} />
                  This is a <span className="font-semibold">reduced weekly reward</span> - perfect for completing the reduced weekly requirements!
                </div>
                <div className="mt-3 p-3 rounded-lg bg-blue-500/20 border border-blue-500/30">
                  <h4 className={`font-semibold text-blue-200 mb-2 ${isMobile ? "text-xs" : "text-sm"}`}>Reduced Requirements:</h4>
                  <ul className={`text-blue-100 space-y-1 ${isMobile ? "text-xs" : "text-sm"}`}>
                    <li>• All Weekly Tasks (any tasks scheduled for the week)</li>
                    <li>• 15+ Daily Quests (half of full requirement)</li>
                    <li>• 2+ Main Quests (half of full requirement)</li>
                    <li>• 2+ Side Quests (half of full requirement)</li>
                    <li>• 11+ Missions (reduced requirement)</li>
                  </ul>
                </div>
              </div>

              <div>
                <Label htmlFor="reduced-weekly-target-date" className={isMobile ? "text-sm" : ""}>Which week would you like this reward for?</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button
                    variant={reducedWeeklyTargetDate.toDateString() === currentWeekStart.toDateString() ? "default" : "outline"}
                    size="sm"
                    onClick={() => setReducedWeeklyTargetDate(currentWeekStart)}
                    className={isMobile ? "text-[10px] px-2 py-1" : "text-xs"}
                  >
                    This Week
                  </Button>
                  <Button
                    variant={reducedWeeklyTargetDate.toDateString() === nextWeekStart.toDateString() ? "default" : "outline"}
                    size="sm"
                    onClick={() => setReducedWeeklyTargetDate(nextWeekStart)}
                    className={isMobile ? "text-[10px] px-2 py-1" : "text-xs"}
                  >
                    Next Week
                  </Button>
                </div>
                <p className={`text-gray-500 mt-2 ${isMobile ? "text-xs" : "text-sm"}`}>
                  <span className={isMobile ? "text-[10px]" : ""}>
                  Selected: {format(reducedWeeklyTargetDate, 'MMM dd')} - {format(new Date(reducedWeeklyTargetDate.getTime() + 6 * 24 * 60 * 60 * 1000), 'MMM dd, yyyy')}
                  </span>
                </p>
                <p className={`text-gray-300 mt-1 ${isMobile ? "text-xs" : "text-sm"}`}>
                  <span className={isMobile ? "text-[10px]" : ""}>
                  💡 Complete the reduced requirements for the week to earn this reward!
                  </span>
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleReducedWeeklySuggestionSelect(selectedReducedWeeklySuggestion, reducedWeeklyTargetDate)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600"
                >
                  Set Reduced Weekly Reward
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedReducedWeeklySuggestion(null)}
                  className="flex-1"
                >
                  Back
                </Button>
              </div>
            </div>
          ) : (
            // All reduced weekly suggestions view
            <div className="space-y-4">
              {/* Custom Reward Option */}
              <div className="p-3 rounded-lg border border-blue-500/30 bg-blue-500/10">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-500">Custom Reduced Weekly Reward</span>
                  </div>
                  <Textarea
                    placeholder="e.g., Weekend movie night, Order takeout, Buy a small treat..."
                    value={customReducedWeeklyReward}
                    onChange={(e) => setCustomReducedWeeklyReward(e.target.value)}
                    className="bg-gray-800/50 border-gray-600 text-gray-200"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        if (customReducedWeeklyReward.trim()) {
                          setWeeklyReward(reducedWeeklyTargetDate, customReducedWeeklyReward.trim());
                          setCustomReducedWeeklyReward('');
                          setIsReducedWeeklySuggestionsDialogOpen(false);
                          toast({
                            title: "Reduced Weekly Reward Set!",
                            description: `Set "${customReducedWeeklyReward.trim()}" for ${format(reducedWeeklyTargetDate, 'MMM dd, yyyy')} (Reduced Requirements)`,
                            variant: "default"
                          });
                        }
                      }}
                      disabled={!customReducedWeeklyReward.trim()}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600"
                    >
                      Set Custom Reward
                    </Button>
                    <div className="grid grid-cols-2 gap-1 flex-1">
                      <Button
                        variant={reducedWeeklyTargetDate.toDateString() === currentWeekStart.toDateString() ? "default" : "outline"}
                        size="sm"
                        onClick={() => setReducedWeeklyTargetDate(currentWeekStart)}
                        className="text-xs"
                      >
                        This Week
                      </Button>
                      <Button
                        variant={reducedWeeklyTargetDate.toDateString() === nextWeekStart.toDateString() ? "default" : "outline"}
                        size="sm"
                        onClick={() => setReducedWeeklyTargetDate(nextWeekStart)}
                        className="text-xs"
                      >
                        Next Week
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Suggested Rewards */}
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-3">Or choose from reduced weekly suggestions:</h4>
                <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto">
                  {reducedWeeklyRewardSuggestions.map((suggestion) => {
                    const IconComponent = suggestion.icon;
                    return (
                      <div
                        key={suggestion.id}
                        onClick={() => setSelectedReducedWeeklySuggestion(suggestion)}
                        className="p-3 rounded-lg border border-gray-700 bg-gray-800/30 hover:bg-gray-700/50 cursor-pointer transition-all hover:border-blue-500/50 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <IconComponent className="h-5 w-5 text-blue-500 group-hover:text-blue-400 transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                              {suggestion.text}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {suggestion.category} • Reduced Requirements
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsReducedWeeklySuggestionsDialogOpen(false);
                    setIsWeeklySuggestionsDialogOpen(true);
                  }}
                  className="text-purple-500 border-purple-500/30 hover:bg-purple-500/10"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Full Weekly Rewards
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsReducedWeeklySuggestionsDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Rewards;
