import React, { useState, useEffect } from 'react';
import { db, doc, getDoc, setDoc, serverTimestamp } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { BugItem } from '../types';
import { todayISO } from '../utils/helpers';
import { clsx } from 'clsx';

export const BugView: React.FC = () => {
  const { user } = useAuth();
  const [bugs, setBugs] = useState<BugItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [type, setType] = useState<'bug' | 'feat'>('bug');

  useEffect(() => {
    if (!user) return;
    const fetchBugs = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid, 'data', 'bugs'));
        if (snap.exists()) {
          setBugs(snap.data().items || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchBugs();
  }, [user]);

  const saveBugs = async (newBugs: BugItem[]) => {
    if (!user) return;
    setBugs(newBugs);
    await setDoc(doc(db, 'users', user.uid, 'data', 'bugs'), { items: newBugs, updatedAt: serverTimestamp() });
  };

  const handleAdd = async () => {
    if (!inputText.trim()) return;
    const newBug: BugItem = {
      id: Date.now().toString(),
      type,
      text: inputText.trim(),
      date: todayISO(),
    };
    await saveBugs([newBug, ...bugs]);
    setInputText('');
  };

  const handleDelete = async (index: number) => {
    if (!window.confirm('Eliminare nota?')) return;
    const newBugs = [...bugs];
    newBugs.splice(index, 1);
    await saveBugs(newBugs);
  };

  if (loading) return <div className="p-8 text-center text-fg-muted font-semibold">Caricamento...</div>;

  return (
    <div className="p-5 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[22px] font-bold text-fg-main tracking-tight">Note di Sviluppo</h2>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 mb-6">
        <div className="flex gap-2.5">
          <select 
            value={type} 
            onChange={(e) => setType(e.target.value as 'bug' | 'feat')}
            className="px-3 py-2.5 rounded-xl border border-bg-hover bg-bg-card text-fg-main font-sans text-sm font-medium outline-none shadow-sm shrink-0"
          >
            <option value="bug">Bug</option>
            <option value="feat">Feature</option>
          </select>
          <button 
            onClick={handleAdd}
            className="sm:hidden flex-1 px-5 py-2.5 rounded-xl bg-accent text-bg-card text-[15px] font-bold shadow-sm hover:scale-95 transition-all"
          >
            Aggiungi
          </button>
        </div>
        <div className="flex flex-1 gap-2.5">
          <input 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Descrivi qui..." 
            className="flex-1 px-4 py-2.5 rounded-xl border border-bg-hover bg-bg-main text-fg-main font-sans text-[15px] font-medium outline-none focus:border-accent focus:ring-3 focus:ring-selection transition-all min-w-0"
          />
          <button 
            onClick={handleAdd}
            className="hidden sm:block px-5 py-2.5 rounded-xl bg-accent text-bg-card text-[15px] font-bold shadow-sm hover:scale-95 transition-all shrink-0"
          >
            Aggiungi
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {bugs.map((b, i) => (
          <div key={b.id} className="bg-bg-card rounded-2xl p-4 flex gap-3 items-start shadow-sm border border-bg-hover">
            <span className={clsx(
              "text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 mt-0.5 uppercase tracking-wide border",
              b.type === 'bug' ? "text-red-500 border-red-500" : "text-success border-success"
            )}>
              {b.type === 'bug' ? 'Bug' : 'Feature'}
            </span>
            <div className="flex-1">
              <div className="text-sm text-fg-main leading-relaxed font-medium">{b.text}</div>
              <div className="text-[11px] font-semibold text-fg-muted font-mono mt-1.5">{b.date}</div>
            </div>
            <button 
              onClick={() => handleDelete(i)}
              className="w-7 h-7 rounded-full bg-bg-main text-fg-muted flex items-center justify-center text-sm hover:bg-bg-hover hover:text-fg-main transition-colors"
            >
              ✕
            </button>
          </div>
        ))}
        {bugs.length === 0 && <div className="text-fg-muted text-sm font-medium text-center py-8">Nessuna nota presente.</div>}
      </div>
    </div>
  );
};
