export const GIORNI = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
export const WEEKDAY_MAP = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

export const uid_gen = () => Math.random().toString(36).slice(2, 10);

export const todayISO = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

export const getDateForWeekdayInWeek = (g: string, baseDate: Date) => {
  const ti = WEEKDAY_MAP.indexOf(g);
  const t = new Date(baseDate);
  const ci = t.getDay();
  t.setDate(t.getDate() + ((ti === 0 ? 7 : ti) - (ci === 0 ? 7 : ci)));
  return t;
};

export const oggi = () => WEEKDAY_MAP[new Date().getDay()];

export const getFoodWeekForDate = (date: Date): string => {
  // Reference date: March 9, 2026 is the start of Week 1
  // (March 16-22 is Week 2)
  const refDate = Date.UTC(2026, 2, 9); // Month is 0-indexed, 2 = March
  const targetDate = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  
  const diffTime = targetDate - refDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  
  // Calculate week in 4-week cycle (1 to 4)
  // ((diffWeeks % 4) + 4) % 4 handles negative numbers correctly
  const weekInCycle = (((diffWeeks % 4) + 4) % 4) + 1;
  
  return String(weekInCycle);
};

export const defaultRoutine = () => [
  {
    id: uid_gen(),
    label: 'Svegliarsi',
    days: null,
    children: [
      {
        id: uid_gen(),
        label: 'Bagno',
        days: null,
        children: [
          { id: uid_gen(), label: 'Pipì', days: null, children: [] },
          { id: uid_gen(), label: 'Faccia', days: null, children: [] },
          { id: uid_gen(), label: 'Denti', days: null, children: [] },
          { id: uid_gen(), label: 'Deodorante', days: null, children: [] }
        ]
      },
      { id: uid_gen(), label: 'Metti via telefono', days: null, children: [] },
      { id: uid_gen(), label: 'Bevi acqua e vitamine', days: null, children: [] }
    ]
  },
  {
    id: uid_gen(),
    label: 'Studio',
    days: null,
    children: [
      { id: uid_gen(), label: 'Entra su Discord', days: null, children: [] },
      { id: uid_gen(), label: 'MIT', days: null, children: [] },
      {
        id: uid_gen(),
        label: 'Blocco 1',
        days: null,
        children: [
          {
            id: uid_gen(),
            label: 'Studio 50 min',
            days: null,
            children: [
              { id: uid_gen(), label: 'Lettura paragrafo', days: null, children: [] },
              { id: uid_gen(), label: 'Mappa paragrafo', days: null, children: [] }
            ]
          },
          { id: uid_gen(), label: 'Pausa 10 min', days: null, children: [] }
        ]
      }
    ]
  }
];
