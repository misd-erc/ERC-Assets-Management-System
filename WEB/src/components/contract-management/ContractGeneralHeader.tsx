import { Button } from '@/components/ui/button';
import { Truck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useVendor } from '@/hooks/contract/useVendor';

export const ContractGeneralHeader = () => {
  const { totalVendors } = useVendor();

  return (
    <div className="space-y-6">
      {/* Title + Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Contract Management</h1>
          <p className="text-muted-foreground">
            Manage vendors and other contract-related entities
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Vendors</p>
                <p className="text-2xl font-bold mt-1">{totalVendors}</p>
              </div>
              <Truck className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};





