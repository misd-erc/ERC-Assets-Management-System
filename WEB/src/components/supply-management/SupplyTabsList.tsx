// src/components/supply-management/SupplyTabsList.tsx
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

export const SupplyTabsList = () => {
  return (
    <TabsList className="grid w-full grid-cols-5">
      {/* <TabsTrigger value="categories">Categories</TabsTrigger> */}
      <TabsTrigger value="inventory">Inventory Items</TabsTrigger>
      <TabsTrigger value="units">Measurement Units</TabsTrigger>
      <TabsTrigger value="storage">Storage Locations</TabsTrigger>
      <TabsTrigger value="stock-cards">Stock Cards</TabsTrigger>
      <TabsTrigger value="ris-requests">RIS Requests</TabsTrigger>
      {/* <TabsTrigger value="allocations">Service Allocations</TabsTrigger> */}
    </TabsList>
  );
};