# PTR and ITR Implementation Plan

## Information Gathered
- ReportTab.tsx: PTR and ITR buttons exist with empty actions
- PARGenerator.tsx: Example for PDF generation using @react-pdf/renderer, fetches assets via getEmployeeAssets, generates PDF with header, table, signatures
- ICSGenerator.tsx: Similar to PAR, for SE assets
- APIs: getEmployeeAssets(employeeId, groupName) for assets by employee, /Inventory/pta/se-ppe/all/{assetId} for single asset
- PTAService: Has movement edit API for updating movements
- UnifiedAsset.ts: Defines Asset, UnifiedMovement interfaces
- ReportPreviewModal: Reusable for preview and confirm

## Plan
- Create PTRGenerator.tsx: Static class for PTR PDF generation, handles multiple assets transfer
- Create ITRGenerator.tsx: Static class for ITR PDF generation, handles single asset movement history
- Create PTRGenerationModal.tsx: Multi-step modal for PTR flow (select FROM/TO employees, date, assets)
- Create ITRGenerationModal.tsx: Modal for ITR flow (select asset)
- Update ReportTab.tsx: Add actions for PTR and ITR buttons to open respective modals
- Update ReportPreviewModal.tsx: Ensure it handles PTR/ITR types if needed

## Dependent Files to be edited
- src/components/assets/reports/ReportTab.tsx: Add imports and button actions
- New files: PTRGenerator.tsx, ITRGenerator.tsx, PTRGenerationModal.tsx, ITRGenerationModal.tsx

## Followup steps
- Test PTR flow: Select employees, assets, generate PDF
- Test ITR flow: Select asset, generate PDF
- Verify PDF content matches requirements
- Ensure no conflicts with existing PAR/ICS logic
