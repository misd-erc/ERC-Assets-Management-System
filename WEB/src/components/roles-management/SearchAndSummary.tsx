import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';

interface SearchAndSummaryProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  totalRoles: number;
}

export function SearchAndSummary({ searchTerm, onSearchChange, totalRoles }: SearchAndSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
      <Card className="md:col-span-2">
        <CardContent className="p-3 sm:p-6">
          <Label htmlFor="search">Search Roles</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="search"
              placeholder="Search by role name, description, or ID"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3 sm:p-6">
          <div className="text-center">
            <p className="text-2xl font-semibold">{totalRoles}</p>
            <p className="text-sm text-muted-foreground">Total Roles</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




