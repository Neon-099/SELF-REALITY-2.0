import React, { useState } from 'react';
import { useSoloLevelingStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const Shop = () => {
  const [shopItems, purchaseItem, gold, addShopItem] = useSoloLevelingStore(
    state => [state.shopItems, state.purchaseItem, state.user.gold, state.addShopItem]
  );
  
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    cost: 0,
    type: 'reward' as 'reward' | 'boost' | 'cosmetic'
  });
  
  const [isOpen, setIsOpen] = useState(false);
  
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
  
  const handleAddItem = () => {
    if (!newItem.name || !newItem.description || newItem.cost <= 0) {
      toast({
        title: "Invalid item details",
        description: "Please fill out all fields correctly.",
        variant: "destructive"
      });
      return;
    }
    
    addShopItem(newItem.name, newItem.description, newItem.cost, newItem.type);
    
    toast({
      title: "Item added",
      description: `${newItem.name} has been added to the shop.`,
    });
    
    // Reset form and close dialog
    setNewItem({
      name: '',
      description: '',
      cost: 0,
      type: 'reward'
    });
    setIsOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-solo-text">Shop</h1>
          <div className="px-4 py-2 bg-solo-dark border border-gray-800 rounded-md flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-yellow-400" />
            <span className="font-semibold">{gold} Gold</span>
          </div>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Shop Item</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Item Name</Label>
                <Input 
                  id="name" 
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cost">Cost (Gold)</Label>
                <Input 
                  id="cost" 
                  type="number" 
                  min="1"
                  value={newItem.cost || ''}
                  onChange={(e) => setNewItem({...newItem, cost: Number(e.target.value)})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Item Type</Label>
                <Select 
                  value={newItem.type}
                  onValueChange={(value: 'reward' | 'boost' | 'cosmetic') => 
                    setNewItem({...newItem, type: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select item type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reward">Reward</SelectItem>
                    <SelectItem value="boost">Stat Boost</SelectItem>
                    <SelectItem value="cosmetic">Cosmetic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button onClick={handleAddItem}>Add Item</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
