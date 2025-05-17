import { Document } from 'mongoose';

export interface UserStats {
  strength: number;
  intelligence: number;
  vitality: number;
  charisma: number;
}

export interface MongoUser extends Document {
  username: string;
  level: number;
  exp: number;
  stats: UserStats;
  createdAt: Date;
  updatedAt: Date;
}

export interface MongoQuest extends Document {
  title: string;
  description: string;
  expReward: number;
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
}

export interface MongoMission extends Document {
  title: string;
  description: string;
  expReward: number;
  rank: string;
  day: number;
  releaseDate: Date;
  createdAt: Date;
}

export interface MongoShopItem {
  _id?: string;
  id: string;
  name: string;
  description: string;
  cost: number;
  type: string;
  effect: any;
  owned: boolean;
  quantity: number;
} 