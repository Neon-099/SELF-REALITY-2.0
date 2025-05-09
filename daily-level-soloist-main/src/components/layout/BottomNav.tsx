import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  UserIcon, 
  HomeIcon, 
  ClockIcon, 
  BookIcon,
  ListIcon,
  ShoppingCartIcon
} from 'lucide-react';

export function BottomNav() {
  const location = useLocation();
  
  const navItems = [
    { to: "/character", icon: <UserIcon size={18} />, label: "Character" },
    { to: "/home", icon: <HomeIcon size={18} />, label: "Home" },
    { to: "/milestones", icon: <ClockIcon size={18} />, label: "Milestones" },
    { to: "/quests", icon: <BookIcon size={18} />, label: "Quests" },
    { to: "/missions", icon: <ListIcon size={18} />, label: "Missions" },
    { to: "/shop", icon: <ShoppingCartIcon size={18} />, label: "Shop" },
  ];

  return (
    <div className="bg-[#0D1219] border-t border-gray-800/50">
      <nav className="flex items-center justify-between max-w-screen-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-1.5 relative",
                "transition-colors duration-200 w-full"
              )}
            >
              {isActive && (
                <div className="absolute top-0 left-0 right-0 mx-auto w-full h-0.5 bg-blue-500" />
              )}
              <div className={cn(
                "mb-1",
                isActive ? "text-blue-500" : "text-gray-400"
              )}>
                {item.icon}
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                isActive ? "text-white" : "text-gray-400"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
} 