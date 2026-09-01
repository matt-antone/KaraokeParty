The library's whole control surface, inside the fixed header.

```jsx
<LibraryHeader
  query={q} onQueryChange={setQ}
  facets={['rock', '80s', 'belter']} activeFacets={['rock']} onFacetToggle={toggle}
  tab="artists" artistCount={214} songCount={1809}
/>
```

Three rows in this order: search, facet keys, tabs. Facets are **latching keys**, not selects — a lit amber key shows its state without being opened, which matters when you are filtering one-handed in a dark room. The starred toggle is a text ★ that lights amber. Search is a bare field with no well: the header itself is the surface.
