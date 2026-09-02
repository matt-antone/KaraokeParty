The room transport — play/pause, skip, volume knob, level meter, display options.

```jsx
<PlaybackCtrl isPlaying volume={0.78} onPause={pause} onPlayNext={next} onVolumeChange={setVolume} />
```

**It has exactly one home: the `Player` panel on the Settings screen, and the player screen's own header.** It is not in the app header and it never appears on the library, queue or account screens. Player controls are admin-only — a singer does not pause the room, not even during their own song — and putting them on every screen made the app look like a remote control when it is a request queue.

Order never changes: play/pause, skip, volume, display, fullscreen. Play/pause is the single amber key; skip is graphite with an amber glyph, because skipping someone's song deserves one more moment of thought than pausing. The knob is the input and the meter beside it is the readout — never a volume number. When no player is connected, the panel shows the prompt to open one instead of a disabled transport.
