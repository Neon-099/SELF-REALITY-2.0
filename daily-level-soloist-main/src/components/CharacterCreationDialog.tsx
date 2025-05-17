import React, { useState, useEffect } from 'react';
import { useSoloLevelingStore } from '@/lib/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Stat } from '@/lib/types';
import { Brain, Dumbbell, MessagesSquare, HeartPulse, Target, BookOpen, Clock } from 'lucide-react';
import AuthDialog from './auth/AuthDialog';
import { MongoDBService } from '@/lib/services/mongodb-service';
import { auth } from '@/lib/auth';

type Category = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  relatedStat: Stat;
  questions: string[];
};

// Character assessment categories and questions
const categories: Category[] = [
  {
    id: 'mental',
    title: 'Mental Clarity',
    description: 'Focus, stress handling, decision-making',
    icon: <Brain className="h-5 w-5 text-blue-400" />,
    relatedStat: 'cognitive',
    questions: [
      'I can stay focused for long periods without getting distracted.',
      'I find it easy to clear my mind and concentrate when needed.',
      'I rarely feel mentally foggy or overwhelmed.',
    ]
  },
  {
    id: 'discipline',
    title: 'Discipline',
    description: 'Willpower, habits, self-control',
    icon: <Dumbbell className="h-5 w-5 text-red-400" />,
    relatedStat: 'physical',
    questions: [
      'I stick to habits even when I don\'t feel motivated.',
      'I can delay short-term pleasures for long-term goals.',
      'I follow through on plans I make.',
    ]
  },
  {
    id: 'social',
    title: 'Social Intelligence',
    description: 'Empathy, listening, expressing',
    icon: <MessagesSquare className="h-5 w-5 text-green-400" />,
    relatedStat: 'social',
    questions: [
      'I can sense how others are feeling even when they don\'t say it.',
      'I listen actively and make people feel heard.',
      'I know how to express myself clearly in conversations.',
    ]
  },
  {
    id: 'emotional',
    title: 'Emotional Resilience',
    description: 'Handling stress, setbacks, and negative emotions',
    icon: <HeartPulse className="h-5 w-5 text-pink-400" />,
    relatedStat: 'emotional',
    questions: [
      'I bounce back quickly after failure or disappointment.',
      'I don\'t let negative emotions control my actions.',
      'I can stay calm even during chaos or arguments.',
    ]
  },
  {
    id: 'goal',
    title: 'Goal Orientation',
    description: 'Motivation, planning, execution',
    icon: <Target className="h-5 w-5 text-yellow-400" />,
    relatedStat: 'physical',
    questions: [
      'I set clear goals and work toward them regularly.',
      'I know what I want to achieve in the next 6–12 months.',
      'I break large goals into smaller, manageable steps.',
    ]
  },
  {
    id: 'knowledge',
    title: 'Knowledge Growth',
    description: 'Curiosity, learning capacity, reading habits',
    icon: <BookOpen className="h-5 w-5 text-purple-400" />,
    relatedStat: 'cognitive',
    questions: [
      'I enjoy learning new skills or topics regularly.',
      'I read, watch, or listen to educational content often.',
      'I seek feedback to improve myself.',
    ]
  },
  {
    id: 'time',
    title: 'Time Management',
    description: 'Productivity, scheduling, priorities',
    icon: <Clock className="h-5 w-5 text-cyan-400" />,
    relatedStat: 'spiritual',
    questions: [
      'I usually finish my tasks on time.',
      'I plan my days or weeks in advance.',
      'I minimize time spent on unimportant things.',
    ]
  }
];

interface CharacterCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;  // Optional callback for when character creation is complete
}

