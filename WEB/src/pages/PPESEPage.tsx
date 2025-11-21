import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PPEList } from './ppe/PPEList';
import { SEList } from './se/SEList';

export function PPESEPage() {
  const [activeTab, setActiveTab] = useState('ppe');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">PPE & SE Encoding</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ppe">PPE Encoding</TabsTrigger>
          <TabsTrigger value="se">SE Encoding</TabsTrigger>
        </TabsList>

        <TabsContent value="ppe" className="mt-6">
          <PPEList />
        </TabsContent>

        <TabsContent value="se" className="mt-6">
          <SEList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
