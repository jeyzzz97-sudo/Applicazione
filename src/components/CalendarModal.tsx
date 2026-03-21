import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, query } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useDate } from '../contexts/DateContext';
import { clsx } from 'clsx';
import { Sheet } from './ui/Sheet';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { selectedDate, setSelectedDate } = useDate();
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  const [daysWithNotes, setDaysWithNotes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
  }, [isOpen, selectedDate]);

  useEffect(() => {
    if (!user || !isOpen) return;
    
    const fetchNotes = async () => {
      setLoading(true);
      try {
        // Fetch all diary entries to find dates with notes
        // In a real app with many notes, we might want to query by month, 
        // but for now we fetch all or a large limit to show dots.
        const snaps = await getDocs(query(collection(db, 'users', user.uid, 'diary')));
        const notesSet = new Set<string>();
        snaps.forEach(s => {
          const data = s.data();
          if (data.entries && data.entries.length > 0) {
            notesSet.add(data.date);
          }
        });
        setDaysWithNotes(notesSet);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotes();
  }, [user, isOpen, currentMonth]);

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleDateClick = (day: number) => {
    setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    onClose();
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Adjust so Monday is 0, Sunday is 6
  };

  const daysInMonth = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  const firstDay = getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const monthName = currentMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title="Seleziona Data">
      <div className="p-2">
        <div className="flex justify-between items-center mb-6">
          <button onClick={prevMonth} className="p-2 rounded-full hover:bg-bg-hover transition-colors text-fg-main">
            &larr;
          </button>
          <h3 className="text-lg font-bold text-fg-main capitalize">{monthName}</h3>
          <button onClick={nextMonth} className="p-2 rounded-full hover:bg-bg-hover transition-colors text-fg-main">
            &rarr;
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(wd => (
            <div key={wd} className="text-center text-xs font-bold text-fg-muted uppercase tracking-wider py-2">
              {wd}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="h-10" />;
            }

            const dateStr = currentMonth.getFullYear() + '-' + 
                            String(currentMonth.getMonth() + 1).padStart(2, '0') + '-' + 
                            String(day).padStart(2, '0');
            
            const isSelected = selectedDate.getDate() === day && 
                               selectedDate.getMonth() === currentMonth.getMonth() && 
                               selectedDate.getFullYear() === currentMonth.getFullYear();
            
            const isToday = new Date().getDate() === day && 
                            new Date().getMonth() === currentMonth.getMonth() && 
                            new Date().getFullYear() === currentMonth.getFullYear();

            const hasNote = daysWithNotes.has(dateStr);

            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                className={clsx(
                  "relative h-10 w-full rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  isSelected 
                    ? "bg-accent text-bg-card font-bold shadow-md" 
                    : isToday 
                      ? "border border-accent text-accent" 
                      : "text-fg-main hover:bg-bg-hover"
                )}
              >
                {day}
                {hasNote && (
                  <div 
                    className={clsx(
                      "absolute bottom-1 w-1.5 h-1.5 rounded-full",
                      isSelected ? "bg-bg-card" : "bg-accent"
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
        
        {loading && (
          <div className="text-center mt-4 text-xs text-fg-muted">Caricamento note...</div>
        )}
      </div>
    </Sheet>
  );
};
