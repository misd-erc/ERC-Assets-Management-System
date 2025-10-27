/**
 * Sanitization Utilities
 * Functions for cleaning and sanitizing data, especially encrypted IDs
 */

/**
 * Sanitizes systemUserIdEncrypted by removing BOM (Byte Order Mark) character
 * @param id The systemUserIdEncrypted string to sanitize
 * @returns The sanitized string with BOM removed
 */
export const sanitizeSystemUserId = (id: string): string => {
  if (!id) return id;
  return id.replace(/^\uFEFF/, '');
};
