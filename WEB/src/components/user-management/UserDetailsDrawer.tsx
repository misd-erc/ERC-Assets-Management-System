import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '@/types/user';
import { Mail, Building, Briefcase, Calendar, User as UserIcon, MapPin, Users, IdCard } from 'lucide-react';
import { getUserPhoto, getUsersDetails } from '@/api/user-management/userApi';
import { getStatusColor } from '@/utils/colorUtils';
import { secureStorage } from '@/utils/secureStorage';


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
  const [userDetails, setUserDetails] = useState<User | null>(null);

  useEffect(() => {
    const loadProfilePicture = async () => {
      if (!user?.profilePictureStorageFile?.id) return;

      try {
        const systemUserId = secureStorage.getItem('systemUserId') || '';

        const fileId = String(user.profilePictureStorageFile.id);
        const photoResponse = await getUserPhoto(fileId, systemUserId);
        const imageUrl = URL.createObjectURL(photoResponse.data);
        setProfileImageUrl(imageUrl);
      } catch (error) {
        console.warn('Failed to load profile picture:', error);
      }
    };

    const loadUserDetails = async () => {
      if (!user?.id) return;

      try {
        const details = await getUsersDetails(user.id.toString()) as any; // Cast to any since UserDetails doesn't have all User properties
        setUserDetails({
          ...user,
          office: details.office || user.office,
          division: details.division || user.division,
          employmentType: details.employmentType || user.employmentType,
          position: details.position || user.position,
          systemRole: details.systemRole || user.systemRole,
          systemUserStatus: details.systemUserStatus || user.systemUserStatus,
        });
      } catch (error) {
        console.warn('Failed to load complete user details:', error);
        setUserDetails(user); // Fallback to original user data
      }
    };

    if (user) {
      loadProfilePicture();
      loadUserDetails();
    }
  }, [user]);

  // Use userDetails if available, otherwise fallback to user
  const displayUser = userDetails || user;

  if (!user) return null;

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
          <SheetTitle className='text-3xl font-semibold text-slate-900 dark:text-white'>User Details</SheetTitle>
          <SheetDescription>
            View detailed information about this user
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6 pb-6">
          {/* User Header */}
          <Card className="shadow-sm border-0 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
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
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{`${user.firstName} ${user.lastName}`}</h3>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">@{user.employeeId}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Badge className={`rounded-full px-4 py-2 text-sm font-semibold shadow-sm ${getStatusColor(user.systemUserStatus.name)}`}>
                      {user.systemUserStatus.name}
                    </Badge>
                    <Badge className="rounded-full px-4 py-2 text-sm font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                      {user.systemRole[0]?.roleName || 'No Role'}
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

              {displayUser!.office && (
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Office</Label>
                    <p className="text-slate-900 font-medium">{displayUser!.office.name}</p>
                  </div>
                </div>
              )}

              {displayUser!.division && (
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Division</Label>
                    <p className="text-slate-900 font-medium">{displayUser!.division.name}</p>
                  </div>
                </div>
              )}

              {displayUser!.employmentType && (
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Employment Type</Label>
                    <p className="text-slate-900 font-medium">{displayUser!.employmentType.name}</p>
                  </div>
                </div>
              )}

              {displayUser!.position && (
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <IdCard className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Position</Label>
                    <p className="text-slate-900 font-medium">{displayUser!.position.name}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Date Created</Label>
                  <p className="text-slate-900 font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Last Login</Label>
                  <p className="text-slate-900 font-medium">{new Date(user.lastLoginAt).toLocaleDateString()}</p>
                </div>
              </div>
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





