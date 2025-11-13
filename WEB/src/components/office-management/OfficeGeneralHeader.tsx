// src/components/office/OfficeGeneralHeader.tsx
import { Button } from '@/components/ui/button';
import { Building2, Users, Briefcase, UserCheck, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useOffice, useDivision, useEmploymentType, usePosition } from '@/hooks';

export const OfficeGeneralHeader = () => {
  const { totalOffices } = useOffice();
  const { totalDivisions } = useDivision();
  const { totalEmploymentTypes } = useEmploymentType();
  const { totalPositions } = usePosition();

  return (
    <div className="pl-64 pt-16 space-y-8">
      {/* Title + Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Office Management</h1>
          <p className="text-muted-foreground">
            Manage offices, divisions, employment types, and positions
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Offices</p>
                <p className="text-2xl font-bold mt-1">{totalOffices}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Divisions</p>
                <p className="text-2xl font-bold mt-1">{totalDivisions}</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Employment Types</p>
                <p className="text-2xl font-bold mt-1">{totalEmploymentTypes}</p>
              </div>
              <Briefcase className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Positions</p>
                <p className="text-2xl font-bold mt-1">{totalPositions}</p>
              </div>
              <UserCheck className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};





