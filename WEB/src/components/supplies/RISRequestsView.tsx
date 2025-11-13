import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRISRequests } from '@/hooks/data/useRISRequests';
import { DataTable } from '@/components/common/DataTable';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/formatters';

export const RISRequestsView: React.FC = () => {
  const { risRequests } = useRISRequests();

  const columns = [
    { key: 'risNumber', label: 'RIS No.' },
    { key: 'requester', label: 'Requester' },
    { key: 'department', label: 'Department' },
    { key: 'dateRequested', label: 'Date', render: (v: string) => new Date(v).toLocaleDateString() },
    { key: 'itemsCount', label: 'Items Requested', render: (_: any, r: any) => `${r.items.length} item(s)` },
    { key: 'totalEstimatedValue', label: 'Total Value', render: (v: number) => formatCurrency(v) },
    { key: 'status', label: 'Status', render: (v: string) => <Badge className={v === 'pending' ? 'bg-yellow-100 text-yellow-800' : v === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{v}</Badge> }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>RIS Requests (Issuance)</CardTitle>
        <CardDescription>Handle requisition slips and issuance approval workflow</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <DataTable data={risRequests as any[]} columns={columns} emptyMessage="No RIS requests yet." />
        </div>
      </CardContent>
    </Card>
  );
};





