/* global KIT */
// The Me tab is its own interface, not a filtered queue: the singer's status and
// pause control first, then only their songs, reorderable by them.
// Your Turn lives in the app header now, so this tab is just the singer's songs
// and their history — it does not repeat the status.
function MeScreen ({ isPaused }) {
  const { QueueItem, TextOverlay, Button, Panel, SongHistoryList } = window.KP_NS;
  const [swiped, setSwiped] = React.useState(null);

  const mine = KIT.queue.filter(r => r.owner);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-4)', padding: '0 var(--gutter) var(--gap-5)' }}>

      {mine.length === 0
        ? (
            <TextOverlay title="Nothing queued" style={{ minHeight: 200 }}>
              Tap a song in the <a href="#library">library</a> to queue it.
            </TextOverlay>
          )
        : (
            <div>
              <div className="silkscreen" style={{ marginBottom: 'var(--gap-2)' }}>my songs &mdash; drag to reorder, swipe to remove</div>
              {mine.map(r => (
                <QueueItem
                  key={r.title}
                  title={r.title}
                  artist={r.artist}
                  userDisplayName={r.singer}
                  wait={r.wait}
                  isUpcoming={r.upcoming}
                  isPaused={isPaused}
                  isOwner
                  showDragHandle
                  showStar={false}
                  isOpen={swiped === r.title}
                  onOpenChange={open => setSwiped(open ? r.title : null)}
                  // star + remove only. A third action squeezes the title below
                  // ~100px at 390px, and info matters least on your own song.
                  actions={[{ icon: 'DELETE', label: 'Remove', tone: 'alert' }]}
                />
              ))}
              <div className="silkscreen" style={{ padding: 'var(--gap-3) 0', textAlign: 'center' }}>
                swipe a row left to remove it
              </div>
            </div>
          )}

      <Button tone="panel" icon="PLUS" iconSize={20} block>Queue another song</Button>

      <Panel title="Sung Tonight" contentStyle={{ padding: 0 }}>
        {/* no re-queue: a song sung tonight is locked for the rest of the party */}
        <SongHistoryList
          items={KIT.sung}
          onStar={() => {}}
          emptyText="Songs you sing all the way through show up here."
        />
      </Panel>
    </div>
  );
}

window.MeScreen = MeScreen;
