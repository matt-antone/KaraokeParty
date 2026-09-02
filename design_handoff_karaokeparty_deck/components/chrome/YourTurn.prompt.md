**Your Turn** — the app's header, on every screen. The singer's own channel strip: when am I on, how deep in the rotation, and can I step out.

```jsx
<YourTurn wait="4 min" position={2} rotationSize={4} songCount={2} isPaused={isPaused} onTogglePaused={toggle} />
```

It sits directly under the wordmark row and is the only status surface in the product — there is no separate one-line strip, and the Me tab does not repeat it. A singer glancing at their phone mid-party is asking one question, so the answer is at the top of whatever screen they are on.

The wait is the one number in the app set in Michroma; it is meant to be readable at arm's length in a dark room. The meter fills as their turn approaches and empties completely when paused, with the left edge rule dropping from amber to hairline — paused is a visibly dead channel. Copy stays possessive ("Pause my songs"), because pausing the *room* is a different, admin-only thing that lives in Settings.

Render nothing when the singer has nothing queued.
