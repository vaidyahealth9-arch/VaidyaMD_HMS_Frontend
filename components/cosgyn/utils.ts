export const addDaysToDate = (baseDateStr: string, days: number): string => {
  const d = new Date(baseDateStr);
  if (isNaN(d.getTime())) return baseDateStr;
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export const getStepDays = (freq: string, index: number): number => {
  if (freq === 'daily') return 1;
  if (freq === 'twice_weekly') return index % 2 === 0 ? 3 : 4;
  if (freq === 'weekly') return 7;
  if (freq === 'fortnightly') return 14;
  if (freq === 'monthly') return 28;
  return 7;
};
