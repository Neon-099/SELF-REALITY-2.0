import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSoloLevelingStore } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { User, Sword } from 'lucide-react';

interface CharacterNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CharacterNameDialog({ open, onOpenChange }: CharacterNameDialogProps) {
  const [characterName, setCharacterName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const setUserName = useSoloLevelingStore(state => state.setUserName);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = characterName.trim();
    
    if (!trimmedName) {
      toast({
        title: "Invalid Name",
        description: "Please enter a valid character name.",
        variant: "destructive"
      });
      return;
    }

    if (trimmedName.length < 2) {
      toast({
        title: "Name Too Short",
        description: "Character name must be at least 2 characters long.",
        variant: "destructive"
      });
      return;
    }

    if (trimmedName.length > 20) {
      toast({
        title: "Name Too Long",
        description: "Character name must be 20 characters or less.",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    
    try {
      // Update the user name in the store
      setUserName(trimmedName);
      
      toast({
        title: "Welcome, Hunter!",
        description: `Your journey begins now, ${trimmedName}!`,
        variant: "default"
      });

      // Close the dialog
      onOpenChange(false);
      
      // Navigate to home page
      navigate('/home');
    } catch (error) {
      console.error("Error creating character:", error);
      toast({
        title: "Error",
        description: "Failed to create character. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only letters, numbers, spaces, and basic punctuation
    const sanitizedValue = value.replace(/[^a-zA-Z0-9\s\-_]/g, '');
    setCharacterName(sanitizedValue);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-md p-6 bg-solo-dark border-gray-800 rounded-xl">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-solo-primary to-solo-secondary rounded-full flex items-center justify-center">
            <Sword className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-solo-primary to-solo-secondary bg-clip-text text-transparent">
            Create Your Hunter
          </DialogTitle>
          <p className="text-gray-400 text-sm">
            Choose a name for your character to begin your leveling journey
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label htmlFor="character-name" className="text-white/80 font-medium flex items-center gap-2">
              <User className="w-4 h-4" />
              Hunter Name
            </Label>
            <Input
              id="character-name"
              type="text"
              value={characterName}
              onChange={handleInputChange}
              placeholder="Enter your hunter name"
              className="border-gray-700 bg-gray-800/50 focus:border-solo-primary/50 focus:ring-1 focus:ring-solo-primary/30 transition-all text-white placeholder:text-gray-500"
              maxLength={20}
              autoFocus
              disabled={isCreating}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>2-20 characters</span>
              <span>{characterName.length}/20</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-solo-primary to-solo-secondary hover:from-solo-primary/90 hover:to-solo-secondary/90 text-white font-medium"
              disabled={isCreating || !characterName.trim() || characterName.trim().length < 2}
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Start Journey'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
