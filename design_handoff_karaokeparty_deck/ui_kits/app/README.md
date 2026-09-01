# App UI kit

The phone app, rebuilt on DECK. 390px wide, because the product is phone-only:
there is no tablet or desktop layout, and content is a single column between fixed
chrome.

Built from `src/routes/{Library,Queue,Account,Settings}` and
`src/components/{Header,Navigation}` in the attached codebase, restyled to the
graphite/amber faceplate.

## Screens

| File | Source | Notes |
| --- | --- | --- |
| `SignInScreen.jsx` | `routes/Account/views/SignedOutView` | Room radios, then returning / new / guest. Guest is one field. |
| `LibraryScreen.jsx` | `routes/Library` | Search, latching facet keys, Artists/Songs tabs, alpha rail, expanding folders. |
| `QueueScreen.jsx` | `routes/Queue` | Queue and History tabs. The playing row is its own amber progress readout; actions are permission-driven. |
| `MeScreen.jsx` | `routes/Queue` + `selectors/getMyUpcoming` | The Me tab: the singer's own reorderable songs, "Queue another song", then their locked song history. Status is not repeated here — `YourTurn` is in the header. |
| `AccountScreen.jsx` | `routes/Account` | My Account panel, and Song History via the same `SongHistoryList` the Me tab uses — here without the re-queue key, since this screen is a record. |
| `SettingsScreen.jsx` | `routes/Settings` | Rooms, Users, Player, Preferences. Admin only — and the only way to the player: its status, the key that opens it, the join code and its display options all live in the Player panel. |
| `App.jsx` | `components/App/CoreLayout` | Header (wordmark, room, `YourTurn`, scanner), routing, bottom nav. No transport — that is admin-only and lives in Settings > Player. |

## What changed from the old brand

- Facet **selects became latching keys**. A key shows its state without being
  opened, which is what you want when filtering one-handed in a dark room. It also
  removed the four facet emoji.
- The queue's own progress fill is now an amber wash with a slow sweep, and the
  singer's own rows are marked with a 2px amber edge rule instead of glowing pink text.
- Media-folder and scanner progress are **VU meters**, so the panel has one language
  for "how far along".
- Volume is a **knob plus a meter**, not a horizontal slider — a vertical-drag control
  doesn't fight the list scroll.
- The **transport left the header entirely.** Player controls are admin-only, so they sit
  in Settings > Player with the rest of the player, not above every screen.

## The rig strip at the bottom

Role, signed-in state, the singer's own status, and the scanner. Not product UI —
it exists so every header state is reachable without a server.

## Deliberately not recreated

- The player (see `ui_kits/player`).
- Room and user editor modals — content-light in the source; the Display modal is
  the modal example.
- QR join, which needs `react-qrcode-logo`.
