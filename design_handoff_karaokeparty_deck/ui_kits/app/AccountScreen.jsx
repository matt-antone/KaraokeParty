/* global KIT */
function AccountScreen ({ isGuest }) {
  const { Panel, Button, InputImage, SongHistoryList } = window.KP_NS;
  const [name, setName] = React.useState('You');
  const [dirty, setDirty] = React.useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-4)', padding: 'var(--gap-4) var(--gutter) var(--gap-5)' }}>
      <Panel title="My Account">
        <p className="silkscreen" style={{ margin: '0 0 var(--gap-3)' }}>
          signed in as {isGuest ? 'guest' : 'you'}
        </p>
        <div style={{ display: 'flex', gap: 'var(--gap-3)', marginBottom: 'var(--gap-3)' }}>
          <InputImage onChange={() => setDirty(true)} />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--gap-2)' }}>
            <input type="text" placeholder="display name" value={name} onChange={(e) => { setName(e.target.value); setDirty(true); }} />
            {!isGuest && <input type="email" placeholder="username or email" defaultValue="you@example.com" onChange={() => setDirty(true)} />}
          </div>
        </div>
        {!isGuest && dirty && <input type="password" placeholder="current password" style={{ marginBottom: 'var(--gap-2)' }} />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-2)' }}>
          {dirty && <Button tone="vu" block onClick={() => setDirty(false)}>Update Account</Button>}
          <Button tone="panel" block>Sign Out</Button>
        </div>
      </Panel>

      <Panel title="Song History" contentStyle={{ padding: 0 }}>
        <SongHistoryList items={KIT.sung} onStar={() => {}} />
      </Panel>
    </div>
  );
}

window.AccountScreen = AccountScreen;
