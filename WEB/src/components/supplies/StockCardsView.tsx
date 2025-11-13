import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useStockCards } from '@/hooks/data/useStockCards';
import { DataTable } from '@/components/common/DataTable';
import { Badge } from '@/components/ui/badge';
import { StockCardEntry } from '@/types/supply/stockCard';

export const StockCardsView: React.FC = () => {
  const { stockCards } = useStockCards();

  const columns = [
    { key: 'date', label: 'Date', render: (v: string) => new Date(v).toLocaleDateString() },
    { key: 'referenceNumber', label: 'Reference No.' },
    { key: 'transactionType', label: 'Type', render: (v: string) => <Badge className={`px-2 py-0.5 text-xs`}>{v}</Badge> },
    { key: 'quantityIn', label: 'Qty In' },
    { key: 'quantityOut', label: 'Qty Out' },
    { key: 'balance', label: 'Balance' },
    { key: 'processedBy', label: 'Processed By' }
  ];

  // Optionally group/filter by supplyId or render per-item view
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Cards (FIFO/LIFO Monitoring)</CardTitle>
        <CardDescription>Track item movement history with FIFO compliance</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input placeholder="Search by reference or type..." className="pl-9" />
          </div>
        </div>

        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <DataTable data={stockCards as StockCardEntry[]} columns={columns} emptyMessage="No stock movements yet." />
        </div>
      </CardContent>
    </Card>
  );
};




