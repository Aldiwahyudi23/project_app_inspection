# TODO - Fix Filter and Progress Issues

## Issues Fixed:
1. [x] Issue 1: Doors filter - type mismatch between settings.doors and vehicleAttr.doors
   - Added `Number()` coercion in `isMatchVehicleAttr` function
2. [x] Issue 2: is_visible = false not showing in navigation toggle
   - Changed from `!item.is_visible` to `item.is_visible === false` in `_isNativelyHidden`
3. [x] Issue 3: Progress calculation - only count visible and required items
   - Fixed `progress` computed to filter by `_finalVisibility === true && is_required === true`
   - Updated navigation components to use same logic

## Files Edited:
- `src/pages/Inspection/FormInspection.vue` - Main form with fixes 1, 2, 3
- `src/components/inspection/InspectionNavigation.vue` - Navigation progress display

## Summary of Changes:
1. **Doors Filter**: `Number(settings.doors) !== Number(vehicleAttr.doors)` - handles string/number comparison
2. **is_visible**: Changed to `item.is_visible === false` to explicitly check for false value
3. **Progress**: Now only counts items where:
   - `_finalVisibility === true` (visible after filters)
   - `is_required === true` (mandatory fields)
