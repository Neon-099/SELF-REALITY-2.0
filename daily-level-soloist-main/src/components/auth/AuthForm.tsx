import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, AuthError } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { AtSign, Lock, User, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface AuthFormProps {
  onComplete: () => void;
  isDialog?: boolean;
  isProcessing?: boolean;
  setIsProcessing?: (isProcessing: boolean) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ 
  onComplete, 
  isDialog = false,
  isProcessing = false,
  setIsProcessing
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Use the parent's loading state management if provided
    const setLoadingState = (state: boolean) => {
      setIsLoading(state);
      if (setIsProcessing) setIsProcessing(state);
    };
    
    setLoadingState(true);
    
    try {
      if (mode === 'signup') {
        await auth.signUp(email, password, username);
        toast({
          title: "Account created!",
          description: "Your account has been successfully created.",
        });
      } else {
        await auth.signIn(email, password);
        toast({
          title: "Welcome back!",
          description: "You have been successfully logged in.",
        });
      }
      
      // Call the onComplete callback to proceed
      onComplete();
      
    } catch (err) {
      const authError = err as AuthError;
      setError(authError.message || 'An error occurred. Please try again.');
      
      toast({
        title: "Authentication error",
        description: authError.message || 'An error occurred. Please try again.',
        variant: "destructive"
      });
      
      // Reset loading state on error
      setLoadingState(false);
    }
  };
  
  // Determine if the form is loading
  const formIsLoading = isLoading || isProcessing;
  
  return (
    <Card className={`w-full ${!isDialog ? 'max-w-md mx-auto' : ''} bg-gray-800/50 border-gray-700`}>
      <CardHeader>
        <CardTitle className="text-xl text-center">{mode === 'login' ? 'Log In' : 'Create Account'}</CardTitle>
        <CardDescription className="text-center">
          {mode === 'login' 
            ? 'Enter your email and password to access your account' 
            : 'Sign up to save your progress and access from any device'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={mode} onValueChange={(value) => setMode(value as 'login' | 'signup')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Log In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-start">
                <div className="space-x-2 bg-gray-800/50 rounded-lg p-0.5">
                  <Button
                    type="button"
                    variant={mode === 'login' ? "default" : "ghost"}
                    onClick={() => setMode('login')}
                    className={`${mode === 'login' ? 'bg-solo-primary' : 'text-gray-400'} px-4 py-1`}
                    size="sm"
                    disabled={formIsLoading}
                  >
                    Login
                  </Button>
                  <Button
                    type="button"
                    variant={mode === 'signup' ? "default" : "ghost"}
                    onClick={() => setMode('signup')}
                    className={`${mode === 'signup' ? 'bg-solo-primary' : 'text-gray-400'} px-4 py-1`}
                    size="sm"
                    disabled={formIsLoading}
                  >
                    Sign Up
                  </Button>
                </div>
              </div>
            </div>
            
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="bg-gray-800/50 border-gray-700"
                  disabled={formIsLoading}
                  required
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="bg-gray-800/50 border-gray-700"
                disabled={formIsLoading}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="bg-gray-800/50 border-gray-700 pr-10"
                  disabled={formIsLoading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={formIsLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            {error && (
              <div className="text-sm text-red-500 p-2 bg-red-500/10 rounded border border-red-500/20">
                {error}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full mt-6"
              disabled={formIsLoading}
            >
              {formIsLoading 
                ? 'Processing...' 
                : mode === 'login' 
                  ? 'Login' 
                  : 'Create Account'
              }
            </Button>
          </form>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-center border-t border-gray-700 pt-4">
        <p className="text-sm text-gray-400">
          {mode === 'login' 
            ? "Don't have an account? Switch to Sign Up" 
            : "Already have an account? Switch to Log In"}
        </p>
      </CardFooter>
    </Card>
  );
};

export default AuthForm; 