# PPE & SE Unification Task

## Overview
Unify PPE and SE pages into one reusable page and set of components. The only difference is API data source.

## Tasks
- [x] Create unified AssetService.ts that dynamically calls PPE or SE APIs based on type
- [x] Create AssetsTable.tsx (merge PPETable and SETable)
- [x] Create AssetsFilters.tsx (merge PPEFilters and SEFilters)
- [x] Create AssetsForm.tsx (merge PPEForm and SEForm)
- [x] Create AssetsViewCard.tsx (merge PPEViewCard and SEViewCard)
- [x] Create unified AssetsPage.tsx component that accepts type prop ("ppe" | "se")
- [ ] Update PPESEPage.tsx to use unified AssetsPage component
- [ ] Update routing in App.tsx to use unified page
- [ ] Remove duplicated folders: src/pages/ppe/, src/pages/se/, src/components/ppe/, src/components/se/
- [ ] Test unified components with both PPE and SE data
- [ ] Verify all modals, filters, pagination work correctly
