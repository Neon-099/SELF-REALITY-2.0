import React, { useState } from 'react';
import { SidebarNav } from './SidebarNav';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  
  return (
    <aside
      className={cn(
        "h-full bg-gray-900/95 border-r border-gray-800 transition-all duration-300",
        "lg:bg-transparent",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="h-full flex flex-col justify-between">
        <div className={cn(
          "py-4",
          collapsed ? "px-2" : "px-3"
        )}>
          <div className={cn(
            "flex flex-col",
            collapsed ? "items-center space-y-6" : "space-y-1"
          )}>
            {!collapsed && <SidebarNav />}
            {collapsed && (
              <div className="flex flex-col items-center pt-4 space-y-6">
                {/* Collapsed icons version of the menu */}
              </div>
            )}
          </div>
        </div>
        
        {/* Only show collapse button on desktop */}
        <div className="hidden lg:block p-2 border-t border-gray-800">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 text-gray-400 hover:text-white rounded-md hover:bg-gray-800"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
      </div>
    </aside>
  );
}