const CharacterCreationDialog: React.FC<CharacterCreationDialogProps> = ({
  open,
  onOpenChange,
  onComplete
}) => {
  const [name, setName] = useState("");
  const [step, setStep] = useState<'name' | 'survey' | 'summary'>('name');
  const [currentCategory, setCurrentCategory] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [results, setResults] = useState<Record<string, number>>({});
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get the store functions
  const { user, increaseStatFree, updateUserName, updateUser } = useSoloLevelingStore();
  const dbService = MongoDBService.getInstance();
  
  // Initialize answers structure
  useEffect(() => {
    const initialAnswers: Record<string, number[]> = {};
    categories.forEach(category => {
      initialAnswers[category.id] = Array(category.questions.length).fill(0);
    });
    setAnswers(initialAnswers);
  }, []);
  
  // Handle answer selection (1-5 scale)
  const handleSelectAnswer = (value: number) => {
    const category = categories[currentCategory];
    const newAnswers = { ...answers };
    newAnswers[category.id][currentQuestion] = value;
    setAnswers(newAnswers);
  };
  
  // Handle navigation to next question
  const handleNext = () => {
    const category = categories[currentCategory];
    
    if (currentQuestion < category.questions.length - 1) {
      // Next question in current category
      setCurrentQuestion(currentQuestion + 1);
    } else if (currentCategory < categories.length - 1) {
      // Next category
      setCurrentCategory(currentCategory + 1);
      setCurrentQuestion(0);
    } else {
      // End of survey
      calculateResults();
      setStep('summary');
    }
  };
  
  // Handle navigation to previous question
  const handlePrevious = () => {
    if (currentQuestion > 0) {
      // Previous question in current category
      setCurrentQuestion(currentQuestion - 1);
    } else if (currentCategory > 0) {
      // Previous category
      setCurrentCategory(currentCategory - 1);
      setCurrentQuestion(categories[currentCategory - 1].questions.length - 1);
    } else {
      // Back to name input
      setStep('name');
    }
  };
  
  // Calculate results from all answers
  const calculateResults = () => {
    const categoryResults: Record<string, number> = {};
    
    // Calculate average score for each category
    categories.forEach(category => {
      const categoryAnswers = answers[category.id];
      const sum = categoryAnswers.reduce((acc, val) => acc + val, 0);
      const average = sum / categoryAnswers.length;
      categoryResults[category.id] = parseFloat(average.toFixed(1));
    });
    
    setResults(categoryResults);
  };
  
  // Map results to stat bonuses
  const calculateStatBonuses = () => {
    const statBonuses: Record<Stat, number> = {
      physical: 0,
      cognitive: 0,
      emotional: 0,
      spiritual: 0,
      social: 0
    };
    
    // Convert category results to stat bonuses
    categories.forEach(category => {
      const score = results[category.id] || 0;
      const statBonus = Math.round(score / 2); // Convert 0-5 score to 0-3 bonus
      statBonuses[category.relatedStat] += statBonus;
    });
    
    return statBonuses;
  };
  
  // Get recommended class based on highest stats
  const getRecommendedClass = () => {
    const statBonuses = calculateStatBonuses();
    const highestStat = Object.entries(statBonuses).reduce(
      (highest, [stat, value]) => value > highest.value ? { stat, value } : highest,
      { stat: 'physical', value: 0 }
    );
    
    // Map stat to class
    switch (highestStat.stat) {
      case 'physical': return 'Warrior';
      case 'cognitive': return 'Mage';
      case 'emotional': return 'Bard';
      case 'spiritual': return 'Cleric';
      case 'social': return 'Ranger';
      default: return 'Adventurer';
    }
  };
  
  // Get strengths and weaknesses
  const getStrengthsAndWeaknesses = () => {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    Object.entries(results).forEach(([categoryId, score]) => {
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        if (score >= 4) {
          strengths.push(category.title);
        } else if (score <= 2) {
          weaknesses.push(category.title);
        }
      }
    });
    
    return { strengths, weaknesses };
  };
  
  // Complete character creation
  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // Update the user's name
      updateUserName(name);
      
      // Apply stat bonuses based on results
      const statBonuses = calculateStatBonuses();
      
      // Prepare full user data with survey results for MongoDB storage
      const characterData = {
        name,
        characterClass: getRecommendedClass(),
        surveyResults: results,
        surveyAnswers: answers,
        strengths: getStrengthsAndWeaknesses().strengths,
        weaknesses: getStrengthsAndWeaknesses().weaknesses,
        completedCharacterCreation: true,
        lastUpdated: new Date()
      };
      
      // Update user state with all character data
      await updateUser(characterData);
      
      // Update stats with calculated bonuses
      Object.entries(statBonuses).forEach(([stat, bonus]) => {
        if (bonus > 0) {
          // Only apply bonuses for stats with non-zero values
          increaseStatFree(stat as Stat, bonus);
        }
      });
      
      // Show auth dialog to save progress to account
      setShowAuthDialog(true);
    } catch (error) {
      console.error('Error saving character data:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle auth completion - now connects character data to authenticated user
  const handleAuthComplete = async () => {
    try {
      // Get current authenticated user
      const currentUser = auth.getCurrentUser();
      
      if (currentUser) {
        // Link the character data with the authenticated user ID
        await updateUser({
          authUserId: currentUser.uid,
          email: currentUser.email
        } as any); // Use type assertion to avoid type issues
        
        console.log('Character data linked to authenticated user:', currentUser.uid);
      }
      
      // Close dialogs and navigate to home using callback
      setShowAuthDialog(false);
      onOpenChange(false);
      
      // Use the onComplete callback if provided, otherwise redirect manually
      if (onComplete) {
        onComplete();
      } else {
        // Fallback for direct navigation when not in a Router context
        window.location.href = '/home';
      }
    } catch (error) {
      console.error('Error linking character to authenticated user:', error);
      // Still navigate to home even if there's an error
      setShowAuthDialog(false);
      onOpenChange(false);
      
      if (onComplete) {
        onComplete();
      } else {
        window.location.href = '/home';
      }
    }
  };
  
  // Handle skipping auth - still save the character data but not linked to auth
  const handleSkipAuth = () => {
    // Close dialogs and navigate to home
    setShowAuthDialog(false);
    onOpenChange(false);
    
    // Use the onComplete callback if provided, otherwise redirect manually
    if (onComplete) {
      onComplete();
    } else {
      window.location.href = '/home';
    }
  };
  
  // Get the total number of questions
  const totalQuestions = categories.reduce((total, category) => total + category.questions.length, 0);
  
  // Calculate current question number
  const getCurrentQuestionNumber = () => {
    let questionNumber = 0;
    
    for (let i = 0; i < currentCategory; i++) {
      questionNumber += categories[i].questions.length;
    }
    
    return questionNumber + currentQuestion + 1;
  };
  
  return (
    <>
      <Dialog open={open && !showAuthDialog} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl md:text-2xl font-bold text-white">
              DISCOVER YOUR INNER HERO
            </DialogTitle>
            <DialogDescription className="text-center text-gray-300 mt-2">
              Before you begin your quest, you must know your strengths and face your weaknesses. Answer these questions to shape your path and awaken your true potential.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {step === 'name' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">What is your name, hero?</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="bg-gray-800/50 border-gray-700"
                  />
                </div>
                <Button 
                  className="w-full mt-4" 
                  onClick={() => setStep('survey')}
                  disabled={!name.trim()}
                >
                  Continue
                </Button>
              </div>
            )}
            
            {step === 'survey' && (
              <div className="space-y-4">
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <div className="flex items-center gap-2">
                      {categories[currentCategory].icon}
                      <span>{categories[currentCategory].title}</span>
                    </div>
                    <span>Question {getCurrentQuestionNumber()} of {totalQuestions}</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{categories[currentCategory].description}</p>
                  <div className="w-full bg-gray-800 h-2 rounded-full">
                    <div 
                      className="bg-solo-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(getCurrentQuestionNumber() / totalQuestions) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <h3 className="text-lg font-medium mb-4">{categories[currentCategory].questions[currentQuestion]}</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Strongly Disagree</span>
                    <span>Strongly Agree</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Button
                        key={value}
                        variant={answers[categories[currentCategory].id][currentQuestion] === value ? "default" : "outline"}
                        className={`flex-1 h-12 ${answers[categories[currentCategory].id][currentQuestion] === value ? "bg-solo-primary" : "bg-gray-800/30"}`}
                        onClick={() => handleSelectAnswer(value)}
                      >
                        {value}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={handlePrevious}>
                    Back
                  </Button>
                  <Button 
                    onClick={handleNext}
                    disabled={answers[categories[currentCategory].id][currentQuestion] === 0}
                  >
                    {getCurrentQuestionNumber() < totalQuestions ? 'Next' : 'Complete'}
                  </Button>
                </div>
              </div>
            )}
            
            {step === 'summary' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium mb-4">Your Character Profile</h3>
                
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 space-y-4">
                  <div className="space-y-1">
                    <p className="text-lg font-bold">{name}</p>
                    <p className="text-sm text-gray-300">Level 1 {getRecommendedClass()}</p>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Your Attribute Scores:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((category) => (
                        <div key={category.id} className="flex items-center justify-between bg-gray-900/50 rounded p-2">
                          <div className="flex items-center gap-2">
                            {category.icon}
                            <span className="text-sm">{category.title}</span>
                          </div>
                          <span className={`text-sm font-medium ${results[category.id] >= 4 ? 'text-green-400' : results[category.id] <= 2 ? 'text-red-400' : 'text-gray-300'}`}>
                            {results[category.id]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-green-400">Strengths:</h4>
                      <p className="text-sm text-gray-300">
                        {getStrengthsAndWeaknesses().strengths.length > 0 
                          ? getStrengthsAndWeaknesses().strengths.join(', ')
                          : 'Well-balanced across all attributes'}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-red-400">Areas for Growth:</h4>
                      <p className="text-sm text-gray-300">
                        {getStrengthsAndWeaknesses().weaknesses.length > 0 
                          ? getStrengthsAndWeaknesses().weaknesses.join(', ')
                          : 'No significant weaknesses detected'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-700">
                    <h4 className="text-sm font-medium mb-2">Stat Bonuses:</h4>
                    <div className="grid grid-cols-3 gap-y-2 gap-x-4">
                      {Object.entries(calculateStatBonuses()).map(([stat, bonus]) => (
                        <div key={stat} className="flex justify-between">
                          <span className="text-xs capitalize">{stat}</span>
                          <span className={`text-xs ${bonus > 0 ? "text-solo-primary" : "text-gray-500"}`}>
                            {bonus > 0 ? `+${bonus}` : '0'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <Button 
                  className="w-full mt-4" 
                  onClick={handleComplete} 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Begin Your Journey'}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Auth Dialog */}
      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onComplete={handleAuthComplete}
        onSkip={handleSkipAuth}
        characterName={name}
      />
    </>
  );
};

export default CharacterCreationDialog; 