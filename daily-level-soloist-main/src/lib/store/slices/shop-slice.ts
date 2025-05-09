
import { StateCreator } from 'zustand';
import { ShopItem } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export interface ShopSlice {
  shopItems: ShopItem[];
  purchaseItem: (id: string) => void;
  addShopItem: (name: string, description: string, cost: number, type: 'reward' | 'boost' | 'cosmetic') => void;
}

export const createShopSlice: StateCreator<ShopSlice & any> = (set) => ({
  shopItems: [
    {
      id: uuidv4(),
      name: "Meditation Guide",
      description: "Unlock basic meditation techniques to improve focus and willpower",
      cost: 200,
      type: "reward",
      purchased: false
    },
    {
      id: uuidv4(),
      name: "Fitness Program",
      description: "A customized workout plan to boost your strength stat",
      cost: 350,
      type: "boost",
      purchased: false
    },
    {
      id: uuidv4(),
      name: "Scholar's Tome",
      description: "Ancient knowledge that grants +1 to intelligence",
      cost: 500,
      type: "boost",
      purchased: false
    }
  ],
  
  purchaseItem: (id) => {
    set((state: any) => {
      const item = state.shopItems.find((i: ShopItem) => i.id === id);
      if (!item || item.purchased || state.user.gold < item.cost) return state;
      
      const updatedItems = state.shopItems.map((i: ShopItem) => 
        i.id === id ? { ...i, purchased: true } : i
      );
      
      // Apply any special effects based on item type
      let updatedStats = { ...state.user.stats };
      if (item.type === 'boost') {
        // Simple boost logic - could be expanded
        const statToBoost = item.name.toLowerCase().includes('intelligence') 
          ? 'intelligence' 
          : item.name.toLowerCase().includes('strength') 
            ? 'strength' 
            : 'willpower';
        
        updatedStats[statToBoost] = updatedStats[statToBoost] + 1;
      }
      
      return {
        shopItems: updatedItems,
        user: {
          ...state.user,
          gold: state.user.gold - item.cost,
          stats: updatedStats
        }
      };
    });
  },
  
  addShopItem: (name, description, cost, type) => {
    set((state: ShopSlice) => ({
      shopItems: [
        ...state.shopItems,
        {
          id: uuidv4(),
          name,
          description,
          cost,
          type,
          purchased: false
        }
      ]
    }));
  }
});
