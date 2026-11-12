import type { NormalizedEmployee } from '@/types/asset/UnifiedAsset';
import { isPlantillaEmploymentType } from '../../../utils/employeeUtils';

export function reportEmployeeName(employee: NormalizedEmployee | null): string {
  if (!employee) return '';
  return [employee.firstName, employee.middleName, employee.lastName, employee.suffixName]
    .filter(Boolean).join(' ').trim() || employee.label;
}

// Legacy APIs use 0 for an empty slot. Never pair one slot's ID with another's name.
export function resolvePTRPeople(raw: any, employees: NormalizedEmployee[] = []) {
  const read = (slot: string): NormalizedEmployee | null => {
    const embedded = raw[slot];
    const id = Number(embedded?.id || raw[`${slot}Id`]);
    const name = raw[`${slot}Name`] || '';
    const known = embedded || employees.find(e => Number(e.id) === id);
    if (!(id > 0) && !name.trim()) return null;
    return {
      id: id > 0 ? id : 0,
      firstName: known?.firstName || '', middleName: known?.middleName || '',
      lastName: known?.lastName || '', suffixName: known?.suffixName || '',
      employeeIdOriginal: known?.employeeIdOriginal || raw[`${slot}IdOriginal`] || '',
      employmentTypeId: known?.employmentType?.id || known?.employmentTypeId || 0,
      employmentTypeName: known?.employmentType?.name || known?.employmentTypeName || raw[`${slot}Type`] || '',
      label: name || known?.label || '',
      positionName: known?.position?.name || known?.positionName || raw[`${slot}Position`] || '',
      officeName: known?.office?.acronym || known?.office?.name || known?.officeName || raw[`${slot}Office`] || '',
      divisionName: known?.division?.acronym || known?.division?.name || known?.divisionName || raw[`${slot}Division`] || '',
    };
  };
  // Apply the same legacy COS-to-Contractual rule used by the asset screens.
  // A promoted holder may still occupy the old non-plantilla database slot.
  const slots = (plantilla: NormalizedEmployee | null, nonPlantilla: NormalizedEmployee | null) =>
    nonPlantilla && isPlantillaEmploymentType(nonPlantilla.employmentTypeName)
      ? { plantilla: nonPlantilla, nonPlantilla: null }
      : { plantilla, nonPlantilla };
  const { plantilla, nonPlantilla } = slots(read('plantillaEmployee'), read('nonPlantillaEmployee'));
  const { plantilla: previousPlantilla, nonPlantilla: previousNonPlantilla } =
    slots(read('previousPlantillaEmployee'), read('previousNonPlantillaEmployee'));
  // Match the source accountability slot to the receiving slot. A non-plantilla
  // recipient is not necessarily a Sub-PAR holder: they may be the sole recipient.
  const to = plantilla || nonPlantilla;
  const from = plantilla ? previousPlantilla || previousNonPlantilla : previousNonPlantilla || previousPlantilla;
  const samePerson = to && nonPlantilla && (
    (to.id > 0 && to.id === nonPlantilla.id) ||
    (Boolean(reportEmployeeName(to)) && reportEmployeeName(to).toUpperCase() === reportEmployeeName(nonPlantilla).toUpperCase())
  );
  const sub = plantilla && nonPlantilla && !samePerson ? nonPlantilla : null;
  return { from, to, sub };
}

export function ptrPeopleFields(raw: any, employees: NormalizedEmployee[] = []) {
  const { from, to, sub } = resolvePTRPeople(raw, employees);
  return {
    fromEmployee: from, fromEmployeeId: from?.id, fromEmployeeName: reportEmployeeName(from) || 'N/A',
    toEmployee: to, toEmployeeId: to?.id, toEmployeeName: reportEmployeeName(to) || 'N/A',
    nonPlantillaEmployee: sub, nonPlantillaEmployeeId: sub?.id ?? null,
    nonPlantillaEmployeeName: reportEmployeeName(sub),
    toEmployeePositionOffice: [to?.positionName, [to?.officeName, to?.divisionName].filter(Boolean).join(', ')]
      .filter(Boolean).join(' - '),
  };
}
