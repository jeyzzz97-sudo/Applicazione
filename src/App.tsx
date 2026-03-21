import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Login } from './components/Login';
import { Header } from './components/Header';
import { Tabs, TabType } from './components/Tabs';
import { DayView } from './views/DayView';
import { FoodView } from './views/FoodView';
import { EditorView } from './views/EditorView';
import { BugView } from './views/BugView';
import { NotesView } from './views/NotesView';

import { DateProvider } from './contexts/DateContext';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('day');

  if (loading) {
    return <div className="min-h-[100dvh] flex items-center justify-center bg-bg-main text-fg-muted font-semibold">Caricamento...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-[100dvh] bg-bg-main text-fg-main transition-colors duration-300">
      <Header />
      <Tabs activeTab={activeTab} onChange={setActiveTab} />
      
      <main className="relative">
        <div className={activeTab === 'day' ? 'block' : 'hidden'}><DayView /></div>
        <div className={activeTab === 'food' ? 'block' : 'hidden'}><FoodView /></div>
        <div className={activeTab === 'editor' ? 'block' : 'hidden'}><EditorView /></div>
        <div className={activeTab === 'notes' ? 'block' : 'hidden'}><NotesView /></div>
        <div className={activeTab === 'bug' ? 'block' : 'hidden'}><BugView /></div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DateProvider>
          <MainApp />
        </DateProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}



