export const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
});

// BOLT: Optimized date formatter to avoid new Date() object allocation
export function formatTimestamp(seconds) {
  if (!seconds) return 'Pending';
  return dateTimeFormatter.format(Number(seconds) * 1000);
}
