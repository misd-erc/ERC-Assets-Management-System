# Employee Dropdown Fixes for AssetsForm.tsx

## Issues to Fix
- [ ] Dropdown showing "undefined, undefined"
- [ ] react-select crashing: Cannot read properties of undefined (reading 'toString')
- [ ] Mapping is wrong because API fields are: id, firstName, lastName, middleName, suffixName, employeeIdOriginal, employmentType.id
- [ ] Dropdown must be searchable by firstName, lastName, middleName, employeeIdOriginal
- [ ] Only ONE dropdown must be used
- [ ] When employee is selected: If employmentType.id === 1 → plantillaEmployeeId = id, nonPlantillaEmployeeId = 0; Else → nonPlantillaEmployeeId = id, plantillaEmployeeId = 0

## Implementation Steps
- [ ] Update normalizeEmployee function to match API fields exactly
- [ ] Fix fetchEmployees to use normalizeEmployee and correct API structure
- [ ] Create formatEmployeeLabel function for proper display
- [ ] Build employeeOptions safely to prevent undefined crashes
- [ ] Fix value handling for ReactSelect component
- [ ] Implement searchable dropdown with custom filterOption
- [ ] Test the implementation to ensure no crashes and proper functionality
