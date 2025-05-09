import { useSoloLevelingStore } from '../store';
import { User } from '../types';

interface UseUserReturn {
  user: User;
  addExp: (exp: number) => void;
  addGold: (amount: number) => void;
  updateStreak: () => void;
}

export function useUser(): UseUserReturn {
  const store = useSoloLevelingStore();
  
  return {
    user: store.user,
    addExp: store.addExp,
    addGold: store.addGold,
    updateStreak: store.updateStreak
  };
} 