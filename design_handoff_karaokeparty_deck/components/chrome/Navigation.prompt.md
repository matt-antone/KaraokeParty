Primary navigation: Library, Queue, Account, and Settings for admins. Fixed to the bottom with `position: sticky; bottom: 0`.

```jsx
<Navigation active="library" isAdmin onNavigate={setRoute} />
```

26px icons, no labels, 52px bar. The lit tab is amber with a 2px amber rule along its top edge — the rule is what makes it read as a selected channel rather than just a coloured icon. Unlit tabs are `--ink-5`.
