/* global KIT */
function SettingsScreen () {
  const { Panel, Button, Accordion, InputCheckbox, Slider, VuMeter, PlaybackCtrl } = window.KP_NS;
  const [visualizer, setVisualizer] = React.useState(true);
  const [keying, setKeying] = React.useState(false);
  const [qrSize, setQrSize] = React.useState(0.5);
  const [isPlaying, setPlaying] = React.useState(true);
  const [volume, setVolume] = React.useState(0.78);

  const cell = { padding: '6px 0', whiteSpace: 'nowrap', overflow: 'hidden' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-4)', padding: 'var(--gap-4) var(--gutter) var(--gap-5)' }}>
      <Panel
        title="Rooms"
        titleComponent={<select defaultValue="all"><option value="all">All</option><option value="open">Open</option><option value="closed">Closed</option></select>}
      >
        <table>
          <thead><tr><th style={{ width: '100%' }}>Name</th><th>Status</th><th>Made</th></tr></thead>
          <tbody>
            {KIT.rooms.map(r => (
              <tr key={r.name}>
                <td style={{ ...cell, maxWidth: 0, textOverflow: 'ellipsis' }}><a href="#room">{r.name}</a></td>
                <td style={{ ...cell, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>
                  {r.status}{r.users > 0 && ` (${r.users})`}
                </td>
                <td style={{ ...cell, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>{r.created}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Button tone="panel" block style={{ marginTop: 'var(--gap-3)' }}>Create Room</Button>
      </Panel>

      <Panel
        title="Users"
        titleComponent={<select defaultValue="all"><option value="all">All</option><option value="online">Online</option></select>}
      >
        <table>
          <thead><tr><th style={{ width: '100%' }}>Username</th><th>Role</th><th>Joined</th></tr></thead>
          <tbody>
            {KIT.users.map(u => (
              <tr key={u.username}>
                <td style={{ ...cell, maxWidth: 0, textOverflow: 'ellipsis' }}><a href="#user">{u.username}</a></td>
                <td style={{ ...cell, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>{u.role}</td>
                <td style={{ ...cell, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>{u.joined}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Button tone="panel" block style={{ marginTop: 'var(--gap-3)' }}>Create User</Button>
      </Panel>

      {/* The player is admin-only and lives here: it is a room fixture you set up once,
          not a place a singer navigates to. There is no Player tab. */}
      <Panel title="Player">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-3)', marginBottom: 'var(--gap-3)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--vu)', flexShrink: 0 }} />
          <span className="silkscreen">connected &middot; living room</span>
        </div>
        <p className="silkscreen" style={{ margin: '0 0 var(--gap-3)', letterSpacing: '.04em', lineHeight: 1.7, textTransform: 'none' }}>
          Runs fullscreen on whatever machine drives the room&rsquo;s audio. Open it there, or scan
          the join code it shows.
        </p>
        {/* the room transport: admin-only, and this is its only home */}
        <PlaybackCtrl
          isPlaying={isPlaying}
          volume={volume}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onPlayNext={() => setPlaying(true)}
          onVolumeChange={setVolume}
          style={{ padding: 'var(--gap-2) 0 var(--gap-3)' }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-2)' }}>
          <Button tone="vu" icon="TELEVISION_PLAY" iconSize={20} block>Open player here</Button>
          <Button tone="panel" icon="QR_CODE" iconSize={20} block>Show join code</Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-2)', marginTop: 'var(--gap-3)' }}>
          <Accordion heading="Display">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-3)' }}>
              <InputCheckbox label="Visualizer" checked={visualizer} onChange={setVisualizer} />
              <InputCheckbox label="Video keying" checked={keying} onChange={setKeying} />
              <div>
                <label className="silkscreen">Lyrics size</label>
                <Slider min={0.4} max={0.9} value={0.65} onChange={() => {}} label="Lyrics size" />
              </div>
              <div>
                <label className="silkscreen">QR code size</label>
                <Slider min={0} max={1} value={qrSize} onChange={setQrSize} label="QR code size" />
              </div>
            </div>
          </Accordion>
        </div>
      </Panel>

      <Panel title="Preferences" contentStyle={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-2)' }}>
        <Accordion heading="Media Folders" initialExpanded>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-2)' }}>
            {[['/media/karaoke', 1809, 1], ['/media/new-2026', 62, 0.42]].map(([path, count, pct]) => (
              <div key={path}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--gap-2)', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{path}</span>
                  <span className="silkscreen" style={{ flexShrink: 0 }}>{count} songs</span>
                </div>
                <VuMeter value={pct} segments={20} peakFrom={2} height={5} />
              </div>
            ))}
          </div>
        </Accordion>

      </Panel>
    </div>
  );
}

window.SettingsScreen = SettingsScreen;
