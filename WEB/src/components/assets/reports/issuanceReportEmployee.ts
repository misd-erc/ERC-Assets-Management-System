import { getEmployeeById } from '@/api/user-management/userApi';
import { ApiEmployee } from '@/types/asset/UnifiedAsset';
import { IssuanceRecord } from '@/types/issuance';

export interface IssuanceReportEmployeeInfo {
  employeeName: string;
  position: string;
  office: string;
  nonPlantillaEmployeeName: string;
}

const fullName = (employee: ApiEmployee) =>
  [employee.firstName, employee.middleName, employee.lastName, employee.suffixName]
    .filter(Boolean)
    .join(' ')
    .trim();

const isPlantillaOrContractual = (employee: ApiEmployee | null) => {
  const employmentType = employee?.employmentType?.name?.trim().toLowerCase();
  return employmentType === 'plantilla' || employmentType === 'contractual';
};

const loadEmployee = async (id?: number): Promise<ApiEmployee | null> => {
  if (!id) return null;

  try {
    const response = await getEmployeeById(id);
    return response.success && response.data.length > 0 ? response.data[0] : null;
  } catch {
    return null;
  }
};

/**
 * Resolve the current recipient for an old issuance record.
 *
 * A COS can be stored as the old record's sub-accountable employee and later
 * become Plantilla/Contractual. In that case the current employee must be the
 * report recipient, and must no longer be printed as Sub-PAR/Sub-ICS.
 */
export async function resolveIssuanceReportEmployeeInfo(
  record: IssuanceRecord
): Promise<IssuanceReportEmployeeInfo> {
  const [accountableEmployee, subEmployee] = await Promise.all([
    loadEmployee(record.employeeId),
    loadEmployee(record.subEmployeeId),
  ]);

  const promotedSubEmployee = isPlantillaOrContractual(subEmployee) ? subEmployee : null;
  const recipient = promotedSubEmployee || accountableEmployee;

  let employeeName = record.employeeName || 'N/A';
  let position = 'N/A';
  let office = record.officeName || 'N/A';

  if (recipient) {
    employeeName = fullName(recipient) || employeeName;
    position = recipient.position?.name || position;
    const officeAcronym = recipient.office?.acronym || recipient.office?.name || record.officeName || '';
    const divisionAcronym = recipient.division?.acronym || recipient.division?.name || '';
    office = [officeAcronym, divisionAcronym].filter(Boolean).join(' - ') || office;
  }

  // A promoted sub-employee is now the recipient, so do not render a Sub-PAR
  // or Sub-ICS line for the same person.
  const nonPlantillaEmployeeName = promotedSubEmployee
    ? ''
    : record.subEmployeeName || (subEmployee ? fullName(subEmployee) : '');

  return { employeeName, position, office, nonPlantillaEmployeeName };
}
