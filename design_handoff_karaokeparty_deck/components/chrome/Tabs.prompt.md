Segmented switch in a header: Artists / Songs in the library, Queue / Me / History in the queue.

```jsx
<Tabs active="queue" onChange={setTab} tabs={[
  { id: 'queue', label: 'Queue', count: 8 },
  { id: 'me', label: 'Me', count: 2 },
  { id: 'history', label: 'History', count: 14 },
]} />
```

The track is recessed and the selected tab is a raised key with an amber label — the unselected ones have no key face at all. Counts ride inline in mono at 10px; never a coloured badge. Two or three tabs; a fourth destination belongs in the bottom nav.
