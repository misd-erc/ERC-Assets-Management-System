import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { useServiceAllocations } from '../../hooks/data/useServiceAllocations';
import { DataTable } from '../common/DataTable';
import { Progress } from '../ui/progress';

export const ServiceAllocationsView: React.FC = () => {
  const { allocations } = useServiceAllocations();

  const columns = [
    { key: 'department', label: 'Department/Service' },
    { key: 'totalAllocation', label: 'Total Allocation', render: (v: number) => `₱${v.toLocaleString()}` },
    { key: 'totalIssued', label: 'Items Issued', render: (v: number) => `₱${v.toLocaleString()}` },
    { key: 'balance', label: 'Balance', render: (_: any, row: any) => `₱${(row.totalAllocation - row.totalIssued).toLocaleString()}` },
    { key: 'util', label: 'Utilization', render: (_: any, row: any) => {
      const rate = row.totalAllocation > 0 ? (row.totalIssued / row.totalAllocation) * 100 : 0;
      return (
        <div className="flex items-center space-x-2">
          <Progress value={rate} className="w-28 h-2" />
          <span className="text-xs">{Math.round(rate)}%</span>
        </div>
      );
    }},
    { key: 'lastUpdated', label: 'Last Updated', render: (v: string) => v ? new Date(v).toLocaleDateString() : '-' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Per Service Allocation</CardTitle>
        <CardDescription>Track allocation of supplies per department/office with quota monitoring</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <DataTable data={allocations as any[]} columns={columns} emptyMessage="No service allocations set up yet." />
        </div>
      </CardContent>
    </Card>
  );
};
