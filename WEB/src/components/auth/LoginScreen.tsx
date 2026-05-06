import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';
import { useAuth } from '@/hooks';
import { AuthenticationResult, AccountInfo } from '@azure/msal-browser';
import { toast } from 'sonner';
import axios from 'axios';
import { secureStorage } from '@/utils/secureStorage';
import { msalInstance, msalInitPromise } from '@/config/msalConfig';
import { useAuthStore } from '@/store/auth';

const ercLogo = '/images/erc-logo.png';
const microsoftLogo = '/images/microsoft-logo.svg';
const REDIRECT_PROCESS_LOCK_KEY = 'msal_redirect_processed';

export function LoginScreen() {
  const { isLoading, error } = useAuth();
  const login = useAuthStore((s) => s.login);
  const [msalReady, setMsalReady] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const navigate = useNavigate();
  const handledRef = useRef(false);

  useEffect(() => {
    msalInitPromise.then(() => {
      setMsalReady(true);

      msalInstance.handleRedirectPromise().then(async (response: AuthenticationResult | null) => {
        console.log('[MSAL] handleRedirectPromise result:', response ? 'got response' : 'null (no redirect)');
        const alreadyProcessed = sessionStorage.getItem(REDIRECT_PROCESS_LOCK_KEY) === '1';
        // Guard: only process once
        if (!response || handledRef.current || alreadyProcessed) return;
        sessionStorage.setItem(REDIRECT_PROCESS_LOCK_KEY, '1');
        handledRef.current = true;

        const account: AccountInfo = response.account!;
        const entraId = account.localAccountId;
        const email = account.username;
        const name = account.name || '';
        const [firstName, ...lastNameParts] = name.split(' ');
        const lastName = lastNameParts.join(' ');

        const claims = response.idTokenClaims as any;
        let employeeId = claims?.employeeId || claims?.employee_id || claims?.['employee-id'] || (account as any).employeeId || (account as any).employee_Id || '';

        if (!employeeId && response.accessToken) {
          try {
            const graphResponse = await axios.get('https://graph.microsoft.com/v1.0/me?$select=id,displayName,employeeId', {
              headers: { Authorization: `Bearer ${response.accessToken}` },
            });
            employeeId = graphResponse.data.employeeId || '';
            secureStorage.setItem('employeeId', employeeId);
          } catch (graphError) {
            console.warn('Failed to fetch employeeId from Microsoft Graph:', graphError);
          }
        }

        try {
          const result = await login({ entraId, firstName: firstName || '', lastName: lastName || '', email, employeeId });
          if (result.success) {
            toast.success('OTP has been sent to your email. Please check your inbox.', { duration: 3000 });
            setTimeout(() => navigate('/mfa'), 3000);
          } else {
            toast.error(result.message);
          }
        } catch (err: any) {
          console.error('Login failed:', err);
          if (err?.response?.data?.code === 'ERR_UNAUTHORIZED' && err?.response?.data?.message?.includes('pending')) {
            navigate('/no-role');
          } else {
            toast.error(err?.response?.data?.message || 'Something went wrong during login.');
          }
        }
      }).catch((err) => {
        console.error('MSAL redirect handling failed:', err);
      });
    }).catch(console.error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMicrosoftLogin = async () => {
    if (!msalReady) {
      toast.error('Authentication not ready. Please wait.');
      return;
    }

    if (isRedirecting) {
      return;
    }

    setIsRedirecting(true);
    sessionStorage.removeItem(REDIRECT_PROCESS_LOCK_KEY);

    try {
      await msalInstance.loginRedirect({
        scopes: ['openid', 'profile', 'email', 'User.Read'],
        prompt: 'select_account',
      });
    } catch (err) {
      setIsRedirecting(false);
      console.error('MSAL login failed:', err);
      toast.error('Something went wrong during login.');
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
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
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Energy Regulatory Commission</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Asset Management System</p>
            <p className='text-slate-600 dark:text-slate-400 mt-1'>{process.env.REACT_APP_Deployment_Type} ver. {process.env.REACT_APP_Version}</p>
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
              className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50"
              disabled={isLoading || isRedirecting || !msalReady}
            >
              {isLoading || isRedirecting ? (
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





