import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { SummaryCards } from '../../components/supplies/SummaryCards';
import { SupplyTable } from '../../components/supplies/SupplyTable';
import { CategoriesView } from '../../components/supplies/CategoriesView';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Package, FileText, BarChart3 } from 'lucide-react';

export const SupplyManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="pl-64 pt-16 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supply Management</h1>
          <p className="text-gray-600">Manage inventory, track supplies, and handle RIS requests</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="ris" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            RIS Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <SummaryCards />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Recent supply activities will be displayed here.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Low Stock Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Items running low on stock will appear here.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <SupplyTable
            supplies={[]}
            onView={(supply) => console.log('View supply:', supply)}
            onEdit={(supply) => console.log('Edit supply:', supply)}
            onDelete={(supply) => console.log('Delete supply:', supply)}
          />
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <CategoriesView />
        </TabsContent>

        <TabsContent value="ris" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>RIS Request Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">RIS request functionality will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SupplyManagement;
