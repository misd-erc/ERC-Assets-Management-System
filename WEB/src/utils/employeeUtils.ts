import { NormalizedEmployee } from '@/types/asset/UnifiedAsset';

// Employment types that belong to the "Plantilla" accountability group.
// Contractual employees are treated the same as Plantilla for asset accountability purposes.
const PLANTILLA_TYPE_NAMES = ['plantilla', 'contractual'];

export function isPlantillaEmploymentType(name?: string | null): boolean {
  return !!name && PLANTILLA_TYPE_NAMES.includes(name.trim().toLowerCase());
}

type MovementEmployee = {
  id?: number;
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  suffixName?: string | null;
  employeeIdOriginal?: string | null;
  employmentType?: { name?: string | null } | null;
  employmentTypeName?: string;
};

export interface MovementEmployeeSlots {
  plantilla: MovementEmployee | null;
  nonPlantilla: MovementEmployee | null;
}

/**
 * Resolve the displayed accountability slots using the employee's current
 * employment type. This also repairs legacy records where a COS was stored in
 * nonPlantillaEmployeeId and later became Contractual.
 */
export function resolveMovementEmployeeSlots(
  movement: {
    plantillaEmployeeId?: number | null;
    nonPlantillaEmployeeId?: number | null;
    employee?: MovementEmployee[];
  },
  employees: MovementEmployee[] = []
): MovementEmployeeSlots {
  const movementEmployees = Array.isArray(movement.employee) ? movement.employee : [];
  const findById = (id?: number | null) => {
    if (!id) return null;
    return movementEmployees.find(employee => employee.id === id)
      ?? employees.find(employee => employee.id === id)
      ?? null;
  };
  const employmentTypeName = (employee: MovementEmployee | null) =>
    employee?.employmentType?.name ?? employee?.employmentTypeName;

  const plantillaById = findById(movement.plantillaEmployeeId);
  const nonPlantillaById = findById(movement.nonPlantillaEmployeeId);
  const plantillaByType = movementEmployees.find(employee =>
    isPlantillaEmploymentType(employmentTypeName(employee))
  ) ?? null;

  // A legacy sub-accountable COS who is now Contractual is the current
  // plantilla/accountable holder. Do not show the same person in both slots.
  if (nonPlantillaById && isPlantillaEmploymentType(employmentTypeName(nonPlantillaById))) {
    return { plantilla: nonPlantillaById, nonPlantilla: null };
  }

  return {
    plantilla: plantillaById ?? plantillaByType,
    nonPlantilla: nonPlantillaById,
  };
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
