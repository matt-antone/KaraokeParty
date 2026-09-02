Rotary control for room volume. Drag up and down — deliberately not horizontal, so it can live in a header above a horizontally-swiped list without conflict.

```jsx
<Knob value={volume} onChange={setVolume} label="vol" />
```

Pair it with a VuMeter rather than a number: the knob is the input, the meter is the readout. The amber indicator line sweeps 270 degrees from -135 to +135. Only ever one knob on a screen.
