import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Toaster } from '@/components/ui/toaster';
import { BottomNav } from './BottomNav';

export function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-solo-dark to-gray-900">
      <Header />
      
      <div className="flex relative">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6 w-full pb-24 lg:pb-6">
          <div className="container mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 shadow-lg">
        <BottomNav />
      </div>
      
      <Toaster />
    </div>
  );
}
