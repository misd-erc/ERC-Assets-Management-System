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