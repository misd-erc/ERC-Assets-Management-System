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
  '@odata.nextLink'?: string;
}

const HRIS_PLANTILLA_GROUP_ID = '10d10efd-bb3d-4c21-b701-59eb60668290';
const HRIS_CO_JO_GROUP_ID = 'e224728a-cf4c-491a-adc4-75a040225d14';

const SCOPES = ['User.Read.All', 'GroupMember.Read.All'];

/** Fetches all members of a single group, following @odata.nextLink for pagination. */
async function fetchGroupMembers(groupId: string, accessToken: string): Promise<Employee[]> {
  const members: Employee[] = [];
  let url: string | undefined =
    `https://graph.microsoft.com/v1.0/groups/${groupId}/members/microsoft.graph.user` +
    `?$select=id,displayName,mail,jobTitle,employeeId&$top=999`;

  while (url) {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Graph API error fetching group ${groupId}: ${response.statusText}`);
    }

    const data: GraphResponse = await response.json();
    members.push(...(data.value || []));
    url = data['@odata.nextLink'];
  }

  return members;
}

function buildMsalInstance() {
  return new PublicClientApplication({
    auth: {
      clientId: process.env.REACT_APP_MSAL_CLIENT_ID || '',
      authority: `https://login.microsoftonline.com/${process.env.REACT_APP_MSAL_TENANT_ID || 'common'}`,
      redirectUri: process.env.REACT_APP_MSAL_REDIRECT_URI || '',
    },
    cache: {
      cacheLocation: 'sessionStorage' as const,
      storeAuthStateInCookie: false,
    },
  });
}

export async function fetchEmployeesDirectly(): Promise<Employee[]> {
  const msalInstance = buildMsalInstance();
  await msalInstance.initialize();

  const accounts = msalInstance.getAllAccounts();

  if (!accounts || accounts.length === 0) {
    throw new Error('No authenticated user found. Please ensure you are logged in to Microsoft Entra ID.');
  }

  const account = accounts[0];

  try {
    const tokenResponse = await msalInstance.acquireTokenSilent({
      scopes: SCOPES,
      account,
    });

    const [plantillaMembers, coJoMembers] = await Promise.all([
      fetchGroupMembers(HRIS_PLANTILLA_GROUP_ID, tokenResponse.accessToken),
      fetchGroupMembers(HRIS_CO_JO_GROUP_ID, tokenResponse.accessToken),
    ]);

    // Deduplicate by Entra object ID in case someone appears in both groups
    const seen = new Set<string>();
    const combined: Employee[] = [];
    for (const emp of [...plantillaMembers, ...coJoMembers]) {
      if (!seen.has(emp.id)) {
        seen.add(emp.id);
        combined.push(emp);
      }
    }

    return combined;
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

  if (!msalInstance) {
    throw new Error('MSAL instance not initialized.');
  }

  try {
    const tokenResponse = await msalInstance.acquireTokenSilent({
      scopes: SCOPES,
      account,
    });

    const [plantillaMembers, coJoMembers] = await Promise.all([
      fetchGroupMembers(HRIS_PLANTILLA_GROUP_ID, tokenResponse.accessToken),
      fetchGroupMembers(HRIS_CO_JO_GROUP_ID, tokenResponse.accessToken),
    ]);

    const seen = new Set<string>();
    const combined: Employee[] = [];
    for (const emp of [...plantillaMembers, ...coJoMembers]) {
      if (!seen.has(emp.id)) {
        seen.add(emp.id);
        combined.push(emp);
      }
    }

    return combined;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch employees: ${error.message}`);
    }
    throw new Error('Failed to fetch employees: Unknown error');
  }
}
