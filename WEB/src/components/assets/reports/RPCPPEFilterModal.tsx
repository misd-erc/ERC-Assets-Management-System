import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getCategories } from '@/api/asset/inventoryApi';
import { toast } from 'sonner';

interface RPCPPEFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (date: Date, categoryId?: number) => void;
}

export function RPCPPEFilterModal({ isOpen, onClose, onGenerate }: RPCPPEFilterModalProps) {
  const [asOfDate, setAsOfDate] = useState('');
  const [categoryId, setCategoryId] = useState<string>('all');
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      getCategories().then(categoriesData => {
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
    onGenerate(new Date(asOfDate), selectedCategoryId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate RPCPPE Excel</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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
            <Select value={categoryId} onValueChange={(value) => setCategoryId(value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
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
          <Button onClick={handleGenerate}>Generate Excel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
