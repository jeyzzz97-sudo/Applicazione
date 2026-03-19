import React, { useState, useMemo } from 'react';
import { useRoutineData } from '../hooks/useRoutineData';
import { GIORNI, oggi, getDateForWeekday } from '../utils/helpers';
import { TaskRow } from '../components/TaskRow';
import { Task, AppState } from '../types';
import { clsx } from 'clsx';
import { db, doc, getDoc, setDoc, serverTimestamp } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export const DayView: React.FC = () => {
  const { user } = useAuth();
  const [curDay, setCurDay] = useState(oggi());
  const [curDateISO, setCurDateISO] = useState(getDateForWeekday(curDay));
  const { routine, state, saveState, loading } = useRoutineData(curDateISO);
  
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [dayNote, setDayNote] = useState('');

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
              setCurDay(g);
              setCurDateISO(getDateForWeekday(g));
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
