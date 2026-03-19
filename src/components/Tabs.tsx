import React from 'react';
import { clsx } from 'clsx';

export type TabType = 'day' | 'food' | 'editor' | 'notes' | 'bug';

interface TabsProps {
  activeTab: TabType;
  onChange: (tab: TabType) => void;
}

export const Tabs: React.FC<TabsProps> = ({ activeTab, onChange }) => {
  const tabs: { id: TabType; label: string }[] = [
    { id: 'day', label: 'Giorno' },
    { id: 'food', label: 'Cibo' },
    { id: 'editor', label: 'Editor' },
    { id: 'notes', label: 'Note' },
    { id: 'bug', label: 'Note Dev' },
  ];

  return (
    <div className="flex gap-2 mb-[-1px] overflow-x-auto scrollbar-hide px-5 bg-glass backdrop-blur-md border-b border-bg-hover">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx(
            "flex-1 min-w-[70px] py-2.5 text-center text-sm font-semibold border-b-2 transition-all whitespace-nowrap",
            activeTab === tab.id 
              ? "text-accent border-accent" 
              : "text-fg-muted border-transparent hover:text-fg-main"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
