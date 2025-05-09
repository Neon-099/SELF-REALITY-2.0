import React, { useState } from 'react';
import { useSoloLevelingStore } from '@/lib/store';
import { Skull, Shield, Clock, AlertCircle, CheckCircle, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export default function ShadowPenalty() {
  const [redemptionDialogOpen, setRedemptionDialogOpen] = useState(false);
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
    getExpModifier
  } = useSoloLevelingStore();

  // Check if we need to show the component
  const showComponent = chanceCounter > 0 || isCursed || hasShadowFatigue || areSideQuestsLocked();
  const expModifier = getExpModifier();
  
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
  
  return (
    <Card className="border-red-500/30 bg-red-950/10 shadow-md overflow-hidden mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skull className="h-5 w-5 text-red-500" />
            <CardTitle className="text-lg font-bold text-red-500">The Shadow Penalty</CardTitle>
          </div>
          <Badge variant={expModifier < 1 ? "destructive" : "outline"} className="font-mono">
            {Math.round(expModifier * 100)}% EXP Rate
          </Badge>
        </div>
        <CardDescription className="text-red-300/80">
          Your current punishment status and strikes
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-3">
        {/* Chances Counter */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-300">Weekly Chances</span>
            <span className="text-sm font-mono">{chanceCounter}/5 used</span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Progress value={chanceCounter * 20} className="h-2 w-full" />
              </TooltipTrigger>
              <TooltipContent>
                <p>You have {5 - chanceCounter} chances remaining this week</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
        </div>
      </CardContent>
      
      {/* Redemption Button (only if cursed and eligible) */}
      {isCursed && canUseRedemption() && (
        <CardFooter className="pt-0">
          <Dialog open={redemptionDialogOpen} onOpenChange={setRedemptionDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Shield className="mr-2 h-4 w-4" />
                Attempt Redemption Challenge
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Redemption Challenge</DialogTitle>
                <DialogDescription>
                  Complete this challenge to lift your curse and restore your experience gain rate.
                  <div className="my-4 p-3 border border-amber-500/30 bg-amber-950/20 rounded-md">
                    <h4 className="font-semibold text-amber-400 mb-2">Challenge Requirements:</h4>
                    <ul className="space-y-2 text-sm text-amber-200/90">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-amber-500" />
                        Take a cold shower
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-amber-500" />
                        Complete 10,000 steps
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-amber-500" />
                        Full digital detox for 4 hours
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-amber-500" />
                        Complete 3 delayed tasks today
                      </li>
                    </ul>
                  </div>
                  <div className="mt-4 text-red-300">
                    <AlertCircle className="inline-block mr-2 h-4 w-4" />
                    Failing the challenge will cost you one rank level!
                  </div>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button variant="ghost" className="w-full" onClick={() => setRedemptionDialogOpen(false)}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button variant="destructive" className="w-full" onClick={handleRedemptionFailure}>
                  <X className="mr-2 h-4 w-4" />
                  Failed Challenge
                </Button>
                <Button variant="default" className="w-full" onClick={handleRedemptionSuccess}>
                  <Zap className="mr-2 h-4 w-4" />
                  Completed Challenge
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      )}
    </Card>
  );
} 