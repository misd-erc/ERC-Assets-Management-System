// src/store/reports/rsmiReportStore.ts
import { create } from 'zustand';
import { supplyReportsApi } from '@/api/asset/supplyReportsApi';
import { FilteredRMSIItemGroupResponseModel } from '@/types/asset/RSMI';

interface RSMIReportState {
    data: FilteredRMSIItemGroupResponseModel[];
    loading: boolean;
    error: string | null;

    // Actions
    fetchReport: (categoryId: string | number, startDate: string, endDate: string) => Promise<void>;
    reset: () => void;
}

export const useRSMIReportStore = create<RSMIReportState>((set) => ({
    data: [],
    loading: false,
    error: null,

    fetchReport: async (categoryId, startDate, endDate) => {
        set({ loading: true, error: null });
        try {
            const data = await supplyReportsApi.fetchRSMIFiltered(categoryId, startDate, endDate);
            set({ data, loading: false });
        } catch (error: any) {
            console.error("Failed to fetch RSMI report data", error);
            set({
                data: [],
                error: error.response?.data?.message || "Failed to generate the report. Please try again.",
                loading: false
            });
        }
    },

    reset: () => set({ data: [], error: null, loading: false }),
}));