The library's jump rail, pinned to the right edge of the artist list.

```jsx
<AlphaPicker active="T" onPick={scrollToLetter} style={{ position: 'sticky', top: 0, height: '100%' }} />
```

Deliberately unlit (`--ink-5`) with only the current letter amber — it's a tool you reach for, not something you read. Sized in `vh` so the alphabet fits any phone; do not convert to px. Appears only in the Artists tab, and only when not searching.
