// src/hooks/supply/useRSMIReport.ts
import { useRSMIReportStore } from '@/store/reports/rsmiReportStore';

export const useRSMIReport = () => {
    const store = useRSMIReportStore();

    // Computed property mimicking your useStockCard pattern
    const totalGroups = store.data.length;

    // If you also want to calculate the grand total of ALL issued items across all groups:
    const grandTotalIssued = store.data.reduce((sum, group) => sum + (group.total || 0), 0);

    return {
        ...store,
        totalGroups,
        grandTotalIssued
    };
};