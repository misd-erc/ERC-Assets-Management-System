import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getCategories } from '@/api/asset/inventoryApi';
import { toast } from 'sonner';

export type RPCSPReportType = 'ISSUED' | 'ONSTOCK';

interface RPCSPFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (date: Date, reportType: RPCSPReportType, categoryId?: number) => void;
}

export function RPCSPFilterModal({ isOpen, onClose, onGenerate }: RPCSPFilterModalProps) {
  const [asOfDate, setAsOfDate] = useState('');
  const [reportType, setReportType] = useState<RPCSPReportType>('ISSUED');
  const [categoryId, setCategoryId] = useState<string>('all');
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      getCategories('SE').then(categoriesData => {
        setCategories(categoriesData);
      });
    }
  }, [isOpen]);

  const handleGenerate = () => {
    if (!asOfDate) {
      toast.error('Please select a date');
      return;
    }
    const selectedCategoryId = categoryId === 'all' ? undefined : Number(categoryId);
    onGenerate(new Date(asOfDate), reportType, selectedCategoryId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate RPCSP REPORT</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Report Type</Label>
            <Select value={reportType} onValueChange={(v) => setReportType(v as RPCSPReportType)}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ISSUED">Issued (SE items assigned to employees)</SelectItem>
                <SelectItem value="ONSTOCK">On Stock (SE items not yet issued)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">As of Date</Label>
            <Input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleGenerate}>Generate Report</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
