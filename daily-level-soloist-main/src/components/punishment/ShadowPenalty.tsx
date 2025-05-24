import React, { useState, useEffect } from 'react';
import { useSoloLevelingStore } from '@/lib/store';
import { Skull, Shield, Clock, AlertCircle, CheckCircle, X, Zap, Play, Lock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { endOfDay, isBefore, isAfter, format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

// Challenge requirements for redemption
interface RecoveryTask {
  title: string;
  description: string;
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
    title: "The Mind Unshackled",
    description: "You let your discipline slip. To regain control, face the truth of your mind. Break the chains of mental fog with ruthless self-awareness.",
    difficulty: "medium",
    category: "mental",
    tasks: [
      {
        title: "90-Minute Deep Focus Work",
        description: "Choose a mentally demanding task you've been avoiding. Work without distractions for 90 minutes."
      },
      {
        title: "Write a Brutally Honest Self-Reflection (500 words)",
        description: "Explore why you failed your previous task and what patterns you keep repeating."
      },
      {
        title: "Study 1 Hour of Cognitive Psychology",
        description: "Focus on willpower, self-control, or habits. Use a reliable YouTube lecture or summary from a book like Thinking, Fast and Slow."
      },
      {
        title: "Cold Shower (3–5 mins)",
        description: "Build grit and shock your system back into presence."
      },
      {
        title: "30 Minutes of Mindfulness Meditation",
        description: "Sit with discomfort. Do not escape. Observe your thoughts without judgment."
      }
    ]
  },
  {
    title: "Echoes of the Body",
    description: "A missed task weakens your physical presence. Realign your body through pain, breath, and sweat. Reclaim strength through movement.",
    difficulty: "hard",
    category: "physical",
    tasks: [
      {
        title: "Complete a Full-Body HIIT Circuit (45 minutes)",
        description: "Push limits. Minimum: burpees, jump squats, push-ups, planks, and mountain climbers."
      },
      {
        title: "Take a Cold Shower or Ice Bath (3–5 mins)",
        description: "Confront your comfort zone. Reset your nervous system."
      },
      {
        title: "Read 10 Pages from a Book on Fitness/Nutrition",
        description: "Preferably Can’t Hurt Me by David Goggins or The 4-Hour Body by Tim Ferriss or a similar book."
      }, {
        title: "Log Every Meal You Eat Today",
        description: "Track calories/macros and reflect on how food influences your energy."
      },
      {
        title: "Stretch + Breathwork Session (20 mins)",
        description: "Mobility and nasal breathing to end the quest with bodily control."
      }
    ]
  },
  {
    title: "The Warrior of Words",
    description: "You ignored your path to expression. Now, you must fight your way back through language, clarity, and thought.",
    difficulty: "medium",
    category: "mental",
    tasks: [
      {
        title: "Write a 700-Word Essay on a Topic That Intimidates You",
        description: "Could be philosophy, purpose, death, or failure. Don’t hold back."
      },
      {
        title: "Learn 10 Advanced English Words and Use Them in a Story",
        description: "No script. Speak clearly and confidently about a value or belief. Upload or keep for personal reflection."
      },
      {
        title: "Record a 3-Minute Spoken Rant or Speech",
        description: "Spend 15 minutes in meditation or mindful breathing"
      }, {
        title: "Write 500 Words",
        description: "Write for 30 minutes without stopping. It can be stream of consciousness or structured writing."
      }, {
        title: "Reflect on Your Writing",
        description: "Journal about what you wrote, what you learned, and how it made you feel."
      }, {
        title: "Write a Self-Contract",
        description: "Commit to never missing a key task again. Sign it."
      }
    ]
  },
  {
    title: "The Clock of Death",
    description: "Time slipped through your fingers. To honor the value of time, you must now battle it head-on. Race the day. Defy procrastination.",
    difficulty: "hard",
    category: "mental",
    tasks: [
      {
        title: "Time Audit Your Entire Day",
        description: "Break down how every hour is spent from wake to sleep. Be brutally honest."
      },
      {
        title: "Create a tomorrow Full Hour-by-Hour Schedule and Stick to It",
        description: "No flexibility. If something derails you, restart the hour."
      },
      {
        title: "Watch One 30-Minute Lecture on Time Management",
        description: "Preferably by Cal Newport, Ali Abdaal, or Thomas Frank."
      }, {
        title: "Do a 2-Hour Deep Work Sprint",
        description: "Choose your most important task and complete it with total focus."
      }, {
        title: "Write a 250-Word Letter From Your Future Self at Age 30",
        description: "Reflect on what your older self would say if you kept wasting time."
      }
    ]
  }
];

export default function ShadowPenalty() {
  const [redemptionDialogOpen, setRedemptionDialogOpen] = useState(false);
  const [penaltyDetailsOpen, setPenaltyDetailsOpen] = useState(false);
  const isMobile = useIsMobile();
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
    quests,
    tasks,
    missions,
    activeRecoveryQuestIds,
    hasPendingRecovery: storeHasPendingRecovery,
    setActiveRecoveryQuestIds,
    abandonRecoveryChallenge
  } = useSoloLevelingStore(state => ({
    chanceCounter: state.chanceCounter,
    isCursed: state.isCursed,
    hasShadowFatigue: state.hasShadowFatigue,
    shadowFatigueUntil: state.shadowFatigueUntil,
    cursedUntil: state.cursedUntil,
    lockedSideQuestsUntil: state.lockedSideQuestsUntil,
    canUseRedemption: state.canUseRedemption,
    areSideQuestsLocked: state.areSideQuestsLocked,
    attemptRedemption: state.attemptRedemption,
    getExpModifier: state.getExpModifier,
    addQuest: state.addQuest,
    addQuestTask: state.addQuestTask,
    quests: state.quests,
    tasks: state.tasks,
    missions: state.missions,
    activeRecoveryQuestIds: state.activeRecoveryQuestIds,
    hasPendingRecovery: state.hasPendingRecovery,
    setActiveRecoveryQuestIds: state.setActiveRecoveryQuestIds,
    abandonRecoveryChallenge: state.abandonRecoveryChallenge
  }));

  // Check if we need to show the component
  const showComponent = chanceCounter > 0 || isCursed || hasShadowFatigue || areSideQuestsLocked();
  const expModifier = getExpModifier();

  // Effect to check for expired active recovery quests (if any)
  useEffect(() => {
    if (storeHasPendingRecovery && activeRecoveryQuestIds && activeRecoveryQuestIds.length > 0) {
      const now = new Date();
      // Find the deadline from the first quest in the active batch (assuming they share a deadline)
      const firstActiveRecoveryQuest = quests.find(q => q.id === activeRecoveryQuestIds[0]);
      if (firstActiveRecoveryQuest && firstActiveRecoveryQuest.deadline && isAfter(now, new Date(firstActiveRecoveryQuest.deadline))) {

        // Mark all recovery quests as completed/failed to prevent bypass
        const updateQuest = useSoloLevelingStore.getState().updateQuest;
        activeRecoveryQuestIds.forEach(questId => {
          updateQuest(questId, {
            completed: true,
            completedAt: now,
            missed: true // Mark as missed to indicate failure
          });
        });

        // Clear the pending recovery state
        useSoloLevelingStore.setState({
          hasPendingRecovery: false,
          activeRecoveryQuestIds: null
        });

        toast({
          title: "Recovery Challenge Failed",
          description: "You didn't complete the recovery quests in time. The curse remains and recovery quests have been marked as failed.",
          variant: "destructive"
        });
      }
    }
  }, [quests, activeRecoveryQuestIds, storeHasPendingRecovery, setActiveRecoveryQuestIds]);

  if (!showComponent && !storeHasPendingRecovery) return null;

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

  // Gather all penalty information
  const getAllPenalties = () => {
    const penalties: {
      type: string;
      title: string;
      description: string;
      deadline: string;
      status: string;
      category: string;
      difficulty: string;
      expReward: number;
    }[] = [];
    const now = new Date();

    // Check for missed tasks
    if (tasks && Array.isArray(tasks)) {
      tasks.forEach(task => {
        if (task.missed || (task.deadline && new Date(task.deadline) < now && !task.completed)) {
          penalties.push({
            type: 'Task',
            title: task.title,
            description: task.description || 'No description',
            deadline: task.deadline ? format(new Date(task.deadline), 'MMM dd, yyyy h:mm a') : 'No deadline',
            status: task.missed ? 'Missed' : 'Overdue',
            category: task.category,
            difficulty: task.difficulty,
            expReward: task.expReward
          });
        }
      });
    }

    // Check for missed quests
    if (quests && Array.isArray(quests)) {
      quests.forEach(quest => {
        if (quest.missed || (quest.deadline && new Date(quest.deadline) < now && !quest.completed)) {
          penalties.push({
            type: quest.isMainQuest ? 'Main Quest' : quest.isDaily ? 'Daily Quest' : 'Side Quest',
            title: quest.title,
            description: quest.description || 'No description',
            deadline: quest.deadline ? format(new Date(quest.deadline), 'MMM dd, yyyy h:mm a') : 'No deadline',
            status: quest.missed ? 'Missed' : 'Overdue',
            category: quest.category || 'None',
            difficulty: quest.difficulty,
            expReward: quest.expReward
          });
        }
      });
    }

    // Check for missed missions
    if (missions && Array.isArray(missions)) {
      missions.forEach(mission => {
        if (mission.missed || (mission.deadline && new Date(mission.deadline) < now && !mission.completed)) {
          penalties.push({
            type: 'Mission',
            title: mission.title,
            description: mission.description || 'No description',
            deadline: mission.deadline ? format(new Date(mission.deadline), 'MMM dd, yyyy h:mm a') : 'No deadline',
            status: mission.missed ? 'Missed' : 'Overdue',
            category: 'Mission',
            difficulty: mission.rank || 'Unknown',
            expReward: mission.expReward
          });
        }
      });
    }

    return penalties;
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
    if (storeHasPendingRecovery) {
      toast({
        title: "Recovery In Progress",
        description: "You already have active recovery quests. Complete them first.",
        variant: "destructive"
      });
      setRedemptionDialogOpen(false);
      return;
    }

    const today = endOfDay(new Date());
    const newRecoveryQuestIdsTrack: string[] = [];
    let currentQuestsState = useSoloLevelingStore.getState().quests;

    REDEMPTION_CHALLENGES.forEach(challenge => {
      const initialQuestCount = currentQuestsState.length;

      // Set individual EXP rewards for each redemption challenge
      const getRedemptionChallengeExpReward = (challengeTitle: string): number => {
        switch (challengeTitle) {
          case 'The Discipline Forge': return 300;
          case '10,000 Steps Challenge': return 450;
          case 'Digital Detox Challenge': return 275;
          case 'Delayed Tasks Conquest': return 425;
          default: return 250; // Default fallback for any new challenges
        }
      };

      addQuest(
        challenge.title,
        challenge.description,
        false, // isMainQuest
        getRedemptionChallengeExpReward(challenge.title), // Individual EXP rewards for redemption challenges
        today,
        challenge.difficulty as any
      );

      // Immediately get the updated quests list from the store
      currentQuestsState = useSoloLevelingStore.getState().quests;

      // Find the newly added quest
      // This assumes addQuest adds to the end and no other quests are added simultaneously
      if (currentQuestsState.length > initialQuestCount) {
        const newQuest = currentQuestsState[currentQuestsState.length - 1];
        if (newQuest && !newRecoveryQuestIdsTrack.includes(newQuest.id)) {
            useSoloLevelingStore.getState().updateQuest(newQuest.id, {
              isRecoveryQuest: true
              // Remove auto-start - recovery quests require manual start
            });
            newRecoveryQuestIdsTrack.push(newQuest.id);

            // Add tasks for this specific new quest
            challenge.tasks.forEach(task => {
              addQuestTask(
                newQuest.id, // Use the newQuest.id here
                task.title,
                task.description,
                'mental', // Default category for recovery quest tasks
                'normal' // Default difficulty for recovery quest tasks
              );
            });
        } else {
          //This case should ideally not happen if addQuest works as expected
          console.error("Failed to identify newly added quest or duplicate ID detected for challenge:", challenge.title);
        }
      } else {
        console.error("Quest count did not increase after adding quest for challenge:", challenge.title);
      }
    });

    // After all quests are added and processed synchronously within the loop
    if (newRecoveryQuestIdsTrack.length === REDEMPTION_CHALLENGES.length) {
      setActiveRecoveryQuestIds(newRecoveryQuestIdsTrack);

      // Mark redemption as started (this sets hasPendingRecovery: true and lastRedemptionDate)
      attemptRedemption(true);
    } else {
      console.error("Mismatch in expected recovery quests and tracked IDs.", newRecoveryQuestIdsTrack);
      // Potentially handle this error, e.g., by not setting active IDs or showing a user error
      setActiveRecoveryQuestIds(null); // Clear out potentially incorrect IDs
    }

    setRedemptionDialogOpen(false);

    toast({
      title: "Recovery Quests Created",
      description: "Complete all recovery quests by the end of today to lift your curse!",
      variant: "default"
    });
  };

  return (
    <Card className="border-red-500/30 bg-red-950/10 shadow-md overflow-hidden mb-4">
      <CardHeader className={cn("pb-2", isMobile ? "p-3" : "p-6")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setPenaltyDetailsOpen(true)}
                  >
                    <AlertTriangle className={cn("text-yellow-500 animate-pulse", isMobile ? "h-4 w-4" : "h-5 w-5")} />
                    <Skull className={cn("text-red-500", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">Click to view all penalties</p>
                  <p className="text-xs text-gray-300">System-wide penalty tracker</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <CardTitle className={cn("font-bold text-red-500", isMobile ? "text-base" : "text-lg")}>The Shadow Penalty</CardTitle>
          </div>
          <Badge variant={expModifier < 1 ? "destructive" : "outline"} className={cn("font-mono", isMobile ? "text-[10px]" : "text-sm")}>
            {Math.round(expModifier * 100)}% EXP Rate
          </Badge>
        </div>
        <CardDescription className={cn("text-red-300/80", isMobile ? "text-xs" : "text-sm")}>
          ⚠️ Active penalties affecting your progress
        </CardDescription>
      </CardHeader>

      <CardContent className={cn("pb-3", isMobile ? "px-3" : "px-6")}>
        {/* Strike Counter  */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className={cn("text-gray-300", isMobile ? "text-xs" : "text-sm")}>Weekly Chances</span>
            <span className={cn("text-gray-300", isMobile ? "text-xs" : "text-sm")}>{Math.min(chanceCounter, 5)}/5 used</span>
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
              style={{ width: `${Math.min((chanceCounter / 5) * 100, 100)}%` }}
            />
          </div>

          {/* Make this message stand out more */}
          {expModifier < 1 && (
            <div className={cn("mt-2 border border-yellow-500/30 bg-yellow-950/30 rounded text-center", isMobile ? "p-1.5" : "p-2")}>
              <p className={cn("text-yellow-300 font-medium", isMobile ? "text-xs" : "text-sm")}>
                All EXP rewards are reduced to {Math.round(expModifier * 100)}%
                until your penalty expires
              </p>
            </div>
          )}
        </div>

        {/* Status Indicators */}
        <div className={cn("space-y-2", isMobile ? "space-y-1.5" : "space-y-2")}>
          {/* Shadow Fatigue */}
          {hasShadowFatigue && (
            <div className={cn("flex items-center justify-between bg-red-950/20 rounded", isMobile ? "p-1.5" : "p-2")}>
              <div className="flex items-center gap-2">
                <Clock className={cn("text-yellow-500", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                <span className={cn("text-yellow-200", isMobile ? "text-xs" : "text-sm")}>Shadow Fatigue</span>
              </div>
              <div className={cn("text-yellow-300/70", isMobile ? "text-xs" : "text-xs")}>
                {getTimeRemaining(shadowFatigueUntil)}
              </div>
            </div>
          )}

          {/* Cursed Status */}
          {isCursed && (
            <div className={cn("flex items-center justify-between bg-red-950/30 rounded", isMobile ? "p-1.5" : "p-2")}>
              <div className="flex items-center gap-2">
                <Skull className={cn("text-red-500", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                <span className={cn("text-red-300", isMobile ? "text-xs" : "text-sm")}>Cursed</span>
              </div>
              <div className={cn("text-red-300/70", isMobile ? "text-xs" : "text-xs")}>
                {getTimeRemaining(cursedUntil)}
              </div>
            </div>
          )}

          {/* Locked Side Quests */}
          {areSideQuestsLocked() && (
            <div className={cn("flex items-center justify-between bg-slate-800 rounded", isMobile ? "p-1.5" : "p-2")}>
              <div className="flex items-center gap-2">
                <AlertCircle className={cn("text-blue-400", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                <span className={cn("text-blue-300", isMobile ? "text-xs" : "text-sm")}>Side Quests Locked</span>
              </div>
              <div className={cn("text-blue-300/70", isMobile ? "text-xs" : "text-xs")}>
                {getTimeRemaining(lockedSideQuestsUntil)}
              </div>
            </div>
          )}

          {/* Recovery Quest Status */}
          {storeHasPendingRecovery && (
            <div className={cn("bg-amber-950/20 rounded", isMobile ? "p-1.5" : "p-2")}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Shield className={cn("text-amber-500", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                  <span className={cn("text-amber-300", isMobile ? "text-xs" : "text-sm")}>Recovery In Progress</span>
                </div>
                <div className={cn("text-amber-300/70", isMobile ? "text-xs" : "text-xs")}>
                  {/* Display deadline of the first active recovery quest, if available */}
                  {(() => {
                    if (activeRecoveryQuestIds && activeRecoveryQuestIds.length > 0) {
                      const firstQuest = quests.find(q => q.id === activeRecoveryQuestIds[0]);
                      if (firstQuest && firstQuest.deadline) {
                        return `Expires ${format(new Date(firstQuest.deadline), "h:mm a")}`;
                      }
                    }
                    return "Complete all quests today";
                  })()}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "w-full border-red-500/30 hover:border-red-500/60 text-red-400 hover:text-red-300",
                  isMobile ? "text-xs py-1" : "text-sm py-1.5"
                )}
                onClick={abandonRecoveryChallenge}
              >
                <X className={cn("mr-1", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                Abandon Challenge
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      {/* Redemption Button or Status Message */}
      {isCursed && (
        <CardFooter className={cn("pt-0", isMobile ? "px-3" : "px-6")}>
          {canUseRedemption() ? (
            <Dialog open={redemptionDialogOpen} onOpenChange={setRedemptionDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="destructive"
                  className={cn("w-full", isMobile ? "text-xs py-2" : "text-sm py-2.5")}
                  disabled={storeHasPendingRecovery}
                >
                  {storeHasPendingRecovery ? (
                    <>
                      <Lock className={cn("mr-2", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                      Recovery In Progress
                    </>
                  ) : (
                    <>
                      <Shield className={cn("mr-2", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                      Attempt Redemption Challenge
                    </>
                  )}
                </Button>
              </DialogTrigger>
            <DialogContent className={cn(
              "glassmorphism flex flex-col text-solo-text rounded-xl",
              "before:!absolute before:!inset-0 before:!rounded-xl",
              "before:!bg-gradient-to-br before:!from-indigo-500/10 before:!to-purple-500/5",
              "before:!backdrop-blur-xl before:!-z-10",
              isMobile
                ? "w-[90vw] max-w-[320px] p-2 sm:p-3 max-h-[85vh]"
                : "max-w-lg max-h-[90vh] p-4 sm:p-6"
            )}>
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className={cn("font-semibold text-white/90 tracking-wide", isMobile ? "text-base" : "text-xl")}>
                  Redemption Challenge
                </DialogTitle>
                <DialogDescription className={cn("text-white/70", isMobile ? "text-xs" : "text-sm")}>
                  Complete these special recovery quests to lift your curse and restore your experience gain rate.
                </DialogDescription>
              </DialogHeader>

              {/* Scrollable Content Area */}
              <div className={cn("flex-1 overflow-y-auto", isMobile ? "pr-1" : "pr-2 -mr-2")}>
                <div className={cn("relative z-10", isMobile ? "space-y-2 pt-1" : "space-y-4")}>
                  <div className={cn("border border-amber-500/30 bg-amber-950/20 rounded-md", isMobile ? "p-2" : "p-3")}>
                    <h4 className={cn("font-semibold text-amber-400 mb-2", isMobile ? "text-sm" : "text-base")}>
                      Challenge Requirements:
                    </h4>
                    <div className={cn("text-amber-200/90", isMobile ? "space-y-2 text-xs" : "space-y-3 text-sm")}>
                      {REDEMPTION_CHALLENGES.map((challenge, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CheckCircle className={cn("text-amber-500 flex-shrink-0", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                            <span className={cn("font-medium", isMobile ? "text-xs" : "text-sm")}>{challenge.title}</span>
                          </div>
                          <ul className={cn("space-y-1", isMobile ? "ml-4" : "ml-6")}>
                            {challenge.tasks.map((task, taskIndex) => (
                              <li key={taskIndex} className={cn("flex items-start gap-2 text-amber-300/80", isMobile ? "text-[10px]" : "text-xs")}>
                                <span className="text-amber-500 mt-0.5">•</span>
                                <span>{task.title}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={cn("border border-amber-500/30 bg-amber-950/20 rounded-md", isMobile ? "p-2" : "p-3")}>
                    <h4 className={cn("font-semibold text-amber-400 mb-2", isMobile ? "text-sm" : "text-base")}>
                      Important Notes:
                    </h4>
                    <ul className={cn("text-amber-200/90", isMobile ? "space-y-1 text-xs" : "space-y-1 text-sm")}>
                      <li className="flex items-start gap-2">
                        <AlertCircle className={cn("text-amber-500 flex-shrink-0 mt-0.5", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                        <span>All quests must be completed by the end of today</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertCircle className={cn("text-amber-500 flex-shrink-0 mt-0.5", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                        <span>Each recovery quest and all its tasks must be manually started and completed</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertCircle className={cn("text-amber-500 flex-shrink-0 mt-0.5", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                        <span>This challenge can only be attempted once per week</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertCircle className={cn("text-amber-500 flex-shrink-0 mt-0.5", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                        <span>Failing will cost you one rank level!</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <DialogFooter className={cn(
                "flex-shrink-0 flex gap-2 border-t border-gray-700",
                isMobile ? "mt-2 pt-2 flex-col" : "mt-4 pt-4 sm:justify-between"
              )}>
                {!isMobile && (
                  <Button
                    variant="ghost"
                    onClick={() => setRedemptionDialogOpen(false)}
                    className="h-9 text-sm"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                )}
                <Button
                  variant="default"
                  onClick={startRedemptionChallenge}
                  className={cn(
                    "bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white",
                    isMobile ? "h-8 text-xs" : "h-9 text-sm"
                  )}
                >
                  <Play className={cn("mr-2", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                  Start Challenge
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          ) : (
            <div className={cn("w-full text-center", isMobile ? "p-2" : "p-3")}>
              {!storeHasPendingRecovery && (
                chanceCounter >= 5 ? (
                  <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-600/30">
                    <p className={cn("text-gray-400 font-medium", isMobile ? "text-xs" : "text-sm")}>
                      <X className={cn("inline mr-1", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                      Redemption Unavailable
                    </p>
                    <p className={cn("text-gray-500 mt-1", isMobile ? "text-xs" : "text-sm")}>
                      Weekly chances full (5/5). Wait for weekly reset or new curse.
                    </p>
                  </div>
                ) : !canUseRedemption() ? (
                  <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-600/30">
                    <p className={cn("text-gray-400 font-medium", isMobile ? "text-xs" : "text-sm")}>
                      <X className={cn("inline mr-1", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                      Redemption Unavailable
                    </p>
                    <p className={cn("text-gray-500 mt-1", isMobile ? "text-xs" : "text-sm")}>
                      Already attempted this week. Wait for weekly reset.
                    </p>
                  </div>
                ) : null
              )}
            </div>
          )}
        </CardFooter>
      )}

      {/* Penalty Details Dialog */}
      <Dialog open={penaltyDetailsOpen} onOpenChange={setPenaltyDetailsOpen}>
        <DialogContent className={cn("max-w-2xl max-h-[80vh] overflow-y-auto", isMobile && "max-w-[95vw]")}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              All System Penalties
            </DialogTitle>
            <DialogDescription>
              Complete overview of all missed deadlines and penalties across the system
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {(() => {
              const allPenalties = getAllPenalties();

              if (allPenalties.length === 0) {
                return (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-green-400 mb-2">No Penalties Found!</h3>
                    <p className="text-gray-400">You have no missed deadlines or penalties at this time.</p>
                  </div>
                );
              }

              // Group penalties by type
              const groupedPenalties = allPenalties.reduce<Record<string, typeof allPenalties>>((acc, penalty) => {
                if (!acc[penalty.type]) {
                  acc[penalty.type] = [];
                }
                acc[penalty.type].push(penalty);
                return acc;
              }, {});

              return Object.entries(groupedPenalties).map(([type, penalties]) => (
                <div key={type} className="space-y-2">
                  <h3 className="text-lg font-semibold text-red-400 border-b border-red-500/30 pb-1">
                    {type}s ({penalties.length})
                  </h3>
                  <div className="space-y-2">
                    {penalties.map((penalty, index) => (
                      <div
                        key={`${penalty.type}-${index}`}
                        className={cn(
                          "border rounded-lg",
                          isMobile ? "p-2" : "p-3",
                          penalty.status === 'Missed'
                            ? "border-red-500/30 bg-red-950/20"
                            : "border-orange-500/30 bg-orange-950/20"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className={cn(
                              "font-medium truncate",
                              isMobile ? "text-sm" : "text-base",
                              penalty.status === 'Missed' ? "text-red-300" : "text-orange-300"
                            )}>
                              {penalty.title}
                            </h4>
                            {penalty.description !== 'No description' && (
                              <p className={cn(
                                "text-gray-400 mt-1",
                                isMobile ? "text-xs" : "text-sm"
                              )}>
                                {penalty.description}
                              </p>
                            )}
                            <div className={cn(
                              "flex flex-wrap gap-2 mt-2",
                              isMobile ? "text-xs" : "text-sm"
                            )}>
                              <span className="text-gray-500">
                                Deadline: {penalty.deadline}
                              </span>
                              <span className="text-gray-500">•</span>
                              <span className="text-gray-500">
                                Category: {penalty.category}
                              </span>
                              <span className="text-gray-500">•</span>
                              <span className="text-gray-500">
                                Difficulty: {penalty.difficulty}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={cn(
                              "px-2 py-1 rounded text-xs font-medium",
                              penalty.status === 'Missed'
                                ? "bg-red-600/20 text-red-400"
                                : "bg-orange-600/20 text-orange-400"
                            )}>
                              {penalty.status}
                            </span>
                            <span className={cn(
                              "text-gray-400",
                              isMobile ? "text-xs" : "text-sm"
                            )}>
                              {penalty.expReward} EXP
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>


        </DialogContent>
      </Dialog>
    </Card>
  );
}