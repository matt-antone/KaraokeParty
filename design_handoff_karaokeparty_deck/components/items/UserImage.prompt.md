The singer's face, wherever a singer is named: queue rows (62px), the account form (96px), the player's intermission card (25vh).

```jsx
<UserImage src={user.imageUrl} style={{ width: 'var(--avatar-queue)' }} />
```

Always square with a 3px radius, always `object-fit: cover`, always sitting in a recessed well. Size it from the outside. The fallback glyph is `--ink-5` — unlit, like every other empty indicator.
