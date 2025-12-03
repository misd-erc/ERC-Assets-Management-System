# Edit Asset Flow Fixes

## Issues Identified
1. AssetEditForm.tsx uses `UnifiedAssetService.create` instead of `update`
2. Incorrect ptaId logic for parts and movements in edit payload
3. Need to ensure payload rules are followed for EDIT operations

## Steps to Complete
- [ ] Fix AssetEditForm.tsx to use update instead of create
- [ ] Correct ptaId logic in payload preparation (always asset.id for edit)
- [ ] Ensure parts keep existing ids, new parts get id: null
- [ ] Ensure movements keep existing ids, new movements get id: null
- [ ] Verify UnifiedAssetService uses correct endpoint (both create/update use same API endpoint)
- [ ] Test the edit flow to ensure AssetEditForm loads with full data
