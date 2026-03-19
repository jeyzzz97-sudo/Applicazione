import React, { useState } from 'react';
import { useFoodData } from '../hooks/useFoodData';
import { GIORNI, oggi, uid_gen } from '../utils/helpers';
import { clsx } from 'clsx';
import { Sheet } from '../components/ui/Sheet';
import { Meal } from '../types';

export const FoodView: React.FC = () => {
  const { meals, mealPlan, saveMeals, saveMealPlan, loading } = useFoodData();
  const [curWeek, setCurWeek] = useState('1');
  const [curDay, setCurDay] = useState(oggi());

  const [pickerOpen, setPickerOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Partial<Meal> | null>(null);

  if (loading) return <div className="p-8 text-center text-fg-muted font-semibold">Caricamento...</div>;

  const currentMealId = mealPlan[curWeek]?.[curDay];
  const currentMeal = currentMealId ? meals.find(m => m.id === currentMealId) : null;

  const handleAssignMeal = (mealId: string) => {
    const newPlan = { ...mealPlan };
    if (!newPlan[curWeek]) newPlan[curWeek] = {};
    newPlan[curWeek][curDay] = mealId;
    saveMealPlan(newPlan);
    setPickerOpen(false);
  };

  const handleRemoveAssignment = () => {
    const newPlan = { ...mealPlan };
    if (newPlan[curWeek]) {
      delete newPlan[curWeek][curDay];
      saveMealPlan(newPlan);
    }
    setPickerOpen(false);
  };

  const handleSaveMeal = () => {
    if (!editingMeal?.nome) return alert('Inserisci un nome');
    let newMeals = [...meals];
    if (editingMeal.id) {
      const idx = newMeals.findIndex(m => m.id === editingMeal.id);
      if (idx > -1) newMeals[idx] = editingMeal as Meal;
    } else {
      newMeals.push({ ...editingMeal, id: uid_gen() } as Meal);
    }
    saveMeals(newMeals);
    setEditorOpen(false);
    setPickerOpen(true);
  };

  const handleDeleteMeal = (id: string) => {
    if (!window.confirm('Eliminare questo pasto?')) return;
    const newMeals = meals.filter(m => m.id !== id);
    const newPlan = { ...mealPlan };
    for (const w of Object.keys(newPlan)) {
      for (const d of Object.keys(newPlan[w])) {
        if (newPlan[w][d] === id) delete newPlan[w][d];
      }
    }
    saveMeals(newMeals);
    saveMealPlan(newPlan);
  };

  return (
    <div className="p-5 pb-24">
      <div className="flex gap-3 mb-4">
        <select 
          value={curWeek} 
          onChange={e => setCurWeek(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl border border-bg-hover bg-bg-card text-fg-main font-sans text-sm font-medium outline-none shadow-sm"
        >
          <option value="1">Settimana 1</option>
          <option value="2">Settimana 2</option>
          <option value="3">Settimana 3</option>
          <option value="4">Settimana 4</option>
        </select>
      </div>

      <div className="flex gap-2 -mx-5 px-5 py-4 mb-3 overflow-x-auto scrollbar-hide">
        {GIORNI.map(g => (
          <button
            key={g}
            onClick={() => setCurDay(g)}
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

      {!currentMeal ? (
        <div className="text-center py-10 px-5">
          <div className="text-[15px] font-semibold text-fg-muted mb-4">Nessun pasto assegnato.</div>
          <button 
            onClick={() => setPickerOpen(true)}
            className="px-6 py-3 rounded-xl bg-accent text-bg-card text-[15px] font-bold shadow-sm hover:scale-95 transition-all"
          >
            Assegna pasto
          </button>
        </div>
      ) : (
        <div className="bg-bg-card rounded-[20px] p-5 mt-4 shadow-sm border border-bg-hover">
          <div className="text-xl font-bold text-fg-main mb-3 flex justify-between items-start gap-3 tracking-tight leading-snug">
            <span>{currentMeal.nome}</span>
            <button 
              onClick={() => setPickerOpen(true)}
              className="bg-bg-main border border-bg-hover text-[13px] font-semibold text-fg-muted px-3 py-1.5 rounded-full hover:bg-bg-hover transition-colors shrink-0"
            >
              Cambia
            </button>
          </div>
          <div className="flex gap-4 font-mono text-sm font-semibold text-accent mb-5 pb-4 border-b border-bg-hover">
            <span>Kcal: {currentMeal.kcal}</span>
            <span>Prot: {currentMeal.prot}g</span>
          </div>
          <div className="text-xs text-fg-muted uppercase tracking-wide mb-3 font-bold">Lista della spesa</div>
          <ul className="list-none p-0 m-0 mb-4 space-y-2">
            {(currentMeal.ingr || '').split('\n').filter(Boolean).map((i, idx) => (
              <li key={idx} className="text-[15px] font-medium text-fg-main flex items-start gap-2.5 leading-snug">
                <span className="text-accent text-lg leading-none">•</span> {i}
              </li>
            ))}
          </ul>
          {currentMeal.nota && (
            <div className="p-3 bg-selection rounded-xl text-sm font-medium text-accent leading-relaxed border border-bg-hover">
              {currentMeal.nota}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 p-4 border border-bg-hover bg-bg-card rounded-2xl shadow-sm">
        <div className="text-xs text-fg-muted uppercase tracking-wide mb-3 font-bold">Integrazione fissa (Ogni giorno)</div>
        <ul className="list-none p-0 m-0 space-y-2">
          <li className="text-[15px] font-medium text-fg-main flex items-start gap-2.5 leading-snug"><span className="text-accent text-lg leading-none">•</span> Proteine in polvere 70g</li>
          <li className="text-[15px] font-medium text-fg-main flex items-start gap-2.5 leading-snug"><span className="text-accent text-lg leading-none">•</span> Banana o Arancia (1)</li>
          <li className="text-[15px] font-medium text-fg-main flex items-start gap-2.5 leading-snug"><span className="text-accent text-lg leading-none">•</span> Olio EVO 27g (9g nei giorni con il Tonno)</li>
        </ul>
        <div className="text-[13px] font-semibold text-fg-muted mt-3">~580/610 kcal · ~57g prot</div>
      </div>

      {/* Picker Sheet */}
      <Sheet isOpen={pickerOpen} onClose={() => setPickerOpen(false)} title={
        <div className="flex justify-between items-center w-full">
          <span>Scegli pasto</span>
          <button 
            onClick={() => { setEditingMeal({ nome: '', kcal: 0, prot: 0, ingr: '', nota: '' }); setPickerOpen(false); setEditorOpen(true); }}
            className="bg-bg-main border border-bg-hover text-[13px] font-semibold text-fg-muted px-3 py-1.5 rounded-full hover:bg-bg-hover transition-colors"
          >
            + Nuovo
          </button>
        </div>
      }>
        <div className="space-y-1.5">
          {meals.length === 0 && <div className="text-fg-muted text-sm py-2">Nessun pasto disponibile.</div>}
          {meals.map(m => (
            <div key={m.id} onClick={() => handleAssignMeal(m.id)} className="flex items-center gap-3 p-3.5 rounded-xl bg-bg-main border border-bg-hover cursor-pointer hover:bg-selection hover:border-accent transition-all">
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-fg-main mb-0.5 truncate">{m.nome}</div>
                <div className="text-xs font-semibold text-fg-muted font-mono">{m.kcal} kcal · {m.prot}g prot</div>
              </div>
              <div className="flex gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                <button onClick={() => { setEditingMeal(m); setPickerOpen(false); setEditorOpen(true); }} className="px-2.5 py-1.5 rounded-lg border border-bg-hover bg-bg-card text-[13px] font-semibold text-fg-muted hover:bg-bg-hover transition-colors">✎</button>
                <button onClick={() => handleDeleteMeal(m.id)} className="px-2.5 py-1.5 rounded-lg border border-bg-hover bg-bg-card text-[13px] font-semibold text-fg-muted hover:bg-bg-hover hover:text-red-500 hover:border-red-500 transition-colors">✕</button>
              </div>
            </div>
          ))}
        </div>
        {currentMeal && (
          <button onClick={handleRemoveAssignment} className="w-full mt-4 p-4 rounded-xl border border-red-500 text-red-500 text-[15px] font-bold hover:bg-red-500/10 transition-colors">
            Rimuovi pasto del giorno
          </button>
        )}
      </Sheet>

      {/* Editor Sheet */}
      <Sheet isOpen={editorOpen} onClose={() => { setEditorOpen(false); setPickerOpen(true); }} title={editingMeal?.id ? 'Modifica pasto' : 'Nuovo pasto'}>
        <div className="space-y-4">
          <div>
            <div className="text-[13px] font-bold text-fg-muted uppercase tracking-wide mb-2">Nome</div>
            <input value={editingMeal?.nome || ''} onChange={e => setEditingMeal(p => ({ ...p, nome: e.target.value }))} className="w-full px-4 py-3.5 rounded-xl border border-bg-hover bg-bg-main text-fg-main font-sans text-[15px] font-medium outline-none focus:border-accent focus:ring-3 focus:ring-selection transition-all" placeholder="Es. Pollo + Riso + Peperoni" />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="text-[13px] font-bold text-fg-muted uppercase tracking-wide mb-2">Kcal totali</div>
              <input type="number" value={editingMeal?.kcal || ''} onChange={e => setEditingMeal(p => ({ ...p, kcal: parseInt(e.target.value) || 0 }))} className="w-full px-4 py-3.5 rounded-xl border border-bg-hover bg-bg-main text-fg-main font-sans text-[15px] font-medium outline-none focus:border-accent focus:ring-3 focus:ring-selection transition-all" placeholder="1900" />
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-bold text-fg-muted uppercase tracking-wide mb-2">Proteine (g)</div>
              <input type="number" value={editingMeal?.prot || ''} onChange={e => setEditingMeal(p => ({ ...p, prot: parseInt(e.target.value) || 0 }))} className="w-full px-4 py-3.5 rounded-xl border border-bg-hover bg-bg-main text-fg-main font-sans text-[15px] font-medium outline-none focus:border-accent focus:ring-3 focus:ring-selection transition-all" placeholder="175" />
            </div>
          </div>
          <div>
            <div className="text-[13px] font-bold text-fg-muted uppercase tracking-wide mb-2">Lista della spesa (una voce per riga)</div>
            <textarea value={editingMeal?.ingr || ''} onChange={e => setEditingMeal(p => ({ ...p, ingr: e.target.value }))} className="w-full px-4 py-3.5 rounded-xl border border-bg-hover bg-bg-main text-fg-main font-sans text-[15px] font-medium outline-none focus:border-accent focus:ring-3 focus:ring-selection transition-all min-h-[120px] resize-none" placeholder="Petto di pollo: 420g&#10;Riso: 210g" />
          </div>
          <div>
            <div className="text-[13px] font-bold text-fg-muted uppercase tracking-wide mb-2">Nota (opzionale)</div>
            <input value={editingMeal?.nota || ''} onChange={e => setEditingMeal(p => ({ ...p, nota: e.target.value }))} className="w-full px-4 py-3.5 rounded-xl border border-bg-hover bg-bg-main text-fg-main font-sans text-[15px] font-medium outline-none focus:border-accent focus:ring-3 focus:ring-selection transition-all" placeholder="Es. Olio EVO ridotto" />
          </div>
        </div>
        <div className="flex gap-3 mt-6 mb-2">
          <button onClick={() => { setEditorOpen(false); setPickerOpen(true); }} className="flex-1 p-4 rounded-xl border border-bg-hover bg-bg-hover text-fg-main text-[15px] font-bold transition-all">Indietro</button>
          <button onClick={handleSaveMeal} className="flex-1 p-4 rounded-xl border border-accent bg-accent text-bg-card text-[15px] font-bold shadow-sm transition-all">Salva</button>
        </div>
      </Sheet>
    </div>
  );
};
