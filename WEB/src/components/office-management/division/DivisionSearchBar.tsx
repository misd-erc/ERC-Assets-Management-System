import { Input } from '@/ui/input';
import { Search } from 'lucide-react';
import { useDivision } from '@/hooks';

export const DivisionSearchBar = () => {
  const { searchQuery, setSearchQuery } = useDivision();

  return (
    <div className='ms-6'>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search divisions by name or acronym..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      </div>
  );
};

