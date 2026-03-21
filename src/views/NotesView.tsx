import React, { useState, useEffect, useMemo } from 'react';
import { db, collection, getDocs, query, orderBy, limit, doc, setDoc, serverTimestamp, getDoc } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { DiaryDay, DiaryEntry } from '../types';
import { todayISO } from '../utils/helpers';
import { Sheet } from '../components/ui/Sheet';

export const NotesView: React.FC = () => {
  const { user } = useAuth();
  const [diaryDays, setDiaryDays] = useState<DiaryDay[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Note creation state
  const [mainNote, setMainNote] = useState('');
  const [mainNoteTags, setMainNoteTags] = useState('');
  
  // Filter state
  const [filterDate, setFilterDate] = useState('');
  const [filterTag, setFilterTag] = useState('');
  
  // Edit state
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editData, setEditData] = useState<{ date: string; id: string; text: string; tags: string } | null>(null);

  const loadDiary = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const snaps = await getDocs(query(collection(db, 'users', user.uid, 'diary'), orderBy('date', 'desc'), limit(30)));
      const days: DiaryDay[] = [];
      snaps.forEach(s => {
        const data = s.data();
        if (data.entries && data.entries.length > 0) {
          days.push({ date: data.date, entries: data.entries });
        }
      });
      setDiaryDays(days);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiary();
  }, [user]);

  const handleAddNote = async () => {
    if (!mainNote.trim() || !user) return;
    try {
      const dRef = doc(db, 'users', user.uid, 'diary', todayISO());
      const snap = await getDoc(dRef);
      const time = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      
      const tagsArray = mainNoteTags
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0);

      const entry: DiaryEntry = { 
        id: Math.random().toString(36).slice(2, 10), 
        time, 
        text: mainNote.trim(),
        tags: tagsArray
      };
      
      if (snap.exists()) {
        const entries = snap.data().entries || [];
        entries.unshift(entry);
        await setDoc(dRef, { date: todayISO(), entries, updatedAt: serverTimestamp() }, { merge: true });
      } else {
        await setDoc(dRef, { date: todayISO(), entries: [entry], updatedAt: serverTimestamp() });
      }
      setMainNote('');
      setMainNoteTags('');
      loadDiary();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (dateIso: string, entryId: string) => {
    if (!user || !window.confirm('Eliminare questa nota?')) return;
    const dRef = doc(db, 'users', user.uid, 'diary', dateIso);
    const snap = await getDoc(dRef);
    if (snap.exists()) {
      const entries = (snap.data().entries || []).filter((e: DiaryEntry) => e.id !== entryId);
      await setDoc(dRef, { entries }, { merge: true });
      loadDiary();
    }
  };

  const handleSaveEdit = async () => {
    if (!user || !editData || !editData.text.trim()) return;
    const dRef = doc(db, 'users', user.uid, 'diary', editData.date);
    const snap = await getDoc(dRef);
    if (snap.exists()) {
      const entries = snap.data().entries || [];
      const idx = entries.findIndex((e: DiaryEntry) => e.id === editData.id);
      if (idx > -1) {
        entries[idx].text = editData.text.trim();
        entries[idx].tags = editData.tags
          .split(',')
          .map(t => t.trim().toLowerCase())
          .filter(t => t.length > 0);
          
        await setDoc(dRef, { entries }, { merge: true });
        setEditSheetOpen(false);
        loadDiary();
      }
    }
  };

  // Extract all unique tags for the filter dropdown
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    diaryDays.forEach(day => {
      day.entries.forEach(entry => {
        if (entry.tags) {
          entry.tags.forEach(t => tags.add(t));
        }
      });
    });
    return Array.from(tags).sort();
  }, [diaryDays]);

  // Filter logic
  const filteredDays = useMemo(() => {
    return diaryDays.map(day => {
      // If filtering by date, and this day doesn't match, return empty entries
      if (filterDate && day.date !== filterDate) {
        return { ...day, entries: [] };
      }
      
      // Filter entries by tag
      const filteredEntries = day.entries.filter(entry => {
        if (!filterTag) return true;
        return entry.tags && entry.tags.includes(filterTag);
      });
      
      return { ...day, entries: filteredEntries };
    }).filter(day => day.entries.length > 0);
  }, [diaryDays, filterDate, filterTag]);

  return (
    <div className="p-5 pb-24">
      <h2 className="text-[22px] font-bold text-fg-main mb-4 tracking-tight">Diario Personale</h2>
      
      {/* Note Creation Section */}
      <div className="mb-8">
        <div className="text-[13px] font-bold text-fg-muted uppercase tracking-wide mb-3 flex items-center gap-1.5">
          Nuovo pensiero
        </div>
        <textarea 
          value={mainNote}
          onChange={e => setMainNote(e.target.value)}
          className="w-full min-h-[100px] bg-bg-card text-fg-main border border-bg-hover rounded-2xl p-4 font-sans text-[15px] leading-relaxed resize-none outline-none focus:border-accent focus:ring-3 focus:ring-selection shadow-sm transition-all mb-3"
          placeholder="Aggiungi una nota alla giornata di oggi..."
        />
        <input 
          type="text"
          value={mainNoteTags}
          onChange={e => setMainNoteTags(e.target.value)}
          placeholder="Tag (separati da virgola, es: lavoro, idee, spesa)"
          className="w-full bg-bg-card text-fg-main border border-bg-hover rounded-xl px-4 py-2.5 font-sans text-[14px] outline-none focus:border-accent focus:ring-3 focus:ring-selection shadow-sm transition-all mb-3"
        />
        <button 
          onClick={handleAddNote}
          className="px-5 py-2.5 rounded-xl bg-bg-hover text-fg-main text-sm font-semibold hover:bg-accent hover:text-bg-card transition-colors"
        >
          Salva nel Diario
        </button>
      </div>

      <div className="h-px bg-bg-hover my-6" />

      {/* Filter Section */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-[12px] font-bold text-fg-muted uppercase tracking-wide mb-1.5">Filtra per Data</label>
          <input 
            type="date" 
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="w-full bg-bg-card text-fg-main border border-bg-hover rounded-xl px-3 py-2 text-[14px] outline-none focus:border-accent focus:ring-2 focus:ring-selection transition-all"
          />
        </div>
        <div className="flex-1">
          <label className="block text-[12px] font-bold text-fg-muted uppercase tracking-wide mb-1.5">Filtra per Tag</label>
          <select 
            value={filterTag}
            onChange={e => setFilterTag(e.target.value)}
            className="w-full bg-bg-card text-fg-main border border-bg-hover rounded-xl px-3 py-2 text-[14px] outline-none focus:border-accent focus:ring-2 focus:ring-selection transition-all"
          >
            <option value="">Tutti i tag</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
        {(filterDate || filterTag) && (
          <div className="flex items-end">
            <button 
              onClick={() => { setFilterDate(''); setFilterTag(''); }}
              className="px-4 py-2 rounded-xl bg-bg-hover text-fg-main text-[13px] font-semibold hover:bg-red-500 hover:text-white transition-colors h-[38px]"
            >
              Rimuovi Filtri
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-fg-muted text-sm font-semibold py-2">Caricamento...</div>
      ) : diaryDays.length === 0 ? (
        <div className="text-fg-muted text-sm font-semibold py-2">Nessuna nota nel diario.</div>
      ) : filteredDays.length === 0 ? (
        <div className="text-fg-muted text-sm font-semibold py-2">Nessuna nota corrisponde ai filtri.</div>
      ) : (
        <div className="space-y-6">
          {filteredDays.map(day => (
            <div key={day.date}>
              <div className="text-[13px] font-bold text-fg-muted uppercase tracking-wide my-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full" />
                {new Date(day.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
              <div className="space-y-3">
                {day.entries.map(entry => (
                  <div key={entry.id} className="bg-bg-card rounded-2xl p-4 shadow-sm border border-bg-hover relative group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-xs font-bold text-accent font-mono">{entry.time}</div>
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 justify-end">
                          {entry.tags.map(tag => (
                            <span key={tag} className="bg-bg-hover text-fg-muted px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-[15px] text-fg-main leading-relaxed whitespace-pre-wrap">{entry.text}</div>
                    <div className="absolute top-3 right-3 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setEditData({ date: day.date, id: entry.id, text: entry.text, tags: entry.tags?.join(', ') || '' }); setEditSheetOpen(true); }}
                        className="bg-bg-main border-none text-xs font-semibold px-2 py-1 rounded-md text-fg-muted hover:bg-bg-hover hover:text-fg-main transition-colors"
                      >
                        Modifica
                      </button>
                      <button 
                        onClick={() => handleDelete(day.date, entry.id)}
                        className="bg-bg-main border-none text-xs font-semibold px-2 py-1 rounded-md text-fg-muted hover:bg-bg-hover hover:text-red-500 transition-colors"
                      >
                        Elimina
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet isOpen={editSheetOpen} onClose={() => setEditSheetOpen(false)} title="Modifica Nota">
        <textarea 
          value={editData?.text || ''}
          onChange={e => setEditData(prev => prev ? { ...prev, text: e.target.value } : null)}
          className="w-full p-4 rounded-xl border border-bg-hover bg-bg-main text-fg-main font-sans text-[15px] font-medium outline-none focus:border-accent focus:ring-3 focus:ring-selection transition-all min-h-[120px] resize-none mb-3"
        />
        <input 
          type="text"
          value={editData?.tags || ''}
          onChange={e => setEditData(prev => prev ? { ...prev, tags: e.target.value } : null)}
          placeholder="Tag (separati da virgola)"
          className="w-full bg-bg-main text-fg-main border border-bg-hover rounded-xl px-4 py-2.5 font-sans text-[14px] outline-none focus:border-accent focus:ring-3 focus:ring-selection transition-all"
        />
        <div className="flex gap-3 mt-6 mb-2">
          <button onClick={() => setEditSheetOpen(false)} className="flex-1 p-4 rounded-xl border border-bg-hover bg-bg-hover text-fg-main text-[15px] font-bold transition-all">Annulla</button>
          <button onClick={handleSaveEdit} className="flex-1 p-4 rounded-xl border border-accent bg-accent text-bg-card text-[15px] font-bold shadow-sm transition-all">Salva</button>
        </div>
      </Sheet>
    </div>
  );
};
