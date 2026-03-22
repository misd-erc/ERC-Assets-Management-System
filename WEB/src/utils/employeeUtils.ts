import { NormalizedEmployee } from '@/types/asset/UnifiedAsset';

// Employment types that belong to the "Plantilla" accountability group.
// Contractual employees are treated the same as Plantilla for asset accountability purposes.
const PLANTILLA_TYPE_NAMES = ['Plantilla', 'Contractual'];

export function isPlantillaEmploymentType(name: string): boolean {
  return PLANTILLA_TYPE_NAMES.includes(name);
}

export function normalizeEmployee(e: any): NormalizedEmployee {
  const firstName = e.firstName ?? "";
  const middleName = e.middleName ?? "";
  const lastName = e.lastName ?? "";
  const suffixName = e.suffixName ?? "";
  const employeeIdOriginal = e.employeeIdOriginal ?? "";
  const employmentTypeId = e.employmentType?.id ?? 1;
  const employmentTypeName = e.employmentType?.name ?? 'Plantilla';
  const groupLabel = isPlantillaEmploymentType(employmentTypeName) ? 'Plantilla' : 'Non-Plantilla';

  const label = `${lastName}, ${firstName}${middleName ? ` ${middleName}` : ''}${suffixName ? ` ${suffixName}` : ''}${employeeIdOriginal ? ` — ${employeeIdOriginal}` : ''} (${groupLabel})`;

  return {
    id: e.id,
    firstName,
    middleName,
    lastName,
    suffixName,
    employeeIdOriginal,
    employmentTypeId,
    employmentTypeName,
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

  if (isPlantillaEmploymentType(emp.employmentTypeName)) {
    onChange(employeeId, 0);
  } else {
    onChange(0, employeeId);
  }
}
