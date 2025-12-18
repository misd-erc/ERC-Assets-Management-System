import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { getCategories } from '@/api/inventoryApi';
import { toast } from 'sonner';

interface RPCPPEFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (year: number, categoryName?: string) => void;
}

export function RPCPPEFilterModal({ isOpen, onClose, onGenerate }: RPCPPEFilterModalProps) {
  const [year, setYear] = useState('');
  const [categoryId, setCategoryId] = useState<string>('all');
  const [categories, setCategories] = useState<any[]>([]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  useEffect(() => {
    if (isOpen) {
      getCategories().then(categoriesData => {
        setCategories(categoriesData);
      });
    }
  }, [isOpen]);

  const handleGenerate = () => {
    if (!year) {
      toast.error('Please select a year');
      return;
    }
    const selectedCategory = categories.find(cat => cat.id.toString() === categoryId);
    const categoryName = categoryId === 'all' ? undefined : selectedCategory?.name;
    onGenerate(Number(year), categoryName);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate RPCPPE Excel</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Year</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
