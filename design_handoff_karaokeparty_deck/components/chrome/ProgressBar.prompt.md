Admin-only scanner status, inside the header while a scan runs and until dismissed.

```jsx
<ProgressBar isActive pct={42} text="Scanning /media/karaoke" onCancel={stop} />
```

Progress is a VU meter with peaking switched off (`peakFrom` above 1) — it must never flash red, because a scan reaching 90% is good news. Red X while running because it cancels real work; grey X once finished because it only dismisses. Non-admins never see it.
