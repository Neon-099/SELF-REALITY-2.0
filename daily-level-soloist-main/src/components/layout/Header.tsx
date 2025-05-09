import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSoloLevelingStore } from '@/lib/store';
import { Star, Coins } from 'lucide-react';
import { calculateProgress } from '@/lib/utils';

export function Header() {
  const user = useSoloLevelingStore(state => state.user);
  const [expPercentage, setExpPercentage] = useState(
    user ? calculateProgress(user.exp, user.expToNextLevel) : 0
  );
  const prevExpRef = useRef(user?.exp || 0);
  
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
    <header className="p-4 border-b border-gray-800">
      <div className="container flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <h1 className="text-2xl font-bold text-solo-primary glow-text">
              Self Reality Leveling 
            </h1>
          </Link>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-400" />
            <span className="font-medium">{user?.gold || 0}</span>
          </div>
          
          <div className="flex flex-col min-w-[200px]">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 stroke-2" />
                <span className="text-sm font-medium">Level {user?.level || 1}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400 ml-4">
                <span>{user?.exp || 0} / {user?.expToNextLevel || 100} XP</span>
              </div>
            </div>
            <div className="exp-bar-bg">
              <div 
                className="exp-bar-fill transition-all duration-700 ease-out" 
                style={{ width: `${expPercentage}%` }} 
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
