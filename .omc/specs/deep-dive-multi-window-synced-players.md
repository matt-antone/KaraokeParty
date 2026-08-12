# Spec: Multi-Window Synced Players

**Slug:** `multi-window-synced-players`
**Source:** `/deep-dive`
**Trace:** [deep-dive-trace-multi-window-synced-players.md](deep-dive-trace-multi-window-synced-players.md)
**Final ambiguity:** ~12% (threshold 20%)

## Goal

Allow up to 3 simultaneous `/player` windows in a room. The first window to join is the **primary**: it owns queue advance and audio output, exactly as the single player does today. Windows 2 and 3 are **mirrors**: they render the same media in sync with the primary, produce no audible output, and have no queue authority. A 4th window is refused a player slot and shown the queue instead.

Playback controls (`PlaybackCtrl`) become visible to admins only.

## Constraints

- **All player windows run on one machine** (multi-monitor host). `Date.now()` is therefore directly comparable across windows — no clock-offset negotiation is needed. This constraint is load-bearing; the sync design below is invalid across machines.
- **Frame-accurate sync is the target.** Steady-state correction is `playbackRate` nudging, not seeking — mirrors must not visibly jump while side-by-side screens are being watched.
- Media types in scope: **MP4 and CDG (MP3+G)**. Both clock off an `HTMLMediaElement.currentTime`, so one sync mechanism covers both.
- Existing single-player behavior must be unchanged when only one window is open.
- Server is single-process (`serverWorker`); socket presence is an acceptable registry backing store. No Redis adapter in play.

## Non-Goals

- **Server-side authorization on `PLAYER_REQ_*` is explicitly out of scope.** The user chose "hide UI only". See *Assumptions Exposed* for the accepted risk.
- Visualizer sync across mirrors. The WebGL visualizer may run per-window without cross-window frame alignment.
- Cross-machine / cross-network player sync.
- Audio output on mirrors, per-window mute toggles, or independent volume.
- Changing how the queue itself works (round-robin, history, ownership).
- Adding a Player nav tab. `/player` remains URL-reached and already admin-gated ([Routes.tsx:69](../../src/components/App/Routes/Routes.tsx:69)).

## Acceptance Criteria

### Roles and cap

1. Opening `/player` with no player in the room yields role `primary`; the window behaves exactly as today (audio audible, advances the queue, emits status).
2. Opening a 2nd and 3rd `/player` in the same room yields role `mirror` for each.
3. A 4th `/player` window is refused a player slot and lands on the queue view with a visible "player limit reached" message. It does not appear in the room's player count.
4. Closing the primary promotes the **oldest surviving mirror** to primary within one status interval; audio resumes on the promoted window and queue advance continues without skipping or repeating a song.
5. Closing a mirror frees its slot; a subsequent `/player` window is admitted as a mirror.
6. A crashed/killed window (socket disconnect without a clean leave) frees its slot — the registry is keyed on live sockets, not on a persisted count.

### Sync

7. With an MP4 song playing, a mirror's `currentTime` stays within **±50 ms** of the primary's projected position in steady state, measured over a 3-minute song.
8. With a CDG song playing, lyric wipe on a mirror is visually indistinguishable from the primary at normal viewing distance. (CDG renders off `audio.currentTime` at [CDGPlayer.tsx:203](../../src/routes/Player/components/Player/CDGPlayer/CDGPlayer.tsx:203), so criterion 7 implies this.)
9. Mirrors produce **no audible output**. Verified by muting the primary's window at the OS level and confirming silence.
10. `playbackRate` on a mirror stays within `[0.98, 1.02]` and returns to exactly `1.0` when |drift| < 20 ms. No audible or visible speed artifacts.
11. On song change, a mirror aligns to the primary's start position via a one-time seek **before** playback begins — it does not nudge its way in from a cold start.
12. Play, pause, next, replay, volume, and display-option commands from `PlaybackCtrl` apply to primary and mirrors together.

### Status stream

13. Only the primary emits `PLAYER_EMIT_STATUS`. The room's `status` slice receives exactly one stream regardless of player count — the app's progress bar and up-next must not flicker between sources.
14. A client joining the room mid-song receives the **primary's** last status, not an arbitrary player's ([server/socket.ts](../../server/socket.ts) currently takes the first found).

### Admin gating

15. `PlaybackCtrl` renders only when `isAdmin`. A non-admin whose turn it is (`isUpNow`) no longer sees playback controls.
16. Non-admins retain everything else they have today (library, queue, starring, their own queue-item removal).

## Assumptions Exposed

- **Accepted risk — server-side authz gap.** `PLAYER_REQ_OPTIONS/NEXT/PAUSE/PLAY/REPLAY/VOLUME` in [server/Player/socket.ts:26-64](../../server/Player/socket.ts:26) have no authorization check. After this change any authenticated room member can still control playback by emitting the socket action directly; only the UI affordance is removed. This was surfaced during the interview and the "hide UI only" option was chosen knowingly. Adding `if (!sock.user.isAdmin) return` to those six handlers is ~6 lines and follows the existing pattern at [server/Queue/socket.ts:48](../../server/Queue/socket.ts:48) if the decision is revisited.
- **"Show the queue" for the rejected 4th window** is interpreted as: redirect to `/queue` carrying a transient message, mirroring the existing redirect pattern at [Routes.tsx:69](../../src/components/App/Routes/Routes.tsx:69). If a passive in-place player view was meant instead, this changes.
- **One-time seek at song start is treated as alignment, not drift correction**, and so does not violate the "nudging, not seeking" choice. Without it a mirror starting 3 s late would need ~150 s at 2% to converge.
- **Backgrounded/minimized mirror windows** may be throttled by the browser and drift beyond nudging range. Given the multi-monitor constraint all windows are expected visible; a hard-seek recovery path for drift > 1 s is included as a safety net, not as the steady-state mechanism.
- Removing the `isUpNow` affordance is a deliberate behavior change from upstream Karaoke Eternal, where the current singer can pause their own song.

## Technical Context

### Current architecture (from trace)

- Server relays every `PLAYER_CMD_*` to the whole room ([server/Player/socket.ts](../../server/Player/socket.ts)) — the broadcast half of multi-window already works.
- Every `PlayerController` is an independent authority: it computes the next queue item, appends to `historyJSON`, and emits full status ([PlayerController.tsx:59-91](../../src/routes/Player/components/PlayerController/PlayerController.tsx:59)).
- The `player` reducer has **no `PLAYER_STATUS` case** ([player.ts:146](../../src/routes/Player/modules/player.ts:146)) — a player window discards peer status. The follower path does not exist and must be built.
- `Rooms.isPlayerPresent` ([Rooms.ts:212](../../server/Rooms/Rooms.ts:212)) returns a bare boolean by scanning sockets for a truthy `_lastPlayerStatus`. No count, no ids, no ordering.
- Status emit is throttled to 1000 ms with no timestamp ([player.ts:67](../../src/routes/Player/modules/player.ts:67)).
- Neither `MP4Player` nor `CDGPlayer` exposes a seek; the only `currentTime` write is `= 0` on replay.
- `Player.tsx` builds a per-window `AudioContext` → `GainNode` → destination graph ([Player.tsx:51-58](../../src/routes/Player/components/Player/Player.tsx:51)).

### Implementation shape

**Server — player registry (`server/Player/socket.ts`, `server/Rooms/Rooms.ts`)**

- New action `PLAYER_EMIT_JOIN`, sent by `PlayerController` on mount. Handler counts sockets in the room with a `_playerRole` set:
  - 0 players → `sock._playerRole = 'primary'`
  - 1-2 players → `sock._playerRole = 'mirror'`
  - ≥3 → reply `PLAYER_REJECTED` to that socket only; do not set a role.
