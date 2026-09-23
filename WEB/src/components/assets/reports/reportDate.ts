/** Shared display format for report previews, PDF/print, and Excel output. */
export function formatReportDate(value?: string | Date | null): string {
  if (!value) return '';
  // Parse date-only values locally to avoid shifting the day in UTC-negative zones.
  const date = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}
