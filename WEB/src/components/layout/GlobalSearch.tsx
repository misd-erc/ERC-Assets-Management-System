import { useState } from 'react';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Search, Package, FileText, Users, Settings, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock search results
  const searchResults: SearchResult[] = [
    {
      id: 'asset-001',
      title: 'Desktop Computer - DELL-001',
      description: 'Assigned to John Doe, Finance Department',
      category: 'Assets',
      icon: Package,
      onClick: () => console.log('Navigate to asset')
    },
    {
      id: 'par-001',
      title: 'PAR-2024-001',
      description: 'Property acknowledgment receipt for IT equipment',
      category: 'Documents',
      icon: FileText,
      onClick: () => console.log('Navigate to PAR')
    },
    {
      id: 'user-001',
      title: 'John Doe',
      description: 'Finance Department - john.doe@erc.gov.ph',
      category: 'Users',
      icon: Users,
      onClick: () => console.log('Navigate to user')
    },
    {
      id: 'report-001',
      title: 'Monthly Asset Report',
      description: 'December 2024 comprehensive asset summary',
      category: 'Reports',
      icon: BarChart3,
      onClick: () => console.log('Navigate to report')
    }
  ];

  const filteredResults = searchResults.filter(result =>
    result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    result.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedResults = filteredResults.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const handleSelect = (result: SearchResult) => {
    result.onClick();
    onOpenChange(false);
    setSearchQuery('');
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search assets, documents, users, and more..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        {searchQuery && filteredResults.length === 0 && (
          <CommandEmpty>No results found for "{searchQuery}"</CommandEmpty>
        )}
        
        {!searchQuery && (
          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => console.log('Create RIS')}>
              <Package className="mr-2 h-4 w-4" />
              <span>Create New RIS</span>
              <Badge variant="secondary" className="ml-auto">Ctrl+R</Badge>
            </CommandItem>
            <CommandItem onSelect={() => console.log('Encode Asset')}>
              <Package className="mr-2 h-4 w-4" />
              <span>Encode New Asset</span>
              <Badge variant="secondary" className="ml-auto">Ctrl+E</Badge>
            </CommandItem>
            <CommandItem onSelect={() => console.log('Generate PAR')}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Generate PAR/ICS</span>
              <Badge variant="secondary" className="ml-auto">Ctrl+P</Badge>
            </CommandItem>
          </CommandGroup>
        )}

        {Object.entries(groupedResults).map(([category, results]) => (
          <CommandGroup key={category} heading={category}>
            {results.map((result) => (
              <CommandItem
                key={result.id}
                onSelect={() => handleSelect(result)}
                className="flex items-center space-x-2"
              >
                <result.icon className="mr-2 h-4 w-4" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{result.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{result.description}</p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}

        {searchQuery && filteredResults.length > 0 && (
          <CommandGroup heading="Advanced Filters">
            <CommandItem onSelect={() => console.log('Advanced search')}>
              <Search className="mr-2 h-4 w-4" />
              <span>Advanced search for "{searchQuery}"</span>
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}




