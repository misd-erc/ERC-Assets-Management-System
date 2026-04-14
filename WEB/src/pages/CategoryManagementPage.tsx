import { useState } from 'react';
import { CategoryManagement, LegendsManagement } from '@/components/categories';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function CategoryManagementPage() {
  const [activeTab, setActiveTab] = useState('categories');

  return (
    <div className="p-2 pt-5 md:pt-20 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
            {activeTab === 'categories' ? 'Category Management' : 'Legends Management'}
          </h1>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
            {activeTab === 'categories' 
              ? 'Manage categories for your assets' 
              : 'Manage legends and folder paths'}
          </p>
        </div>
      </div>

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
