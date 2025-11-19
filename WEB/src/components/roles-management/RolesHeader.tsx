import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface RolesHeaderProps {
  onAddRole: () => void;
}

export function RolesHeader({ onAddRole }: RolesHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className='text-2xl font-semibold text-gray-900'>Role Management</h1>
        <p className="text-muted-foreground">
          Create and manage user roles with specific permissions
        </p>
      </div>
      <Button onClick={onAddRole} className="bg-blue-600 hover:bg-blue-700">
        <Plus className="w-4 h-4 mr-2" />
        Add Role
      </Button>
    </div>
  );
}




