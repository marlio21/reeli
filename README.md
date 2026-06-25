# ureel clean preview stabilization v52.5.35

Focused stabilization release after v52.5.34.

## Main intent

Do not change the app concept. Repair the mobile button presentation and reduce the empty public-view loading moment.

## Changes

- Button tile sizes are balanced again for the real 390×693 mobile surface.
- Studio preview, clean preview, and Public view use the same safe clamp: 38–68px.
- Presets now write:
  - Klein: 42px
  - Normal: 50px
  - Groß: 58px
  - Sehr groß: 66px
- Button icon/text scale is reduced so labels do not overflow as easily.
- Button content stays centered and slightly lifted inside the tile.
- Layered button dock is lifted from the bottom and capped to avoid clipping.
- Public video elements preload automatically again to reduce the blank area before the first frame.
- Debug remains hidden unless `?debugLayout=force` is used.

## Upload notes

The ZIP intentionally excludes `dist/`, `node_modules/`, and release-note clutter. Vercel should build from `package.json`.
