import React from 'react';
import { Sword } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Loading your adventure..." }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-solo-dark bg-opacity-90 flex flex-col items-center justify-center z-50">
      <div className="animate-pulse-glow">
        <Sword className="h-16 w-16 text-solo-primary animate-bounce" />
      </div>
      <h2 className="mt-6 text-2xl font-bold text-white">
        {message}
      </h2>
      <div className="mt-4 w-48 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-solo-primary to-solo-secondary animate-progress-bar"></div>
      </div>
    </div>
  );
}

export function LoadingError({ message = "Failed to load data", retry }: { message: string; retry?: () => void }) {
  return (
    <div className="fixed inset-0 bg-solo-dark bg-opacity-90 flex flex-col items-center justify-center z-50">
      <div className="text-red-500">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h2 className="mt-6 text-2xl font-bold text-white">
        {message}
      </h2>
      {retry && (
        <button
          onClick={retry}
          className="mt-6 px-4 py-2 bg-solo-primary text-white rounded-md hover:bg-solo-primary/80 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
} 