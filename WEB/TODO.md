# TODO: Fix AuditLogDetailsModal TypeError

## Tasks
- [ ] Update `src/types/audit/index.ts` to change `changes` type from array to object
- [ ] Edit `src/components/audit-logs/AuditLogDetailsModal.tsx` to handle `changes` as an object
- [ ] Edit `src/components/audit-logs/AuditLogsTable.tsx` to use `Object.keys` for changes count

## Followup
- [ ] Test the audit logs page to ensure the modal opens without error and displays changes correctly
