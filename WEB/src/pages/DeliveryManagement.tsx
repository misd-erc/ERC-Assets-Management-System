import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeliveryRecordTabContent } from "@/components/delivery/delivery-record/DeliveryRecordTabContent";
import { DeliveryGeneralHeader } from "@/components/delivery/DeliveryGeneralHeader";
import { SupplyIARTabContent } from "@/components/delivery/iar/SupplyIARTabContent";
import { Truck, ClipboardCheck } from "lucide-react";

// Peek (without consuming) a pending notification deep-link so the IAR tab opens automatically
// when arriving from an "IAR submitted" notification. SupplyIARTabContent consumes/clears the key.
const getInitialTab = (): string => {
  const raw = sessionStorage.getItem('_notifNav');
  if (!raw) return 'deliveries';
  try {
    const parsed = JSON.parse(raw);
    return parsed.iarId ? 'iar' : 'deliveries';
  } catch {
    return 'deliveries';
  }
};

const DeliveryManagement = () => {
  const [activeTab, setActiveTab] = useState(getInitialTab);

  return (
    <div className="p-6 md:p-8 space-y-6">

      <DeliveryGeneralHeader />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="h-auto grid grid-cols-2 w-full bg-slate-100/80 dark:bg-slate-900/50 p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-inner mb-6">
          <TabsTrigger
            value="deliveries"
            className="group flex items-center justify-center gap-2 rounded-lg py-2.5 font-semibold text-sm transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-md hover:bg-slate-200/50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300"
          >
            <Truck className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
            <span>Delivery Records</span>
          </TabsTrigger>
          <TabsTrigger
            value="iar"
            className="group flex items-center justify-center gap-2 rounded-lg py-2.5 font-semibold text-sm transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-md hover:bg-slate-200/50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300"
          >
            <ClipboardCheck className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
            <span>Inspection & Acceptance (IAR)</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="iar" className="space-y-4">
           <SupplyIARTabContent />
        </TabsContent>

        <TabsContent value="deliveries" className="space-y-4">
           <DeliveryRecordTabContent />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeliveryManagement;