import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
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
  Upload
} from 'lucide-react';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useAuthStore } from '../../store/auth';
import { editUserProfile } from '../../api/authApi';
import { toast } from 'sonner';

export const MyProfile = React.memo(() => {
  const { userProfile, loading, refreshProfile } = useUserProfile();
  const { systemUserIdEncrypted } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: '',
    status: '',
    phone: '',
    location: ''
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cancel edit mode when switching away from Details tab
  React.useEffect(() => {
    if (activeTab !== 'details') {
      setIsEditing(false);
    }
  }, [activeTab]);

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

  const handleEditProfile = () => {
    if (!userProfile) return;
    setIsEditing(true);
    setActiveTab('details');
    setFormData({
      firstName: userProfile.firstName || '',
      lastName: userProfile.lastName || '',
      role: userProfile.role || 'User',
      status: userProfile.status || (userProfile.isActive ? 'Active' : 'Inactive'),
      phone: '+63 917 123 4567', // Placeholder
      location: userProfile.officeName || 'Quezon City, Philippines' // Placeholder
    });
    setImagePreview(userProfile.profileImage || null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      firstName: '',
      lastName: '',
      role: '',
      status: '',
      phone: '',
      location: ''
    });
    setSelectedImage(null);
    setImagePreview(null);
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

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSave = async () => {
    if (!systemUserIdEncrypted || !userProfile) return;

    // Validate
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }

    setSaving(true);
    try {
      let base64Image: string | undefined;
      if (selectedImage) {
        base64Image = await convertToBase64(selectedImage);
      }

      const payload = {
        systemUserIdEncrypted,
        systemRoleIdEncrypted: formData.role,
        statusIdEncrypted: formData.status,
        isActiveEncrypted: formData.status === 'Active' ? 'true' : 'false',
        actionBySystemUserIdEncrypted: systemUserIdEncrypted,
        profileImageBase64: base64Image
      };

      await editUserProfile(payload);

      // Update localStorage
      const updatedProfile = {
        ...userProfile,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        status: formData.status,
        isActive: formData.status === 'Active',
        profileImage: base64Image || userProfile.profileImage
      };
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));

      // Refresh profile
      await refreshProfile();

      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xl shadow-sm">
                {initials}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{fullName}</h3>
                <p className="text-gray-500">@{userProfile.email ? userProfile.email.split('@')[0] : 'unknown'}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`rounded-full px-3 py-1 bg-blue-100 text-blue-800 border-blue-200`}>{roleBadge}</Badge>
                  <Badge className={`rounded-full px-3 py-1 ${userProfile.isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>{statusBadge}</Badge>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              className="text-blue-600 border-blue-600 hover:bg-blue-50 rounded-lg px-4 py-2"
              onClick={handleEditProfile}
              disabled={isEditing}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
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
              value="details"
              className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-blue-500 data-[state=active]:text-gray-900 data-[state=inactive]:bg-gray-50 data-[state=inactive]:text-gray-600"
            >
              Details
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
            {/* Contact Information */}
            <Card className="rounded-xl shadow-sm border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-gray-600" />
                  Contact Information
                </CardTitle>
                <p className="text-sm text-gray-500">Your contact details</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Email</Label>
                    <p className="text-gray-900">{userProfile.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Phone</Label>
                    <p className="text-gray-900">+63 917 123 4567</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Location</Label>
                    <p className="text-gray-900">Quezon City, Philippines</p>
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

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card className="rounded-xl shadow-sm border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Personal Details</CardTitle>
              <p className="text-sm text-gray-500">View your personal information</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Upload Section - Only show when editing */}
              {isEditing && (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg shadow-sm">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-medium text-gray-700">Profile Picture</Label>
                    <p className="text-xs text-gray-500">Upload a new profile picture</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">First Name</Label>
                    {isEditing ? (
                      <Input
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="mt-1 border-blue-500 focus:ring-blue-500"
                        placeholder="Enter first name"
                      />
                    ) : (
                      <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 mt-1">
                        <p className="text-gray-900">{userProfile.firstName || 'N/A'}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Last Name</Label>
                    {isEditing ? (
                      <Input
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="mt-1 border-blue-500 focus:ring-blue-500"
                        placeholder="Enter last name"
                      />
                    ) : (
                      <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 mt-1">
                        <p className="text-gray-900">{userProfile.lastName || 'N/A'}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Username</Label>
                    <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 mt-1">
                      <p className="text-gray-900">@{userProfile.email ? userProfile.email.split('@')[0] : 'unknown'}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Email Address</Label>
                    <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 mt-1">
                      <p className="text-gray-900">{userProfile.email || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Phone Number</Label>
                    {isEditing ? (
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="mt-1 border-blue-500 focus:ring-blue-500"
                        placeholder="Enter phone number"
                      />
                    ) : (
                      <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 mt-1">
                        <p className="text-gray-900">+63 917 123 4567</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Role</Label>
                    {isEditing ? (
                      <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                        <SelectTrigger className="mt-1 border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="User">User</SelectItem>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Manager">Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 mt-1">
                        <p className="text-gray-900">{userProfile.role || 'User'}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Status</Label>
                    {isEditing ? (
                      <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                        <SelectTrigger className="mt-1 border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 mt-1">
                        <p className="text-gray-900">{userProfile.isActive ? 'Active' : 'Inactive'}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Office Location</Label>
                    <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 mt-1">
                      <p className="text-gray-900">{userProfile.officeName || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save/Cancel Buttons - Only show when editing */}
              {isEditing && (
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="px-6 py-2"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
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
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Updated asset record PPE-2024-0234</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Approved RIS Request #156</p>
                  <p className="text-xs text-gray-500">3 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Generated Monthly Report</p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Created new PAR #PAR-2024-089</p>
                  <p className="text-xs text-gray-500">2 days ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Logged in to system</p>
                  <p className="text-xs text-gray-500">3 days ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
});

