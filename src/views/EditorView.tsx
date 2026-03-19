import React, { useState } from 'react';
import { useRoutineData } from '../hooks/useRoutineData';
import { Task } from '../types';
import { clsx } from 'clsx';
import { Sheet } from '../components/ui/Sheet';
import { uid_gen, todayISO } from '../utils/helpers';

interface EditorRowProps {
  task: Task;
  depth: number;
  parentList: Task[];
  idx: number;
  selection: Set<string>;
  toggleSel: (id: string) => void;
  collapsed: Set<string>;
  toggleCollapse: (id: string) => void;
  moveTask: (list: Task[], idx: number, dir: number) => void;
  openEditTask: (task: Task) => void;
}

const EditorRow: React.FC<EditorRowProps> = ({
  task, depth, parentList, idx, selection, toggleSel, collapsed, toggleCollapse, moveTask, openEditTask
}) => {
  const isSection = depth === 0;
  const hasChildren = task.children && task.children.length > 0;
  const isSel = selection.has(task.id);
  const isCollapsed = collapsed.has(task.id);

  return (
    <div className="mb-1">
      <div className={clsx(
        "flex items-center gap-2.5 rounded-xl transition-all border",
        isSection ? "bg-transparent border-transparent py-4 px-3.5 pb-2" : "bg-bg-card border-bg-hover py-3 px-3.5 shadow-sm hover:scale-[0.99] active:scale-[0.98]",
        depth === 1 && "ml-6 bg-bg-main",
        depth === 2 && "ml-12 bg-bg-main",
        isSel && "border-accent ring-2 ring-selection"
      )}>
        <div 
          onClick={(e) => { e.stopPropagation(); toggleSel(task.id); }}
          className={clsx(
            "w-5 h-5 shrink-0 border-2 rounded-md flex items-center justify-center cursor-pointer transition-all",
            isSel ? "bg-accent border-accent" : "bg-bg-card border-bg-hover"
          )}
        >
          {isSel && <div className="w-1.5 h-2.5 border-2 border-bg-card border-t-0 border-l-0 rotate-45 -translate-y-px" />}
        </div>

        {hasChildren && (
          <button 
            onClick={(e) => { e.stopPropagation(); toggleCollapse(task.id); }}
            className={clsx(
              "w-6 h-6 shrink-0 flex items-center justify-center text-xs text-fg-muted bg-bg-hover rounded-full transition-transform",
              isCollapsed && "-rotate-90"
            )}
          >
            ▼
          </button>
        )}

        <span 
          onClick={() => openEditTask(task)}
          className={clsx(
            "flex-1 text-sm cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis",
            isSection ? "font-bold text-fg-muted uppercase tracking-wide" : "font-semibold text-fg-main"
          )}
        >
          {task.label} {task.days ? `[${task.days.join(',')}]` : ''}
        </span>

        <div className="flex gap-1">
          {idx > 0 && (
            <button onClick={(e) => { e.stopPropagation(); moveTask(parentList, idx, -1); }} className="w-7 h-7 rounded-lg bg-bg-main text-fg-muted text-sm font-bold flex items-center justify-center hover:bg-bg-hover hover:text-fg-main transition-colors">↑</button>
          )}
          {idx < parentList.length - 1 && (
            <button onClick={(e) => { e.stopPropagation(); moveTask(parentList, idx, 1); }} className="w-7 h-7 rounded-lg bg-bg-main text-fg-muted text-sm font-bold flex items-center justify-center hover:bg-bg-hover hover:text-fg-main transition-colors">↓</button>
          )}
        </div>
      </div>

      {hasChildren && !isCollapsed && (
        <div>
          {task.children.map((child, i) => (
            <EditorRow
              key={child.id}
              task={child}
              depth={depth + 1}
              parentList={task.children}
              idx={i}
              selection={selection}
              toggleSel={toggleSel}
              collapsed={collapsed}
              toggleCollapse={toggleCollapse}
              moveTask={moveTask}
              openEditTask={openEditTask}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const EditorView: React.FC = () => {
  const { routine, saveConfig, loading } = useRoutineData(todayISO());
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<{ id: string, label: string } | null>(null);
  
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  const toggleSel = (id: string) => {
    setSelection(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCollapse = (id: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const moveTask = (list: Task[], idx: number, dir: number) => {
    const ni = idx + dir;
    if (ni >= 0 && ni < list.length) {
      const temp = list[idx];
      list[idx] = list[ni];
      list[ni] = temp;
      saveConfig([...routine]);
    }
  };

  const findTaskAndParent = (tasks: Task[], tid: string): { task: Task, parent: Task[], idx: number } | null => {
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].id === tid) return { task: tasks[i], parent: tasks, idx: i };
      const r = findTaskAndParent(tasks[i].children, tid);
      if (r) return r;
    }
    return null;
  };

  const handleDeleteSelection = () => {
    if (selection.size === 0) return;
    if (!window.confirm('Eliminare i task selezionati?')) return;
    
    const newRoutine = JSON.parse(JSON.stringify(routine)); // Deep copy
    for (const tid of selection) {
      const r = findTaskAndParent(newRoutine, tid);
      if (r) r.parent.splice(r.idx, 1);
    }
    setSelection(new Set());
    saveConfig(newRoutine);
  };

  const handleSaveEdit = () => {
    if (!editingTask || !editingTask.label.trim()) return;
    const newRoutine = JSON.parse(JSON.stringify(routine));
    const r = findTaskAndParent(newRoutine, editingTask.id);
    if (r) {
      r.task.label = editingTask.label.trim();
      saveConfig(newRoutine);
      setEditSheetOpen(false);
    }
  };

  const handleAddSection = () => {
    if (!newSectionName.trim()) return;
    const newRoutine = [...routine, { id: uid_gen(), label: newSectionName.trim(), days: null, children: [] }];
    saveConfig(newRoutine);
    setNewSectionName('');
    setAddSheetOpen(false);
  };

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(routine, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "routine_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  if (loading) return <div className="p-8 text-center text-fg-muted font-semibold">Caricamento...</div>;

  return (
    <div className="p-3 pb-32">
      <div className="mb-4">
        {routine.map((task, i) => (
          <EditorRow
            key={task.id}
            task={task}
            depth={0}
            parentList={routine}
            idx={i}
            selection={selection}
            toggleSel={toggleSel}
            collapsed={collapsed}
            toggleCollapse={toggleCollapse}
            moveTask={moveTask}
            openEditTask={(t) => { setEditingTask({ id: t.id, label: t.label }); setEditSheetOpen(true); }}
          />
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-glass backdrop-blur-md border-t border-bg-hover p-3 pb-[calc(12px+var(--safe-bot))] flex gap-2.5 flex-wrap z-50 transition-colors duration-300">
        <button onClick={() => setAddSheetOpen(true)} className="flex-1 min-w-[80px] p-3 rounded-xl border border-accent bg-accent text-bg-card text-[13px] font-bold shadow-sm hover:scale-95 transition-all">+ Nuova Sezione</button>
        <button onClick={handleDeleteSelection} className="flex-1 min-w-[80px] p-3 rounded-xl border border-red-500 bg-bg-card text-red-500 text-[13px] font-bold shadow-sm hover:bg-red-500/10 transition-all">Elimina Sel.</button>
        <button onClick={() => setCollapsed(new Set())} className="flex-1 min-w-[80px] p-3 rounded-xl border border-bg-hover bg-bg-card text-fg-main text-[13px] font-bold shadow-sm hover:bg-bg-hover transition-all">Espandi</button>
        <button onClick={() => { const next = new Set<string>(); routine.forEach(t => next.add(t.id)); setCollapsed(next); }} className="flex-1 min-w-[80px] p-3 rounded-xl border border-bg-hover bg-bg-card text-fg-main text-[13px] font-bold shadow-sm hover:bg-bg-hover transition-all">Comprimi</button>
        <button onClick={exportJSON} className="basis-full p-3 rounded-xl border border-fg-main bg-fg-main text-bg-card text-[13px] font-bold shadow-sm hover:scale-[0.99] transition-all">Scarica Backup JSON</button>
      </div>

      {/* Edit Task Sheet */}
      <Sheet isOpen={editSheetOpen} onClose={() => setEditSheetOpen(false)} title="Modifica task">
        <div className="text-[13px] font-bold text-fg-muted uppercase tracking-wide mb-2 mt-5">Nome</div>
        <input 
          value={editingTask?.label || ''} 
          onChange={e => setEditingTask(p => p ? { ...p, label: e.target.value } : null)} 
          className="w-full px-4 py-3.5 rounded-xl border border-bg-hover bg-bg-main text-fg-main font-sans text-[15px] font-medium outline-none focus:border-accent focus:ring-3 focus:ring-selection transition-all" 
        />
        <div className="flex gap-3 mt-6 mb-2">
          <button onClick={() => setEditSheetOpen(false)} className="flex-1 p-4 rounded-xl border border-bg-hover bg-bg-hover text-fg-main text-[15px] font-bold transition-all">Annulla</button>
          <button onClick={handleSaveEdit} className="flex-1 p-4 rounded-xl border border-accent bg-accent text-bg-card text-[15px] font-bold shadow-sm transition-all">Salva</button>
        </div>
      </Sheet>

      {/* Add Section Sheet */}
      <Sheet isOpen={addSheetOpen} onClose={() => setAddSheetOpen(false)} title="Nuova Sezione">
        <div className="text-[13px] font-bold text-fg-muted uppercase tracking-wide mb-2 mt-5">Nome</div>
        <input 
          value={newSectionName} 
          onChange={e => setNewSectionName(e.target.value)} 
          className="w-full px-4 py-3.5 rounded-xl border border-bg-hover bg-bg-main text-fg-main font-sans text-[15px] font-medium outline-none focus:border-accent focus:ring-3 focus:ring-selection transition-all" 
        />
        <div className="flex gap-3 mt-6 mb-2">
          <button onClick={() => setAddSheetOpen(false)} className="flex-1 p-4 rounded-xl border border-bg-hover bg-bg-hover text-fg-main text-[15px] font-bold transition-all">Annulla</button>
          <button onClick={handleAddSection} className="flex-1 p-4 rounded-xl border border-accent bg-accent text-bg-card text-[15px] font-bold shadow-sm transition-all">Crea</button>
        </div>
      </Sheet>
    </div>
  );
};
