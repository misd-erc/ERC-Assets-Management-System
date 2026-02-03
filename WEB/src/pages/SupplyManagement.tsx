import { useState } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';

// Clean imports thanks to the index.ts file
import { 
  SupplyGeneralHeader, 
  SupplyTabsList, 
  SupplyItemTabContent,
  SupplyUnitTabContent,
  SupplyStorageTabContent
} from '@/components/supply-management';

export const SupplyManagement = () => {
  const [activeTab, setActiveTab] = useState('inventory');

  return (
    <div className="p-6 pt-20 space-y-8">
      <SupplyGeneralHeader />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <SupplyTabsList />

        {/* --- INVENTORY ITEMS --- */}
        <TabsContent value="inventory">
          <SupplyItemTabContent />
        </TabsContent>

        {/* --- UNITS --- */}
        <TabsContent value="units">
          <SupplyUnitTabContent />
        </TabsContent>

         {/* --- STORAGE LOCATIONS --- */}
         <TabsContent value="storage">
          <SupplyStorageTabContent />
        </TabsContent>

        {/* --- PLACEHOLDERS FOR FUTURE MODULES --- */}
        {/* <TabsContent value="categories">
           <div className="p-12 text-center text-muted-foreground border rounded-lg bg-slate-50">
             Category Module Coming Soon
           </div>
        </TabsContent> */}
        <TabsContent value="ris-requests">
           <div className="p-12 text-center text-muted-foreground border rounded-lg bg-slate-50">
             RIS Module Coming Soon
           </div>
        </TabsContent>
         <TabsContent value="stock-cards">
           <div className="p-12 text-center text-muted-foreground border rounded-lg bg-slate-50">
             Stock Cards Module Coming Soon
           </div>
        </TabsContent>
         <TabsContent value="allocations">
           <div className="p-12 text-center text-muted-foreground border rounded-lg bg-slate-50">
             Allocations Module Coming Soon
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};