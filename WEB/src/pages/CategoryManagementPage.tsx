import { useState } from 'react';
import { CategoryManagement, LegendsManagement } from '@/components/categories';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function CategoryManagementPage() {
  const [activeTab, setActiveTab] = useState('categories');

  return (
    <div className="pt-20">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="legends">Legends</TabsTrigger>
        </TabsList>
        <TabsContent value="categories" className="space-y-6">
          <CategoryManagement />
        </TabsContent>
        <TabsContent value="legends" className="space-y-6">
          <LegendsManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
