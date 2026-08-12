# Deep Dive Trace: multi-window-synced-players

## Observed Result

Request: run the karaoke player in up to 3 browser windows, keep playback frame-accurately in sync across them, restrict playback control to logged-in admins, and hide the playback-control surface from everyone else.

This is a brownfield change to a Karaoke Eternal fork (koa + socket.io server, React + Redux Toolkit client, socket action relay).

## Ranked Hypotheses

| Rank | Hypothesis | Confidence | Evidence Strength | Why it leads |
|------|------------|------------|-------------------|--------------|
| 1 | **Code-path**: `PlayerController` is written as the *sole* authority — it owns queue advance, media clock, and status emit. N mounted instances = N competing authorities with no follower mode. | High | Strong (direct code read; `player` reducer has no `PLAYER_STATUS` case, so a player window structurally cannot follow another) | This is the hard blocker. Broadcast already reaches every window; what is missing is a client that can *obey* instead of *decide*. |
| 2 | **Premise / measurement audit**: two stated premises do not match the code. (a) The playback-control bar is **not** admin-only today. (b) Frame-accurate sync is unreachable over the current wire format. | High | Strong (`Header.tsx:70`, `PlaybackCtrl.tsx:41`, server has zero authz on `PLAYER_REQ_*`, status throttled to 1000 ms with no clock reference) | Changes the shape of the work: the authz fix is a real gap (not just "hide a tab"), and the sync target needs a time base that does not exist yet. |
| 3 | **Config / orchestration**: the socket layer has no player registry, no identity, no count, no cap, and no shared clock. | High | Strong (`server/Player/socket.ts` 6× `@todo: emit to players only`; `Rooms.isPlayerPresent` returns a bare boolean; `server/socket.ts` `@todo this just emits the first status found`) | Necessary supporting work, but derivative of #1 — a registry is only meaningful once players have roles. |

All three lanes came back high-confidence. Ranking reflects *which blocks the most*, not differing certainty.

## Evidence Summary by Hypothesis

### Lane 1 — PlayerController is a sole authority

- [PlayerController.tsx:59-91](src/routes/Player/components/PlayerController/PlayerController.tsx:59) `handleLoadNext` — the *player itself* reads the round-robin queue, picks the next item, appends to history, and dispatches status. Every mounted instance runs this independently.
- [PlayerController.tsx:121-139](src/routes/Player/components/PlayerController/PlayerController.tsx:121) — effects fire `handleLoadNext` on first play, on `_isPlayingNext`, and when the queue refills. Two windows = two advances, two history writes.
- [PlayerController.tsx:106-115](src/routes/Player/components/PlayerController/PlayerController.tsx:106) — every window emits a *full* status blob on any local change.
- [player.ts:146-190](src/routes/Player/modules/player.ts:146) — the `player` reducer handles `PLAYER_CMD_*`, `PLAYER_UPDATE`, `PLAYER_LOAD/PLAY/ERROR`. **No `PLAYER_STATUS` case.** A player window receives peers' status and discards it. There is no follower code path to extend; one must be added.
- [Player.tsx:51-58](src/routes/Player/components/Player/Player.tsx:51) — each window constructs its own `AudioContext` + `GainNode`. Three windows = three simultaneous audio outputs.
- [MP4Player.tsx:28-42](src/routes/Player/components/Player/MP4Player/MP4Player.tsx:28) — the only seek that exists is `currentTime = 0` on replay. There is **no arbitrary-seek path**, which any drift-correction scheme requires.
- [PlayerController.tsx:118](src/routes/Player/components/PlayerController/PlayerController.tsx:118) — unmount dispatches `playerLeave`; leave/join is per-socket with no role handoff.

### Lane 2 — Premise audit

- [Header.tsx:70](src/components/Header/Header.tsx:70) — `{(isUpNow || isAdmin) && <PlaybackCtrl />}`. A **non-admin singer whose turn it is** gets the full control bar. The premise "the tab is admin-only, just hide it harder" is false; upstream deliberately grants the current singer play/pause/next/volume/display-options.
- [PlaybackCtrl.tsx:41-43](src/components/Header/PlaybackCtrl/PlaybackCtrl.tsx:41) — `isAdmin` is consulted **only** for the `NoPlayer` fallback branch. Once `status.isPlayerPresent` is true, the control bar renders for whoever `Header` let through.
- [server/Player/socket.ts:26-64](server/Player/socket.ts:26) — `PLAYER_REQ_OPTIONS/NEXT/PAUSE/PLAY/REPLAY/VOLUME` have **no `isAdmin` check and no owner check**. Any authenticated socket in the room can pause or skip playback by emitting the action directly, regardless of what the UI shows. Compare [server/Queue/socket.ts:48](server/Queue/socket.ts:48), which *does* gate on `isAdmin || isOwner`. Hiding UI does not close this.
- [Routes.tsx:69](src/components/App/Routes/Routes.tsx:69) — the `/player` route **is** already admin-gated client-side. That half of the premise holds.
- Frame-accuracy reachability: status emits are throttled to `wait: 1000` ([player.ts:67](src/routes/Player/modules/player.ts:67)), carry a `position` float with **no server timestamp or clock offset**, and there is no seek API on the media components. Independent `<video>` decoders on independent machines will drift. Frame-accuracy is not achievable by tightening the existing channel alone.

