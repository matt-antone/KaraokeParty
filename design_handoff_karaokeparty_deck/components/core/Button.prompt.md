Every pressable thing. Keys are raised with a real bevel and drop 1px when pressed — that travel is the whole interaction language, so don't replace it with a colour change or an opacity fade.

```jsx
<Button tone="vu" block type="submit">Sign In</Button>
<Button tone="panel" block>Sign Out</Button>
<Button tone="flush" icon="MOVE_TOP" aria-label="Move to top" />
<Button tone="alert" icon="DELETE" aria-label="Remove" />
```

One amber key per panel, and on a single-panel screen that means one per screen — amber is the signal colour and it stops meaning anything if two things claim it. On a stack of panels (Settings), give the amber to the thing someone came to do: opening the player, not creating a room.

The transport is exempt: `PlaybackCtrl` is a fixed control cluster with its own colour logic (play/pause is always the amber key inside it), so a panel containing the transport may still have one amber key of its own. Icon-only keys are `flush` inside list rows (the row is already a surface) and `panel` on the transport bar. Minimum 44px in every direction, no exceptions.
