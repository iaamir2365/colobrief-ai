# Task r8: Polish log symptoms, records, and handout tabs

## Files Modified
1. `src/components/colobrief/log-symptoms-tab.tsx`
2. `src/components/colobrief/my-records-tab.tsx`
3. `src/components/colobrief/doctor-handout-tab.tsx`

## Changes Summary

### log-symptoms-tab.tsx
- Added `ClipboardCheck` icon import
- Added welcome banner with gradient teal/emerald background at top of form
- Added "Physical Symptoms" section header with separator before Pain/Frequency cards
- Added "Identified Triggers" section header before Triggers card
- Added "Additional Notes" section header before Notes card
- Changed trigger checkboxes from flex-wrap to `grid grid-cols-2 sm:grid-cols-3` layout
- Added character count below notes textarea
- Enhanced Save button with teal gradient background and shadow

### my-records-tab.tsx
- Added `expandedId` state for expandable row details
- Made table rows clickable with cursor-pointer and hover effect
- Added expanded detail row showing notes, stress level, and Bristol type
- Added `e.stopPropagation()` on delete button to prevent row toggle
- Computed `avgPain`, `avgFreq`, `avgStress` from filtered array
- Added summary averages row below table
- Replaced simple Previous/Next pagination with full page number buttons (with ellipsis for many pages)

### doctor-handout-tab.tsx
- Added Bristol Stool Scale reference card above the main handout (print:hidden)
- Reference card shows 4 categories: Constipation, Normal, Mild Diarrhea, Severe Diarrhea
- Added mobile scroll hint for handout table (`sm:hidden`)
- Added pain color coding to handout table cells (emerald/amber/rose)
- Enhanced SBAR sections with colored left borders: S=teal, B=sky, A=amber, R=violet
- Updated heading colors to match their respective border colors

## Notes
- Pre-existing lint error in overview-tab.tsx (line 400) not related to this task
- All three modified files pass lint cleanly
- Dev server compiles successfully with no errors
