# Unified PPE/SE Movement Payload Fix

## Tasks
- [x] Add `normalizeMovement(entry, assetModel)` helper in UnifiedAssetService.ts
- [x] Update AssetsForm.tsx to normalize movements before submitting
- [x] Update UnifiedAssetService.create() to use normalizeMovement
- [x] Update UnifiedAssetService.update() to use normalizeMovement
- [x] Update mapApiToUnifiedAsset to map actualOfficeId → officeId, actualDivisionId → divisionId
- [x] Remove duplicated movement logic from PPE services
- [x] Remove duplicated movement logic from SE services
