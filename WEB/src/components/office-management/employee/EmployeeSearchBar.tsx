// src/components/office-management/employee/EmployeeSearchBar.tsx
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useEmployee } from '@/hooks';

export const EmployeeSearchBar = () => {
  const { searchQuery, setSearchQuery } = useEmployee();

  return (
    <div className="ms-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search employees by name, ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  );
};
