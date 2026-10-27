/**
 * Utility functions for date manipulation and formatting
 */

/**
 * Formats a date string or object into "MMM DD, YYYY" (e.g., "Jan 01, 2024")
 * @param date - The date to format
 * @returns Formatted date string
 */
export const formatDate = (date: string | Date | undefined | null): string => {
  if (!date) return '-';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return '-';
  }
};

/**
 * Converts a value returned by the API into an ISO date-time accepted by
 * ASP.NET DateTime model binding. Some older movement records can have a
 * null/empty date or a timestamp with more fractional-second precision than
 * the browser can parse, so use the fallback when necessary.
 */
export const toApiDateTime = (
  value: unknown,
  fallback: unknown = new Date()
): string => {
  const parse = (candidate: unknown): Date | null => {
    if (candidate instanceof Date) {
      return Number.isNaN(candidate.getTime()) ? null : candidate;
    }

    if (typeof candidate !== 'string' && typeof candidate !== 'number') {
      return null;
    }

    const text = String(candidate).trim();
    if (!text) return null;

    let parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) return parsed;

    // .NET may serialize seven fractional-second digits; JavaScript Date only
    // supports millisecond precision.
    const normalizedText = text.replace(
      /(\.\d{3})\d+(?=(Z|[+-]\d{2}:?\d{2})?$)/,
      '$1'
    );
    parsed = new Date(normalizedText);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  return (parse(value) ?? parse(fallback) ?? new Date()).toISOString();
};

/**
 * Converts a date string to a relative time format (e.g., "2 hours ago")
 * @param dateStr - The date string in ISO format (UTC)
 * @returns Relative time string
 */
export const timeAgo = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid date';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSeconds < 60) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
    if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
  } catch {
    return 'Invalid date';
  }
};

/**
 * Formats a table name by removing "Tbl" prefix and capitalizing words
 * @param tableName - The raw table name (e.g., "TblSessionToken")
 * @returns Formatted table name (e.g., "Session Token")
 */
export const formatTableName = (tableName: string): string => {
  if (!tableName) return 'Unknown';

  // Remove "Tbl" prefix if present
  let formatted = tableName.replace(/^Tbl/i, '');

  // Split by camelCase or underscores and capitalize
  formatted = formatted
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase to spaces
    .replace(/_/g, ' ') // underscores to spaces
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return formatted;
};
