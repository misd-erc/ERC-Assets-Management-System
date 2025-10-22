import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Shield,
  Lock,
  Key,
  Smartphone,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Save,
  Clock,
  MapPin,
  Monitor,
  Download
} from 'lucide-react';
import { useAuth } from '../../hooks';

export function SecurityPrivacy() {
  const { user } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [loginNotifications, setLoginNotifications] = useState(true);
  const [sessionTracking, setSessionTracking] = useState(true);

  const handleChangePassword = () => {
    // toast.success('Password changed successfully');
  };

  const handleEnable2FA = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    // toast.success(twoFactorEnabled ? '2FA disabled' : '2FA enabled successfully');
  };

  const handleDownloadData = () => {
    // toast.success('Data export started. You will receive an email when ready.');
  };

  // Mock session data
  const activeSessions = [
    {
      device: 'Chrome on Windows',
      location: 'Pasig City, Metro Manila',
      ip: '192.168.1.100',
      lastActive: 'Active now',
      isCurrent: true,
    },
    {
      device: 'Safari on iPhone',
      location: 'Quezon City, Metro Manila',
      ip: '192.168.1.105',
      lastActive: '2 hours ago',
      isCurrent: false,
    },
  ];

  const loginHistory = [
    { date: 'Oct 16, 2025 09:30 AM', location: 'Pasig City', status: 'success' },
    { date: 'Oct 15, 2025 08:45 AM', location: 'Pasig City', status: 'success' },
    { date: 'Oct 14, 2025 09:15 AM', location: 'Pasig City', status: 'success' },
    { date: 'Oct 13, 2025 02:30 PM', location: 'Unknown Location', status: 'failed' },
    { date: 'Oct 13, 2025 08:50 AM', location: 'Pasig City', status: 'success' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Security & Privacy</h1>
        <p className="text-slate-600 mt-1">Manage your security settings and privacy preferences</p>
      </div>

      {/* Security Status */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-900">Security Status: Good</h3>
              <p className="text-sm text-green-700 mt-1">
                Your account is protected with two-factor authentication and all security features are enabled.
              </p>
              <div className="flex gap-2 mt-3">
                <Badge className="bg-green-600 hover:bg-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  2FA Enabled
                </Badge>
                <Badge className="bg-green-600 hover:bg-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Strong Password
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Tabs */}
      <Tabs defaultValue="password" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="2fa">Two-Factor Auth</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        {/* Password Tab */}
        <TabsContent value="password" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4 text-slate-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-slate-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              {/* Password Requirements */}
              <Card className="bg-slate-50 border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Password Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-slate-600">At least 8 characters long</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-slate-600">Contains uppercase and lowercase letters</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-slate-600">Contains at least one number</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-slate-600">Contains at least one special character</span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline">Cancel</Button>
                <Button onClick={handleChangePassword}>
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2FA Tab */}
        <TabsContent value="2fa" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Authenticator App</h4>
                    <p className="text-sm text-slate-500 mt-1">
                      Use an authenticator app to generate verification codes
                    </p>
                    {twoFactorEnabled && (
                      <Badge className="mt-2 bg-green-100 text-green-800 hover:bg-green-100">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Enabled
                      </Badge>
                    )}
                  </div>
                </div>
                <Switch checked={twoFactorEnabled} onCheckedChange={handleEnable2FA} />
              </div>

              {twoFactorEnabled && (
                <Card className="bg-slate-50 border-slate-200">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Backup Codes</p>
                          <p className="text-xs text-slate-500">Download backup codes for emergency access</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Recovery Email</p>
                          <p className="text-xs text-slate-500">{user?.username}@erc.gov.ph</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Update
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Login Notifications</Label>
                  <p className="text-sm text-slate-500">Get notified of new login attempts</p>
                </div>
                <Switch checked={loginNotifications} onCheckedChange={setLoginNotifications} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Manage your active sessions across devices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeSessions.map((session, index) => (
                <div key={index} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Monitor className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{session.device}</p>
                        {session.isCurrent && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            Current
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MapPin className="w-3 h-3" />
                        <span>{session.location}</span>
                      </div>
                      <p className="text-xs text-slate-500">IP: {session.ip}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>{session.lastActive}</span>
                      </div>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      Revoke
                    </Button>
                  )}
                </div>
              ))}

              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Revoke All Other Sessions
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Login History</CardTitle>
              <CardDescription>Recent login attempts to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loginHistory.map((login, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {login.status === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{login.date}</p>
                        <p className="text-xs text-slate-500">{login.location}</p>
                      </div>
                    </div>
                    <Badge
                      variant={login.status === 'success' ? 'outline' : 'destructive'}
                      className="text-xs"
                    >
                      {login.status === 'success' ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Control your privacy and data settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Activity Tracking</Label>
                    <p className="text-sm text-slate-500">Track your activity for audit purposes</p>
                  </div>
                  <Switch checked={sessionTracking} onCheckedChange={setSessionTracking} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Profile Visibility</Label>
                    <p className="text-sm text-slate-500">Who can see your profile</p>
                  </div>
                  <Badge variant="outline">ERC Staff Only</Badge>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Data Retention</Label>
                    <p className="text-sm text-slate-500">How long your data is kept</p>
                  </div>
                  <Badge variant="outline">As per COA Policy</Badge>
                </div>
              </div>

              <Card className="bg-slate-50 border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Data Management</CardTitle>
                  <CardDescription className="text-xs">
                    Manage your personal data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" onClick={handleDownloadData}>
                    <Download className="w-4 h-4 mr-2" />
                    Download My Data
                  </Button>
                  <p className="text-xs text-slate-500">
                    Download a copy of your personal data and activity logs
                  </p>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset to Default
                </Button>
                <Button>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
