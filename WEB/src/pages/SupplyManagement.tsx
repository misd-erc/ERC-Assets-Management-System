import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { SummaryCards } from '../components/supplies/SummaryCards';
import { SupplyTable } from '../components/supplies/SupplyTable';
import { CategoriesView } from '../components/supplies/CategoriesView';
import { StockCardsView } from '../components/supplies/StockCardsView';
import { ServiceAllocationsView } from '../components/supplies/ServiceAllocationsView';
import { RISRequestsView } from '../components/supplies/RISRequestsView';
import { Card, CardHeader, CardTitle } from '../components/ui/card';
import { Package, FileText, BarChart3, ClipboardList, Users } from 'lucide-react';

export const SupplyManagement: React.FC = () => {
  const [tab, setTab] = useState('overview');

  return (
    <div className="pl-64 pt-16 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supply Management</h1>
          <p className="text-gray-600">Manage inventory, track supplies, and handle RIS requests</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2"><BarChart3 className="w-4 h-4" />Overview</TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2"><Package className="w-4 h-4" />Inventory</TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2"><FileText className="w-4 h-4" />Categories</TabsTrigger>
          <TabsTrigger value="stockcards" className="flex items-center gap-2"><ClipboardList className="w-4 h-4" />Stock Cards</TabsTrigger>
          <TabsTrigger value="allocations" className="flex items-center gap-2"><Users className="w-4 h-4" />Service Allocations</TabsTrigger>
          <TabsTrigger value="ris" className="flex items-center gap-2"><FileText className="w-4 h-4" />RIS Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <SummaryCards />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
              <div className="p-4 text-slate-600">Recent activities will appear here</div>
            </Card>
            <Card>
              <CardHeader><CardTitle>Low Stock Alerts</CardTitle></CardHeader>
              <div className="p-4 text-slate-600">Low stock alerts will appear here</div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory">
          <SupplyTable />
        </TabsContent>

        <TabsContent value="categories">
          <CategoriesView />
        </TabsContent>

        <TabsContent value="stockcards">
          <StockCardsView />
        </TabsContent>

        <TabsContent value="allocations">
          <ServiceAllocationsView />
        </TabsContent>

        <TabsContent value="ris">
          <RISRequestsView />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SupplyManagement;
