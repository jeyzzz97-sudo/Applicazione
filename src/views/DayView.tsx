import React, { useState, useMemo, useEffect } from 'react';
import { useRoutineData } from '../hooks/useRoutineData';
import { useCalendarEvents } from '../hooks/useCalendarEvents';
import { GIORNI, oggi, getDateForWeekdayInWeek, WEEKDAY_MAP } from '../utils/helpers';
import { TaskRow } from '../components/TaskRow';
import { Task, AppState } from '../types';
import { clsx } from 'clsx';
import { db, doc, getDoc, setDoc, serverTimestamp, signInWithPopup, auth, googleProvider } from '../firebase';
import { GoogleAuthProvider } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { useDate } from '../contexts/DateContext';

export const DayView: React.FC = () => {
  const { user, googleAccessToken, setGoogleAccessToken } = useAuth();
  const { selectedDate, setSelectedDate } = useDate();
  
  const curDateISO = selectedDate.getFullYear() + '-' + String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + String(selectedDate.getDate()).padStart(2, '0');
  const curDay = WEEKDAY_MAP[selectedDate.getDay()];

  const { routine, state, saveState, loading } = useRoutineData(curDateISO);
  const { events: calendarEvents, loading: calLoading, error: calError } = useCalendarEvents(googleAccessToken, curDateISO);
  
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [dayNote, setDayNote] = useState('');

  const handleReconnectCalendar = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        localStorage.setItem('gcal_token', credential.accessToken);
        localStorage.setItem('gcal_token_time', Date.now().toString());
        setGoogleAccessToken(credential.accessToken);
      }
    } catch (error) {
      console.error('Error reconnecting calendar:', error);
    }
  };

  // Load existing notes for the day when date changes
  useEffect(() => {
    if (!user) return;
    const loadDayNote = async () => {
      try {
        const dRef = doc(db, 'users', user.uid, 'diary', curDateISO);
        const snap = await getDoc(dRef);
        if (snap.exists() && snap.data().entries?.length > 0) {
          // We don't populate the textarea with all notes, just keep it empty for new thoughts
          // But we could show an indicator or just leave it as is.
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadDayNote();
  }, [curDateISO, user]);

  const toggleCollapse = (id: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allDescendants = (t: Task): string[] => {
    let ids = [t.id];
    for (const c of t.children) ids = ids.concat(allDescendants(c));
    return ids;
  };

  const childrenAllDone = (task: Task, st: AppState, g: string) => {
    const v = task.children.filter(c => !c.days || c.days.includes(g));
    if (!v.length) return false;
    return v.every(c => st[c.id]);
  };

  const toggleTask = (task: Task, parentTask: Task | null) => {
    const nv = !state[task.id];
    const newState = { ...state };
    newState[task.id] = nv;
    
    for (const id of allDescendants(task).slice(1)) {
      newState[id] = nv;
    }
    
    if (parentTask) {
      newState[parentTask.id] = childrenAllDone(parentTask, newState, curDay);
    }
    
    saveState(newState);
  };

  const getLeafIdsVisible = (tasks: Task[], g: string): string[] => {
    let ids: string[] = [];
    for (const t of tasks) {
      if (!t.days || t.days.includes(g)) {
        if (t.children.length === 0) ids.push(t.id);
        else ids = ids.concat(getLeafIdsVisible(t.children, g));
      }
    }
    return ids;
  };

  const allIdsVisible = (tasks: Task[], g: string): string[] => {
    let ids: string[] = [];
    for (const t of tasks) {
      if (!t.days || t.days.includes(g)) {
        ids.push(t.id);
        ids = ids.concat(allIdsVisible(t.children, g));
      }
    }
    return ids;
  };

  const handleSelAll = () => {
    const newState = { ...state };
    for (const id of allIdsVisible(routine, curDay)) newState[id] = true;
    saveState(newState);
  };

  const handleDeselAll = () => {
    if (!window.confirm('Deselezionare tutti?')) return;
    const newState = { ...state };
    for (const id of allIdsVisible(routine, curDay)) newState[id] = false;
    saveState(newState);
  };

  const handleExpandAll = () => setCollapsed(new Set());
  
  const handleCollapseAll = () => {
    const next = new Set<string>();
    routine.forEach(t => next.add(t.id));
    setCollapsed(next);
  };

  const saveDiaryEntry = async () => {
    if (!dayNote.trim() || !user) return;
    try {
      const dRef = doc(db, 'users', user.uid, 'diary', curDateISO);
      const snap = await getDoc(dRef);
      const time = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      const entry = { id: Math.random().toString(36).slice(2, 10), time, text: dayNote.trim() };
      
      if (snap.exists()) {
        const entries = snap.data().entries || [];
        entries.unshift(entry);
        await setDoc(dRef, { date: curDateISO, entries, updatedAt: serverTimestamp() }, { merge: true });
      } else {
        await setDoc(dRef, { date: curDateISO, entries: [entry], updatedAt: serverTimestamp() });
      }
      setDayNote('');
      alert('Nota salvata nel Diario!');
    } catch (e) {
      console.error(e);
    }
  };

  const leafIds = useMemo(() => getLeafIdsVisible(routine, curDay), [routine, curDay]);
  const tot = leafIds.length;
  const done = leafIds.filter(id => state[id]).length;
  const pct = tot ? Math.round((done / tot) * 100) : 0;

  if (loading) return <div className="p-8 text-center text-fg-muted font-semibold">Caricamento...</div>;

  return (
    <div className="pb-20">
      {/* Day Nav */}
      <div className="flex gap-2 px-5 py-4 overflow-x-auto scrollbar-hide">
        {GIORNI.map(g => (
          <button
            key={g}
            onClick={() => {
              setSelectedDate(getDateForWeekdayInWeek(g, selectedDate));
            }}
            className={clsx(
              "shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-all shadow-sm",
              g === curDay 
                ? "bg-accent text-bg-card shadow-md" 
                : g === oggi() 
                  ? "border border-bg-hover text-fg-main bg-bg-card" 
                  : "bg-bg-card text-fg-muted border border-transparent"
            )}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Progress */}
      <div className="px-5 pb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[13px] font-semibold text-fg-muted font-mono">{done}/{tot} completati</span>
          <span className="text-[13px] font-bold text-accent font-mono">{pct}%</span>
        </div>
        <div className="h-1.5 bg-bg-hover rounded-full overflow-hidden">
          <div 
            className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex gap-2 px-5 pb-4 flex-wrap">
        <button onClick={handleSelAll} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-bg-hover bg-bg-card text-fg-muted hover:bg-bg-hover transition-colors">Seleziona tutto</button>
        <button onClick={handleDeselAll} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-bg-hover bg-bg-card text-fg-muted hover:bg-bg-hover transition-colors">Deseleziona</button>
        <button onClick={handleExpandAll} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-bg-hover bg-bg-card text-fg-muted hover:bg-bg-hover transition-colors">Espandi</button>
        <button onClick={handleCollapseAll} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-bg-hover bg-bg-card text-fg-muted hover:bg-bg-hover transition-colors">Comprimi</button>
      </div>

      {/* Calendar Events */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] font-bold text-fg-muted uppercase tracking-wide">Google Calendar</span>
          {(!googleAccessToken || calError === 'AUTH_REQUIRED') && (
            <button 
              onClick={handleReconnectCalendar}
              className="text-[11px] font-bold text-accent bg-accent/10 px-2 py-1 rounded-md"
            >
              Collega Calendario
            </button>
          )}
        </div>
        
        {googleAccessToken && !calError && (
          <div className="space-y-2">
            {calLoading ? (
              <div className="text-xs text-fg-muted">Sincronizzazione...</div>
            ) : calendarEvents.length === 0 ? (
              <div className="text-xs text-fg-muted">Nessun evento per oggi.</div>
            ) : (
              calendarEvents.map(event => {
                const startTime = event.start.dateTime 
                  ? new Date(event.start.dateTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
                  : 'Tutto il giorno';
                
                return (
                  <a 
                    key={event.id} 
                    href={event.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 rounded-xl bg-bg-card border border-bg-hover hover:border-accent/50 transition-colors group"
                  >
                    <div className="text-xs font-bold text-accent font-mono shrink-0 mt-0.5">{startTime}</div>
                    <div className="text-sm font-medium text-fg-main leading-tight group-hover:text-accent transition-colors">{event.summary}</div>
                  </a>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Day Note */}
      <div className="px-5 pb-3">
        <button 
          onClick={() => setIsNoteOpen(!isNoteOpen)}
          className="flex items-center justify-between w-full bg-transparent border-none p-0 cursor-pointer"
        >
          <span className="text-[13px] font-bold text-fg-muted uppercase tracking-wide">Pensieri del giorno</span>
          <span className={clsx("text-[11px] text-fg-muted transition-transform duration-300", isNoteOpen && "rotate-180")}>▼</span>
        </button>
        <div 
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{ maxHeight: isNoteOpen ? '500px' : '0' }}
        >
          <div className="pt-3">
            <textarea 
              value={dayNote}
              onChange={e => setDayNote(e.target.value)}
              className="w-full min-h-[100px] bg-bg-card text-fg-main border border-bg-hover rounded-2xl p-4 font-sans text-[15px] leading-relaxed resize-none outline-none focus:border-accent focus:ring-3 focus:ring-selection shadow-sm transition-all"
              placeholder="Scrivi qui un pensiero veloce e invialo al tuo diario..."
            />
            <button 
              onClick={saveDiaryEntry}
              className="mt-3 px-5 py-2.5 rounded-xl bg-bg-hover text-fg-main text-sm font-semibold hover:bg-accent hover:text-bg-card transition-colors"
            >
              Salva nel Diario
            </button>
          </div>
        </div>
      </div>

      <div className="h-px bg-bg-hover mx-5 my-2" />

      {/* Task List */}
      <div className="px-3 pb-20">
        {routine.map(task => (
          <TaskRow
            key={task.id}
            task={task}
            depth={0}
            parentTask={null}
            state={state}
            curDay={curDay}
            collapsed={collapsed}
            toggleCollapse={toggleCollapse}
            toggleTask={toggleTask}
          />
        ))}
      </div>
    </div>
  );
};
