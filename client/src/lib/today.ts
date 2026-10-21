function deviceToday(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * "Today" for relative labels and date pickers. Starts as the device date
 * and is replaced by the clinic-local date the backend sends with the
 * portal data. Importers always read the current value.
 */
export let TODAY = deviceToday();

export function setToday(date: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) TODAY = date;
}
