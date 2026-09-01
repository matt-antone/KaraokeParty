Every section of Account and Settings is a Panel — My Account, Song History, Rooms, Users, Preferences. Nothing sits loose on the chassis.

```jsx
<Panel title="Rooms" titleComponent={<select>…</select>}>
  <table>…</table>
</Panel>
```

Titles are silkscreen: short, and rendered uppercase and tracked by the component — write "Song History", not "SONG HISTORY". The title strip is separated by a hairline, not a fill; the panel's own bevel is what lifts it off the chassis. Stack panels with `gap: var(--gap-4)`.
