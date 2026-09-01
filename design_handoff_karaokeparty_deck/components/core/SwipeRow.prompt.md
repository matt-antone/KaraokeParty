Wraps a list row so it can be **swiped aside in one piece**, revealing labelled action keys bolted to the chassis underneath. This is the product's only row-action pattern.

```jsx
<SwipeRow
  isOpen={isOpen}
  onOpenChange={setOpen}
  actions={[
    { icon: 'MOVE_TOP', label: 'Top', tone: 'vu' },
    { icon: 'DELETE', label: 'Remove', tone: 'alert' },
  ]}
>
  {/* the row itself — must be opaque, it slides over the keys */}
</SwipeRow>
```

Why it works this way: the row is a cartridge and the keys are the panel behind it. Nothing expands, nothing reflows, and the row's own content never changes width — so a long song title is not squeezed by the actions appearing.

Rules: the sliding child must have an opaque background or the keys show through — and it must stay at `opacity: 1`. Dim a "spent" row by stepping its text down the ink ramp (and greyscaling its avatar), never with opacity on the layer that carries the background. Put edge rules like the owner marker on the `SwipeRow` shell rather than the sliding child, so they stay visible while the row is aside. Each key is 72px wide with a glyph over a one-word silkscreen label — the label is what makes the gesture's payoff obvious, so do not drop it. Two or three actions maximum; past that the row has to travel too far. Destructive keys are `alert`, constructive are `vu`. A vertical drag is handed back to the list so the page still scrolls, and the row snaps open past 40% of its travel.