- Stamp `sock._playerJoinedAt` for promotion ordering.
- Reply `PLAYER_ROLE` to the joining socket.
- On `PLAYER_EMIT_LEAVE` and on socket `disconnect`: clear the role; if the leaver was primary, promote the oldest surviving mirror and emit `PLAYER_ROLE` to it.
- Replace `Rooms.isPlayerPresent` with a `Rooms.getPlayers(io, roomId)` returning sockets ordered by `_playerJoinedAt`. Keep a thin `isPlayerPresent` wrapper if other call sites depend on it.
- `PLAYER_EMIT_STATUS` handler: ignore emits from non-primary sockets (defense in depth; the client also gates).
- [server/socket.ts](../../server/socket.ts) late-join: send the **primary's** `_lastPlayerStatus` instead of the first found.

**Client — role plumbing (`src/routes/Player/modules/player.ts`)**

- Add `role: 'primary' | 'mirror' | null` to `PlayerState`, plus `_leaderPosition` and `_leaderPositionAt` (underscore-prefixed so the existing emit filter at [player.ts:52-57](../../src/routes/Player/modules/player.ts:52) strips them).
- Add reducer cases for `PLAYER_ROLE` and — new — `PLAYER_STATUS`, the latter applying only when `role === 'mirror'`: adopt `queueId`, `mediaType`, `isPlaying`, `isVideoKeyingEnabled`, and record `_leaderPosition = payload.position`, `_leaderPositionAt = payload.positionAt`.
- `playerStatus` thunk: include `positionAt: Date.now()` in the emitted payload, and no-op entirely when `role !== 'primary'`.

**Client — authority gating (`PlayerController.tsx`)**

- Gate on `player.role === 'primary'`: `handleLoadNext`, `handleReplay`, the `nextUserId` lock-in effect, and the always-emit effect. Mirrors run none of these.
- Mirrors derive `queueItem` from the adopted `queueId` exactly as today, so `Player` receives the same props and no rendering changes are needed.

**Client — sync (`Player.tsx`, `MP4Player.tsx`, `CDGPlayer.tsx`)**

- `Player` passes `isMirror` down and sets `audioGainNode.gain = 0` for mirrors. Use the **gain node, not `element.muted`** — CDG lyric rendering and any future visualizer need the element decoding normally.
- Add a shared `useMediaSync` helper (or a small base method) used by both `MP4Player` and `CDGPlayer`, since both hold a single `HTMLMediaElement` ref:
  - `targetPos = _leaderPosition + (Date.now() - _leaderPositionAt) / 1000` when playing.
  - `drift = el.currentTime - targetPos`.
  - On media load / `mediaKey` change: one-time `el.currentTime = targetPos` before play (criterion 11).
  - Steady state on each `timeupdate`: `|drift| < 0.02` → `playbackRate = 1`; else `playbackRate = clamp(1 - drift * 0.5, 0.98, 1.02)`.
  - Safety net: `|drift| > 1.0` → hard seek to `targetPos`.
- Mirrors do not call `props.onStatus` (no position emit) and do not call `props.onEnd` (no queue advance).

**Client — admin gating**

- [Header.tsx:70](../../src/components/Header/Header.tsx:70): `{(isUpNow || isAdmin) && <PlaybackCtrl />}` → `{isAdmin && <PlaybackCtrl />}`.
- `PlaybackCtrl` itself needs no change; its `isAdmin` use at [line 41](../../src/components/Header/PlaybackCtrl/PlaybackCtrl.tsx:41) already covers the `NoPlayer` branch.

**Shared**

- `shared/actionTypes.ts`: add `PLAYER_EMIT_JOIN`, `PLAYER_ROLE`, `PLAYER_REJECTED`.

### Verification

- Two-window manual check per the trace's discriminating probe: same song, observe independent queue advance is gone, measure `position` divergence over 60 s, confirm no progress-bar flicker.
- One automated check on the drift math (pure function: leader position + timestamp + local time → target `playbackRate`), asserting clamp bounds, the dead zone, and the hard-seek threshold.

