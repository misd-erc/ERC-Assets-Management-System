// src/pages/SupplyManagement.tsx (or wherever the page is)
import { useState } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';

import {
  SupplyGeneralHeader,
  SupplyTabsList,
  SupplyGroupedTabContent, // <-- Import the new grouped tab content
  SupplyUnitTabContent,
  SupplyStorageTabContent
} from '@/components/supply-management';
import { SupplyRISTabContent } from '@/components/supply-management/supply-ris/SupplyRISTabContent';

export const SupplyManagement = () => {
  const [activeTab, setActiveTab] = useState('inventory');

  return (
    <div className="p-6 pt-20 space-y-8">
      <SupplyGeneralHeader />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <SupplyTabsList />

        {/* --- INVENTORY ITEMS (GROUPED) --- */}
        <TabsContent value="inventory">
          <SupplyGroupedTabContent /> {/* Replaced old SupplyItemTabContent */}
        </TabsContent>

        {/* --- UNITS --- */}
        <TabsContent value="units">
          <SupplyUnitTabContent />
        </TabsContent>

        {/* --- STORAGE LOCATIONS --- */}
        <TabsContent value="storage">
          <SupplyStorageTabContent />
        </TabsContent>

      <TabsContent value="ris-requests">
        <SupplyRISTabContent />
      </TabsContent>
        {/* ... other tabs ... */}
      </Tabs>
    </div>
  );
};