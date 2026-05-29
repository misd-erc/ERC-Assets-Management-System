import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, FileSpreadsheet } from "lucide-react";
import { AddSupplyStockForm } from './AddSupplyStockForm';
import { IssuanceRISForm } from './IssuanceRISForm';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockNumber: string;
  description: string;
  unitId?: number;
  totalCurrentStock?: number;
  onSuccess: () => void;
}

export const IssuanceBypassModal = ({ open, onOpenChange, stockNumber, description, unitId, totalCurrentStock, onSuccess }: Props) => {
  const [activeTab, setActiveTab] = useState<'add-item' | 'ris'>('add-item');

  useEffect(() => {
    if (open) {
      setActiveTab('add-item');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-7xl !w-[60vw] max-h-[90vh] overflow-y-auto p-6 bg-white border border-slate-200 rounded-lg shadow-2xl flex flex-col gap-4">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-2xl text-slate-900 font-bold">
            Record Transaction: <span className="text-blue-600 font-mono">{stockNumber}</span>
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium text-sm mt-1">
            {description}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full flex-1">
          <TabsList className="h-auto grid grid-cols-2 w-full bg-slate-100/80 dark:bg-slate-900/50 p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-inner mb-6">
            <TabsTrigger
              value="add-item"
              className="group flex items-center justify-center gap-2 rounded-lg py-2.5 font-semibold text-sm transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-md hover:bg-slate-200/50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300"
            >
              <PlusCircle className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
              <span>Add Supply Stock</span>
            </TabsTrigger>
            <TabsTrigger
              value="ris"
              className="group flex items-center justify-center gap-2 rounded-lg py-2.5 font-semibold text-sm transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-md hover:bg-slate-200/50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300"
            >
              <FileSpreadsheet className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
              <span>RIS (Issuance)</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Add Supply Stock */}
          <TabsContent value="add-item">
            <AddSupplyStockForm
              stockNumber={stockNumber}
              description={description}
              unitId={unitId}
              onSuccess={onSuccess}
              onCancel={() => onOpenChange(false)}
            />
          </TabsContent>

          {/* TAB 2: RIS Requisition shortcut */}
          <TabsContent value="ris">
            <IssuanceRISForm
              stockNumber={stockNumber}
              description={description}
              unitId={unitId}
              totalCurrentStock={totalCurrentStock}
              onSuccess={onSuccess}
              onCancel={() => onOpenChange(false)}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
