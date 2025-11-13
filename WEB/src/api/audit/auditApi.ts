import axiosInstance from '@/lib/axios';
import { AuditTrailResponse, ActivityResponse } from '@/types/audit';

/**
 * Fetch audit trail logs for the current user
 * @param token - The ActionBySystemUserId token from localStorage
 * @param sessionKey - The SessionKey from localStorage
 * @param page - Page number for pagination (default: 1)
 * @param pageSize - Number of items per page (default: 10)
 * @returns Promise<AuditTrailResponse>
 */
export const getAuditTrail = async (token: string, sessionKey: string, page: number = 1, pageSize: number = 10): Promise<AuditTrailResponse> => {
  try {
        const response = await axiosInstance.get(
      `/Logs/audit-trail/all/${encodeURIComponent(token)}?ActionBySystemUserId=${encodeURIComponent(token)}&SessionKey=${encodeURIComponent(sessionKey)}&pageNumber=${page}&pageSize=${pageSize}`
    );
    return response.data;

  } catch (error) {
    console.error('[AuditAPI] Failed to fetch audit trail:', error);
    throw error;
  }
};

export const getAllAuditTrail = async (token: string, sessionKey: string, page: number = 1, pageSize: number = 10): Promise<AuditTrailResponse> => {
  try {
        const response = await axiosInstance.get(
      `/Logs/audit-trail/all?ActionBySystemUserId=${encodeURIComponent(token)}&SessionKey=${encodeURIComponent(sessionKey)}&pageNumber=${page}&pageSize=${pageSize}`
    );
    return response.data;

  } catch (error) {
    console.error('[AuditAPI] Failed to fetch audit trail:', error);
    throw error;
  }
};


/**
 * Fetch activity logs for the current user
 * @param token - The ActionBySystemUserId token from localStorage
 * @param sessionKey - The SessionKey from localStorage
 * @param page - Page number for pagination (default: 1)
 * @param pageSize - Number of items per page (default: 10)
 * @returns Promise<ActivityResponse>
 */
export const getActivities = async (token: string, sessionKey: string, page: number = 1, pageSize: number = 10): Promise<ActivityResponse> => {
  try {
    const response = await axiosInstance.get(
      `/Logs/activities/all/${encodeURIComponent(token)}?ActionBySystemUserId=${encodeURIComponent(token)}&SessionKey=${encodeURIComponent(sessionKey)}&pageNumber=${page}&pageSize=${pageSize}`
    );
    return response.data;
  } catch (error) {
    console.error('[AuditAPI] Failed to fetch activities:', error);
    throw error;
  }
};



