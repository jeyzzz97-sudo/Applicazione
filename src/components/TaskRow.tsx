import React, { useState } from 'react';
import { Task, AppState } from '../types';
import { clsx } from 'clsx';

interface TaskRowProps {
  task: Task;
  depth: number;
  parentTask: Task | null;
  state: AppState;
  curDay: string;
  collapsed: Set<string>;
  toggleCollapse: (id: string) => void;
  toggleTask: (task: Task, parentTask: Task | null) => void;
}

export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  depth,
  parentTask,
  state,
  curDay,
  collapsed,
  toggleCollapse,
  toggleTask,
}) => {
  const isSection = depth === 0;
  const hasChildren = task.children && task.children.length > 0;
  const isCollapsed = collapsed.has(task.id);

  // Check if task is visible today
  if (task.days && !task.days.includes(curDay)) return null;

  const isDone = !!state[task.id];
  const isPartial = !isDone && hasChildren && task.children.some(c => (!c.days || c.days.includes(curDay)) && state[c.id]);

  return (
    <div className="my-1">
      <div 
        className={clsx(
          "flex items-center gap-3 rounded-xl transition-all relative border border-transparent",
          isSection ? "py-3.5 px-4 bg-transparent mt-3" : "py-3 px-4 bg-bg-card mb-1 shadow-sm hover:scale-[0.99] active:scale-[0.98]",
          depth === 1 && "ml-6",
          depth === 2 && "ml-12",
          depth >= 3 && "ml-16"
        )}
      >
        {hasChildren ? (
          <button 
            onClick={(e) => { e.stopPropagation(); toggleCollapse(task.id); }}
            className={clsx(
              "w-6 h-6 shrink-0 flex items-center justify-center text-xs text-fg-muted bg-bg-hover rounded-full transition-transform",
              isCollapsed && "-rotate-90"
            )}
          >
            ▼
          </button>
        ) : (
          <span className="w-6 shrink-0" />
        )}

        <div 
          onClick={(e) => { e.stopPropagation(); toggleTask(task, parentTask); }}
          className={clsx(
            "w-6 h-6 shrink-0 border-2 rounded-lg flex items-center justify-center transition-all cursor-pointer",
            isDone ? "bg-accent border-accent" : isPartial ? "bg-transparent border-accent" : "bg-bg-card border-bg-hover"
          )}
        >
          {isDone && <div className="w-1.5 h-2.5 border-2 border-bg-card border-t-0 border-l-0 rotate-45 -translate-y-px" />}
          {isPartial && <div className="w-2.5 h-0.5 bg-accent rounded-full" />}
        </div>

        <span 
          onClick={() => toggleTask(task, parentTask)}
          className={clsx(
            "flex-1 leading-snug cursor-pointer select-none transition-colors",
            isSection ? "text-sm font-bold text-fg-muted uppercase tracking-wide" : "text-[15px] font-medium text-fg-main",
            isDone && (isSection ? "text-bg-hover" : "text-fg-muted line-through decoration-bg-hover")
          )}
        >
          {task.label}
        </span>

        {task.days && (
          <span className="text-[10px] font-semibold font-mono bg-bg-hover text-fg-muted px-2 py-1 rounded-md shrink-0">
            {task.days.join(' ')}
          </span>
        )}
      </div>

      {hasChildren && (
        <div 
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{ maxHeight: isCollapsed ? '0' : '9999px' }}
        >
          {task.children.map(child => (
            <TaskRow
              key={child.id}
              task={child}
              depth={depth + 1}
              parentTask={task}
              state={state}
              curDay={curDay}
              collapsed={collapsed}
              toggleCollapse={toggleCollapse}
              toggleTask={toggleTask}
            />
          ))}
        </div>
      )}
    </div>
  );
};
