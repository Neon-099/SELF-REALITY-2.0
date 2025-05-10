import React, { useState, useEffect } from 'react';
import { useSoloLevelingStore } from '@/lib/store';
import { Skull, Shield, Clock, AlertCircle, CheckCircle, X, Zap, Play, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { endOfDay, isBefore, isAfter, format } from 'date-fns';

// Challenge requirements for redemption
interface RecoveryTask {
  title: string;
  description: string;
  category: string;
  difficulty: string;
}

interface RecoveryChallenge {
  title: string;
  description: string;
  difficulty: string;
  category: string;
  tasks: RecoveryTask[];
}

const REDEMPTION_CHALLENGES: RecoveryChallenge[] = [
  {
    title: "Cold Shower Challenge",
    description: "Demonstrate your resolve by taking a cold shower for at least 5 minutes",
    difficulty: "medium",
    category: "physical",
    tasks: [
      {
        title: "Take a cold shower",
        description: "Complete a cold shower for at least 5 minutes",
        category: "physical",
        difficulty: "medium"
      }
    ]
  },
  {
    title: "10,000 Steps Challenge",
    description: "Push your physical limits by completing 10,000 steps in a single day",
    difficulty: "hard",
    category: "physical",
    tasks: [
      {
        title: "Complete 10,000 steps",
        description: "Walk at least 10,000 steps today",
        category: "physical",
        difficulty: "hard"
      }
    ]
  },
  {
    title: "Digital Detox Challenge",
    description: "Free your mind from digital distractions for 4 hours",
    difficulty: "medium",
    category: "mental",
    tasks: [
      {
        title: "Digital detox for 4 hours",
        description: "Stay away from all digital devices for 4 hours",
        category: "mental",
        difficulty: "medium"
      }
    ]
  },
  {
    title: "Delayed Tasks Conquest",
    description: "Face your procrastination head-on by completing 3 delayed tasks",
    difficulty: "hard",
    category: "intelligence",
    tasks: [
      {
        title: "Complete 3 delayed tasks",
        description: "Finish 3 tasks that you've been putting off",
        category: "intelligence",
        difficulty: "hard"
      }
    ]
  }
];

export default function ShadowPenalty() {
  const [redemptionDialogOpen, setRedemptionDialogOpen] = useState(false);
  const [recoveryQuestIds, setRecoveryQuestIds] = useState<string[]>([]);
  const [hasPendingRecovery, setHasPendingRecovery] = useState(false);
  const [recoveryDeadline, setRecoveryDeadline] = useState<Date | null>(null);
  const { 
    chanceCounter, 
    isCursed, 
    hasShadowFatigue, 
    shadowFatigueUntil, 
    cursedUntil,
    lockedSideQuestsUntil,
    canUseRedemption,
    areSideQuestsLocked,
    attemptRedemption,
    getExpModifier,
    addQuest,
    addQuestTask,
    quests
  } = useSoloLevelingStore();

  // Check if we need to show the component
  const showComponent = chanceCounter > 0 || isCursed || hasShadowFatigue || areSideQuestsLocked();
  const expModifier = getExpModifier();
  
  // Check for existing recovery quests on component mount
  useEffect(() => {
    const recoveryQuests = quests.filter(quest => quest.isRecoveryQuest && !quest.completed);
    if (recoveryQuests.length > 0) {
      // We have active recovery quests
      setHasPendingRecovery(true);
      
      // Store their IDs
      const ids = recoveryQuests.map(quest => quest.id);
      setRecoveryQuestIds(ids);
      
      // Get the deadline from the first quest
      if (recoveryQuests[0].deadline) {
        setRecoveryDeadline(new Date(recoveryQuests[0].deadline));
      }
      
      // Check if any deadline has passed
      const now = new Date();
      const expiredQuests = recoveryQuests.filter(quest => 
        quest.deadline && isAfter(now, new Date(quest.deadline))
      );
      
      if (expiredQuests.length > 0) {
        // Mark expired recovery quests as failed
        toast({
          title: "Recovery Challenge Failed",
          description: "You didn't complete the recovery quests in time. The curse remains.",
          variant: "destructive"
        });
        
        // Clear recovery tracking
        setRecoveryQuestIds([]);
        setHasPendingRecovery(false);
        setRecoveryDeadline(null);
      }
    } else {
      // No active recovery quests
      setHasPendingRecovery(false);
      setRecoveryQuestIds([]);
      setRecoveryDeadline(null);
    }
  }, [quests]);
  
  // Check if all recovery quests are completed to remove the curse
  useEffect(() => {
    if (!isCursed || recoveryQuestIds.length === 0) return;
    
    const allRecoveryQuests = quests.filter(quest => 
      recoveryQuestIds.includes(quest.id)
    );
    
    // If no recovery quests found, return
    if (allRecoveryQuests.length === 0) return;
    
    // Check if all recovery quests are completed
    const allCompleted = allRecoveryQuests.every(quest => quest.completed);
    
    if (allCompleted) {
      // All recovery quests completed, remove the curse
      useSoloLevelingStore.setState({ 
        isCursed: false,
        cursedUntil: null 
      });
      
      toast({
        title: "Redemption Complete!",
        description: "You've completed all recovery quests! The curse has been lifted.",
        variant: "default"
      });
      
      // Clear recovery quest tracking
      setRecoveryQuestIds([]);
      setHasPendingRecovery(false);
      setRecoveryDeadline(null);
    }
  }, [isCursed, quests, recoveryQuestIds]);
  
  // Update the useEffect to share hasPendingRecovery with the store
  useEffect(() => {
    // Update the hasPendingRecovery state in the store
    useSoloLevelingStore.setState({ hasPendingRecovery });
  }, [hasPendingRecovery]);
  
  if (!showComponent) return null;
  
  // Format time remaining for debuffs
  const getTimeRemaining = (endDate: Date | null) => {
    if (!endDate) return 'N/A';
    
    const now = new Date();
    const endTime = new Date(endDate);
    const diffMs = endTime.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Expired';
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h remaining`;
    }
    
    return `${diffHours}h remaining`;
  };
  
  const handleRedemptionSuccess = () => {
    attemptRedemption(true);
    setRedemptionDialogOpen(false);
  };
  
  const handleRedemptionFailure = () => {
    attemptRedemption(false);
    setRedemptionDialogOpen(false);
  };
  
  // Create redemption side quests with today's deadline
  const startRedemptionChallenge = () => {
    // If already has pending recovery, prevent creating more
    if (hasPendingRecovery) {
      toast({
        title: "Recovery In Progress",
        description: "You already have active recovery quests. Complete them first.",
        variant: "destructive"
      });
      setRedemptionDialogOpen(false);
      return;
    }
    
    // Create end of day deadline
    const today = endOfDay(new Date());
    
    // Track the IDs of recovery quests
    const newRecoveryQuestIds: string[] = [];
    
    // Create side quests for each challenge
    REDEMPTION_CHALLENGES.forEach(challenge => {
      // Calculate reward based on difficulty
      const baseReward = 100;
      const difficultyMultiplier = challenge.difficulty === 'easy' ? 1 : 
                                 challenge.difficulty === 'medium' ? 2 : 
                                 challenge.difficulty === 'hard' ? 3 : 4;
      const expReward = baseReward * difficultyMultiplier;
      
      // Create the side quest
      const isMainQuest = false; // These are side quests
      addQuest(
        challenge.title,
        challenge.description,
        isMainQuest,
        expReward,
        today,
        challenge.difficulty as any
      );
      
      // Get the newly created quest ID (the last one in the list)
      setTimeout(() => {
        const quests = useSoloLevelingStore.getState().quests;
        const questId = quests[quests.length - 1].id;
        
        // Mark as recovery quest
        useSoloLevelingStore.getState().updateQuest(questId, { 
          isRecoveryQuest: true 
        });
        
        // Track this recovery quest ID
        newRecoveryQuestIds.push(questId);
        
        // Add the tasks to the quest
        challenge.tasks.forEach(task => {
          addQuestTask(
            questId,
            task.title,
            task.description,
            task.category as any,
            task.difficulty as any
          );
        });
        
        // Mark the quest as started
        useSoloLevelingStore.getState().startQuest(questId);
        
        // Update recovery quest IDs after all have been created
        if (newRecoveryQuestIds.length === REDEMPTION_CHALLENGES.length) {
          setRecoveryQuestIds(newRecoveryQuestIds);
          setHasPendingRecovery(true);
          setRecoveryDeadline(today);
        }
      }, 100);
    });
    
    setRedemptionDialogOpen(false);
    
    // Show toast notification
    toast({
      title: "Recovery Quests Created",
      description: "Complete all recovery quests by the end of today to lift your curse!",
      variant: "default"
    });
  };
  
  return (
    <Card className="border-red-500/30 bg-red-950/10 shadow-md overflow-hidden mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skull className="h-5 w-5 text-red-500" />
            <CardTitle className="text-lg font-bold text-red-500">The Shadow Penalty</CardTitle>
          </div>
          <Badge variant={expModifier < 1 ? "destructive" : "outline"} className="font-mono text-sm">
            {Math.round(expModifier * 100)}% EXP Rate
          </Badge>
        </div>
        <CardDescription className="text-red-300/80">
          Your current punishment status and strikes
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-3">
        {/* Strike Counter  */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-300">Weekly Chances</span>
            <span className="text-sm text-gray-300">{chanceCounter}/5 used</span>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all",
                isCursed
                  ? "bg-red-500 animate-pulse" 
                  : chanceCounter <= 2
                  ? "bg-green-500"
                  : chanceCounter <= 3
                  ? "bg-yellow-500"
                  : "bg-red-500"
              )}
              style={{ width: `${(chanceCounter / 5) * 100}%` }}
            />
          </div>
          
          {/* Make this message stand out more */}
          {expModifier < 1 && (
            <div className="mt-2 p-2 border border-yellow-500/30 bg-yellow-950/30 rounded text-center">
              <p className="text-yellow-300 font-medium">
                All EXP rewards are reduced to {Math.round(expModifier * 100)}% 
                until your penalty expires
              </p>
            </div>
          )}
        </div>
        
        {/* Status Indicators */}
        <div className="space-y-2">
          {/* Shadow Fatigue */}
          {hasShadowFatigue && (
            <div className="flex items-center justify-between bg-red-950/20 p-2 rounded">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-yellow-200">Shadow Fatigue</span>
              </div>
              <div className="text-xs text-yellow-300/70">
                {getTimeRemaining(shadowFatigueUntil)}
              </div>
            </div>
          )}
          
          {/* Cursed Status */}
          {isCursed && (
            <div className="flex items-center justify-between bg-red-950/30 p-2 rounded">
              <div className="flex items-center gap-2">
                <Skull className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-300">Cursed</span>
              </div>
              <div className="text-xs text-red-300/70">
                {getTimeRemaining(cursedUntil)}
              </div>
            </div>
          )}
          
          {/* Locked Side Quests */}
          {areSideQuestsLocked() && (
            <div className="flex items-center justify-between bg-slate-800 p-2 rounded">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-blue-300">Side Quests Locked</span>
              </div>
              <div className="text-xs text-blue-300/70">
                {getTimeRemaining(lockedSideQuestsUntil)}
              </div>
            </div>
          )}
          
          {/* Recovery Quest Status */}
          {hasPendingRecovery && (
            <div className="flex items-center justify-between bg-amber-950/20 p-2 rounded">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-amber-300">Recovery In Progress</span>
              </div>
              <div className="text-xs text-amber-300/70">
                {recoveryDeadline 
                  ? `Expires ${format(recoveryDeadline, "h:mm a")}`
                  : "Complete all quests today"
                }
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      {/* Redemption Button (only if cursed and eligible) */}
      {isCursed && canUseRedemption() && (
        <CardFooter className="pt-0">
          <Dialog open={redemptionDialogOpen} onOpenChange={setRedemptionDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="destructive" 
                className="w-full"
                disabled={hasPendingRecovery}
              >
                {hasPendingRecovery ? (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Recovery In Progress
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Attempt Redemption Challenge
                  </>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl">Redemption Challenge</DialogTitle>
                <DialogDescription>
                  Complete these special recovery quests to lift your curse and restore your experience gain rate.
                  <div className="my-4 p-3 border border-amber-500/30 bg-amber-950/20 rounded-md">
                    <h4 className="font-semibold text-amber-400 mb-2">Challenge Requirements:</h4>
                    <ul className="space-y-2 text-sm text-amber-200/90">
                      {REDEMPTION_CHALLENGES.map((challenge, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                          <span>{challenge.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-2 p-3 border border-amber-500/30 bg-amber-950/20 rounded-md">
                    <h4 className="font-semibold text-amber-400 mb-2">Important Notes:</h4>
                    <ul className="space-y-1 text-sm text-amber-200/90">
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span>All quests must be completed by the end of today</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span>This challenge can only be attempted once per curse</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span>Failing will cost you one rank level!</span>
                      </li>
                    </ul>
                  </div>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex sm:justify-between gap-2 mt-4">
                <Button variant="ghost" onClick={() => setRedemptionDialogOpen(false)}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button variant="default" onClick={startRedemptionChallenge}>
                  <Play className="mr-2 h-4 w-4" />
                  Start Challenge
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      )}
    </Card>
  );
} 