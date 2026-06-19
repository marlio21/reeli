# v52.2.1 – Simple Studio Layout Fix

Purpose: hard mobile layout correction for the simple dashboard version.

## Changed

- Keeps the simple dashboard model from v52.2.
- Forces the mobile preview panel to the top of the Studio flow.
- Removes the large empty dark space above the phone preview.
- Caps mobile preview height so the navigation and edit panel appear sooner.
- Keeps the main navigation visible and compact.
- Keeps the subnavigation as compact horizontal chips.
- Makes the light edit panel visible below the preview/chips instead of only showing an offscreen rounded edge.
- Hides non-essential preview footer actions on mobile to save vertical space.
- Leaves Public Link, public mobile card renderer and desktop public renderer unchanged.

## Test focus

Open on Samsung/mobile after deploy with `?v=5221` and verify:

1. Preview appears directly below the top Studio bar.
2. There is no huge empty dark gap before the phone preview.
3. Scene / Text / Buttons / Design remain reachable.
4. Subsection chips are visible below the preview.
5. The light edit panel is visible and no longer cut off at the bottom.
6. Public Link remains unchanged.
