import { QuestSlice } from './slices/quest-slice';
import { TaskSlice } from './slices/task-slice';
import { MissionSlice } from './slices/mission-slice';
import { UserSlice } from './slices/user-slice';
import { ShopSlice } from './slices/shop-slice';
import { PunishmentSlice } from './slices/punishment-slice';

export interface StoreState extends 
  QuestSlice,
  TaskSlice,
  MissionSlice,
  UserSlice,
  ShopSlice,
  PunishmentSlice {} 