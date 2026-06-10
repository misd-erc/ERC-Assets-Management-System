import { secureStorage } from '@/utils/secureStorage';

const REPORT_NAMES = {
  SE_PROPERTY: 'SE_PROPERTY',
} as const;

export type ReportName = typeof REPORT_NAMES[keyof typeof REPORT_NAMES];

export { REPORT_NAMES };

export class ReportSerialService {
  private static getAuth() {
    return {
      actionBySystemUserId: secureStorage.getItem('systemUserId') || '',
      sessionKey: secureStorage.getItem('sessionToken') || '',
    };
  }

  static async getNextSerial(reportName: ReportName): Promise<string> {
    const { actionBySystemUserId, sessionKey } = this.getAuth();
    const API_BASE_URL = process.env.REACT_APP_API_URL || '';

    const url = `${API_BASE_URL}/Reports/serial/next?reportName=${reportName}&ActionBySystemUserId=${actionBySystemUserId}&SessionKey=${encodeURIComponent(sessionKey)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) throw new Error('Failed to fetch next serial number');

    const data = await response.json();
    return data.data?.serialNumber as string;
  }

  static async saveSerial(reportName: ReportName, serialNumber: string): Promise<void> {
    const { actionBySystemUserId, sessionKey } = this.getAuth();
    const API_BASE_URL = process.env.REACT_APP_API_URL || '';

    const response = await fetch(`${API_BASE_URL}/Reports/serial/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        reportName,
        serialNumber,
        actionBySystemUserId: Number(actionBySystemUserId),
        sessionKey,
      }),
    });

    if (!response.ok) throw new Error('Failed to save serial number');
  }
}
