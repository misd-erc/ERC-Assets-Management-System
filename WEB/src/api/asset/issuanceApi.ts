import { IssuanceRecord, IssuanceStats, IssuanceType } from '@/types/issuance';

const STORAGE_KEY = 'mockPpeSeIssuances';

export const generateParIcsNumber = (itemGroup: 'PPE' | 'SE') => {
  const prefix = itemGroup === 'PPE' ? 'PAR' : 'ICS';
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${datePart}-${random}`;
};

const normalizeRecords = (records: IssuanceRecord[]): IssuanceRecord[] => {
  let mutated = false;
  const normalized = records.map((record) => {
    if (record.parIcsNumber) return record;

    mutated = true;
    return {
      ...record,
      parIcsNumber: generateParIcsNumber(record.itemGroup),
    };
  });

  if (mutated) {
    writeStore(normalized);
  }

  return normalized;
};

const readStore = (): IssuanceRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as IssuanceRecord[];
    return normalizeRecords(parsed);
  } catch (error) {
    console.warn('[PPE/SE Issuance] Failed to read mock store', error);
    return [];
  }
};

const writeStore = (records: IssuanceRecord[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.warn('[PPE/SE Issuance] Failed to persist mock store', error);
  }
};

export const getIssuanceStats = async (): Promise<IssuanceStats> => {
  const records = readStore().filter((r) => r.status === 'ACTIVE');
  const totalNew = records.filter((r) => r.issuanceType === 'NEW').length;
  const totalRenew = records.filter((r) => r.issuanceType === 'RENEW').length;

  return {
    totalActive: records.length,
    totalNew,
    totalRenew,
  };
};

export const listIssuances = async (): Promise<IssuanceRecord[]> => {
  return readStore();
};

export const createIssuance = async (
  payload: Omit<IssuanceRecord, 'id' | 'status'>
): Promise<IssuanceRecord> => {
  const records = readStore();
  const newRecord: IssuanceRecord = {
    ...payload,
    parIcsNumber: payload.parIcsNumber || generateParIcsNumber(payload.itemGroup),
    id: records.length ? Math.max(...records.map((r) => r.id)) + 1 : 1,
    status: 'ACTIVE',
  };

  records.push(newRecord);
  writeStore(records);
  return newRecord;
};

export const closeIssuance = async (id: number): Promise<void> => {
  const records = readStore();
  const updated: IssuanceRecord[] = records.map((r) =>
    r.id === id
      ? {
          ...r,
          status: 'INACTIVE' as const,
        }
      : r
  );
  writeStore(updated);
};

export const seedIssuances = () => {
  const existing = readStore();
  if (existing.length > 0) return;

  const today = new Date().toISOString().split('T')[0];

  const seeded = [
    {
      id: 1,
      employeeId: 101,
      employeeName: 'Jane Santos',
      itemName: 'Hard Hat',
      itemGroup: 'PPE',
      issuanceType: 'NEW',
      issuedDate: today,
      expiryDate: undefined,
      status: 'ACTIVE',
      notes: 'Initial issuance for new hire',
      parIcsNumber: generateParIcsNumber('PPE'),
    },
    {
      id: 2,
      employeeId: 205,
      employeeName: 'Carlos Reyes',
      itemName: 'Laptop SE',
      itemGroup: 'SE',
      issuanceType: 'RENEW',
      issuedDate: today,
      expiryDate: undefined,
      status: 'ACTIVE',
      notes: 'Annual renewal',
      parIcsNumber: generateParIcsNumber('SE'),
    },
  ] satisfies IssuanceRecord[];

  writeStore(seeded);
};
