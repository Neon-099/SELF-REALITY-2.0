
import React from 'react';
import { useSoloLevelingStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ShoppingBag } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Shop = () => {
  const [shopItems, purchaseItem, gold] = useSoloLevelingStore(
    state => [state.shopItems, state.purchaseItem, state.user.gold]
  );

  const handlePurchase = (id: string, cost: number, name: string) => {
    if (gold < cost) {
      toast({
        title: "Insufficient funds",
        description: `You need ${cost - gold} more gold to purchase this item.`,
        variant: "destructive"
      });
      return;
    }
    
    purchaseItem(id);
    toast({
      title: "Item purchased",
      description: `You've successfully purchased ${name}!`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-solo-text">Shop</h1>
        <div className="px-4 py-2 bg-solo-dark border border-gray-800 rounded-md flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-yellow-400" />
          <span className="font-semibold">{gold} Gold</span>
        </div>
      </div>

      {shopItems.length === 0 ? (
        <div className="bg-solo-dark border border-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-400">No items available in the shop yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shopItems.map((item) => (
            <div 
              key={item.id} 
              className="bg-solo-dark border border-gray-800 rounded-lg p-4 hover:border-solo-primary/40 transition-all"
            >
              <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
              <p className="text-gray-400 mb-4">{item.description}</p>
              
              <div className="flex items-center justify-between">
                <span className="text-yellow-400 font-semibold">{item.cost} Gold</span>
                
                {item.purchased ? (
                  <span className="text-green-500 font-semibold">Purchased</span>
                ) : (
                  <Button 
                    onClick={() => handlePurchase(item.id, item.cost, item.name)}
                    disabled={gold < item.cost}
                    variant="outline"
                    size="sm"
                  >
                    Purchase
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Shop;
