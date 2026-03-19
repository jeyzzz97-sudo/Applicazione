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
        {activeTab === 'day' && <DayView />}
        {activeTab === 'food' && <FoodView />}
        {activeTab === 'editor' && <EditorView />}
        {activeTab === 'notes' && <NotesView />}
        {activeTab === 'bug' && <BugView />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}



