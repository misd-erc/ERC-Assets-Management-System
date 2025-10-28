import axiosInstance from '../lib/axios';
import { AuditTrailResponse } from '../types/audit';

/**
 * Fetch audit trail logs for the current user
 * @param token - The ActionBySystemUserIdEncrypted token from localStorage
 * @param page - Page number for pagination (default: 1)
 * @param pageSize - Number of items per page (default: 10)
 * @returns Promise<AuditTrailResponse>
 */
export const getAuditTrail = async (token: string, page: number = 1, pageSize: number = 10): Promise<AuditTrailResponse> => {
  try {
        const response = await axiosInstance.get(
      `/Logs/audit-trail/all/${encodeURIComponent(token)}?ActionBySystemUserIdEncrypted=${encodeURIComponent(token)}&pageNumber=${page}&pageSize=${pageSize}`
    );
    return response.data;

  } catch (error) {
    console.error('[AuditAPI] Failed to fetch audit trail:', error);
    throw error;
  }
};
