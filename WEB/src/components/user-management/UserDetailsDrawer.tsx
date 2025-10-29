import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { User } from '../../types/user';
import { Mail, Building, Briefcase, Calendar, User as UserIcon, MapPin, Users, IdCard } from 'lucide-react';
import { getUserPhoto } from '../../api/userApi';
import { encrypt } from '../../utils/encryption';

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
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>();

  useEffect(() => {
    const loadProfilePicture = async () => {
      if (!user?.profilePictureStorageFileId) return;

      try {
        const token = localStorage.getItem('ActionBySystemUserIdEncrypted');
        if (!token) return;

        const fileIdEncrypted = encrypt(String(user.profilePictureStorageFileId));
        const photoResponse = await getUserPhoto(fileIdEncrypted, token);
        const imageUrl = URL.createObjectURL(photoResponse.data);
        setProfileImageUrl(imageUrl);
      } catch (error) {
        console.warn('Failed to load profile picture:', error);
      }
    };

    if (user) {
      loadProfilePicture();
    }
  }, [user]);

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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>User Details</SheetTitle>
          <SheetDescription>
            View detailed information about this user
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6 pb-6">
          {/* User Header */}
          <Card className="shadow-sm border-0 bg-gradient-to-r from-slate-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                  <AvatarImage
                    src={profileImageUrl || undefined}
                    alt={`${user.firstName} ${user.lastName}`}
                  />
                  <AvatarFallback className="text-lg font-semibold text-blue-700 bg-blue-50">
                    {getInitials(`${user.firstName} ${user.lastName}`)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-900">{user.name}</h3>
                  <p className="text-slate-600 font-medium">@{user.username}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Badge className={`rounded-full px-4 py-2 text-sm font-semibold shadow-sm ${getStatusColor(user.status)}`}>
                      {user.status || 'Active'}
                    </Badge>
                    <Badge className="rounded-full px-4 py-2 text-sm font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {user.role}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Information */}
          <Card className="shadow-sm border-0 bg-white">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Email</Label>
                  <p className="text-slate-900 font-medium">{user.email}</p>
                </div>
              </div>

              {user.position && (
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Position</Label>
                    <p className="text-slate-900 font-medium">{user.position}</p>
                  </div>
                </div>
              )}

              {user.department && (
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Building className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Department</Label>
                    <p className="text-slate-900 font-medium">{user.department}</p>
                  </div>
                </div>
              )}

              {user.officeName && (
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Office</Label>
                    <p className="text-slate-900 font-medium">{user.officeName}</p>
                  </div>
                </div>
              )}

              {user.divisionName && (
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Division</Label>
                    <p className="text-slate-900 font-medium">{user.divisionName}</p>
                  </div>
                </div>
              )}

              {user.employmentTypeId && (
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                    <IdCard className="w-5 h-5 text-pink-600" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Employment Type</Label>
                    <p className="text-slate-900 font-medium">{user.employmentTypeId}</p>
                  </div>
                </div>
              )}

              {user.dateCreated && (
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Date Created</Label>
                    <p className="text-slate-900 font-medium">{new Date(user.dateCreated).toLocaleDateString()}</p>
                  </div>
                </div>
              )}

              {user.lastLogin && (
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Last Login</Label>
                    <p className="text-slate-900 font-medium">{new Date(user.lastLogin).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="shadow-sm border-0 bg-white">
            <CardContent className="p-6">
              <div className="flex justify-end">
                <Button variant="outline" onClick={onClose} className="px-6 py-2 font-semibold text-slate-700 border-slate-300 hover:bg-slate-50">
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
};
