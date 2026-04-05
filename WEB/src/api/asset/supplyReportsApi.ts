// src/services/api/supplyReportsApi.ts
import axiosInstance from '@/lib/axios';
import { getAuthParams } from '@/utils/auth';
import { FilteredRMSIItemGroupResponseModel } from '@/types/asset/RSMI'; // Adjust path if needed

// Match the ApiResponse interface from your system
interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
}

export const supplyReportsApi = {
    fetchRSMIFiltered: async (
        categoryId: string | number,
        startDate: string,
        endDate: string
    ): Promise<FilteredRMSIItemGroupResponseModel[]> => {

        // 1. Grab the auth credentials just like in issuanceApi
        const { systemUserId, sessionKey } = getAuthParams();

        // 2. Make the request, appending the auth credentials to the params
        const response = await axiosInstance.get<ApiResponse<FilteredRMSIItemGroupResponseModel[]>>(
            `/supply/rmsi-items/filter/${categoryId}/${startDate}/${endDate}`,
            {
                params: {
                    // These fulfill your C# [ValidateSessionToken] and SoloQueryParams requirements
                    SystemUserId: systemUserId,
                    ActionBySystemUserId: systemUserId, // Passed both just to be safe with your backend model
                    SessionKey: sessionKey,
                },
            }
        );

        // 3. Return the data payload
        return response.data.data || [];
    }
};