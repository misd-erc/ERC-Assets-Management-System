/**
 * Sanitization Utilities
 * Functions for cleaning and sanitizing data, especially encrypted IDs
 */

/**
 * Sanitizes systemUserId by removing BOM (Byte Order Mark) character
 * @param id The systemUserId string to sanitize
 * @returns The sanitized string with BOM removed
 */
export const sanitizeSystemUserId = (id: string): string => {
  if (!id) return id;
  return id.replace(/^\uFEFF/, '');
};
