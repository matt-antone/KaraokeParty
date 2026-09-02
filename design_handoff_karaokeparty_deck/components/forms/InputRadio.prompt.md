The join flow's choices: which room, and returning user / new user / guest.

```jsx
<InputRadio name="mode" value="guest" label="Guest" checked={mode === 'guest'} onChange={setMode} />
```

Stack in a column under a silkscreen section label ("JOIN AS..."). Each row is a full 44px target across its whole width. Long room names ellipsise rather than wrapping — the list must stay scannable at a glance.