### Lane 3 — No player registry or shared clock

- [server/Player/socket.ts:28,35,41,47,53,60](server/Player/socket.ts:28) — every command is relayed to `Rooms.prefix(roomId)`, i.e. the **whole room**, marked `@todo: emit to players only`. Consequence: the broadcast half of multi-player already works today, unintentionally.
- [server/Player/socket.ts:65-74](server/Player/socket.ts:65) — `PLAYER_EMIT_STATUS` rebroadcasts each player's status to the whole room. With N players, the room's single `status` slice ([status.ts:96](src/store/modules/status.ts:96)) receives N interleaved streams — last-writer-wins. Expect the app's progress bar and up-next to flicker between players.
- [Rooms.ts:212-220](server/Rooms/Rooms.ts:212) — `isPlayerPresent` scans sockets for a truthy `_lastPlayerStatus` and returns a **boolean**. No count, no ids, no ordering. A cap of 3 cannot be enforced against this.
- [server/socket.ts](server/socket.ts) join path — emits the *first* `_lastPlayerStatus` found, marked `@todo this just emits the first status found`. Late joiners get an arbitrary player's view.
- No `PLAYER_*` action carries a server time reference. `shared/actionTypes.ts` has no leader/primary/clock concept.

## Evidence Against / Missing Evidence

- **Lane 1**: none found. Read directly from source; the absent `PLAYER_STATUS` case in the player reducer is dispositive.
- **Lane 2**: the `/player` route gate is genuinely admin-only, so the premise is half-correct. Not verified at runtime whether a non-admin singer's control bar is considered a *feature* by this fork's users — treated as an open product question, not a bug.
- **Lane 3**: not verified whether socket.io rooms are ever multi-node here (a Redis adapter would change the registry design). Single-process `serverWorker` suggests not, but this was not confirmed.

## Per-Lane Critical Unknowns

- **Lane 1 (code-path)**: Should follower windows produce audio at all, or is the intent N video surfaces with a single audio source? This decides whether the follower is a muted mirror (simple) or a fully synchronized decoder (hard).
- **Lane 2 (premise audit)**: Is removing the non-admin singer's control bar (`isUpNow`) intended, or should singers keep pause/skip on their own song? And is server-side authz on `PLAYER_REQ_*` in scope for this change?
- **Lane 3 (orchestration)**: Do the 3 windows run on one machine, or on separate machines across the network? Frame-accuracy is achievable in the first case and physically marginal in the second.

## Lane 3 Misplacement / SoT Ownership Scope

No MOVE candidates surfaced. Lane 3 found *missing* state (a player registry), not misplaced state. No cross-boundary ownership concerns apply to this change.

## Rebuttal Round

**Best rebuttal to the leader (Lane 1):** "Nothing needs to change in `PlayerController` — commands already broadcast to every window, so opening `/player` three times gives three windows that all receive play/pause/next. Just add the cap and the authz."

**Why the leader held:** each window independently runs `handleLoadNext` and pushes to `historyJSON`. On song end, all three advance on their *own* `onEnded`, each emitting a divergent history to the shared room status. They also start at whatever `position` their own decoder reached and will never converge, since the player reducer discards peer status. The broadcast delivers *commands*, not *state*; without a follower path the windows diverge on first song boundary. Rebuttal fails.

## Convergence / Separation Notes

- **Lanes 1 and 3 converge** on a single mechanism: *nothing in the stack has a concept of player identity or authority*. Lane 1 is its client-side face (no follower reducer path), Lane 3 its server-side face (no registry). They should be treated as one workstream, not two.
- **Lane 2 is genuinely separate.** The authz gap exists today, is exploitable with a single player, and is worth fixing independently of the multi-window work.

## Most Likely Explanation

Multi-window playback is already *half* implemented by accident: the server relays every player command to the entire room, so a second `/player` window receives play/pause/next today. What is missing is the other half — every player window is an independent authority that decides its own queue advance, runs its own media clock, and structurally ignores peer status. Nothing on the server knows how many players exist or which is canonical, so a 3-player cap cannot be enforced and late joiners get an arbitrary player's state.

Separately and independently: playback control is **not** admin-restricted today. The current singer gets the control bar client-side, and the server applies no authorization at all to playback commands — so the restriction has to be built, not merely un-hidden.

Frame-accurate sync is not reachable by tightening the existing channel: status is throttled to 1 s, carries no clock reference, and the media components expose no seek.

## Critical Unknown

Whether the 3 player windows share a machine (and therefore a clock and an audio device) or are spread across machines. This single fact decides whether "frame-accurate" means *one leader driving muted mirrors on the same box* — tractable — or *distributed clock synchronization with drift correction across the network* — a substantially larger build with a hard physical ceiling.

## Recommended Discriminating Probe

Open `/player` in two browser windows in the same room, press play, and observe over ~60 s:

1. Do both windows advance to the next song independently at the song boundary (confirms Lane 1)?
2. How far do their `status.position` values diverge (measures the real drift budget)?
3. Does the app's progress bar flicker between two status streams (confirms Lane 3's last-writer-wins)?

This collapses all three lanes at once and yields the actual drift number needed to size the sync mechanism.
