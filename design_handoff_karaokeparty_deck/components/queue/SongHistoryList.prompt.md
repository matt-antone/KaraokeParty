The singer's own past performances. Used twice: as the record at the foot of the Me tab, and on the Account screen.

```jsx
<SongHistoryList items={sung} onStar={star} />
```

**A song sung tonight is locked** — it cannot go back in the queue this party, so these rows carry no re-queue action and no key face. They are a record, not a menu. The only control is the star, and starring here means "favourite this for next time", not "sing it again".

Rows are flat with seam rules between them and the title at `--ink-2`: spent, by colour. Put it inside a `Panel` with `contentStyle={{ padding: 0 }}` so the rows run to the panel's edges.
