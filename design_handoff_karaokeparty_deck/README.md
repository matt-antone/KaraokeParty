# Handoff: KaraokeParty — DECK rebrand

## Overview

A full visual and structural rebrand of KaraokeParty, a self-hosted karaoke system: a
host runs the server, singers queue songs from their phones, and a player screen drives
the room's TV and audio.

The old brand was blue/pink neon with glow filters, a webfont called Beon, frosted-glass
chrome and emoji. **DECK** replaces it with component hi-fi: a graphite faceplate,
machined depth, amber VU-meter signal, silkscreen labels. The bundle covers two surfaces
— the singer's phone app and the room's player screen — plus the design system both are
built from.

## About the design files

**The HTML and JSX files in this bundle are design references, not production code.**
They are prototypes that show intended look, structure and behaviour. Your task is to
**recreate these designs in the target codebase's own environment** — its framework,
component library, routing and state patterns — not to copy the files in.

Two things in the bundle *are* directly liftable:

- **`tokens/*.css`** — plain CSS custom properties. Copy them in as-is, or port the values
  into whatever token system the codebase uses. Every value in the designs comes from here.
- **The `.d.ts` and `.prompt.md` files** next to each component — the intended prop
  surface and the reasoning behind each component. Read these before implementing.

The `.jsx` files are reference implementations: correct structure and exact values,
written against plain React with inline styles. Treat them as detailed specs.

## Fidelity

**High fidelity.** Final colours, typography, spacing, depth, motion and copy. Recreate
the UI to match, using the codebase's existing libraries where they can hit these values
and the tokens where they cannot. Where the codebase already has a primitive that fits
(button, checkbox, modal), use it and restyle it with these tokens rather than adding a
parallel component.

## Where to start

1. Read `design_system.md` end to end. It is the source of truth for the brand, and it
   explains *why* each rule exists — which matters when you hit a case the components
   don't cover.
2. Open `previews/app.html` and `previews/player.html` in a browser. These are the two
   clickable references. Every screen and state is reachable from them.
3. Read `ui_kits/app/README.md` and `ui_kits/player/README.md` — they map each screen to
   the routes and selectors in the existing KaraokeParty codebase.
4. Then work component by component from `components/`.

## Screens / views

### The app (phone, 390px column)

Structure: a wordmark row that scrolls away, `YourTurn` pinned to the top of the
viewport, the scrolling body, and a bottom nav pinned to the base. See
`ui_kits/app/App.jsx` and the Layout section of `design_system.md`.

| Screen | File | Purpose |
| --- | --- | --- |
| Library | `ui_kits/app/LibraryScreen.jsx` | Search, facet keys, Artists/Songs tabs, alpha rail, expanding folders. |
| Queue | `ui_kits/app/QueueScreen.jsx` | Queue and History tabs. The playing row carries its own amber progress readout; row actions are permission-driven. |
| Me | `ui_kits/app/MeScreen.jsx` | The singer's own reorderable songs, "Queue another song", then their locked history. |
| My Account | `ui_kits/app/AccountScreen.jsx` | Account panel and song history as a record — no re-queue action here. |
| Settings | `ui_kits/app/SettingsScreen.jsx` | Rooms, Users, Player, Preferences. **Admin only, and the only route to the player controls.** |

### The player (room TV, 16:9)

`ui_kits/player/PlayerScreen.jsx` and `components/player/PlayerOverlay.jsx`. Six mutually
exclusive overlay states: `upNow`, `upNextTease`, `intermission`, `idle`, `empty`,
`errored`. Everything is sized in `vh` because the audience is across the room.

Placement rules, all deliberate:

- Overlays that sit over playing video are **solid corner panels in the top-right**,
  keeping the lower two-thirds clear for lyrics.
- The **queue-depth VU meter** runs along the bottom edge so the room can see how long the
  list is without asking. It hides when the queue is empty.
- The **join QR** parks in the lower-right, out of the lyric band, and stays up during
  intermission — that is when people are looking for it.
