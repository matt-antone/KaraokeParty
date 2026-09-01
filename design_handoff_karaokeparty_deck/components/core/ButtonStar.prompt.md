Star a song. In every library row, every queue row, and the song-history list.

```jsx
<ButtonStar isStarred={isStarred} count={numStars} onClick={toggle} />
```

A text ★ — this brand uses no emoji anywhere, so do not swap in ⭐. Off is `--ink-5` and reads as unlit; on is amber and reads as lit, same as every other indicator. The count is mono, 9px, tight against the star.
