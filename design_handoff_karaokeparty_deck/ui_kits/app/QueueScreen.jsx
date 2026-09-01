/* global KIT */
function QueueScreen ({ isAdmin }) {
  const { QueueHeader, QueueItem, TextOverlay } = window.KP_NS;
  const [tab, setTab] = React.useState('queue');
  const [isPaused, setPaused] = React.useState(false);
  const [swiped, setSwiped] = React.useState(null);
  const [starred, setStarred] = React.useState(['Dreams', 'Once in a Lifetime']);

  const rows = tab === 'history' ? KIT.history : KIT.queue;

  const actionsFor = (row) => {
    // sung songs are locked for the rest of the party — nothing to do to them
    if (row.played) return [];
    if (row.current) {
      const a = [{ icon: 'REPLAY', label: 'Replay', tone: 'alert' }, { icon: 'PLAY_NEXT', label: 'Skip', tone: 'alert' }];
      return (isAdmin || row.owner) ? a : [];
    }
    const a = [];
    if (isAdmin) a.push({ icon: 'MOVE_TOP', label: 'Top', tone: 'vu' });
    if (isAdmin || row.owner) a.push({ icon: 'DELETE', label: 'Remove', tone: 'alert' });
    return a;
  };

  return (
    <>
      <QueueHeader
        tab={tab}
        onTabChange={setTab}
        queueCount={KIT.queue.length}
        myCount={KIT.queue.filter(r => r.owner).length}
        historyCount={KIT.history.length}
      />

      {tab === 'me' && (
        <window.MeScreen isPaused={isPaused} />
      )}

      <div style={{ display: tab === 'me' ? 'none' : 'block', padding: '0 var(--gutter) var(--gap-5)' }}>
        {rows.length === 0 && (
          <TextOverlay title={tab === 'history' ? 'Nothing sung yet' : 'Nothing queued'} style={{ minHeight: 260 }}>
            {tab === 'history'
              ? 'Songs land here once they have been played.'
              : <>Tap a song in the <a href="#library">library</a> to queue it.</>}
          </TextOverlay>
        )}

        {rows.map(r => (
          <QueueItem
            key={r.title + r.singer}
            title={r.title}
            artist={r.artist}
            userDisplayName={r.singer}
            wait={r.wait}
            isCurrent={r.current}
            isPlaying={r.current}
            isPlayed={r.played}
            isPaused={isPaused && r.owner}
            isOwner={r.owner}
            isUpcoming={r.upcoming}
            isStarred={starred.includes(r.title)}
            isOpen={swiped === r.title}
            onOpenChange={open => setSwiped(open ? r.title : null)}
            starCount={r.starCount || 0}
            pctPlayed={r.pct}
            showDragHandle={isAdmin && r.upcoming}
            actions={actionsFor(r)}
            onStar={() => setStarred(p => p.includes(r.title) ? p.filter(t => t !== r.title) : [...p, r.title])}
          />
        ))}

        {rows.length > 0 && (
          <div className="silkscreen" style={{ padding: 'var(--gap-4) 0', textAlign: 'center' }}>
            swipe a row left for its actions
          </div>
        )}
      </div>
    </>
  );
}

window.QueueScreen = QueueScreen;
