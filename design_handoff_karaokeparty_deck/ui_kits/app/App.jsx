// Screens publish themselves on window (see the tail of each screen file).
window.KP_NS = (() => {
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

if (!window.KP_NS.Button) {
  document.getElementById('root').innerHTML =
    '<pre style="font:12px ui-monospace,monospace;color:#ff8a1e;white-space:pre-wrap;padding:16px">'
    + 'Design-system bundle not loaded (_ds_bundle.js).\nThis page renders once the project is compiled as a Design System.'
    + '</pre>';
}

function App () {
  const { Navigation, YourTurn, ProgressBar, Modal, Button, InputCheckbox, Slider, Logo, Icon } = window.KP_NS;
  const [signedIn, setSignedIn] = React.useState(true);
  const [isGuest, setGuest] = React.useState(false);
  const [isAdmin, setAdmin] = React.useState(true);
  const [route, setRoute] = React.useState('queue');
  const [isPlaying, setPlaying] = React.useState(true);
  const [volume, setVolume] = React.useState(0.78);
  const [display, setDisplay] = React.useState(false);
  const [scanning, setScanning] = React.useState(false);
  const [isPaused, setPaused] = React.useState(false);
  const [status, setStatus] = React.useState('upNext');

  return (
    <div className="app">
      {signedIn && (
        <div className="hdr">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-3)', padding: 'var(--gap-3) var(--gutter)' }}>
            <Logo withMark markSize={36} />
            <span className="silkscreen" style={{ marginLeft: 'auto', flexShrink: 0 }}>Living&nbsp;Room</span>
          </div>
          {/* No transport here. Player controls are admin-only and live in
              Settings > Player. The header carries Your Turn and nothing else. */}
          {status !== 'none' && (
            <YourTurn
              isUpNow={status === 'upNow'}
              isPaused={isPaused}
              onTogglePaused={() => setPaused(v => !v)}
              wait={status === 'upNext' ? '4 min' : '16 min'}
              position={2}
              rotationSize={4}
              songCount={2}
              style={{ borderRadius: 0, boxShadow: 'none' }}
            />
          )}
          {isAdmin && scanning && (
            <ProgressBar isActive pct={42} text="Scanning /media/new-2026" onCancel={() => setScanning(false)} />
          )}
        </div>
      )}

      <div className="body">
        {!signedIn && <window.SignInScreen onSignIn={(g) => { setGuest(g); setSignedIn(true); setRoute('library'); }} />}
        {signedIn && route === 'library' && <window.LibraryScreen />}
        {signedIn && route === 'queue' && <window.QueueScreen isAdmin={isAdmin} />}
        {signedIn && route === 'account' && <window.AccountScreen isGuest={isGuest} />}
        {signedIn && route === 'settings' && <window.SettingsScreen />}
      </div>

      {signedIn && (
        <div className="nav">
          <Navigation active={route} isAdmin={isAdmin} onNavigate={setRoute} />
        </div>
      )}

      <div className="rig">
        <span>kit controls &mdash; not product UI</span>
        <button data-on={isAdmin ? '' : undefined} onClick={() => setAdmin(v => !v)}>{isAdmin ? 'admin' : 'singer'}</button>
        <button data-on={signedIn ? undefined : ''} onClick={() => setSignedIn(v => !v)}>{signedIn ? 'sign out' : 'signed out'}</button>
        <button data-on={scanning ? '' : undefined} onClick={() => setScanning(v => !v)}>scan</button>
        {[['upNow', 'up now'], ['upNext', 'up next'], ['inQueue', 'in queue'], ['none', 'no songs']].map(([id, label]) => (
          <button key={id} data-on={status === id ? '' : undefined} onClick={() => setStatus(id)}>{label}</button>
        ))}
        <button onClick={() => setDisplay(true)}>display modal</button>
      </div>

      {display && (
        <Modal
          title="Display"
          onClose={() => setDisplay(false)}
          buttons={<Button tone="vu" block onClick={() => setDisplay(false)}>Done</Button>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-4)' }}>
            <div>
              <InputCheckbox label="Visualizer" checked onChange={() => {}} />
              <div style={{ display: 'flex', gap: 'var(--gap-2)', marginTop: 'var(--gap-2)' }}>
                {['CHEVRON_LEFT', 'DICE', 'CHEVRON_RIGHT'].map(ic => (
                  <Button key={ic} tone="panel" icon={ic} iconSize={24} block aria-label={ic} />
                ))}
              </div>
              <p className="silkscreen" style={{ margin: 'var(--gap-2) 0 0' }}>martin — cope reprise</p>
            </div>
            <div>
              <label className="silkscreen">Sensitivity</label>
              <Slider min={0} max={2} value={1.1} onChange={() => {}} label="Sensitivity" />
            </div>
            <div>
              <label className="silkscreen">Lyrics size</label>
              <Slider min={0.4} max={0.9} value={0.65} onChange={() => {}} label="Lyrics size" />
            </div>
            <div>
              <label className="silkscreen">Lyrics background</label>
              <Slider min={0} max={1} value={0.3} onChange={() => {}} label="Lyrics background" />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// The screens are separate text/babel files; Babel fetches them asynchronously,
// so mount once they have all published themselves.
function mount () {
  const ready = ['SignInScreen', 'LibraryScreen', 'QueueScreen', 'MeScreen', 'AccountScreen', 'SettingsScreen']
    .every(n => typeof window[n] === 'function');
  if (!ready) return setTimeout(mount, 30);
  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
}

if (window.KP_NS.Button) mount();
