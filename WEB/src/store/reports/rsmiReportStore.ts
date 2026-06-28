// src/store/reports/rsmiReportStore.ts
import { create } from 'zustand';
import { supplyReportsApi } from '@/api/asset/supplyReportsApi';
import { FilteredRMSIItemGroupResponseModel } from '@/types/asset/RSMI';

interface RSMIReportState {
    data: FilteredRMSIItemGroupResponseModel[];
    totalCount: number;
    loading: boolean;
    error: string | null;

    // Actions
    fetchReport: (categoryId: string | number, startDate: string, endDate: string, page?: number, pageSize?: number) => Promise<void>;
    reset: () => void;
}

export const useRSMIReportStore = create<RSMIReportState>((set) => ({
    data: [],
    totalCount: 0,
    loading: false,
    error: null,

    fetchReport: async (categoryId, startDate, endDate, page = 1, pageSize = 10) => {
        set({ loading: true, error: null });
        try {
            const data = await supplyReportsApi.fetchRSMIFiltered(categoryId, startDate, endDate, page, pageSize);
            set({ data: data.items, totalCount: data.totalCount, loading: false });
        } catch (error: any) {
            console.error("Failed to fetch RSMI report data", error);
            set({
                data: [],
                totalCount: 0,
                error: error.response?.data?.message || "Failed to generate the report. Please try again.",
                loading: false
            });
        }
    },

    reset: () => set({ data: [], totalCount: 0, error: null, loading: false }),
}));
