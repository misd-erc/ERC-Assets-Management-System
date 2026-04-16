import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, Briefcase, UserCheck, UserCircle } from 'lucide-react';

export const OfficeTabsList = () => {
  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-5 sm:max-w-2xl">
        <TabsTrigger value="office" className="whitespace-nowrap">
          <Building2 className="w-4 h-4 mr-1 sm:mr-2" />
          Office
        </TabsTrigger>
        <TabsTrigger value="division" className="whitespace-nowrap">
          <Users className="w-4 h-4 mr-1 sm:mr-2" />
          Division
        </TabsTrigger>
        <TabsTrigger value="employment-type" className="whitespace-nowrap">
          <Briefcase className="w-4 h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Employment Type</span>
          <span className="sm:hidden">Emp. Type</span>
        </TabsTrigger>
        <TabsTrigger value="position" className="whitespace-nowrap">
          <UserCheck className="w-4 h-4 mr-1 sm:mr-2" />
          Position
        </TabsTrigger>
        <TabsTrigger value="employee" className="whitespace-nowrap">
          <UserCircle className="w-4 h-4 mr-1 sm:mr-2" />
          Employee
        </TabsTrigger>
      </TabsList>
    </div>
  );
};




