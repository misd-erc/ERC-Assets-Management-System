import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Truck } from 'lucide-react';

export const ContractTabsList = () => {
  return (
    /*w-full grid-cols-4 */
    <TabsList className="grid max-w-2xl">  
      <TabsTrigger value="vendor">
        <Truck className="w-4 h-4 mr-2" />
        Vendor
      </TabsTrigger>
    </TabsList>
  );
};




