import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';
import { useAuth } from '@/hooks';
import { PublicClientApplication, AuthenticationResult, AccountInfo, BrowserAuthError } from '@azure/msal-browser';
import { toast } from 'sonner';
import axios from 'axios';
import { secureStorage } from '@/utils/secureStorage';

const ercLogo = '/images/erc-logo.png';
const microsoftLogo = '/images/microsoft-logo.svg';

// MSAL configuration
const msalConfig = {
  auth: {
    clientId: process.env.REACT_APP_MSAL_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${process.env.REACT_APP_MSAL_TENANT_ID || 'common'}`,
    redirectUri: process.env.REACT_APP_MSAL_REDIRECT_URI || '',
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

export function LoginScreen() {
  const { login, requireMFA, isLoading, error } = useAuth();
  const [msalInstance, setMsalInstance] = useState<PublicClientApplication | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeMSAL = async () => {
      const instance = new PublicClientApplication(msalConfig);
      await instance.initialize();
      setMsalInstance(instance);
    };

    initializeMSAL();
  }, []);

  useEffect(() => {
	console.log(process.env.REACT_APP_API_URL);

    if (msalInstance) {
      msalInstance.handleRedirectPromise().then(async (response: AuthenticationResult | null) => {
        if (response) {
          const account: AccountInfo = response.account!;

          // Extract user information
          const entraId = account.localAccountId;
          const email = account.username;
          const name = account.name || '';
          const [firstName, ...lastNameParts] = name.split(' ');
          const lastName = lastNameParts.join(' ');

          // Extract employeeId from idTokenClaims if available
          const claims = response.idTokenClaims as any;
          let employeeId = claims?.employeeId || claims?.employee_id || claims?.['employee-id'] || (account as any).employeeId || (account as any).employee_Id || '';

          // If employeeId is still empty, try to fetch from Microsoft Graph API
          if (!employeeId && response.accessToken) {
            try {
              const graphResponse = await axios.get('https://graph.microsoft.com/v1.0/me?$select=id,displayName,employeeId', {
                headers: {
                  Authorization: `Bearer ${response.accessToken}`,
                },
              });
              employeeId = graphResponse.data.employeeId || '';
              secureStorage.setItem('employeeId', employeeId);
            } catch (graphError) {
              console.warn('Failed to fetch employeeId from Microsoft Graph:', graphError);
            }
          }

          // Call our backend validation
          login({
            entraId,
            firstName: firstName || '',
            lastName: lastName || '',
            email,
            employeeId,
          }).then((result) => {
            if (result.success) {
              toast.success('OTP has been sent to your email. Please check your inbox.', {
                duration: 3000,
              });
              setTimeout(() => navigate('/mfa'), 3000);
            } else {
              toast.error(result.message);
            }
          }).catch((error) => {
            console.error('Login failed:', error);
            // Check if the error is due to pending account approval
            if (error?.response?.data?.code === 'ERR_UNAUTHORIZED' &&
                error?.response?.data?.message?.includes('pending')) {
              navigate('/no-role');
            } else {
              toast.error('Something went wrong during login.');
            }
          });
        }
      }).catch((error) => {
        console.error('MSAL redirect failed:', error);
        toast.error('Something went wrong during login.');
      });
    }
  }, [msalInstance, login, navigate]);

  const handleMicrosoftLogin = async () => {
    if (!msalInstance) {
      toast.error('MSAL not initialized');
      return;
    }

    try {
      const loginRequest = {
        scopes: ['openid', 'profile', 'email', 'User.Read'],
        prompt: 'select_account',
      };

      await msalInstance.loginRedirect(loginRequest);
    } catch (error) {
      console.error('MSAL login failed:', error);
      toast.error('Something went wrong during login.');
    }
  };



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
            <p className='text-slate-600 mt-1'>{process.env.REACT_APP_Deployment_Type} ver. {process.env.REACT_APP_Version}</p>
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
              disabled={isLoading}
            >
              {isLoading ? (
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





