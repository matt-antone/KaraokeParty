Header for the queue screen: three tabs, nothing else.

```jsx
<QueueHeader tab="me" queueCount={8} myCount={2} historyCount={14} onTabChange={setTab} />
```

The three tabs are three different interfaces, not three filters of one list:

- **Queue** — the whole rotation, in order.
- **Me** — only the singer's own songs, reorderable by them, then their song history. Do not render it as a filtered queue list.
- **History** — what the room has already sung tonight. Those songs are locked, so the rows are inert.

The singer's status and the pause key are **not** here: they live in `YourTurn`, the app header, where they are visible on every screen.
