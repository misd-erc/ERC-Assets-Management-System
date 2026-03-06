import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeliveryRecordTabContent } from "@/components/delivery/delivery-record/DeliveryRecordTabContent";
import { DeliveryGeneralHeader } from "@/components/delivery/DeliveryGeneralHeader";
import { SupplyIARTabContent } from "@/components/delivery/iar/SupplyIARTabContent";

const DeliveryManagement = () => {
  return (
    <div className="p-6 pt-20 space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
           <h2 className="text-2xl font-semibold text-slate-900">Deliveries & Receipts</h2>
           <p className="text-muted-foreground">Manage incoming deliveries and inspection reports.</p>
        </div>
      </div>

      <DeliveryGeneralHeader />

      <Tabs defaultValue="iar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="iar">Inspection & Acceptance</TabsTrigger>
          <TabsTrigger value="deliveries">Delivery Records</TabsTrigger>
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