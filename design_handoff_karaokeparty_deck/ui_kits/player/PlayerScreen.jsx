const KP_NS = (() => {
  const need = ['Button', 'Panel', 'QueueItem'];
  // 'top'/'parent' etc. are cross-origin Windows; reading a named property off
  // them throws SecurityError, so skip them and guard every other read.
  const skip = new Set(['top', 'parent', 'self', 'window', 'frames', 'opener', 'globalThis']);
  for (const k of Object.keys(window)) {
    if (skip.has(k)) continue;
    try {
      const v = window[k];
      if (v && typeof v === 'object' && need.every(n => typeof v[n] === 'function')) return v;
    } catch (e) { /* cross-origin frame */ }
  }
  return {};
})();

if (!KP_NS.Button) {
  document.getElementById('root').innerHTML =
    '<pre style="font:12px ui-monospace,monospace;color:#ff8a1e;white-space:pre-wrap">'
    + 'Design-system bundle not loaded (_ds_bundle.js).\nThis page renders once the project is compiled as a Design System.'
    + '</pre>';
}

const STATES = [
  ['upNow', 'song starts'],
  ['upNextTease', 'song ending'],
  ['intermission', 'intermission'],
  ['idle', 'waiting for a tap'],
  ['empty', 'nothing queued'],
  ['errored', 'media failed'],
];

// Stand-in for the media layer. The real player decodes MP3+G lyric frames, plays
// MP4 (including alpha-keyed video), or runs a WebGL visualizer. None of that can be
// recreated without the media, so this paints a field of roughly the right value and
// two lines of placeholder lyric — enough to judge overlay contrast, no more.
function MediaStandIn ({ kind, showLyrics }) {
  const fills = {
    cdg: 'linear-gradient(165deg, #131b24, #05070a)',
    mp4: 'linear-gradient(150deg, #2b2419, #141a1f 55%, #05070a)',
    visualizer: 'radial-gradient(120% 90% at 28% 18%, #3a2a12, transparent 60%), radial-gradient(110% 80% at 76% 72%, #1b2b33, transparent 60%), #04060a',
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: fills[kind] }}>
      {kind === 'cdg' && (
        <div className="silkscreen" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: '1.6vh', opacity: .4 }}>
          mp3 + cdg lyric frames
        </div>
      )}
      {showLyrics && (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: '11%', textAlign: 'center',
          fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '3.6vh', lineHeight: 1.3,
          color: '#fff', textShadow: '0 3px 10px #000',
        }}
        >
          <div>and you may ask yourself</div>
          <div style={{ opacity: .5 }}>well, how did I get here</div>
        </div>
      )}
    </div>
  );
}

function PlayerScreen () {
  const { PlayerOverlay, PlaybackCtrl, Icon } = KP_NS;
  const [state, setState] = React.useState('intermission');
  const [media, setMedia] = React.useState('cdg');
  const [showQR, setShowQR] = React.useState(true);
  const [isPlaying, setPlaying] = React.useState(true);
  const [volume, setVolume] = React.useState(0.78);
  const [seconds, setSeconds] = React.useState(9);

  React.useEffect(() => {
    if (state !== 'intermission') return;
    const id = setInterval(() => setSeconds(s => (s <= 0 ? 12 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [state]);

  const overVideo = state === 'upNow' || state === 'upNextTease' || state === 'idle';

  return (
    <>
      <div style={{ background: 'var(--brush)', boxShadow: 'var(--edge-top)', borderRadius: 'var(--radius-panel) var(--radius-panel) 0 0' }}>
        <PlaybackCtrl
          isPlaying={isPlaying}
          volume={volume}
          showFullscreen
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onVolumeChange={setVolume}
        />
      </div>

      <div className="stage">
        {overVideo && <MediaStandIn kind={media} showLyrics={state !== 'idle'} />}

        <PlayerOverlay
          state={state}
          singer={state === 'upNextTease' ? 'Priya' : 'Dana'}
          nextTitle={state === 'upNow' ? 'Dreams' : 'Once in a Lifetime'}
          nextArtist={state === 'upNow' ? 'Fleetwood Mac' : 'Talking Heads'}
          secondsLeft={state === 'intermission' ? seconds : undefined}
          comingUpSinger="Priya"
          comingUpTitle="Dreams"
          queueDepth={8}
          onPlay={() => setState('upNow')}
        />

        {showQR && state !== 'intermission' && (
          <div style={{
            position: 'absolute', left: '2vh', top: '2vh',
            display: 'grid', placeItems: 'center',
            width: '13vh', height: '13vh',
            background: 'var(--ink)', color: 'var(--chassis)',
            borderRadius: 'var(--radius-key)', boxShadow: 'var(--bevel)',
          }}
          >
            <Icon icon="QR_CODE" style={{ height: '10vh' }} />
          </div>
        )}
      </div>

      <div className="rig">
        <span>overlay state</span>
        {STATES.map(([id, label]) => (
          <button key={id} data-on={state === id ? '' : undefined} onClick={() => setState(id)}>{label}</button>
        ))}
      </div>
      <div className="rig">
        <span>media layer</span>
        {[['cdg', 'mp3+g'], ['mp4', 'mp4 video'], ['visualizer', 'visualizer']].map(([id, label]) => (
          <button key={id} data-on={media === id ? '' : undefined} onClick={() => setMedia(id)}>{label}</button>
        ))}
        <button data-on={showQR ? '' : undefined} onClick={() => setShowQR(v => !v)}>qr join code</button>
      </div>

      <p className="note">
        The player is another route of the same app, run fullscreen on whatever machine drives the
        room&rsquo;s audio. Everything is sized in <em>vh</em> because the audience is across the room.
        Overlays that sit over playing video are <em>solid corner panels</em> in the top-right, keeping
        the lower two-thirds clear for lyrics. A queue-depth VU meter runs along the bottom edge, so the
        room can see how long the list is without asking. The QR join code parks in a corner and fades
        in and out rather than burning in.
      </p>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<PlayerScreen />);
