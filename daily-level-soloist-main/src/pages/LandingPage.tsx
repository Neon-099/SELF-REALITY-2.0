import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Award, Shield, Star, Sword } from 'lucide-react';
import CharacterCreationDialog from '@/components/CharacterCreationDialog';

export default function Landing() {
  const [showCharacterCreation, setShowCharacterCreation] = useState(false);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-solo-dark to-gray-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-solo-primary to-solo-secondary bg-clip-text text-transparent animate-fade-in">
            Self Reality Leveling
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Transform your daily tasks into an epic journey of self-improvement. Level up your life, one quest at a time.
          </p>
          <Button size="lg" className="animate-pulse-glow" onClick={() => setShowCharacterCreation(true)}>
            Enter Your Journey <ArrowRight className="ml-2" />
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          <Card className="bg-solo-dark/50 border-gray-800">
            <CardContent className="pt-6">
              <div className="rounded-full w-12 h-12 bg-solo-primary/20 flex items-center justify-center mb-4">
                <Sword className="text-solo-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Daily Quests</h3>
              <p className="text-gray-400">Complete daily challenges to earn experience and gold.</p>
            </CardContent>
          </Card>

          <Card className="bg-solo-dark/50 border-gray-800">
            <CardContent className="pt-6">
              <div className="rounded-full w-12 h-12 bg-solo-primary/20 flex items-center justify-center mb-4">
                <Star className="text-solo-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Level System</h3>
              <p className="text-gray-400">Progress through ranks from F to SSS as you grow stronger.</p>
            </CardContent>
          </Card>

          <Card className="bg-solo-dark/50 border-gray-800">
            <CardContent className="pt-6">
              <div className="rounded-full w-12 h-12 bg-solo-primary/20 flex items-center justify-center mb-4">
                <Shield className="text-solo-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Weekly Missions</h3>
              <p className="text-gray-400">Take on challenging missions to test your abilities.</p>
            </CardContent>
          </Card>

          <Card className="bg-solo-dark/50 border-gray-800">
            <CardContent className="pt-6">
              <div className="rounded-full w-12 h-12 bg-solo-primary/20 flex items-center justify-center mb-4">
                <Award className="text-solo-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Achievements</h3>
              <p className="text-gray-400">Unlock rewards and titles as you accomplish goals.</p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center py-16 bg-solo-primary/10 rounded-lg border border-solo-primary/20">
          <h2 className="text-3xl font-bold mb-4">Ready to Begin Your Adventure?</h2>
          <p className="text-gray-300 mb-8">Your journey awaits.</p>
          <Button variant="secondary" size="lg" onClick={() => setShowCharacterCreation(true)}>
            Start your journey <ArrowRight className="ml-2" />
          </Button>
        </div>
      </div>
      
      {/* Character Creation Dialog */}
      <CharacterCreationDialog 
        open={showCharacterCreation} 
        onOpenChange={setShowCharacterCreation} 
      />
    </div>
  );
}