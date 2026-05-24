import axiosInstance from '@/lib/axios';
import { getAuthParams } from '@/utils/auth';
import { secureStorage } from '@/utils/secureStorage';
import { decrypt } from '@/utils/encryption';
import { IssuanceRecord } from '@/types/issuance';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface MyAccountabilityItem {
  id: number;
  ptaId: number;
  parIcsNumber: string;
  dateAssigned: string;
  status: string;
  remarks: string | null;
  isCurrent: boolean;
  isActive: boolean;
  createdAt: string;
  plantillaEmployeeId: number | null;
  plantillaEmployeeName: string | null;
  plantillaEmployeeIdOriginal: string | null;
  nonPlantillaEmployeeId: number | null;
  nonPlantillaEmployeeName: string | null;
  nonPlantillaEmployeeIdOriginal: string | null;
  office: { id: number; name: string; acronym: string } | null;
  division: { id: number; officeId: number; name: string; acronym: string } | null;
  item: {
    id: number;
    group: 'PPE' | 'SE';
    propertyNumber: string | null;
    description: string | null;
    brand: string | null;
    model: string | null;
    serialNumber: string | null;
    category: string | null;
    unitOfMeasurement: string | null;
    unitValue: number;
    dateAcquired: string | null;
  } | null;
}

interface PaginatedData<T> {
  items: T[];
  totalCount: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}

export interface MyAccountabilitiesResult {
  items: IssuanceRecord[];
  totalCount: number;
}

const mapItem = (x: MyAccountabilityItem, currentEmployeeDbId: number): IssuanceRecord => {
  // Pick the name/id that belongs to the currently logged-in employee.
  // Prefer the entry whose numeric DB id matches the stored employeeDbId.
  // Falls back to plantilla → non-plantilla order when no match is found.
  let employeeId: number;
  let employeeName: string;
  let employeeIdOriginal: string | undefined;

  if (currentEmployeeDbId && x.nonPlantillaEmployeeId === currentEmployeeDbId) {
    employeeId       = x.nonPlantillaEmployeeId;
    employeeName     = x.nonPlantillaEmployeeName || 'N/A';
    employeeIdOriginal = x.nonPlantillaEmployeeIdOriginal ?? undefined;
  } else if (currentEmployeeDbId && x.plantillaEmployeeId === currentEmployeeDbId) {
    employeeId       = x.plantillaEmployeeId;
    employeeName     = x.plantillaEmployeeName || 'N/A';
    employeeIdOriginal = x.plantillaEmployeeIdOriginal ?? undefined;
  } else {
    // Fallback: show whoever has a name (original behaviour)
    employeeId       = x.plantillaEmployeeId ?? x.nonPlantillaEmployeeId ?? 0;
    employeeName     = x.plantillaEmployeeName || x.nonPlantillaEmployeeName || 'N/A';
    employeeIdOriginal = x.plantillaEmployeeIdOriginal ?? x.nonPlantillaEmployeeIdOriginal ?? undefined;
  }

  return ({
  id: x.id,
  ptaId: x.ptaId,
  employeeId,
  employeeName,
  employeeIdOriginal,
  subEmployeeId: x.nonPlantillaEmployeeId ?? undefined,
  subEmployeeName: x.nonPlantillaEmployeeName ?? undefined,
  subEmployeeIdOriginal: x.nonPlantillaEmployeeIdOriginal ?? undefined,
  plantillaEmployeeName: x.plantillaEmployeeName ?? undefined,
  nonPlantillaEmployeeName: x.nonPlantillaEmployeeName ?? undefined,
  itemName: x.item?.description || `Item #${x.ptaId}`,
  itemGroup: x.item?.group ?? 'PPE',
  parIcsNumber: x.parIcsNumber,
  issuanceType: x.status?.toUpperCase() === 'RENEW' ? 'RENEW' : 'NEW',
  issuedDate: x.dateAssigned ? x.dateAssigned.split('T')[0] : '',
  status: x.isActive ? 'ACTIVE' : 'INACTIVE',
  notes: x.remarks ?? undefined,
  actualOfficeId: x.office?.id,
  actualDivisionId: x.division?.id,
  officeName: x.office?.name ?? undefined,
  officeAcronym: x.office?.acronym ?? undefined,
  divisionName: x.division?.name ?? undefined,
  divisionAcronym: x.division?.acronym ?? undefined,
  propertyNumber: x.item?.propertyNumber ?? undefined,
  brand: x.item?.brand ?? undefined,
  model: x.item?.model ?? undefined,
  serialNumber: x.item?.serialNumber ?? undefined,
  category: x.item?.category ?? undefined,
  unitOfMeasurement: x.item?.unitOfMeasurement ?? undefined,
  unitValue: x.item?.unitValue,
  dateAcquired: x.item?.dateAcquired ? x.item.dateAcquired.split('T')[0] : undefined,
});
};

export const getMyAccountabilities = async (): Promise<MyAccountabilitiesResult> => {
  const { systemUserId, sessionKey } = getAuthParams();
  let employeeId = secureStorage.getItem('employeeId') || '';

  if (!employeeId) {
    const encryptedUserDetails = secureStorage.getItem('userDetails');
    if (encryptedUserDetails) {
      try {
        const userDetails = JSON.parse(decrypt(encryptedUserDetails));
        employeeId = userDetails?.employeeId || '';
      } catch {
        employeeId = '';
      }
    }
  }

  const response = await axiosInstance.get<ApiResponse<PaginatedData<MyAccountabilityItem>>>(
    '/Inventory/pta/accountabilities/me',
    {
      params: {
        ActionBySystemUserId: systemUserId,
        SessionKey: sessionKey,
        ...(employeeId ? { EmployeeId: employeeId } : {}),
        PageNumber: 1,
        PageSize: 1000,
      },
    }
  );

  const payload = response.data?.data;
  const currentEmployeeDbId = Number(secureStorage.getItem('employeeDbId') || '0');
  const items = (payload?.items ?? []).map((x) => mapItem(x, currentEmployeeDbId));

  return {
    items,
    totalCount: payload?.totalCount ?? items.length,
  };
};
