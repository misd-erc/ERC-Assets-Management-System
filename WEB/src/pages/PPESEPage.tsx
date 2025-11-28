import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AssetsPage } from './AssetsPage';
import { AssetType } from '@/services/assetService';
import { useState } from 'react';

export function PPESEPage() {
  const [activeTab, setActiveTab] = useState<AssetType>('ppe');

  return (
    <div className="p-6 pt-20 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">PPE & SE Encoding</h1>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AssetType)} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ppe">PPE Encoding</TabsTrigger>
          <TabsTrigger value="se">SE Encoding</TabsTrigger>
        </TabsList>

        <TabsContent value="ppe" className="mt-6">
          <AssetsPage type="ppe" />
        </TabsContent>

        <TabsContent value="se" className="mt-6">
          <AssetsPage type="se" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
