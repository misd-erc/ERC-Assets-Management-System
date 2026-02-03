// src/components/supply-management/supply-item/SupplyItemSearchBar.tsx
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useSupplyItem } from '@/hooks';

export const SupplyItemSearchBar = () => {
  const { searchQuery, setSearchQuery } = useSupplyItem();

  return (
    <div className="relative max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        placeholder="Search supplies by description or code..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10"
      />
    </div>
  );
};