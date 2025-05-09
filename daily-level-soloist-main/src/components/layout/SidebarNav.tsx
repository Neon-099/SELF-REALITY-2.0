import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSoloLevelingStore } from '@/lib/store';
import { 
  UserIcon, 
  CalendarIcon, 
  ClockIcon, 
  ListIcon, 
  BookIcon, 
  ShoppingCartIcon, 
  LayersIcon,
  HomeIcon
} from 'lucide-react';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NavItem = ({ to, icon, label }: NavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link 
      to={to} 
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md transition-all",
        "hover:bg-solo-dark hover:text-solo-primary",
        isActive 
          ? "bg-solo-dark text-solo-primary glow-text" 
          : "text-gray-400"
      )}
    >
      <div className="w-5 h-5">{icon}</div>
      <span className="font-medium">{label}</span>
    </Link>
  );
};

export function SidebarNav() {
  const user = useSoloLevelingStore(state => state.user);
  
  const navItems = [
    { to: "/character", icon: <UserIcon size={20} />, label: "Character" },
    { to: "/home", icon: <HomeIcon size={20} />, label: "Home" },
    { to: "/planner", icon: <CalendarIcon size={20} />, label: "Weekly Planner" },
    { to: "/milestones", icon: <ClockIcon size={20} />, label: "Milestones" },
    { to: "/quests", icon: <BookIcon size={20} />, label: "Quests" },
    { to: "/missions", icon: <ListIcon size={20} />, label: "Missions" },
    { to: "/shop", icon: <ShoppingCartIcon size={20} />, label: "Shop" },
  ];

  return (
    <div className="space-y-1 py-4">
      <div className="px-3 py-2">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-solo-primary/20 flex items-center justify-center">
            <UserIcon className="w-6 h-6 text-solo-primary" />
          </div>
          <div>
            <h3 className="font-bold text-solo-text">{user.name}</h3>
            <div className="text-xs font-semibold text-muted-foreground">
              Level {user.level} Hunter • Rank {user.rank}
            </div>
          </div>
        </div>
      </div>
      
      {navItems.map((item) => (
        <NavItem key={item.to} {...item} />
      ))}
    </div>
  );
}
