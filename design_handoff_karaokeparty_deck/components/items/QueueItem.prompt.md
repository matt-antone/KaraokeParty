A channel in the rotation. Taller than a library row (86px) because the singer's photo is the primary identifier — people find their turn by looking for their face, not by reading.

```jsx
<QueueItem
  isCurrent isPlaying pctPlayed={38}
  title="Dreams" artist="Fleetwood Mac" userDisplayName="Dana"
  isOpen={isOpen} onOpenChange={setOpen}
  actions={[{ icon: 'PLAY_NEXT', label: 'Skip', tone: 'alert' }]}
/>
```

Actions live *under* the row, via `SwipeRow`: swiping slides the whole row aside and reveals labelled keys on the chassis. The row's own content never changes width, so a long title is never squeezed by actions appearing. The star stays on the row face, because it is a state readout as much as an action.

Song titles wrap and are never truncated, so the row grows past its 86px minimum when a title is long — do not put a queue row inside a fixed-height container. Pass `showStar={false}` on the Me tab.

The playing row *is* the progress bar — an amber wash with a slow sweep across it. Never add a separate progress element. The viewer's own rows get a 2px amber rule down the left edge, not a fill: on a deck, the armed channel is marked at the edge. That rule sits on the swipe shell, so it stays put when the row slides aside. Spent rows (played, or paused) dim by colour — title to `--ink-4`, artist and singer to `--ink-5`, avatar greyscaled — never by opacity, which would let the action keys show through. Which actions appear is permission-driven — move to top, replay, remove, skip — toned amber for constructive and red for destructive. A played row gets **no actions at all**: a song sung tonight is locked. There is no info action: the row already shows the title, artist and singer, which is everything anyone acts on.
