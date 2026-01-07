// Shared Intl.DateTimeFormat instance to avoid re-creating it during renders.
// Using a shared formatter improves performance, especially when rendering lists of dates.
export const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
});
