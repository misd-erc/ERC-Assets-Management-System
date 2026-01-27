import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useDivision } from '@/hooks';
import { useVendor } from '@/hooks';

export const VendorSearchBar = () => {
  const { searchQuery, setSearchQuery } = useVendor();

  return (
    <div className='ms-6'>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search vendors by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      </div>
  );
};





