import React, { useState, useEffect } from 'react';
import { Lock, Plus } from 'lucide-react';
import { useSoloLevelingStore } from '@/lib/store';
import { Rank, Mission, Difficulty } from '@/lib/types';
import { PredefinedMission } from '@/data/predefined-missions';
import RankMissionProgress from '@/components/missions/RankMissionProgress';
import RankBadgesTimeline from '@/components/missions/RankBadgesTimeline';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Utility function to convert Mission to PredefinedMission format
const convertMissionToPredefined = (mission: Mission): PredefinedMission => {
  return {
    ...mission,
    rank: (mission.rank || 'F') as Rank,
    day: mission.day || 1,
    releaseDate: mission.releaseDate || mission.createdAt || new Date()
  };
};

interface RankLevel {
  id: Rank;
  name: string;
  color: string;
  daysRequired: number;
  isLocked: boolean;
  missions: PredefinedMission[];
}

// Define all rank levels with their UI properties
const createRankLevels = (): RankLevel[] => [
  {
    id: 'F',
    name: 'F Rank',
    color: 'from-gray-400 to-gray-600',
    daysRequired: 12,
    isLocked: false,
    missions: []
  },
  {
    id: 'E',
    name: 'E Rank',
    color: 'from-orange-400 to-orange-600',
    daysRequired: 18,
    isLocked: false,
    missions: []
  },
  {
    id: 'D',
    name: 'D Rank',
    color: 'from-blue-400 to-blue-600',
    daysRequired: 30,
    isLocked: true,
    missions: []
  },
  {
    id: 'C',
    name: 'C Rank',
    color: 'from-green-400 to-green-600',
    daysRequired: 60,
    isLocked: true,
    missions: []
  },
  {
    id: 'B',
    name: 'B Rank',
    color: 'from-purple-400 to-purple-600',
    daysRequired: 90,
    isLocked: true,
    missions: []
  },
  {
    id: 'A',
    name: 'A Rank',
    color: 'from-red-400 to-red-600',
    daysRequired: 120,
    isLocked: true,
    missions: []
  },
  {
    id: 'S',
    name: 'S Rank',
    color: 'from-yellow-400 to-yellow-600',
    daysRequired: 150,
    isLocked: true,
    missions: []
  },
  {
    id: 'SS',
    name: 'SS Rank',
    color: 'from-emerald-400 to-emerald-600',
    daysRequired: 180,
    isLocked: true,
    missions: []
  },
  {
    id: 'SSS',
    name: 'SSS Rank',
    color: 'from-indigo-400 to-indigo-600',
    daysRequired: 200,
    isLocked: true,
    missions: []
  }
];