- The **fullscreen key** floats in the upper-right on the paused stage only.
- The **thread field** is the stage background when no video is playing. See Backgrounds
  in `design_system.md`; the reference implementation is inline in
  `previews/player.html` (`window.KP_BG`).

Note: `previews/player.html` includes a small control rig at the bottom for switching
states and media layers. **That rig is a preview harness, not part of the design** — do
not build it.

## Interactions & behaviour

Covered per component in the `.prompt.md` files. The load-bearing ones:

- **Swipe rows** (`components/queue/SwipeRow`) — action keys sit *underneath* the row on
  the chassis; the row slides over them. The row is the only opaque layer, so dim a
  disabled row by colour, never by opacity, or the keys ghost through.
- **Played rows are inert.** No re-queue, no controls, no info icon, no favourite toggle
  except the star. A sung song is a record.
- **Song titles are never truncated** — site-wide. Titles wrap and the row grows. Artist
  names and silkscreen meta still ellipsise on one line.
- **No hover language.** This is a touch product; states are press and selected only.
- **Motion is mechanical**: `--dur-key` 90ms for a press, `--dur-ui` 180ms for a tab or
  tray. No bounce, no pulse, no glow bloom.

## State management

The UI kit files name the real routes and selectors they came from
(`routes/Library`, `routes/Queue`, `selectors/getMyUpcoming`, `routes/Settings`), so map
these designs onto the existing state rather than inventing new stores. Permission gating
matters in two places: queue row actions differ for owner / admin / other, and the whole
Settings route including all player transport is admin-only.

## Design tokens

All in `tokens/`, imported by `styles.css`:

| File | What |
| --- | --- |
| `colors.css` | Two graphite ramps and three signals — amber `--vu`, teal `--standby`, red `--alert`. The whole palette. |
| `typography.css` | Michroma (display), Figtree (body), JetBrains Mono (silkscreen labels + numbers). Scale, and the silkscreen package. |
| `spacing.css` | `--gap-1` 2px … `--gap-5` 20px, hit targets, fixed row heights. |
| `effects.css` | `--bevel` (raised) and `--well` (recessed) — two shadows carry the whole system — plus key faces and the focus ring. |
| `motion.css` | Durations and easings. |
| `fonts.css` | `@font-face` / font loading. |
| `base.css` | Resets and the `.silkscreen` utility. |

Wanting a fourth colour means wanting a fourth indicator — reconsider instead of adding
one. Every element gets `--bevel` or `--well`; nothing gets both, nothing gets neither.

## Assets

**No image assets, by design.** There is no logo file: both the knob mark and the stacked
wordmark are CSS geometry (`components/core/Logo.jsx`). Icons are a single path map in
`components/core/Icon.jsx` — one shape per name, 24-box weight. If you need an icon that
isn't there, add its real path data to the map at the same weight; don't draw a one-off.

The Beon webfont, all glow filter tokens, all `backdrop-filter` tokens, the pink hue, and
every emoji are removed. Don't reintroduce them.

## Files

```
design_system.md            The brand. Read first.
styles.css                  Imports every token file.
tokens/                     7 CSS files — colours, type, spacing, effects, motion, fonts, base.
components/                 25 components in 6 groups, each with .jsx, .d.ts, .prompt.md
  core/                     Button, Icon, Logo, Knob, VuMeter, …
  forms/                    InputCheckbox, InputRadio, InputImage, Slider
  surfaces/                 Panel, Modal, Accordion, TextOverlay
  chrome/                   YourTurn, Navigation, Tabs, LibraryHeader, QueueHeader,
                            ProgressBar, PlaybackCtrl (Settings > Player only)
  queue/                    SwipeRow, QueueItem, SongHistoryList, …
  player/                   PlayerOverlay, PlayerHeadline
ui_kits/app/                Six phone screens + App shell, with a README mapping each to routes.
ui_kits/player/             The player screen, with a README.
previews/app.html           Clickable phone reference — every screen and state.
previews/player.html        Clickable player reference — all six overlay states.
```

The `.card.html` files in each component directory are the design-system preview cards.
They are documentation, not implementation targets.
