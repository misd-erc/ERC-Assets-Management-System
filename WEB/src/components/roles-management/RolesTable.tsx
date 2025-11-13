import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Role } from '@/types/roles';

interface RolesTableProps {
  roles: Role[];
  onEditRole: (role: Role) => void;
  onDeleteRole: (roleId: string) => void;
}

export function RolesTable({ roles, onEditRole, onDeleteRole }: RolesTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Roles ({roles.length})</CardTitle>
        <CardDescription>
          Manage system roles and their permission assignments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Role ID</th>
                <th className="text-left p-3">Role Name</th>
                <th className="text-left p-3">Description</th>
                <th className="text-left p-3">Permissions</th>
                <th className="text-left p-3">Users</th>
                <th className="text-left p-3">Date Created</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono text-sm">{role.roleId}</td>
                  <td className="p-3 font-medium">{role.roleName}</td>
                  <td className="p-3 text-sm text-muted-foreground">{role.description}</td>
                  <td className="p-3">
                    <Badge variant="secondary">
                      {role.assignedPermissions.length} permissions
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline">
                      {role.userCount} users
                    </Badge>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {new Date(role.dateCreated).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditRole(role)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Role
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDeleteRole(role.id)}
                          disabled={role.userCount > 0}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Role
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}




