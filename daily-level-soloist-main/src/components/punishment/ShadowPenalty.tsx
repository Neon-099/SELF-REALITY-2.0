import React, { useState } from 'react';
import { useSoloLevelingStore } from '@/lib/store';
import { Skull, Shield, Clock, AlertCircle, CheckCircle, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

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
            <DialogContent className="max-w-md w-full p-3 sm:p-4 max-h-[95vh] overflow-y-auto">
              <DialogHeader className="pb-1 sm:pb-2">
                <DialogTitle className="text-lg sm:text-xl">Redemption Challenge</DialogTitle>
              </DialogHeader>
              
              <div className="text-sm text-muted-foreground mt-1 mb-3">
                Complete this challenge to lift your curse and restore your experience gain rate.
              </div>
              
              <div className="mb-3 p-2.5 border border-amber-500/30 bg-amber-950/20 rounded-md">
                <h4 className="font-semibold text-amber-400 mb-1.5">Challenge Requirements:</h4>
                <ul className="space-y-1 text-sm text-amber-200/90">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                    <span>Take a cold shower</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                    <span>Complete 10,000 steps</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                    <span>Full digital detox for 4 hours</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                    <span>Complete 3 delayed tasks today</span>
                  </li>
                </ul>
              </div>
              
              <div className="mb-4 text-sm text-red-300 flex items-center">
                <AlertCircle className="mr-2 h-4 w-4 flex-shrink-0" />
                <span>Failing the challenge will cost you one rank level!</span>
              </div>
              
              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button variant="ghost" size="sm" className="w-full" onClick={() => setRedemptionDialogOpen(false)}>
                  <X className="mr-1.5 h-4 w-4" />
                  Cancel
                </Button>
                <Button variant="destructive" size="sm" className="w-full" onClick={handleRedemptionFailure}>
                  <X className="mr-1.5 h-4 w-4" />
                  Failed Challenge
                </Button>
                <Button variant="default" size="sm" className="w-full" onClick={handleRedemptionSuccess}>
                  <Zap className="mr-1.5 h-4 w-4" />
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