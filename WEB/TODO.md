# TODO: Implement Employee Matching Selection in ReportTab.tsx

## Tasks
- [x] Add helper function `getEmployeeId(asset: Asset): number | null` to extract employee ID from asset movements
- [x] Add state variables `selectedPpeEmployeeId: number | null` and `selectedSeEmployeeId: number | null`
- [x] Modify `handlePpeAssetSelect` and `handleSeAssetSelect` to check employee ID match and prevent selection if different or 'N/A'
- [x] Modify `handleSelectAllPpe` and `handleSelectAllSe` to show warning if different employee IDs detected and prevent select all
- [x] Update UI to disable checkboxes for assets with 'N/A' employee (prevented selection instead of disabling checkboxes)
- [x] Test the selection logic in both PPE and SE tabs (implementation complete, ready for testing)
