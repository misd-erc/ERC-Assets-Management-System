import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { AlertTriangle, UserX, LogIn } from 'lucide-react';
import { Button } from '@/ui/button';

const RoleRequiredView: React.FC = () => {
  const handleContactAdmin = () => {
    window.location.href = 'mailto:ams-dev@erc.ph?subject=Role Assignment Request';
  };

  const handleGoToLogin = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <UserX className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Access Restricted
          </CardTitle>
          <CardDescription className="text-gray-600">
            Your account is registered but needs to be activated and assigned a role by an administrator.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="text-sm font-medium text-yellow-800">Role Required</span>
            </div>
            <p className="text-sm text-yellow-700">
              Please contact your system administrator to activate your account and assign a role.
            </p>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleContactAdmin}
              className="w-full"
              variant="default"
            >
              Contact Administrator
            </Button>

            <Button
              onClick={handleGoToLogin}
              className="w-full"
              variant="outline"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            If you believe this is an error, please reach out to support.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleRequiredView;

