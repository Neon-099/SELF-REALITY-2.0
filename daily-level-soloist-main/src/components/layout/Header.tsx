import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSoloLevelingStore } from '@/lib/store';
import { Star, Award, Sparkles } from 'lucide-react';
import { calculateProgress } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export function Header() {
  const user = useSoloLevelingStore(state => state.user);
  const [expPercentage, setExpPercentage] = useState(
    user ? calculateProgress(user.exp, user.expToNextLevel) : 0
  );
  const prevExpRef = useRef(user?.exp || 0);
  const isMobile = useIsMobile();
  
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
              <div className="flex items-center gap-1 text-xs text-gray-300 ml-2">
                <span>{isMobile ? `${user?.exp || 0}/${user?.expToNextLevel || 100}` : `${user?.exp || 0} / ${user?.expToNextLevel || 100} XP`}</span>
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
