import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { signOut, auth } from '../firebase';
import { clsx } from 'clsx';

interface HeaderProps {
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isSyncing = false }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    if (window.confirm(`Connesso come:\n${user?.email}\n\nVuoi disconnetterti?`)) {
      signOut(auth);
    }
  };

  const todayStr = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long' });

  return (
    <div className="sticky top-0 z-50 bg-glass backdrop-blur-md pt-[calc(16px+var(--safe-top))] px-5 border-b border-bg-hover transition-colors duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-accent tracking-tight">Routine</span>
          <span 
            className={clsx(
              "w-2 h-2 rounded-full ml-2 transition-colors duration-300",
              isSyncing ? "bg-accent animate-pulse" : "bg-success"
            )} 
            title={isSyncing ? "Sincronizzazione..." : "Sincronizzato"}
          />
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme}
            className="bg-transparent text-fg-muted border border-bg-hover px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-bg-hover transition-all"
          >
            {theme === 'dark' ? 'Chiaro' : 'Scuro'}
          </button>
          <span className="text-xs font-semibold text-fg-muted font-mono uppercase tracking-wide hidden sm:inline-block">
            {todayStr}
          </span>
          {user?.photoURL && (
            <img 
              src={user.photoURL} 
              alt="Account" 
              onClick={handleLogout}
              className="w-8 h-8 rounded-full cursor-pointer border-2 border-bg-card shadow-sm"
            />
          )}
        </div>
      </div>
    </div>
  );
};
