import React from 'react';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
}

export const Sheet: React.FC<SheetProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-end animate-in fade-in duration-200" 
      onClick={onClose}
    >
      <div 
        className="w-full bg-bg-card rounded-t-3xl pb-[calc(24px+var(--safe-bot))] max-h-[92dvh] overflow-y-auto animate-in slide-in-from-bottom duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1.5 bg-bg-hover rounded-full mx-auto mt-4 mb-5" />
        <div className="text-xl font-bold text-fg-main px-6 pb-4 tracking-tight flex justify-between items-center">
          {title}
        </div>
        <div className="px-6">
          {children}
        </div>
      </div>
    </div>
  );
};
