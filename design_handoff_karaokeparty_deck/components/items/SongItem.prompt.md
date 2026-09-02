The library's unit of action, and the clearest expression of the whole system: an un-queued song is a **raised key**, a queued song is a **teal standby well**, a played song is a **flat outline**. State is physical.

```jsx
<SongItem title="Once in a Lifetime" tags={['rock','80s']} duration="4:19" numStars={4} onQueue={queue} onStar={star} />
```

Song titles wrap and are never truncated — the row grows past its 56px minimum rather than cutting a title off, because a half-read title is useless when you are choosing what to sing.

One tap queues it — no confirm, no add button. Once queued the row is genuinely disabled and shows a QUEUED tag instead of the star, so nobody double-queues by tapping twice. Played rows stay in the list but are dim and inert: a song sung tonight is locked for the rest of the party. They remain visible so people can see what has already been done, not so they can do it again.

The star is the row's only action. There is no info affordance anywhere in the product: the row already shows everything a singer decides on — title, artist, tags, duration, how many people starred it.
