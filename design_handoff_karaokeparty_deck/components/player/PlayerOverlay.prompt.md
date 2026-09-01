Everything the player draws over the video. One component, six mutually exclusive states — never two at once.

```jsx
<PlayerOverlay state="intermission" singer="Dana" singerImage={dana} nextTitle="Once in a Lifetime" nextArtist="Talking Heads" secondsLeft={9} comingUpSinger="Priya" comingUpTitle="Dreams" queueDepth={8} />
```

Rules: overlays over playing video are **solid corner panels** in the top-right, keeping the lower two-thirds clear of lyrics. The corner panel always names the singer *and* their song — a name alone leaves the room guessing what is about to play — with the song separated by a hairline beneath the name. Intermission is the only takeover, and it stacks in one order — next song, face, name, countdown, coming up. Everything is sized in `vh`: the viewer is across the room. A queue-depth VU meter runs along the bottom edge whenever anything is queued, which is how the room reads "how long is the list" without anyone asking.
