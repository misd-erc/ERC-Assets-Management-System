import { PublicClientApplication, AuthenticationResult } from '@azure/msal-browser';

export interface Employee {
  id: string;
  displayName: string;
  mail: string;
  jobTitle: string;
  employeeId: string;
}

interface GraphResponse {
  value: Employee[];
}

const GRAPH_API_ENDPOINT = 'https://graph.microsoft.com/v1.0/users';
const SCOPES = ['User.Read.All'];

export async function fetchEmployeesDirectly(): Promise<Employee[]> {
  const msalConfig = {
    auth: {
      clientId: process.env.REACT_APP_MSAL_CLIENT_ID || '',
      authority: `https://login.microsoftonline.com/${process.env.REACT_APP_MSAL_TENANT_ID || 'common'}`,
      redirectUri: process.env.REACT_APP_MSAL_REDIRECT_URI || '',
    },
    cache: {
      cacheLocation: 'sessionStorage' as const,
      storeAuthStateInCookie: false,
    },
  };

  const msalInstance = new PublicClientApplication(msalConfig);
  await msalInstance.initialize();

  const accounts = msalInstance.getAllAccounts();
  
  if (!accounts || accounts.length === 0) {
    throw new Error('No authenticated user found. Please ensure you are logged in to Microsoft Entra ID.');
  }

  const account = accounts[0];
  
  if (!account) {
    throw new Error('Invalid account. Please log in again.');
  }

  try {
    const tokenResponse = await msalInstance.acquireTokenSilent({
      scopes: SCOPES,
      account,
    });

    const response = await fetch(
      `${GRAPH_API_ENDPOINT}?$select=id,displayName,mail,jobTitle,employeeId,office,division`,
      {
        headers: {
          Authorization: `Bearer ${tokenResponse.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Graph API error: ${response.statusText}`);
    }

    const data: GraphResponse = await response.json();
    return data.value || [];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch employees: ${error.message}`);
    }
    throw new Error('Failed to fetch employees: Unknown error');
  }
}

export async function fetchEmployees(
  msalInstance: PublicClientApplication,
  accounts: any[]
): Promise<Employee[]> {
  if (!accounts || accounts.length === 0) {
    throw new Error('No authenticated user found. Please ensure you are logged in to Microsoft Entra ID.');
  }

  const account = accounts[0];
  
  if (!account) {
    throw new Error('Invalid account. Please log in again.');
  }

  if (!msalInstance) {
    throw new Error('MSAL instance not initialized.');
  }

  try {
    const tokenResponse = await msalInstance.acquireTokenSilent({
      scopes: SCOPES,
      account,
    });

    const response = await fetch(
      `${GRAPH_API_ENDPOINT}?$select=id,displayName,mail,jobTitle,employeeId,office,division`,
      {
        headers: {
          Authorization: `Bearer ${tokenResponse.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Graph API error: ${response.statusText}`);
    }

    const data: GraphResponse = await response.json();
    return data.value || [];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch employees: ${error.message}`);
    }
    throw new Error('Failed to fetch employees: Unknown error');
  }
}
