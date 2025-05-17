import { StateCreator, StoreApi } from 'zustand';
import { ShopItem } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { MongoDBService } from '../../services/mongodb-service';
import { StoreState } from '../index';

export interface ShopSlice {
  shopItems: ShopItem[];
  purchaseItem: (id: string) => void;
  addShopItem: (name: string, description: string, cost: number, type: 'reward' | 'boost' | 'cosmetic') => void;
}

export const createShopSlice = (dbService: MongoDBService) => (
  set: (
    partial: ShopSlice | Partial<ShopSlice> | ((state: StoreState) => ShopSlice | Partial<ShopSlice> | Partial<StoreState>),
    replace?: boolean | undefined
  ) => void,
  get: () => StoreState,
  _store: StoreApi<StoreState>
) => ({
  shopItems: [],
  
  purchaseItem: (id: string) => {
    set((state: StoreState) => {
      const item = state.shopItems.find((i: ShopItem) => i.id === id);
      if (!item || item.purchased || !state.user || state.user.gold < item.cost) {
        return {};
      }
      
      const updatedItems = state.shopItems.map((i: ShopItem) => 
        i.id === id ? { ...i, purchased: true } : i
      );
      
      let updatedStats = { ...state.user.stats };
      if (item.type === 'boost') {
        const statToBoost = item.name.toLowerCase().includes('intelligence') 
          ? 'intelligence' 
          : item.name.toLowerCase().includes('strength') 
            ? 'strength' 
            : 'willpower';
        
        updatedStats[statToBoost] = (updatedStats[statToBoost] || 0) + 1;
      }
      
      return {
        shopItems: updatedItems,
        user: {
          ...state.user,
          gold: state.user.gold - item.cost,
          stats: updatedStats
        }
      } as Partial<StoreState>;
    });
  },
  
  addShopItem: (name: string, description: string, cost: number, type: 'reward' | 'boost' | 'cosmetic') => {
    const newItem: ShopItem = {
      id: uuidv4(),
      name,
      description,
      cost,
      type,
      purchased: false
    };
    set((state: StoreState) => ({
      shopItems: [
        ...(state.shopItems || []),
        newItem
      ]
    } as Partial<ShopSlice>));
  }
});
