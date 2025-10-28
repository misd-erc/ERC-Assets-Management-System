import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Mail,
  Phone,
  MapPin,
  Building,
  Briefcase,
  Calendar,
  Edit2,
  User,
  Save,
  X,
  Camera,
  Loader2
} from 'lucide-react';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useAuthStore } from '../../store/auth';
import { editUserProfile } from '../../api/authApi';
import { getUserAuditTrail } from '../../api/userApi';
import { uploadProfilePicture, retrieveFile } from '../../api/uploadApi';
import { timeAgo } from '../../utils/dateUtils';
import { AuditTrailItem } from '../../types/audit';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export const MyProfile = React.memo(() => {
  const { userProfile, loading, refreshProfile } = useUserProfile();
  const { systemUserIdEncrypted } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile picture state
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);

  // Load profile picture on mount
  React.useEffect(() => {
    const loadProfilePicture = async () => {
      const profilePictureId = localStorage.getItem('profilePictureId');
      if (profilePictureId) {
        try {
          const url = await retrieveFile(profilePictureId);
          setProfilePictureUrl(url);
        } catch (error) {
          console.error('Failed to load profile picture:', error);
          // Fallback to initials
        }
      }
    };
    loadProfilePicture();
  }, []);

  // Audit trail state
  const [auditLogs, setAuditLogs] = useState<AuditTrailItem[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditPage, setAuditPage] = useState(1);
  const [auditHasMore, setAuditHasMore] = useState(true);



  // Fetch audit trail on tab switch to activity
  React.useEffect(() => {
    if (activeTab === 'activity' && systemUserIdEncrypted) {
      fetchAuditTrail();
    }
  }, [activeTab, systemUserIdEncrypted]);

  const fetchAuditTrail = async () => {
    if (!systemUserIdEncrypted) return;

    setAuditLoading(true);
    setAuditError(null);
    try {
      const response = await getUserAuditTrail(systemUserIdEncrypted, auditPage, 10);
      if (response.success) {
        setAuditLogs(response.data.items);
        setAuditHasMore(auditPage < response.data.totalPages);
      } else {
        setAuditError('Failed to load audit trail');
      }
    } catch (error) {
      console.error('Failed to fetch audit trail:', error);
      setAuditError('Failed to load audit trail');
    } finally {
      setAuditLoading(false);
    }
  };

  const formatDate = (dateStr: string, format: string) => {
    try {
      if (!dateStr) return 'N/A';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Invalid Date';
      if (format === 'Month DD, YYYY') {
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      } else if (format === 'Month DD, YYYY HH:mm') {
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + ' ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      }
      return dateStr;
    } catch {
      return 'Invalid Date';
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, JPEG, and PNG files are allowed');
      return;
    }

    if (!systemUserIdEncrypted) return;

    setUploadingPicture(true);
    try {
      const response = await uploadProfilePicture(file, systemUserIdEncrypted, systemUserIdEncrypted);
      const newUrl = await retrieveFile(response.fileStorageIdEncrypted);

      // Store in localStorage
      localStorage.setItem('profilePictureId', response.fileStorageIdEncrypted);

      // Update state
      setProfilePictureUrl(newUrl);
      toast.success('Profile picture updated successfully');
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setUploadingPicture(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };



  if (loading) {
    return (
      <div className="pl-64 pt-16 space-y-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Loading profile information...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="pl-64 pt-16 space-y-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500 mt-1">No user data available.</p>
        </div>
      </div>
    );
  }

  const fullName = `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || 'Unknown User';
  const initials = ((userProfile.firstName || '')[0] || '') + ((userProfile.lastName || '')[0] || '') || 'U';
  const statusBadge = userProfile.isActive ? 'Active' : 'Inactive';
  const roleBadge = 'User'; // Assuming role is not in API, or add if available
  const dateJoined = formatDate(userProfile.createdAt, 'Month DD, YYYY');
  const lastLogin = formatDate(userProfile.lastLoginAt, 'Month DD, YYYY HH:mm');

  return (
    <div className="pl-64 pt-16 space-y-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">View and manage your profile information</p>
      </div>

      {/* Persistent Profile Card */}
      <Card className="rounded-xl shadow-sm border-gray-200 mb-6">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="relative">
                {profilePictureUrl ? (
                  <img
                    src={profilePictureUrl}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xl shadow-sm">
                    {initials}
                  </div>
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-white border-2 border-white shadow-md hover:bg-gray-50"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingPicture}
                      >
                        {uploadingPicture ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Upload a new profile picture</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleProfilePictureUpload}
                  accept=".jpg,.jpeg,.png"
                  className="hidden"
                />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{fullName}</h3>
                <p className="text-gray-500">@{userProfile.email ? userProfile.email.split('@')[0] : 'unknown'}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`rounded-full px-3 py-1 bg-blue-100 text-blue-800 border-blue-200`}>{roleBadge}</Badge>
                  <Badge className={`rounded-full px-3 py-1 ${userProfile.isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>{statusBadge}</Badge>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-0 h-auto font-normal"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingPicture}
                      >
                        {uploadingPicture ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Camera className="w-4 h-4 mr-1" />
                            {profilePictureUrl ? 'Change Picture' : 'Upload Image'}
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Upload a new profile picture</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Profile Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto bg-gray-100 rounded-full p-1 h-12">
            <TabsTrigger
              value="overview"
              className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-blue-500 data-[state=active]:text-gray-900 data-[state=inactive]:bg-gray-50 data-[state=inactive]:text-gray-600"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-blue-500 data-[state=active]:text-gray-900 data-[state=inactive]:bg-gray-50 data-[state=inactive]:text-gray-600"
            >
              Activity
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Two-Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Details */}
            <Card className="rounded-xl shadow-sm border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-600" />
                  Personal Details
                </CardTitle>
                <p className="text-sm text-gray-500">Your personal information</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-400" />
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Full Name</Label>
                    <p className="text-gray-900">{fullName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Email</Label>
                    <p className="text-gray-900">{userProfile.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Role</Label>
                    <p className="text-gray-900">{userProfile.role || 'User'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building className="w-4 h-4 text-gray-400" />
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Employee ID</Label>
                    <p className="text-gray-900">{userProfile.employeeId || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employment Information */}
            <Card className="rounded-xl shadow-sm border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Building className="w-5 h-5 text-gray-600" />
                  Employment Information
                </CardTitle>
                <p className="text-sm text-gray-500">Your work details</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Building className="w-4 h-4 text-gray-400" />
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Division</Label>
                    <p className="text-gray-900">{userProfile.divisionName || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Office</Label>
                    <p className="text-gray-900">{userProfile.officeName || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Date Joined</Label>
                    <p className="text-gray-900">{dateJoined}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Last Login</Label>
                    <p className="text-gray-900">{lastLogin}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* About Section */}
          <Card className="rounded-xl shadow-sm border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-gray-600" />
                About
              </CardTitle>
              <p className="text-sm text-gray-500">Brief description</p>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Dedicated professional committed to efficient asset management and compliance with government regulations.
                Experienced in overseeing system operations and ensuring data integrity across all ERC asset management processes.
              </p>
            </CardContent>
          </Card>
        </TabsContent>



        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card className="rounded-xl shadow-sm border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
              <p className="text-sm text-gray-500">Your recent actions in the system</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {auditLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading audit trail...</p>
                </div>
              ) : auditError ? (
                <div className="text-center py-8">
                  <p className="text-red-500">{auditError}</p>
                  <Button
                    variant="outline"
                    onClick={fetchAuditTrail}
                    className="mt-2"
                  >
                    Retry
                  </Button>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No activity found</p>
                </div>
              ) : (
                <>
                  {auditLogs.map((log, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {log.action} {log.table} record #{log.recordId}
                        </p>
                        <p className="text-xs text-gray-500">{timeAgo(log.date)}</p>
                      </div>
                    </div>
                  ))}
                  {auditHasMore && (
                    <div className="text-center pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setAuditPage(prev => prev + 1);
                          fetchAuditTrail();
                        }}
                      >
                        Load More
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
});

