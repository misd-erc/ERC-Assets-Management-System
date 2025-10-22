import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  User,
  Mail,
  Building,
  Calendar,
  Clock,
  Edit,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../hooks';
import { getUserDetails, editUserDetails, UserDetails } from '../../api/authApi';
import { toast } from 'sonner';

export function MyProfile() {
  const { user } = useAuth();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  useEffect(() => {
    loadUserDetails();
  }, []);

  const loadUserDetails = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const details = await getUserDetails(user.id, user.id); // Using user.id as actionBy
      setUserDetails(details);
      setFormData({
        firstName: details.FirstName,
        lastName: details.LastName,
        email: details.Email
      });
    } catch (error) {
      toast.error('Failed to load user details');
      console.error('Error loading user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id || !userDetails) return;

    try {
      setSaving(true);
      await editUserDetails({
        systemUserIdEncrypted: user.id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        actionBySystemUserIdEncrypted: user.id
      });

      toast.success('Profile updated successfully');
      setEditing(false);
      await loadUserDetails(); // Reload data
    } catch (error) {
      toast.error('Failed to update profile');
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (userDetails) {
      setFormData({
        firstName: userDetails.FirstName,
        lastName: userDetails.LastName,
        email: userDetails.Email
      });
    }
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!userDetails) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600">Failed to load user details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">My Profile</h1>
          <p className="text-slate-600 mt-1">View and manage your account information</p>
        </div>
        {!editing && (
          <Button onClick={() => setEditing(true)} className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Profile Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Overview</CardTitle>
              <CardDescription>Your basic account information and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-10 h-10 text-blue-600" />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-xl font-semibold text-slate-900">
                    {userDetails.FirstName} {userDetails.LastName}
                  </h3>
                  <p className="text-slate-600">{userDetails.Email}</p>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {userDetails.StatusName}
                    </Badge>
                    <Badge variant="outline">
                      {userDetails.SystemRoleName}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Quick Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <Building className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Office</p>
                    <p className="text-sm text-slate-600">{userDetails.OfficeName} ({userDetails.OfficeAcronym})</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <Building className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Division</p>
                    <p className="text-sm text-slate-600">{userDetails.DivisionName} ({userDetails.DivisionAcronym})</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Member Since</p>
                    <p className="text-sm text-slate-600">{new Date(userDetails.CreatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <Clock className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Last Login</p>
                    <p className="text-sm text-slate-600">
                      {userDetails.LastLoginAt ? new Date(userDetails.LastLoginAt).toLocaleString() : 'Never'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Manage your personal details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    {editing ? (
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      />
                    ) : (
                      <p className="text-sm text-slate-900 p-3 bg-slate-50 rounded-md">{userDetails.FirstName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    {editing ? (
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      />
                    ) : (
                      <p className="text-sm text-slate-900 p-3 bg-slate-50 rounded-md">{userDetails.LastName}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  {editing ? (
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  ) : (
                    <p className="text-sm text-slate-900 p-3 bg-slate-50 rounded-md">{userDetails.Email}</p>
                  )}
                </div>

                {/* Read-only fields */}
                <div className="space-y-2">
                  <Label>System Role</Label>
                  <p className="text-sm text-slate-900 p-3 bg-slate-50 rounded-md">{userDetails.SystemRoleName}</p>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <p className="text-sm text-slate-900 p-3 bg-slate-50 rounded-md">{userDetails.StatusName}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Office</Label>
                    <p className="text-sm text-slate-900 p-3 bg-slate-50 rounded-md">{userDetails.OfficeName} ({userDetails.OfficeAcronym})</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Division</Label>
                    <p className="text-sm text-slate-900 p-3 bg-slate-50 rounded-md">{userDetails.DivisionName} ({userDetails.DivisionAcronym})</p>
                  </div>
                </div>
              </div>

              {editing && (
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={handleCancel} disabled={saving}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Activity</CardTitle>
              <CardDescription>Recent activity and account events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">Account Created</p>
                    <p className="text-xs text-slate-500">{new Date(userDetails.CreatedAt).toLocaleString()}</p>
                  </div>
                </div>

                {userDetails.LastLoginAt && (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">Last Login</p>
                      <p className="text-xs text-slate-500">{new Date(userDetails.LastLoginAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <User className="w-5 h-5 text-purple-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">Profile Status</p>
                    <p className="text-xs text-slate-500">
                      {userDetails.IsActive ? 'Active account' : 'Inactive account'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
