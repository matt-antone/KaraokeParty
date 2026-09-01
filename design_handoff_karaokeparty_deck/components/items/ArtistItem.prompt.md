A row in the library's Artists tab. Tapping expands the artist's songs inline beneath it — it is not a navigation push.

```jsx
<ArtistItem name="Talking Heads" songCount={8} hasStarredChild onClick={toggle} />
```

46px and separated by seams rather than boxed as a key — folders are labels, not controls, and only songs are pressable in the key sense. The count lives inside the glyph and is replaced by a chevron when open. Two independent signals: starred children light the folder, queued children light the name.
