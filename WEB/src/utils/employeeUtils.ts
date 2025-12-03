import { NormalizedEmployee } from '@/types/asset/UnifiedAsset';

export function normalizeEmployee(e: any): NormalizedEmployee {
  const firstName = e.firstName ?? "";
  const middleName = e.middleName ?? "";
  const lastName = e.lastName ?? "";
  const suffixName = e.suffixName ?? "";
  const employeeIdOriginal = e.employeeIdOriginal ?? "";
  const employmentTypeId = e.employmentType?.id ?? 1;
  const employmentTypeName = employmentTypeId === 1 ? 'Plantilla' : 'Non-Plantilla';

  const label = `${lastName}, ${firstName}${middleName ? ` ${middleName}` : ''}${suffixName ? ` ${suffixName}` : ''}${employeeIdOriginal ? ` — ${employeeIdOriginal}` : ''} (${employmentTypeName})`;

  return {
    id: e.id,
    firstName,
    middleName,
    lastName,
    suffixName,
    employeeIdOriginal,
    employmentTypeId,
    label,
  };
}

export function handleEmployeeSelect(
  employees: NormalizedEmployee[],
  employeeId: number,
  onChange: (plantillaEmployeeId: number | null, nonPlantillaEmployeeId: number | null) => void
) {
  const emp = employees.find(e => e.id === employeeId);
  if (!emp) {
    onChange(0, 0);
    return;
  }

  if (emp.employmentTypeId === 1) {
    onChange(employeeId, 0);
  } else {
    onChange(0, employeeId);
  }
}