const Missions = () => {
  const [currentRankIndex, setCurrentRankIndex] = useState(0);
  const { user, missions, addMission, completeMission } = useSoloLevelingStore(state => ({
    user: state.user,
    missions: state.missions,
    addMission: state.addMission,
    completeMission: state.completeMission
  }));
  const [rankLevels, setRankLevels] = useState<RankLevel[]>(createRankLevels());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentMissions, setRecentMissions] = useState<PredefinedMission[]>([]);
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [newMission, setNewMission] = useState({
    title: '',
    description: '',
    day: 1,
    rank: 'F',
    difficulty: 'medium' as Difficulty
  });

  const handleNewMissionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setNewMission({ ...newMission, [e.target.name]: e.target.value });
  };

  const handleCreateMission = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use XP reward based on difficulty level
    const difficultyExpRewards = {
      'easy': 15,
      'medium': 30,
      'hard': 60,
      'boss': 100
    };
    
    const expReward = difficultyExpRewards[newMission.difficulty as keyof typeof difficultyExpRewards] || 30;
    
    // Validate day number against rank requirements
    const rankLevel = rankLevels.find(r => r.id === newMission.rank);
    if (rankLevel && Number(newMission.day) > rankLevel.daysRequired) {
      toast({ 
        title: 'Invalid Day', 
        description: `${newMission.rank} Rank only has ${rankLevel.daysRequired} days available.`,
        variant: 'destructive'
      });
      return;
    }
    
    // Use the updated addMission function that now accepts rank and day
    addMission(
      newMission.title,
      newMission.description,
      expReward,
      newMission.rank,
      Number(newMission.day)
    );
    
    setShowModal(false);
    setNewMission({ 
      title: '', 
      description: '', 
      day: 1, 
      rank: 'F', 
      difficulty: 'medium' 
    });
    
    toast({ 
      title: 'Mission Created', 
      description: `Mission added to ${newMission.rank} Rank - Day ${newMission.day}!` 
    });
  };

  useEffect(() => {
    const fetchMissions = async () => {
      if (!user?.rank) {
        console.log('No user rank available, skipping mission fetch');
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const rankOrder: Rank[] = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
        const userRankIndex = rankOrder.indexOf(user.rank);
        const missionsByRank: Record<Rank, PredefinedMission[]> = {} as Record<Rank, PredefinedMission[]>;
        
        // Include missions for all ranks, not just unlocked ones
        for (const rank of rankOrder) {
          // Include all missions for this rank, both active and completed
          const filteredMissions = missions
            .filter(m => m.rank === rank)
            .map(convertMissionToPredefined);
          
          missionsByRank[rank] = filteredMissions;
        }
        
        // Set recent missions to show most recently created ones
        const recentlyCreatedMissions = [...missions]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 3)
          .map(convertMissionToPredefined);
        
        setRecentMissions(recentlyCreatedMissions);
        
        const updatedRankLevels = rankLevels.map((rankLevel, index) => {
          const isLocked = index > userRankIndex;
          const rankMissions = missionsByRank[rankLevel.id] || [];
          return {
            ...rankLevel,
            isLocked,
            missions: rankMissions
          };
        });
        setRankLevels(updatedRankLevels);
      } catch (err) {
        setError('Failed to load missions. Please try again later.');
        toast({
          title: 'Error',
          description: 'Failed to load missions.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchMissions();
  }, [user?.rank, missions]);

  const handlePrevRank = () => {
    setCurrentRankIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextRank = () => {
    setCurrentRankIndex(prev => Math.min(rankLevels.length - 1, prev + 1));
  };

  const currentRank = rankLevels[currentRankIndex];

  // Helper function to safely render recent missions
  const renderRecentMissions = () => {
    if (!recentMissions || !Array.isArray(recentMissions) || recentMissions.length === 0) {
      return null;
    }

    const displayMissions = recentMissions.slice(0, 3);
    
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-primary mb-4">
          Recently Added Missions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayMissions.map(mission => (
            <div 
              key={mission.id}
              className="bg-card rounded-lg p-4 border border-border/50 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                  {mission.rank} Rank
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  {mission.expReward} EXP
                </span>
              </div>
              <h3 className="font-bold">{mission.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{mission.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6 space-y-8">
        <div className="space-y-8">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-solo-primary to-solo-secondary bg-clip-text text-transparent drop-shadow-glow mb-4 flex items-center gap-2">
            <Lock className="h-8 w-8 text-yellow-400 drop-shadow-glow" />
            Missions
          </h1>
          <div className="flex justify-between items-center">
            <Dialog open={showModal} onOpenChange={setShowModal}>
              <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
                <Plus className="w-5 h-5" /> New Mission
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Mission</DialogTitle>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleCreateMission}>
                  <div className="space-y-2">
                    <Label htmlFor="mission-title">Title</Label>
                    <Input
                      id="mission-title"
                      name="title"
                      placeholder="Title"
                      value={newMission.title}
                      onChange={handleNewMissionChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mission-description">Description</Label>
                    <Textarea
                      id="mission-description"
                      name="description"
                      placeholder="Description"
                      value={newMission.description}
                      onChange={handleNewMissionChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mission-day">Day</Label>
                    <Input
                      id="mission-day"
                      name="day"
                      type="number"
                      min="1"
                      placeholder="Day"
                      value={newMission.day}
                      onChange={handleNewMissionChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mission-difficulty">Difficulty</Label>
                    <Select name="difficulty" value={newMission.difficulty} onValueChange={val => setNewMission(n => ({ ...n, difficulty: val as Difficulty }))}>
                      <SelectTrigger id="mission-difficulty">
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy (15 XP)</SelectItem>
                        <SelectItem value="medium">Medium (30 XP)</SelectItem>
                        <SelectItem value="hard">Hard (60 XP)</SelectItem>
                        <SelectItem value="boss">Boss (100 XP)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mission-rank">Rank</Label>
                    <Select name="rank" value={newMission.rank} onValueChange={val => setNewMission(n => ({ ...n, rank: val }))}>
                      <SelectTrigger id="mission-rank">
                        <SelectValue placeholder="Select rank" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="F">F</SelectItem>
                        <SelectItem value="E">E</SelectItem>
                        <SelectItem value="D">D</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="S">S</SelectItem>
                        <SelectItem value="SS">SS</SelectItem>
                        <SelectItem value="SSS">SSS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          {/* Rank Navigation and Current Rank Section */}
          <div className="flex items-center justify-center mb-6">
            <h2 className={`text-3xl font-extrabold bg-gradient-to-r ${currentRank.color} bg-clip-text text-transparent drop-shadow-glow flex items-center gap-2`}>
              {currentRank.name}
            </h2>
          </div>
          {/* Rank Selection Timeline */}
          <div className="rounded-lg py-6 shadow-sm border border-border/30">
            <RankBadgesTimeline 
              rankBadges={rankLevels}
              currentRankIndex={currentRankIndex}
              onPrevRank={handlePrevRank}
              onNextRank={handleNextRank}
            />
          </div>
          {/* Recently Added Missions Section */}
          {renderRecentMissions()}
          {/* Mission section title */}
          <div className="mt-8 mb-4">
            <h2 className="text-2xl font-bold text-primary">
              {currentRank.name} Missions
            </h2>
          </div>
          {/* Missions View */}
          <div className="rounded-lg p-6 shadow-md border border-border/30">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="text-center p-8 text-destructive">
                <p>{error}</p>
                <button 
                  className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            ) : currentRank.isLocked ? (
              <div className="text-center p-8">
                <Lock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-400 mb-4">
                  Complete the previous rank missions to unlock {currentRank.name} missions.
                </p>
                <div className="opacity-50">
                  <RankMissionProgress 
                    key={currentRank.id}
                    missions={currentRank.missions} 
                    rankName={currentRank.name} 
                    totalDays={currentRank.daysRequired}
                    rank={currentRank.id}
                    isLocked={true}
                  />
                </div>
              </div>
            ) : currentRank.missions.length === 0 ? (
              <div className="text-center p-8">
                <p className="text-muted-foreground">
                  No missions available for {currentRank.name} yet.
                </p>
              </div>
            ) : (
              <RankMissionProgress 
                key={currentRank.id}
                missions={currentRank.missions} 
                rankName={currentRank.name} 
                totalDays={currentRank.daysRequired}
                rank={currentRank.id}
                isLocked={false}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Missions;