## Ontology

| Entity | Definition | Stability |
|--------|-----------|-----------|
| **Player window** | A browser window rendering `/player` that has been granted a slot by the server. Max 3 per room. | Stable |
| **Primary** | The one player window that owns queue advance, audio output, and the room's status stream. First to join; oldest mirror is promoted on its exit. | Stable |
| **Mirror** | A player window that renders the primary's media in sync with gain 0 and no queue authority. | Stable |
| **Rejected window** | A 4th `/player` attempt. Holds no slot; redirected to the queue view. | Stable — meaning of "show the queue" assumed (see Assumptions) |
| **Drift** | `mirror.currentTime − (leaderPosition + elapsed wall-clock since leaderPositionAt)`. Valid only because all windows share one machine clock. | Stable |
| **Player slot** | A live socket in a room carrying a `_playerRole`. Freed on clean leave or disconnect. | Stable |
| **Playback control** | The `PlaybackCtrl` surface. Post-change: admin-only in the UI, unauthenticated on the wire. | Stable |

## Ontology Convergence

Entity set stabilized after the first interview round. The one term that shifted was "tab": the user's initial phrasing suggested a nav tab, but [Navigation.tsx](../../src/components/Navigation/Navigation.tsx) has no player tab and `/player` is already admin-gated — clarified in round 1 to mean the `PlaybackCtrl` bar. "Synced" narrowed from unspecified to frame-accurate, then became tractable once the same-machine constraint landed. No entity required renaming after round 2.

## Trace Findings

The trace ran three lanes and all three returned high confidence.

**What shaped this spec most:** the discovery that the `player` reducer has no `PLAYER_STATUS` case. There is no follower code path to extend — mirrors are net-new client behavior, which is why the role plumbing above is a state-shape change rather than a conditional.

**Premise corrections that changed scope:**

- Playback control is *not* admin-only today. [Header.tsx:70](../../src/components/Header/Header.tsx:70) grants the current singer the full control bar via `isUpNow`. The request "hide the tab" therefore removes a real affordance from non-admin singers rather than tightening an existing gate.
- The server applies *no* authorization to playback commands. This gap was surfaced, and the decision to leave it open is recorded above as an accepted risk.
- Frame-accurate sync was unreachable over the existing wire (1 s throttle, no timestamp, no seek). It became reachable only after the same-machine constraint was established, which made `Date.now()` a valid shared time base.

**Resolved by the interview:** the audio question (muted mirrors — settled the phasing problem before it existed), the topology question (same machine — collapsed the clock-sync design entirely), and the cap-enforcement question (hard reject — which is what forces a real registry, since `Rooms.isPlayerPresent`'s boolean cannot support one).

**Convergence noted in the trace:** lanes 1 and 3 are one workstream — "no concept of player identity anywhere in the stack" — with a client face and a server face. Lane 2 (authz) is genuinely independent and could ship separately.

## Interview Transcript

**Round 1 — lane confirmation + premise audit**

- *Trace lanes appropriate?* → Confirm all 3.
- *"the tab should be hidden" — which tab?* → The existing playback controls (`PlaybackCtrl`), not a nav tab.
- *How tight must sync be?* → Frame-accurate / lip-sync.

**Round 2 — per-lane critical unknowns**

- *Where do the 3 windows run?* → Same machine, multiple monitors.
- *Audio on non-primary windows?* → Muted mirrors.
- *What happens to the singer's controls?* → Hide UI only (server authz declined; risk recorded).
- *4th window behavior?* → Reject with a message.

**Round 3 — mechanism**

- *How do mirrors correct drift?* → `playbackRate` nudging.
- *Who is primary?* → First player in wins.
- *Which media types must mirror?* → MP4 + CDG.
- *Rejected 4th window UX?* → "Show the queue."
