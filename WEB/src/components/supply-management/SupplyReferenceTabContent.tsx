import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Ruler, Warehouse } from 'lucide-react';
import { SupplyUnitTabContent } from './supply-unit/SupplyUnitTabContent';
import { SupplyStorageTabContent } from './supply-storage/SupplyStorageTabContent';

export const SupplyReferenceTabContent = () => {
  const [activeSubTab, setActiveSubTab] = useState<'units' | 'storage'>('units');

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Navigation Sidebar */}
      <Card className="md:col-span-1 border-slate-200 dark:border-slate-800 shadow-sm max-h-fit bg-white dark:bg-slate-900">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Reference Setup</CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Configure reference configurations and lookup categories used across supply items.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2 space-y-1">
          <button
            type="button"
            onClick={() => setActiveSubTab('units')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeSubTab === 'units'
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Ruler className="w-4 h-4 shrink-0" />
            <span>Measurement Units</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('storage')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeSubTab === 'storage'
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Warehouse className="w-4 h-4 shrink-0" />
            <span>Storage Locations</span>
          </button>
        </CardContent>
      </Card>

      {/* Content Area */}
      <div className="md:col-span-3">
        {activeSubTab === 'units' ? (
          <SupplyUnitTabContent />
        ) : (
          <SupplyStorageTabContent />
        )}
      </div>
    </div>
  );
};
