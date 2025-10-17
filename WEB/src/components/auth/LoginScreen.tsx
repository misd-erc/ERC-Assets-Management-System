import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Shield } from 'lucide-react';
import { useAuth } from '../../hooks';
import { MFAVerification } from './MFAVerification';
import { PublicClientApplication, AuthenticationResult, AccountInfo } from '@azure/msal-browser';

const ercLogo = '/images/erc-logo.png';
const microsoftLogo = '/images/microsoft-logo.svg';

// MSAL configuration
const msalConfig = {
  auth: {
    clientId: process.env.REACT_APP_MSAL_CLIENT_ID || 'your-client-id',
    authority: `https://login.microsoftonline.com/${process.env.REACT_APP_MSAL_TENANT_ID || 'common'}`,
    redirectUri: 'http://localhost:4434',
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
};

export function LoginScreen() {
  const { login, requireMFA, isLoading, error } = useAuth();
  const [msalLoading, setMsalLoading] = useState(false);
  const [msalInstance, setMsalInstance] = useState<PublicClientApplication | null>(null);

  useEffect(() => {
    const initializeMSAL = async () => {
      const instance = new PublicClientApplication(msalConfig);
      await instance.initialize();
      setMsalInstance(instance);
    };

    initializeMSAL();
  }, []);

  const handleMicrosoftLogin = async () => {
    if (!msalInstance) {
      console.error('MSAL not initialized');
      return;
    }

    setMsalLoading(true);

    try {
      const loginRequest = {
        scopes: ['openid', 'profile', 'email', 'User.Read'],
        prompt: 'select_account',
      };

      const response: AuthenticationResult = await msalInstance.loginPopup(loginRequest);
      const account: AccountInfo = response.account!;

      // Extract user information
      const entraId = account.localAccountId;
      const email = account.username;
      const name = account.name || '';
      const [firstName, ...lastNameParts] = name.split(' ');
      const lastName = lastNameParts.join(' ');

      // Call our backend validation
      await login({
        entraId,
        firstName: firstName || '',
        lastName: lastName || '',
        email,
      });

    } catch (error) {
      console.error('MSAL login failed:', error);
      // Error will be handled by the auth store
    } finally {
      setMsalLoading(false);
    }
  };

  if (requireMFA) {
    return <MFAVerification />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 flex items-center justify-center">
            <img
              src={ercLogo}
              alt="Energy Regulatory Commission"
              className="w-20 h-20 object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Energy Regulatory Commission</h1>
            <p className="text-slate-600 mt-1">Asset Management System</p>
          </div>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Use your ERC-provided Microsoft account to access the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleMicrosoftLogin}
              className="w-full flex items-center justify-center gap-2 bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              disabled={isLoading || msalLoading}
            >
              {isLoading || msalLoading ? (
                'Signing in...'
              ) : (
                <>
                  <img
                    src={microsoftLogo}
                    alt="Microsoft"
                    className="w-5 h-5"
                  />
                  <span>Sign in with Microsoft</span>
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-start space-x-2">
              <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p>This system is for ERC authorized personnel only. All activities are logged and monitored.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
