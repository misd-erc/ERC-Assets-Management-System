import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface RolesHeaderProps {
  onAddRole: () => void;
}

export function RolesHeader({ onAddRole }: RolesHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 className='text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white'>Role Management</h1>
        <p className="text-sm text-muted-foreground">
          Create and manage user roles with specific permissions
        </p>
      </div>
      <Button onClick={onAddRole} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
        <Plus className="w-4 h-4 mr-2" />
        Add Role
      </Button>
    </div>
  );
}




