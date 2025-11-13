import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, Briefcase, UserCheck } from 'lucide-react';

export const OfficeTabsList = () => {
  return (
    <TabsList className="grid w-full grid-cols-4 max-w-2xl">
      <TabsTrigger value="office">
        <Building2 className="w-4 h-4 mr-2" />
        Office
      </TabsTrigger>
      <TabsTrigger value="division">
        <Users className="w-4 h-4 mr-2" />
        Division
      </TabsTrigger>
      <TabsTrigger value="employment-type">
        <Briefcase className="w-4 h-4 mr-2" />
        Employment Type
      </TabsTrigger>
      <TabsTrigger value="position">
        <UserCheck className="w-4 h-4 mr-2" />
        Position
      </TabsTrigger>
    </TabsList>
  );
};




