import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import AuthForm from './AuthForm';
import { auth } from '@/lib/auth';
import { useSoloLevelingStore } from '@/lib/store';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  onSkip?: () => void;
  characterName: string;
}

const AuthDialog: React.FC<AuthDialogProps> = ({ 
  open, 
  onOpenChange, 
  onComplete, 
  onSkip,
  characterName 
}) => {
  const [showForm, setShowForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const updateUser = useSoloLevelingStore(state => state.updateUser);
  
  const handleAuthComplete = async () => {
    setIsProcessing(true);
    try {
      // Get the currently authenticated user
      const currentUser = auth.getCurrentUser();
      
      if (currentUser) {
        // Update user record with authentication information
        await updateUser({
          authUserId: currentUser.uid,
          email: currentUser.email,
          username: currentUser.username || currentUser.email.split('@')[0]
        });
        
        console.log('Character data linked to authenticated user account:', currentUser.uid);
      }
      
      onComplete();
    } catch (error) {
      console.error('Error completing authentication flow:', error);
      // Still continue even if there was an error
      onComplete();
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleSkip = async () => {
    setIsProcessing(true);
    try {
      // Mark the character as using local storage only
      await updateUser({
        usingLocalStorageOnly: true,
        lastUpdated: new Date()
      });
      
      if (onSkip) {
        onSkip();
      } else {
        onComplete();
      }
    } catch (error) {
      console.error('Error handling skip auth:', error);
      // Continue anyway
      if (onSkip) {
        onSkip();
      } else {
        onComplete();
      }
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl md:text-2xl font-bold text-white">
            {showForm ? 'Save Your Progress' : 'Ready to Begin Your Journey?'}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-300 mt-2">
            {showForm 
              ? 'Create an account or log in to save your progress and continue your adventure from any device.'
              : `${characterName}, your journey awaits! Would you like to save your progress by creating an account?`
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {!showForm ? (
            <div className="space-y-4">
              <Button 
                className="w-full" 
                onClick={() => setShowForm(true)}
                disabled={isProcessing}
              >
                Create Account / Login
              </Button>
              
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-700"></div>
                <span className="flex-shrink mx-3 text-gray-500 text-sm">or</span>
                <div className="flex-grow border-t border-gray-700"></div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full text-gray-400 border-gray-700 hover:bg-gray-700/50"
                onClick={handleSkip}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Continue Without Account'}
              </Button>
              
              <p className="text-xs text-gray-500 text-center mt-2">
                Note: Without an account, your progress will only be saved on this device.
              </p>
            </div>
          ) : (
            <AuthForm 
              onComplete={handleAuthComplete} 
              isDialog={true}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog; 