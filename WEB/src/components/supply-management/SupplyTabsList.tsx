// src/components/supply-management/SupplyTabsList.tsx
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Boxes, FileText, ClipboardList, Settings } from 'lucide-react';

export const SupplyTabsList = () => {
  return (
    <TabsList className="h-auto grid grid-cols-2 sm:grid-cols-4 w-full bg-slate-100/80 dark:bg-slate-900/50 p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-inner mb-6">
      <TabsTrigger 
        value="inventory"
        className="group flex items-center justify-center gap-2 rounded-lg py-2.5 font-semibold text-sm transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-md hover:bg-slate-200/50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300"
      >
        <Boxes className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
        <span>Inventory Items</span>
      </TabsTrigger>
      
      <TabsTrigger 
        value="stock-cards"
        className="group flex items-center justify-center gap-2 rounded-lg py-2.5 font-semibold text-sm transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-md hover:bg-slate-200/50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300"
      >
        <FileText className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
        <span>Stock Cards</span>
      </TabsTrigger>
      
      <TabsTrigger 
        value="ris-requests"
        className="group flex items-center justify-center gap-2 rounded-lg py-2.5 font-semibold text-sm transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-md hover:bg-slate-200/50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300"
      >
        <ClipboardList className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
        <span>RIS Requests</span>
      </TabsTrigger>
      
      <TabsTrigger 
        value="setup"
        className="group flex items-center justify-center gap-2 rounded-lg py-2.5 font-semibold text-sm transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-md hover:bg-slate-200/50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300"
      >
        <Settings className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
        <span>Setup & Reference</span>
      </TabsTrigger>
    </TabsList>
  );
};