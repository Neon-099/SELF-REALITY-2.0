import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  UserIcon,
  HomeIcon,
  ClockIcon,
  BookIcon,
  ListIcon,
  ShoppingCartIcon,
  CalendarIcon
} from 'lucide-react';

export function BottomNav() {
  const location = useLocation();

  const navItems = [
    { to: "/character", icon: <UserIcon size={20} />, label: "Character" },
    { to: "/home", icon: <HomeIcon size={20} />, label: "Home" },
    { to: "/planner", icon: <CalendarIcon size={20} />, label: "Planner" },
    { to: "/quests", icon: <BookIcon size={20} />, label: "Quests" },
    { to: "/missions", icon: <ListIcon size={20} />, label: "Missions" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-lg bg-solo-dark/80 border-t border-gray-800/30 shadow-lg">
      <nav className="flex items-center justify-center max-w-screen-lg mx-auto px-1 py-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center py-2 relative",
                "transition-all duration-300 w-full",
                "hover:text-solo-primary"
              )}
            >
              <div
                className={cn(
                  "absolute inset-0 mx-auto w-12 h-full rounded-full transition-all duration-300 opacity-0",
                  isActive && "bg-gradient-to-b from-solo-primary/20 to-transparent opacity-100"
                )}
              />

              {isActive && (
                <div className="absolute -top-1 left-0 right-0 mx-auto w-6 h-1 rounded-full bg-gradient-to-r from-solo-primary to-solo-secondary animate-pulse" />
              )}

              <div className={cn(
                "relative z-10 mb-1 transition-transform duration-300",
                isActive ? "text-solo-primary transform scale-110" : "text-gray-400"
              )}>
                {item.icon}
              </div>

              <span className={cn(
                "relative z-10 text-[10px] font-medium transition-all duration-300",
                isActive
                  ? "text-white font-semibold"
                  : "text-gray-500"
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