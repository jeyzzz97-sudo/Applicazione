export interface Task {
  id: string;
  label: string;
  days: string[] | null;
  children: Task[];
}

export interface Meal {
  id: string;
  nome: string;
  kcal: number;
  prot: number;
  ingr: string;
  nota: string;
}

export interface DiaryEntry {
  id: string;
  time: string;
  text: string;
  tags?: string[];
}

export interface DiaryDay {
  date: string;
  entries: DiaryEntry[];
  updatedAt?: any;
}

export interface BugItem {
  id: string;
  type: 'bug' | 'feat';
  text: string;
  date: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink: string;
}

export interface MealPlan {
  [week: string]: {
    [day: string]: string; // mealId
  };
}

export interface AppState {
  [taskId: string]: boolean;
}
