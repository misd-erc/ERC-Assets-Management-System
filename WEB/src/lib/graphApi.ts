import { PublicClientApplication, AuthenticationResult, InteractionRequiredAuthError } from '@azure/msal-browser';
import { msalInstance } from '@/config/msalConfig';

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

const SCOPES = [
  'https://graph.microsoft.com/User.Read.All',
  'https://graph.microsoft.com/GroupMember.Read.All',
];

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

let msalInitialized = false;

async function ensureMsalInitialized(): Promise<void> {
  if (!msalInitialized) {
    await msalInstance.initialize();
    msalInitialized = true;
  }
}

async function acquireGraphToken(): Promise<string> {
  await ensureMsalInitialized();

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
    return tokenResponse.accessToken;
  } catch (silentError) {
    if (silentError instanceof InteractionRequiredAuthError) {
      // Consent or MFA required — prompt the user
      const tokenResponse = await msalInstance.acquireTokenPopup({
        scopes: SCOPES,
        account,
      });
      return tokenResponse.accessToken;
    }
    throw silentError;
  }
}

export async function fetchEmployeesDirectly(): Promise<Employee[]> {
  try {
    const accessToken = await acquireGraphToken();

    const [plantillaMembers, coJoMembers] = await Promise.all([
      fetchGroupMembers(HRIS_PLANTILLA_GROUP_ID, accessToken),
      fetchGroupMembers(HRIS_CO_JO_GROUP_ID, accessToken),
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
