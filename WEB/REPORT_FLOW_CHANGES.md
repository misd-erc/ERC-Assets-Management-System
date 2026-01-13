# Report Generation Flow Changes

## Overview
Changed PAR and ICS report generation from **employee-centric** to **item-centric** with a two-step flow:
1. **Step 1**: Select an item (search/filter by property number, description, etc.)
2. **Step 2**: View item movements and select which movement/assignment to use for the report

---

## New Components Created

### 1. ItemSelectModal.tsx
- Modal for searching and selecting items (PPE or SE)
- Features:
  - Search by property number, description, serial number, category
  - Filter items by type (PPE or SE)
  - Displays item details (category, condition, serial number)
  - Pagination support for large datasets

### 2. ItemMovementsModal.tsx
- Modal showing all movements/assignments for a selected item
- Features:
  - Displays item details at the top
  - Lists all active movements with:
    - Date assigned
    - Condition
    - Employee/Office/Division information
    - PAR/ITR number
  - Click on a movement to confirm selection
  - Scrollable list for multiple movements

---

## Modified Components

### ReportTab.tsx
**Changes:**
- Added new state management for item-centric flow
  - `selectedItem` - currently selected asset
  - `selectedMovement` - currently selected movement/assignment
  - `showItemSelectModal` - modal visibility for item selection
  - `showItemMovementsModal` - modal visibility for movement selection

- New handler functions:
  - `handleItemSelect()` - handles item selection, opens movements modal
  - `handleMovementSelect()` - handles movement selection, generates preview
  - `generateItemPreview()` - generates PDF preview for item + movement

- Updated report buttons:
  - **PAR**: Now triggers `setShowItemSelectModal(true)` instead of employee modal
  - **ICS**: Now triggers `setShowItemSelectModal(true)` instead of employee modal
  - **PAL**: Still uses employee modal (unchanged)

- Added new modals to render:
  - `<ItemSelectModal />` - Step 1: Item selection
  - `<ItemMovementsModal />` - Step 2: Movement selection

### PARGenerator.tsx
**Changes:**
- Modified `generatePARPreview()` to accept:
  - `item: Asset` (the selected asset)
  - `movement: UnifiedMovement | null` (the selected movement)
  
- Modified `generatePAR()` to accept:
  - `item: Asset` (the selected asset)
  - `movement: UnifiedMovement | null` (the selected movement)

- Extracts employee information from movement data instead of taking employee directly
- Fetches employee details using IDs from movement object

### ICSGenerator.tsx
**Changes:**
- Modified `generateICSPreview()` to accept:
  - `item: Asset` (the selected asset)
  - `movement: UnifiedMovement | null` (the selected movement)
  
- Modified `generateICS()` to accept:
  - `item: Asset` (the selected asset)
  - `movement: UnifiedMovement | null` (the selected movement)

- Same logic as PARGenerator - extracts employee info from movement

---

## User Flow Comparison

### OLD FLOW (PAR/ICS)
```
Click PAR/ICS Icon
    ↓
Select Employee
    ↓
Generate Report for ALL employee's assets
    ↓
Download/Preview
```

### NEW FLOW (PAR/ICS)
```
Click PAR/ICS Icon
    ↓
[STEP 1] Select Item
    (Search by property number, description, serial number)
    ↓
[STEP 2] Select Movement
    (Shows which employee/office the item is currently assigned to)
    ↓
Generate Report for SPECIFIC ITEM
    ↓
Download/Preview
```

---

## Technical Details

### ItemSelectModal
- Fetches all PPE/SE assets using `UnifiedAssetService.getAll()`
- Real-time search filtering on client-side
- Displays up to 1000 items per load

### ItemMovementsModal
- Filters movements to show only active/non-deleted ones
- Displays movement history for the selected item
- Allows selection of a specific movement to generate report for

### Modified Generators
- Now accept single `Asset` + `UnifiedMovement` instead of array of assets
- Extract employee information from movement data
- Support null movement (for items not assigned to anyone)

---

## Benefits
✅ More granular report generation (per item, not all items of employee)
✅ Better visibility into item movements and assignments
✅ Ability to generate reports for unassigned items
✅ Clearer audit trail (report generated for specific movement date)
✅ Reduced data clutter in reports (one item at a time)
