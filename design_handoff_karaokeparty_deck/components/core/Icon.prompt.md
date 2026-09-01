Renders one glyph from KaraokeParty's built-in single-path SVG set; the only icon source in the product — never inline your own SVG or reach for an icon font.

```jsx
<Icon icon='MAGNIFIER' size={28} />
```

Icons are monochrome and take `color` from the parent (`fill: currentColor`). Glow is applied by the *parent* as a `filter: drop-shadow(...)` so the light follows the glyph outline, not a box. Sizing is by height only — set `size`, or size the `svg` in CSS. 48 names; see `ICON_NAMES`.
