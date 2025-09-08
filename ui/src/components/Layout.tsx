// Main layout component for Space Trader UI
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  actionBar?: React.ReactNode;
}

export function Layout({ children, header, actionBar }: LayoutProps) {
  return (
    <div className="game-screen flex flex-col">
      {/* Header with game status */}
      {header && (
        <header className="space-panel m-4 mb-2">
          {header}
        </header>
      )}
      
      {/* Main game content */}
      <main className="flex-1 px-4">
        {children}
      </main>
      
      {/* Action bar with available actions */}
      {actionBar && (
        <footer className="space-panel m-4 mt-2">
          {actionBar}
        </footer>
      )}
    </div>
  );
}

export function Header({ systemName, credits, status }: { 
  systemName: string; 
  credits: string; 
  status: string; 
}) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="retro-title text-xl">SPACE TRADER</h1>
        <div className="text-sm text-neon-cyan">System: {systemName}</div>
      </div>
      <div className="text-right">
        <div className="text-lg font-bold text-neon-green">{credits}</div>
        <div className="text-sm text-palm-gray">{status}</div>
      </div>
    </div>
  );
}

export function ActionBar({ actions, onAction }: { 
  actions: any[]; 
  onAction: (action: any) => void; 
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action, index) => (
        <button 
          key={index}
          onClick={() => onAction(action)}
          className="neon-button"
          disabled={!action.available}
        >
          {action.name}
        </button>
      ))}
    </div>
  );
}
