import { PublicClientApplication, LogLevel } from '@azure/msal-browser';

const clientId = process.env.REACT_APP_MSAL_CLIENT_ID;
const tenantId = process.env.REACT_APP_MSAL_TENANT_ID;

if (!clientId || !tenantId) {
  console.error('Missing MSAL configuration. Please set REACT_APP_MSAL_CLIENT_ID and REACT_APP_MSAL_TENANT_ID in .env');
}

const msalConfig = {
  auth: {
    clientId: clientId || '',
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: LogLevel, message: string, piiEnabled: boolean) => {
        if (piiEnabled) return;
        if (level === LogLevel.Error) {
          console.error('[MSAL]', message);
        } else if (level === LogLevel.Warning) {
          console.warn('[MSAL]', message);
        }
      },
    },
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

// Initialize once at module load time — prevents StrictMode from calling initialize() twice
export const msalInitPromise = msalInstance.initialize();
