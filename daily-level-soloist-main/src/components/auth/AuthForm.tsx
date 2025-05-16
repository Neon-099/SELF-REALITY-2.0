import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, AuthError } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { AtSign, Lock, User, Mail, ArrowRight } from 'lucide-react';

interface AuthFormProps {
  onComplete: () => void;
  isDialog?: boolean;
}

const AuthForm: React.FC<AuthFormProps> = ({ onComplete, isDialog = false }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
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
    } finally {
      setIsLoading(false);
    }
  };
  
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
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm">Username</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    <User size={16} />
                  </div>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    className="pl-10 bg-gray-900/50 border-gray-700"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Mail size={16} />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="pl-10 bg-gray-900/50 border-gray-700"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm">Password</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Lock size={16} />
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="pl-10 bg-gray-900/50 border-gray-700"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
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
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-50 border-t-transparent rounded-full"></span>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  {mode === 'login' ? 'Log In' : 'Create Account'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              )}
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