// src/components/supply-management/SupplyTabsList.tsx
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

export const SupplyTabsList = () => {
  return (
    <TabsList className="grid w-full grid-cols-4">
      <TabsTrigger value="inventory">Inventory Items</TabsTrigger>
      <TabsTrigger value="stock-cards">Stock Cards</TabsTrigger>
      <TabsTrigger value="ris-requests">RIS Requests</TabsTrigger>
      <TabsTrigger value="setup">Setup & Reference</TabsTrigger>
    </TabsList>
  );
};