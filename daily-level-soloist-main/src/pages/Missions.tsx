import React, { useState, useEffect } from 'react';
import { Lock, Plus, Star } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';

// Utility function to convert Mission to PredefinedMission format
const convertMissionToPredefined = (mission: Mission): PredefinedMission => {
  return {
    ...mission,
    rank: (mission.rank || 'F') as Rank,
    day: mission.day || 1,
    releaseDate: mission.releaseDate || mission.createdAt || new Date(),
    difficulty: mission.difficulty || 'normal'
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
    rank: 'F' as Rank,
    difficulty: 'normal' as Difficulty,
    expReward: '30', // Default XP value
    count: 1, // Default task count
    taskNames: [''] // Default task names
  });

  const handleNewMissionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'count') {
      const count = parseInt(value) || 1;
      // Update task names array length based on new count
      const taskNames = [...newMission.taskNames];
      
      // If increasing count, add empty task names
      if (count > taskNames.length) {
        while (taskNames.length < count) {
          taskNames.push(`Task ${taskNames.length + 1}`);
        }
      } 
      // If decreasing count, truncate the array
      else if (count < taskNames.length) {
        taskNames.length = count;
      }
      
      setNewMission(prev => ({ ...prev, count, taskNames }));
    } else {
      setNewMission(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleTaskNameChange = (index: number, value: string) => {
    const taskNames = [...newMission.taskNames];
    taskNames[index] = value;
    setNewMission(prev => ({ ...prev, taskNames }));
  };

  const handleCreateMission = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get XP reward from input
    const expReward = parseInt(newMission.expReward) || 30; // Default to 30 if invalid
    
    // Get task count
    const count = parseInt(String(newMission.count)) || 1; // Default to 1 if invalid
    
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
    
    // Clean up task names - replace empty strings with default names
    const taskNames = newMission.taskNames
      .map((name, index) => name.trim() || `Task ${index + 1}`);
    
    // Use the updated addMission function that now accepts taskNames
    addMission(
      newMission.title,
      newMission.description,
      expReward,
      newMission.rank as Rank,
      Number(newMission.day),
      newMission.difficulty === 'boss' ? 'boss' : 'normal',
      count,
      taskNames
    );
    
    setShowModal(false);
    setNewMission({ 
      title: '', 
      description: '', 
      day: 1, 
      rank: 'F', 
      difficulty: 'normal', 
      expReward: '30',
      count: 1,
      taskNames: ['']
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

  const handleSelectRank = (index: number) => {
    console.log(`Missions: Setting current rank index to ${index}`);
    if (index >= 0 && index < rankLevels.length) {
      setCurrentRankIndex(index);
    }
  };

  const currentRank = rankLevels[currentRankIndex];

  // Helper function to safely render recent missions
  const renderRecentMissions = () => {
    if (!recentMissions || !Array.isArray(recentMissions) || recentMissions.length === 0) {
      return null;
    }

    const displayMissions = recentMissions.slice(0, 3);
    
    // Helper to get rank color classes
    const getRankColor = (rank: Rank) => {
      switch (rank) {
        case 'F': return 'from-gray-400 to-gray-600 border-gray-400';
        case 'E': return 'from-orange-400 to-orange-600 border-orange-400';
        case 'D': return 'from-blue-400 to-blue-600 border-blue-400';
        case 'C': return 'from-green-400 to-green-600 border-green-400';
        case 'B': return 'from-purple-400 to-purple-600 border-purple-400';
        case 'A': return 'from-red-400 to-red-600 border-red-400';
        case 'S': return 'from-yellow-400 to-yellow-600 border-yellow-400';
        case 'SS': return 'from-emerald-400 to-emerald-600 border-emerald-400';
        case 'SSS': return 'from-indigo-400 to-indigo-600 border-indigo-400';
        default: return 'from-gray-400 to-gray-600 border-gray-400';
      }
    };
    
    // Helper to get solid rank colors
    const getRankSolidColor = (rank: Rank) => {
      switch (rank) {
        case 'F': return 'bg-gray-500';
        case 'E': return 'bg-orange-500';
        case 'D': return 'bg-blue-500';
        case 'C': return 'bg-green-500';
        case 'B': return 'bg-purple-500';
        case 'A': return 'bg-red-500';
        case 'S': return 'bg-yellow-500';
        case 'SS': return 'bg-emerald-500';
        case 'SSS': return 'bg-indigo-500';
        default: return 'bg-gray-500';
      }
    };
    
    // Helper to get badge rank colors
    const getRankBadgeColor = (rank: Rank) => {
      switch (rank) {
        case 'F': return 'border-gray-400 text-gray-500';
        case 'E': return 'border-orange-400 text-orange-500';
        case 'D': return 'border-blue-400 text-blue-500';
        case 'C': return 'border-green-400 text-green-500';
        case 'B': return 'border-purple-400 text-purple-500';
        case 'A': return 'border-red-400 text-red-500';
        case 'S': return 'border-yellow-400 text-yellow-500';
        case 'SS': return 'border-emerald-400 text-emerald-500';
        case 'SSS': return 'border-indigo-400 text-indigo-500';
        default: return 'border-gray-400 text-gray-500';
      }
    };
    
    return (
      <div className="mt-12 border-t border-border pt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-primary">
            Recently Added Missions
          </h2>
          <Badge variant="outline" className="px-3 py-1">
            Last {displayMissions.length} added
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayMissions.map(mission => {
            const rankGradient = getRankColor(mission.rank);
            const rankSolid = getRankSolidColor(mission.rank);
            const rankBadge = getRankBadgeColor(mission.rank);
            const rankLocked = rankLevels.find(r => r.id === mission.rank)?.isLocked || false;
            
            return (
              <div 
                key={mission.id}
                className="bg-card rounded-xl overflow-hidden border-2 border-border/50 hover:shadow-md transition-shadow relative"
              >
                {/* Rank indicator strip */}
                <div className={`absolute top-0 left-0 w-2 h-full ${rankSolid}`}></div>
                
                <div className={`p-4 border-b bg-gradient-to-br from-${mission.rank.toLowerCase()}-400/5 to-${mission.rank.toLowerCase()}-600/10`}>
                  <div className="flex justify-between items-center mb-3">
                    <Badge className={`px-2 py-1 ${rankBadge} bg-transparent font-semibold`}>
                      {mission.rank} Rank
                    </Badge>
                    <Badge className="flex items-center gap-1 bg-transparent border-amber-500 text-amber-500 py-1 px-2">
                      <Star className="h-3 w-3 fill-amber-500" />
                      +{mission.expReward} EXP
                    </Badge>
                  </div>
                  
                  <h3 className={`font-bold text-lg bg-gradient-to-r ${rankGradient} bg-clip-text text-transparent`}>
                    {mission.title}
                  </h3>
                  
                  {rankLocked && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-gray-400 border-gray-400 flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Locked
                      </Badge>
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">{mission.description}</p>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Added {new Date(mission.releaseDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}
          )}
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
              <DialogContent variant="compact">
                <DialogHeader>
                  <DialogTitle>Create New Mission</DialogTitle>
                </DialogHeader>
                <form className="space-y-3" onSubmit={handleCreateMission}>
                  <div className="space-y-1">
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
                  <div className="space-y-1">
                    <Label htmlFor="mission-description">Description</Label>
                    <Textarea
                      id="mission-description"
                      name="description"
                      placeholder="Description"
                      value={newMission.description}
                      onChange={handleNewMissionChange}
                      required
                      className="h-20"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
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
                    <div className="space-y-1">
                      <Label htmlFor="mission-exp">XP Reward</Label>
                      <Input
                        id="mission-exp"
                        name="expReward"
                        type="number"
                        min="1"
                        placeholder="Enter XP amount"
                        value={newMission.expReward}
                        onChange={handleNewMissionChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="mission-count">Task Count</Label>
                      <Input
                        id="mission-count"
                        name="count"
                        type="number"
                        min="1"
                        max="100"
                        placeholder="Number of tasks"
                        value={newMission.count}
                        onChange={handleNewMissionChange}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="mission-difficulty">Difficulty</Label>
                      <Select name="difficulty" value={newMission.difficulty} onValueChange={val => setNewMission(n => ({ ...n, difficulty: val as Difficulty }))}>
                        <SelectTrigger id="mission-difficulty">
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="boss">Boss</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="mission-rank">Rank</Label>
                    <Select name="rank" value={newMission.rank} onValueChange={val => setNewMission(n => ({ ...n, rank: val as Rank }))}>
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
                  
                  {/* Task Names */}
                  {parseInt(String(newMission.count)) > 1 && (
                    <div className="space-y-2">
                      <Label>Task Names</Label>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                        {newMission.taskNames.map((taskName, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              placeholder={`Task ${index + 1}`}
                              value={taskName}
                              onChange={(e) => handleTaskNameChange(index, e.target.value)}
                              className="flex-1"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <DialogFooter className="pt-2">
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
              onSelectRank={handleSelectRank}
            />
          </div>
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
          
          {/* Recently Added Missions Section */}
          {renderRecentMissions()}
        </div>
      </div>
    </div>
  );
};

export default Missions;