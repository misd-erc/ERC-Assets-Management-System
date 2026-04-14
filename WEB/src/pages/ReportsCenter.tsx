import React from "react";
import { ReportTab } from "@/components/assets/reports/ReportTab";

export default function ReportsCenter() {
  return (
    <div className="p-2 pt-5 md:pt-20 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">Reports Center</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Generate and view asset-related reports.</p>
      </div>
      <ReportTab />
    </div>
  );
}
