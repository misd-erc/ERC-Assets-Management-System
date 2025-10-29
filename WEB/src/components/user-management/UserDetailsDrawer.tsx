import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet';
import { Label } from '../ui/label';
import { User } from '../../types/user';
import { Mail, Building, Briefcase, Calendar, User as UserIcon } from 'lucide-react';

interface UserDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export const UserDetailsDrawer: React.FC<UserDetailsDrawerProps> = ({
  isOpen,
  onClose,
  user
}) => {
  if (!user) return null;

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800';
      case 'Suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[500px]">
        <SheetHeader>
          <SheetTitle>User Details</SheetTitle>
          <SheetDescription>
            View detailed information about this user
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* User Header */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900">{user.name}</h3>
              <p className="text-gray-500">@{user.username}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={`rounded-full px-3 py-1 ${getStatusColor(user.status)}`}>
                  {user.status || 'Active'}
                </Badge>
                <Badge className="rounded-full px-3 py-1 bg-blue-100 text-blue-800">
                  {user.role}
                </Badge>
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <div>
                <Label className="text-sm font-medium text-gray-700">Email</Label>
                <p className="text-gray-900">{user.email}</p>
              </div>
            </div>

            {user.position && (
              <div className="flex items-center gap-3">
                <Briefcase className="w-4 h-4 text-gray-400" />
                <div>
                  <Label className="text-sm font-medium text-gray-700">Position</Label>
                  <p className="text-gray-900">{user.position}</p>
                </div>
              </div>
            )}

            {user.department && (
              <div className="flex items-center gap-3">
                <Building className="w-4 h-4 text-gray-400" />
                <div>
                  <Label className="text-sm font-medium text-gray-700">Department</Label>
                  <p className="text-gray-900">{user.department}</p>
                </div>
              </div>
            )}

            {user.dateCreated && (
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <Label className="text-sm font-medium text-gray-700">Date Created</Label>
                  <p className="text-gray-900">{new Date(user.dateCreated).toLocaleDateString()}</p>
                </div>
              </div>
            )}

            {user.lastLogin && (
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <Label className="text-sm font-medium text-gray-700">Last Login</Label>
                  <p className="text-gray-900">{new Date(user.lastLogin).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
