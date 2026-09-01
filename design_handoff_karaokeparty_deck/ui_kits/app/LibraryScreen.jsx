/* global KIT */
function LibraryScreen () {
  const { LibraryHeader, ArtistItem, SongItem, AlphaPicker, TextOverlay } = window.KP_NS;
  const [tab, setTab] = React.useState('artists');
  const [query, setQuery] = React.useState('');
  const [starredOnly, setStarredOnly] = React.useState(false);
  const [activeFacets, setActiveFacets] = React.useState([]);
  const [openArtist, setOpenArtist] = React.useState('Talking Heads');
  const [queued, setQueued] = React.useState(['Once in a Lifetime']);
  const [starred, setStarred] = React.useState(KIT.songs.filter(s => s.starred).map(s => s.title));

  const q = query.trim().toLowerCase();
  const matches = s =>
    (!q || s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q))
    && (!starredOnly || starred.includes(s.title))
    && activeFacets.every(fa => s.tags.includes(fa));

  const songs = KIT.songs.filter(matches);
  const artists = KIT.artists.filter(a => !q || a.name.toLowerCase().includes(q));
  const searching = !!q || starredOnly || activeFacets.length > 0;

  const row = (song, showArtist) => (
    <SongItem
      key={song.title}
      title={song.title}
      artist={showArtist ? song.artist : undefined}
      tags={song.tags}
      duration={song.duration}
      numStars={song.stars || 0}
      isPlayed={song.played}
      isStarred={starred.includes(song.title)}
      isUpcoming={queued.includes(song.title)}
      onQueue={() => setQueued(p => [...p, song.title])}
      onStar={() => setStarred(p => p.includes(song.title) ? p.filter(t => t !== song.title) : [...p, song.title])}
    />
  );

  return (
    <>
      <LibraryHeader
        query={query}
        onQueryChange={setQuery}
        facets={KIT.facets}
        activeFacets={activeFacets}
        onFacetToggle={fa => setActiveFacets(p => p.includes(fa) ? p.filter(x => x !== fa) : [...p, fa])}
        starredOnly={starredOnly}
        onToggleStarred={() => setStarredOnly(v => !v)}
        tab={tab}
        onTabChange={setTab}
        artistCount={artists.length}
        songCount={songs.length}
      />

      <div style={{ display: 'flex', padding: 'var(--gap-3) 0 var(--gap-5)' }}>
        <div style={{ flex: 1, minWidth: 0, padding: '0 var(--gap-2) 0 var(--gutter)' }}>
          {tab === 'artists' && !searching && artists.map(a => (
            <div key={a.name}>
              <ArtistItem
                name={a.name}
                songCount={a.count}
                isExpanded={openArtist === a.name}
                hasStarredChild={a.starred}
                hasUpcomingChild={KIT.songs.some(s => s.artist === a.name && queued.includes(s.title))}
                onClick={() => setOpenArtist(openArtist === a.name ? null : a.name)}
              />
              {openArtist === a.name && (
                <div style={{ padding: 'var(--gap-2) 0 var(--gap-3)' }}>
                  {KIT.songs.filter(s => s.artist === a.name).map(s => row(s, false))}
                </div>
              )}
            </div>
          ))}

          {(tab === 'songs' || searching) && songs.map(s => row(s, true))}

          {(tab === 'songs' || searching) && songs.length === 0 && (
            <TextOverlay title="No matches" style={{ minHeight: 220 }}>
              Try a different search, or clear the filters.
            </TextOverlay>
          )}

        </div>

        {tab === 'artists' && !searching && (
          <AlphaPicker
            active="T"
            onPick={() => {}}
            style={{ position: 'sticky', top: 'var(--gap-3)', alignSelf: 'flex-start', height: 'calc(100vh - 240px)' }}
          />
        )}
      </div>
    </>
  );
}

window.LibraryScreen = LibraryScreen;
