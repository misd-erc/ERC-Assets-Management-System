import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Button } from '@/ui/button';
import { Label } from '@/ui/label';
import { Badge } from '@/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/ui/dialog';
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
  Loader2,
  Eye,
  FileText,
  Database,
  Hash,
  Activity
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar';
import { useAuthStore } from '@/store/auth';
import { getUserPhoto } from '@/api/user-management/userApi';
import { getActivities, getAuditTrail } from '@/api/audit/auditApi';
import { ActivityItem, AuditTrailItem } from '@/types/audit';
import { retrieveFile, uploadProfilePicture } from '@/api/storage/uploadApi';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/ui/tooltip';
import { encrypt, decrypt } from '@/utils/encryption';
import { getUserDetails } from '@/api/user-management/authApi';


export const MyProfile = () => {
  const { systemUserId } = useAuthStore();
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile picture state
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);

  // Load user details and profile picture on mount
  React.useEffect(() => {
    const loadUserDetails = async () => {
      const stored = localStorage.getItem('userDetails');
      const token = localStorage.getItem('sessionToken');

      if (!stored) {
        setLoading(false);
        return;
      }

      try {
        const decrypted = decrypt(stored);
        const parsed = JSON.parse(decrypted);
        setUserDetails(parsed);

        if (parsed?.profilePictureStorageFile.id && token) {
          const fileIdEncrypted = String(parsed.profilePictureStorageFile.id);
          const userId = parsed?.id || systemUserId;
          console.log('[MyProfile] Loading profile picture from localStorage');
          const photoResponse = await getUserPhoto(fileIdEncrypted, userId);
          const imageUrl = URL.createObjectURL(photoResponse.data);
          setProfilePictureUrl(imageUrl);
          console.log('[MyProfile] Profile picture loaded from localStorage');
        }
      } catch (error) {
        console.warn('Failed to load user details from localStorage:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserDetails();
  }, []);

  // Activity state for Activity tab
  const [activityLogs, setActivityLogs] = useState<ActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotalPages, setActivityTotalPages] = useState(1);

  // Audit trail state for Audit Trail tab
  const [auditTrailLogs, setAuditTrailLogs] = useState<AuditTrailItem[]>([]);
  const [auditTrailLoading, setAuditTrailLoading] = useState(false);
  const [auditTrailError, setAuditTrailError] = useState<string | null>(null);
  const [auditTrailPage, setAuditTrailPage] = useState(1);
  const [auditTrailTotalPages, setAuditTrailTotalPages] = useState(1);

  // Modal state for viewing details
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
  const [selectedAuditTrail, setSelectedAuditTrail] = useState<AuditTrailItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);



  // Fetch data on tab switch to activity or auditTrail
  React.useEffect(() => {
    if (activeTab === 'activity') {
      fetchActivities();
    }
    if (activeTab === 'auditTrail') {
      fetchAuditTrailForAuditTab();
    }
  }, [activeTab, activityPage]);

  React.useEffect(() => {
    if (activeTab === 'auditTrail') {
      fetchAuditTrailForAuditTab();
    }
  }, [auditTrailPage]);

  const fetchActivities = async () => {
    const userId = systemUserId || localStorage.getItem('systemUserId');
    if (!userId) {
      setActivityError('User ID not available');
      return;
    }
    const sessionKey = localStorage.getItem('sessionToken') || '';
    setActivityLoading(true);
    setActivityError(null);
    try {
      const response = await getActivities(userId, sessionKey, activityPage, 10);
      if (response.success) {
        setActivityLogs(response.data.items);
        setActivityTotalPages(response.data.totalPages);
      } else {
        setActivityError('Failed to load activities');
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      setActivityError('Failed to load activities');
    } finally {
      setActivityLoading(false);
    }
  };

  const fetchAuditTrailForAuditTab = async () => {
    const userId = systemUserId || localStorage.getItem('systemUserId');
    if (!userId) {
      setAuditTrailError('User ID not available');
      return;
    }
    const sessionKey = localStorage.getItem('sessionToken') || '';
    setAuditTrailLoading(true);
    setAuditTrailError(null);
    try {
      const response = await getAuditTrail(userId, sessionKey, auditTrailPage, 10);
      if (response.success) {
        setAuditTrailLogs(response.data.items);
        setAuditTrailTotalPages(response.data.totalPages);
      } else {
        setAuditTrailError('Failed to load audit trail');
      }
    } catch (error) {
      console.error('Failed to fetch audit trail for audit tab:', error);
      setAuditTrailError('Failed to load audit trail');
    } finally {
      setAuditTrailLoading(false);
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

    const id = systemUserId || localStorage.getItem("systemUserId");
    if (!id) { toast.error("User ID missing â€” please re-login."); return; }

    setUploadingPicture(true);
    console.log("[MyProfile] Uploading profile picture...");
    try {
      const token = localStorage.getItem("sessionToken") || localStorage.getItem("sessionKey");
      const fileStorageId = await uploadProfilePicture(file);
      const newUrl = await retrieveFile(fileStorageId);
      if (newUrl.includes('blob:')) {

        const res = await getUserDetails();
        if (res) {
          localStorage.setItem('userDetails', encrypt(JSON.stringify(res)));
        }
      }


      // Update state
      setProfilePictureUrl(newUrl);
      toast.success('Profile picture updated successfully');

      // Notify other components to update profile picture
      window.dispatchEvent(new CustomEvent('profilePictureUpdated'));
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

  // Modal handlers
  const openActivityModal = (activity: ActivityItem) => {
    setSelectedActivity(activity);
    setSelectedAuditTrail(null);
    setIsModalOpen(true);
  };

  const openAuditTrailModal = (auditTrail: AuditTrailItem) => {
    setSelectedAuditTrail(auditTrail);
    setSelectedActivity(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedActivity(null);
    setSelectedAuditTrail(null);
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

  if (!userDetails) {
    return (
      <div className="pl-64 pt-16 space-y-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500 mt-1">No user data available.</p>
        </div>
      </div>
    );
  }

  const fullName = `${userDetails.firstName || ''} ${userDetails.lastName || ''}`.trim() || 'Unknown User';
  const initials = ((userDetails.firstName || '')[0] || '') + ((userDetails.lastName || '')[0] || '') || 'U';
  const statusBadge = userDetails.isActive ? 'Active' : 'Inactive';
  const roleBadge = userDetails.systemRole[0].roleName || 'No Role Assigned'; 
  const dateJoined = formatDate(userDetails.createdAt, 'Month DD, YYYY');
  const lastLogin = formatDate(userDetails.lastLoginAt, 'Month DD, YYYY HH:mm');

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
                <Avatar className="w-20 h-20 border-2 border-blue-200">
                  <AvatarImage
                    src={profilePictureUrl || undefined}
                    alt={`${userDetails.firstName} ${userDetails.lastName}`}
                  />
                  <AvatarFallback className="text-xl font-semibold text-blue-700 bg-blue-50">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-white border-2 border-white shadow-md hover:bg-gray-50"
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
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
                  id="profilePictureInput"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleProfilePictureUpload}
                  accept=".jpg,.jpeg,.png"
                  className="hidden"
                />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{fullName}</h3>
                <p className="text-gray-500">@{userDetails.email ? userDetails.email.split('@')[0] : 'unknown'}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`rounded-full px-3 py-1 bg-blue-100 text-blue-800 border-blue-200`}>{roleBadge}</Badge>
                  <Badge className={`rounded-full px-3 py-1 ${userDetails.isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>{statusBadge}</Badge>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-0 h-auto font-normal"
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
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
          <TabsList className="grid w-full grid-cols-3 lg:w-auto bg-gray-100 rounded-full p-1 h-12">
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
            <TabsTrigger
              value="auditTrail"
              className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-blue-500 data-[state=active]:text-gray-900 data-[state=inactive]:bg-gray-50 data-[state=inactive]:text-gray-600"
            >
              Audit Trail
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
                    <p className="text-gray-900">{userDetails.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Role</Label>
                    <p className="text-gray-900">{userDetails.systemRole[0].roleName || 'User'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building className="w-4 h-4 text-gray-400" />
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Employee ID</Label>
                    <p className="text-gray-900">{localStorage.getItem('employeeId') || 'N/A'}</p>
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
                    <p className="text-gray-900">{userDetails.divisionName || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Office</Label>
                    <p className="text-gray-900">{userDetails.officeName || 'N/A'}</p>
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
              <CardTitle className="text-lg font-semibold text-gray-900">Activity</CardTitle>
              <p className="text-sm text-gray-500">Your recent actions in the system</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {activityLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading activities...</p>
                </div>
              ) : activityError ? (
                <div className="text-center py-8">
                  <p className="text-red-500">{activityError}</p>
                  <Button
                    variant="outline"
                    onClick={fetchActivities}
                    className="mt-2"
                  >
                    Retry
                  </Button>
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No records found</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead>Action By</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activityLogs.map((log, index) => (
                        <TableRow key={index}>
                          <TableCell>{log.action}</TableCell>
                          <TableCell>{log.actionBy}</TableCell>
                          <TableCell>{formatDate(log.createdAt, 'Month DD, YYYY HH:mm')}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openActivityModal(log)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex justify-between items-center pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (activityPage > 1) {
                          setActivityPage(prev => prev - 1);
                        }
                      }}
                      disabled={activityPage === 1}
                    >
                      Prev
                    </Button>
                    <span className="text-sm text-gray-500">
                      Page {activityPage} of {activityTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (activityPage < activityTotalPages) {
                          setActivityPage(prev => prev + 1);
                        }
                      }}
                      disabled={activityPage === activityTotalPages}
                    >
                      Next
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Trail Tab */}
        <TabsContent value="auditTrail" className="space-y-6">
          <Card className="rounded-xl shadow-sm border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Audit Trail</CardTitle>
              <p className="text-sm text-gray-500">Detailed log of your actions in the system</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {auditTrailLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading audit trail...</p>
                </div>
              ) : auditTrailError ? (
                <div className="text-center py-8">
                  <p className="text-red-500">{auditTrailError}</p>
                  <Button
                    variant="outline"
                    onClick={fetchAuditTrailForAuditTab}
                    className="mt-2"
                  >
                    Retry
                  </Button>
                </div>
              ) : auditTrailLogs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No audit logs found</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Table Name</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Action By</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Changes</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
  {auditTrailLogs.map((log, index) => (
    <TableRow key={index}>
      {/* Table Name */}
      <TableCell>{log.table}</TableCell>

      {/* Action */}
      <TableCell>{log.action}</TableCell>

      {/* Action By */}
      <TableCell>{log.actionBy}</TableCell>

      {/* Date */}
      <TableCell>
        {formatDate(log.date, 'MMMM DD, YYYY hh:mm A')}
      </TableCell>

      {/* Changes Summary */}
      <TableCell>
        {log.changes && Object.keys(log.changes).length > 0 ? (
          <div className="flex items-center justify-between w-full">
            <span className="text-sm font-medium text-gray-800">
              {Object.keys(log.changes).length} field
              {Object.keys(log.changes).length > 1 ? 's' : ''} changed
            </span>
           
          </div>
        ) : (
          <span className="text-gray-500 text-sm">No changes</span>
        )}
      </TableCell>

      {/* Optional separate column for View button (if needed) */}
      
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openAuditTrailModal(log)}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          <Eye className="w-4 h-4 mr-1" />
          View Details
        </Button>
      </TableCell>
     
    </TableRow>
  ))}
</TableBody>

                  </Table>
                  <div className="flex justify-between items-center pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (auditTrailPage > 1) {
                          setAuditTrailPage(prev => prev - 1);
                        }
                      }}
                      disabled={auditTrailPage === 1}
                    >
                      Prev
                    </Button>
                    <span className="text-sm text-gray-500">
                      Page {auditTrailPage} of {auditTrailTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (auditTrailPage < auditTrailTotalPages) {
                          setAuditTrailPage(prev => prev + 1);
                        }
                      }}
                      disabled={auditTrailPage === auditTrailTotalPages}
                    >
                      Next
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                {selectedActivity ? (
                  <Activity className="w-6 h-6 text-blue-600" />
                ) : (
                  <FileText className="w-6 h-6 text-blue-600" />
                )}
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  {selectedActivity ? 'Activity Details' : 'Audit Trail Details'}
                </DialogTitle>
                <DialogDescription className="text-gray-600 mt-1">
                  {selectedActivity ? 'Detailed information about this activity entry' : 'Detailed information about this audit trail entry'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {selectedActivity && (
              <>
                {/* Activity Basic Information Card */}
                <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-blue-600" />
                      Activity Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                        <Hash className="w-4 h-4 text-gray-400" />
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Activity ID</label>
                          <p className="text-sm font-medium text-gray-900 font-mono">{selectedActivity.activityId}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                        <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-600">A</span>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Action</label>
                          <p className="text-sm font-medium text-gray-900">{selectedActivity.action}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Action By</label>
                          <p className="text-sm font-medium text-gray-900">{selectedActivity.actionBy}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created At</label>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(selectedActivity.createdAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                        <Hash className="w-4 h-4 text-gray-400" />
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Audit Trail ID</label>
                          <p className="text-sm font-medium text-gray-900 font-mono">{selectedActivity.auditTrailId || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">System User ID</label>
                          <p className="text-sm font-medium text-gray-900 font-mono">{selectedActivity.actionBySystemUserId}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Audit Trail Details Card */}
                {selectedActivity.auditTrail && (
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-green-600" />
                        Audit Trail Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                          Raw JSON Data
                        </label>
                        <pre className="text-sm text-gray-900 bg-white p-3 rounded border overflow-auto max-h-64">
                          {JSON.stringify(selectedActivity.auditTrail, null, 2)}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {selectedAuditTrail && (
              <>
                {/* Audit Trail Basic Information Card */}
                <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Database className="w-5 h-5 text-blue-600" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                        <Database className="w-4 h-4 text-gray-400" />
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Table</label>
                          <p className="text-sm font-medium text-gray-900 font-mono">{selectedAuditTrail.table}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                        <Hash className="w-4 h-4 text-gray-400" />
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Record ID</label>
                          <p className="text-sm font-medium text-gray-900 font-mono">{selectedAuditTrail.recordId}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                        <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-600">A</span>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Action</label>
                          <div className="mt-1">
                            <Badge className={`font-medium px-3 py-1 ${
                              selectedAuditTrail.action.toLowerCase() === 'insert' ? 'bg-green-100 text-green-800' :
                              selectedAuditTrail.action.toLowerCase() === 'update' ? 'bg-blue-100 text-blue-800' :
                              selectedAuditTrail.action.toLowerCase() === 'delete' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {selectedAuditTrail.action}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Action By</label>
                          <p className="text-sm font-medium text-gray-900">{selectedAuditTrail.actionBy}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 md:col-span-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date & Time</label>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(selectedAuditTrail.date).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Changes Card */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-green-600" />
                      Changes
                      <Badge variant="secondary" className="ml-2">
                        {Object.keys(selectedAuditTrail.changes).length} field{Object.keys(selectedAuditTrail.changes).length !== 1 ? 's' : ''}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(selectedAuditTrail.changes).length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">No changes recorded for this entry</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {Object.entries(selectedAuditTrail.changes).map(([field, value], index) => (
                          <div key={index} className="group relative bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-sm font-semibold text-gray-900 capitalize">
                                  {field.replace(/([A-Z])/g, ' $1').toLowerCase()}
                                </span>
                              </div>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                                Current Value
                              </label>
                              <div className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded border break-all">
                                {value !== null && value !== undefined ? String(value) : <span className="text-gray-400 italic">(empty)</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};


