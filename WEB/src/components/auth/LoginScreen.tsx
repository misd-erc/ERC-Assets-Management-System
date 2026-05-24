import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Monitor, User2 } from 'lucide-react';
import { useAuth } from '@/hooks';
import { PublicClientApplication, AuthenticationResult, AccountInfo } from '@azure/msal-browser';
import { toast } from 'sonner';
import axios from 'axios';
import { secureStorage } from '@/utils/secureStorage';

const ercLogo = '/images/erc-logo.png';
const microsoftLogo = '/images/microsoft-logo.svg';
const LOGIN_FLOW_STORAGE_KEY = 'erc_login_flow_type';

type LoginFlowType = 'system' | 'employee';

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
  const { login, loginEmployee, isLoading, error } = useAuth();
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
    if (msalInstance) {
      msalInstance.handleRedirectPromise().then(async (response: AuthenticationResult | null) => {
        if (response) {
          const loginFlow = (sessionStorage.getItem(LOGIN_FLOW_STORAGE_KEY) as LoginFlowType) || 'system';
          sessionStorage.removeItem(LOGIN_FLOW_STORAGE_KEY);
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

          const loginHandler = loginFlow === 'employee' ? loginEmployee : login;

          // Call our backend validation
          loginHandler({
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
  }, [msalInstance, login, loginEmployee, navigate]);

  const handleMicrosoftLogin = async (loginFlow: LoginFlowType) => {
    if (!msalInstance) {
      toast.error('MSAL not initialized');
      return;
    }

    try {
      sessionStorage.setItem(LOGIN_FLOW_STORAGE_KEY, loginFlow);

      const loginRequest = {
        scopes: ['openid', 'profile', 'email', 'User.Read'],
        prompt: 'select_account',
      };

      await msalInstance.loginRedirect(loginRequest);
    } catch (error) {
      sessionStorage.removeItem(LOGIN_FLOW_STORAGE_KEY);
      console.error('MSAL login failed:', error);
      toast.error('Something went wrong during login.');
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50 dark:from-slate-900 dark:to-slate-800 px-4 py-10">
      <div className="w-full max-w-sm space-y-6">

        {/* Header */}
        <div className="text-center space-y-3">
          <img
            src={ercLogo}
            alt="Energy Regulatory Commission"
            className="mx-auto w-16 h-16 object-contain drop-shadow-sm"
          />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Energy Regulatory Commission
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Asset Management System</p>
            <span className="inline-block mt-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 uppercase tracking-widest">
              {process.env.REACT_APP_Deployment_Type} · v{process.env.REACT_APP_Version}
            </span>
          </div>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-3 text-center">
            <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">
              Select Account Type
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Sign in with your ERC Microsoft account to continue
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 pb-5">
            {error && (
              <Alert variant="destructive" className="text-sm">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* AMS Personnel */}
            <button
              onClick={() => handleMicrosoftLogin('system')}
              disabled={isLoading}
              className="w-full group flex items-center gap-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 active:scale-[0.99] transition-all px-4 py-3 text-left disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"
            >
              <span className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 group-hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 transition-colors">
                <Monitor className="w-4 h-4" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">AMS Personnel</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">Manage modules, records &amp; approvals</span>
              </span>
              <img src={microsoftLogo} alt="" className="w-4 h-4 flex-shrink-0 opacity-60" />
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>

            {/* Employee */}
            <button
              onClick={() => handleMicrosoftLogin('employee')}
              disabled={isLoading}
              className="w-full group flex items-center gap-4 rounded-lg border border-blue-200 bg-blue-50/60 hover:bg-blue-50 hover:border-blue-300 active:scale-[0.99] transition-all px-4 py-3 text-left disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-950/30 dark:border-blue-900 dark:hover:bg-blue-900/40"
            >
              <span className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 transition-colors">
                <User2 className="w-4 h-4" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">Employee</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">View your accountabilities &amp; issued items</span>
              </span>
              <img src={microsoftLogo} alt="" className="w-4 h-4 flex-shrink-0 opacity-60" />
            </button>

            {isLoading && (
              <p className="text-center text-xs text-slate-500 pt-1 animate-pulse">
                Redirecting to Microsoft sign-in…
              </p>
            )}
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="flex items-start gap-2 px-1">
          <Shield className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-slate-400 leading-relaxed">
            This system is for ERC authorized personnel only. All activities are logged and monitored.
          </p>
        </div>

      </div>
    </div>
  );
}





