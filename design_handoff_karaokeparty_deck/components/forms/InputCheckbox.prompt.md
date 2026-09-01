Labelled toggle: the visualizer switch, video keying, room and player preference flags.

```jsx
<InputCheckbox label="Visualizer" checked={on} disabled={!isWebGLSupported} onChange={setOn} />
```

Off is a recessed well, on is a raised amber key with a dark tick — the same raised/recessed logic as every other control. The whole label is the target and clears 44px. Disabled is 45% opacity with the box left in its off state.
