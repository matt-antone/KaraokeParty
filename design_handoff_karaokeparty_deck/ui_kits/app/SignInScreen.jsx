/* global KIT */
function SignInScreen ({ onSignIn }) {
  const { Logo, InputRadio, Button } = window.KP_NS;
  const [room, setRoom] = React.useState('Living Room');
  const [mode, setMode] = React.useState('returning');

  const heading = t => (
    <h2 className="silkscreen" style={{ margin: 'var(--gap-5) 0 var(--gap-2)', fontWeight: 400 }}>{t}</h2>
  );

  return (
    <div style={{ padding: 'var(--gap-5) var(--gutter) var(--gap-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--gap-4) 0' }}>
        <Logo withMark size="1.5rem" markSize={64} />
      </div>

      {heading('Join room')}
      {KIT.rooms.filter(r => r.status === 'open').map(r => (
        <InputRadio key={r.name} name="room" value={r.name} label={r.name} checked={room === r.name} onChange={setRoom} />
      ))}

      {heading('Join as')}
      <InputRadio name="mode" value="returning" label="Returning user" checked={mode === 'returning'} onChange={setMode} />
      <InputRadio name="mode" value="standard" label="New user" checked={mode === 'standard'} onChange={setMode} />
      <InputRadio name="mode" value="guest" label="Guest" checked={mode === 'guest'} onChange={setMode} />

      <form
        noValidate
        onSubmit={(e) => { e.preventDefault(); onSignIn(mode === 'guest'); }}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-2)', marginTop: 'var(--gap-4)' }}
      >
        {mode === 'returning' && (
          <>
            <input type="email" autoComplete="username" placeholder="username or email" />
            <input type="password" autoComplete="current-password" placeholder="password" />
            <Button tone="vu" block type="submit" style={{ marginTop: 'var(--gap-2)' }}>Sign In</Button>
          </>
        )}
        {mode === 'standard' && (
          <>
            <input type="email" placeholder="username or email" />
            <input type="password" placeholder="password" />
            <input type="password" placeholder="confirm password" />
            <input type="text" placeholder="display name" />
            <Button tone="vu" block type="submit" style={{ marginTop: 'var(--gap-2)' }}>Create Account</Button>
          </>
        )}
        {mode === 'guest' && (
          <>
            <input type="text" placeholder="display name" />
            <Button tone="vu" block type="submit" style={{ marginTop: 'var(--gap-2)' }}>Join as Guest</Button>
          </>
        )}
      </form>
    </div>
  );
}

window.SignInScreen = SignInScreen;
