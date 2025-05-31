import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  UserIcon,
  CalendarIcon,
  ClockIcon,
  ListIcon,
  BookIcon,
  ShoppingCartIcon,
  HomeIcon,
  Gift as GiftIcon
} from 'lucide-react';

interface MobileNavProps {
  onItemClick: () => void;
}

export function MobileNav({ onItemClick }: MobileNavProps) {
  const location = useLocation();

  const navItems = [
    { to: "/character", icon: <UserIcon size={24} />, label: "Character" },
    { to: "/home", icon: <HomeIcon size={24} />, label: "Home" },
    { to: "/planner", icon: <CalendarIcon size={24} />, label: "Planner" },
    { to: "/milestones", icon: <ClockIcon size={24} />, label: "Milestones" },
    { to: "/quests", icon: <BookIcon size={24} />, label: "Quests" },
    { to: "/missions", icon: <ListIcon size={24} />, label: "Missions" },
    { to: "/shop", icon: <ShoppingCartIcon size={24} />, label: "Shop" },
    { to: "/rewards", icon: <GiftIcon size={24} />, label: "Rewards" },
  ];

  return (
    <nav className="py-4 px-2">
      <div className="grid grid-cols-4 gap-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;

          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onItemClick}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg",
                "transition-colors duration-200",
                isActive
                  ? "text-solo-primary bg-solo-dark glow-text"
                  : "text-gray-400 hover:text-solo-primary hover:bg-solo-dark"
              )}
            >
              <div className="mb-1">{item.icon}</div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}