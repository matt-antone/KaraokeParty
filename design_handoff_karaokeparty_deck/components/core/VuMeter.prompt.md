The brand's signature element. Use it wherever a quantity is continuous and live: room level, queue depth, scan progress, song position on the player stage.

```jsx
<VuMeter value={0.72} segments={24} />
```

Unlit segments are recessed wells; lit ones sit flush and light amber, with the top ~14% going red. It is a *readout*, not a control — pair it with a Knob or Slider if the value needs changing. Never animate it decoratively; it moves because the audio does.
