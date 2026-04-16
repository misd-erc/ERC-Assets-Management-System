import { ContractGeneralHeader } from "@/components/contract-management/ContractGeneralHeader";
import { ContractTabsList } from "@/components/contract-management/ContractTabsList";
import { VendorTabContent } from "@/components/contract-management/vendor/VendorTabContent";
import { Tabs, TabsContent } from "@/components/ui/tabs";

const ContractManagement = () => {
  return (
    <div className="p-2 pt-5 md:pt-20 space-y-8">
      <ContractGeneralHeader />
      <Tabs defaultValue="vendor" className="space-y-4">
        <ContractTabsList />
        <TabsContent value="vendor" className="space-y-4">
          <VendorTabContent />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContractManagement;