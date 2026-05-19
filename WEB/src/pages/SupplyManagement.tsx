// src/pages/SupplyManagement.tsx
import { useState } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';

import {
  SupplyGeneralHeader,
  SupplyTabsList,
  SupplyGroupedTabContent,
  SupplyReferenceTabContent
} from '@/components/supply-management';
import { SupplyRISTabContent } from '@/components/supply-management/supply-ris/SupplyRISTabContent';
import { StockCardTabContent } from '@/components/supply-management/supply-stock-card/StockCardTabContent';

export const SupplyManagement = () => {
  const [activeTab, setActiveTab] = useState('inventory');

  return (
    <div className="p-2 pt-5 md:pt-20 space-y-8">
      <SupplyGeneralHeader />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <SupplyTabsList />

        <TabsContent value="inventory">
          <SupplyGroupedTabContent />
        </TabsContent>

        <TabsContent value="stock-cards">
          <StockCardTabContent />
        </TabsContent>

        <TabsContent value="ris-requests">
          <SupplyRISTabContent />
        </TabsContent>

        <TabsContent value="setup">
          <SupplyReferenceTabContent />
        </TabsContent>
      </Tabs>
    </div>
  );
};