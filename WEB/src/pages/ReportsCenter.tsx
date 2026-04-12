import React from "react";
import { ReportTab } from "@/components/assets/reports/ReportTab";

export default function ReportsCenter() {
  return (
    <div className="p-2 pt-5 md:pt-20 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Reports Center</h1>
        <p className="text-sm text-slate-600">Generate and view asset-related reports.</p>
      </div>
      <ReportTab />
    </div>
  );
}
