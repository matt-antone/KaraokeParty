# KaraokeParty Design System — DECK

KaraokeParty is a self-hosted karaoke system. A host runs the server on whatever they
have — a PC, a Mac, a Raspberry Pi, a NAS — points it at a folder of karaoke media, and
opens the player fullscreen on the machine driving the room's audio. Everyone else scans
a QR code and gets the app in their phone browser, where they find songs and add
themselves to the queue. No app install, no accounts required (a guest is one field),
no ads, no telemetry.

It is a fork of [Karaoke Eternal](https://github.com/bhj/KaraokeEternal) by RadRoot LLC,
used under the ISC license.

**This design system is a rebrand.** Karaoke Eternal's identity — two hues (blue 209 and
pink 270), neon glows built from stacked drop-shadows, the Beon neon display face, a
rainbow colour-cycling player — has been replaced entirely. Nothing of it survives in
`tokens/` or `components/`. The old brand's assets are parked in `assets/legacy/` for
reference only; do not use them.

## The idea: DECK

**The product is a piece of component hi-fi.** A graphite faceplate, machined in steps of
light, with silkscreened labels and one amber VU register. It is quiet, precise and
high-contrast, and it does not shout with colour.

That gives every state a physical answer instead of a decorative one:

- A thing you can press is a **raised key**. A thing that holds something — an input, a
  tab track, a meter segment, an avatar — is a **recessed well**.
- A thing that is *on* is **amber**. A thing that is *off* is dim graphite. There is no
  glow anywhere; an indicator is lit by being amber, not by bleeding light.
- Quantity is a **VU meter**. Room level, scan progress, queue depth, song position — all
  the same readout language.

The mark is the volume knob. The wordmark is two channel labels stacked.

## Two surfaces, opposite conditions

- **The app** — a phone, one-handed, in a dark room, by someone holding a drink. Phone
  only: there is no tablet or desktop layout. 390px column, fixed chrome top and bottom,
  every target at least 44px.
- **The player** — a TV across the room. Sized in `vh`, big amber type, overlays kept
  out of the lower two-thirds so lyrics stay clear.

**The player is admin-only, and everything about it lives in one place: the `Player`
panel on the Settings screen.** Status, the key that opens it, the join code, its display
options, and **the room transport** — play/pause, skip, volume. It is a room fixture the
host sets up once on the machine driving the audio, not a place anyone navigates to.

There is no Player tab, no player entry in the bottom nav, and **no transport in the app
header**. A singer does not pause the room, not even during their own song. The header
carries the singer's own status and nothing else; putting transport controls on every
screen made the app read as a remote control when it is a request queue.

## Sources this system was built from

- **Codebase:** the `KaraokeParty` folder attached to this project.
  - `src/components/`, `src/routes/{Library,Queue,Account,Settings,Player}/` — the
    component inventory and the screens. Structure, information architecture, row
    heights, permissions and copy were taken from here.
  - `src/styles/variables.css` — read, then deliberately replaced.
  - `docs/research/competitive-features.md` — competitive study and feature backlog.
- **Upstream:** <https://www.karaoke-eternal.com/>
- **Fonts:** Michroma, Figtree and JetBrains Mono, from Google Fonts.
- **Icons:** the codebase's own 48-glyph path map, kept verbatim.

No Figma file, brand guidelines or logo files were supplied. No screenshots were used as
a primary source: structure came from the `.tsx`, and the visual system is new.

---

## VISUAL FOUNDATIONS

### Colour

Two graphite ramps and three signals. That is the whole palette.

**Graphite** runs in six steps across thirteen lightness points:
`--chassis-deep` → `--chassis` → `--key-well` → `--faceplate` → `--key` → `--key-hi`.
The difference between a key and the panel it sits on is four or five points *plus a
bevel* — never a hue shift and never a border.

**Ink** is five levels of warm off-white, starting at `--ink` #e6e4de. Pure white on
graphite reads as a screen rather than a panel, so nothing is pure white. `--ink-4` is
"already sung"; `--ink-5` is "off" — an unlit icon, an empty meter segment.

**Signals**, one job each:

| Token | Meaning |
| --- | --- |
| `--vu` #ff8a1e | Level, progress, now playing, your row, the one primary action per screen. |
| `--standby` #35c8b0 | Armed but not running: a queued song. |
| `--alert` #e5484d | A fault, or a destructive key. |

Wanting a fifth colour means wanting a fifth indicator. Reconsider instead of adding one.

### Backgrounds

Flat graphite, layered by lightness. No photography, no illustration, no pattern, no
texture, no grain. The only gradients are functional and nearly invisible: the vertical
brush on a panel face, the vertical face of a key, and the amber wash behind a playing
queue row. There are no decorative background gradients anywhere.

**The one exception is the player's own stage**, which is a TV across a dark room rather
than a panel in the hand. When no video is playing it draws a *thread field*: six lanes
of luminous amber threads, drifting and breathing, pinched to a fan at both edges and
dimmer with depth. It uses the amber ramp only — signal, a warm highlight, and `--vu-dim`
for the threads furthest back. Two rules keep it honest: the middle band stays empty so
the singer's name and the countdown read cleanly, and the field **stops drawing entirely**
whenever video covers it, which is most of a night. It is Canvas 2D, capped at 30fps, and
honours `prefers-reduced-motion`. Nothing like it appears anywhere in the app.

### Depth

Two shadows carry the entire system:

- `--bevel` — raised. A 1px white inner top edge, a dark inner bottom edge, and a small
  cast shadow. Keys, panels, queue rows, the selected tab, the amber banner.
- `--well` — recessed. A dark inner top shadow. Inputs, tab tracks, unlit meter
  segments, avatars, accordion bodies.

If a new element is pressable it gets `--bevel`; if it contains something it gets
`--well`. Nothing gets both, and nothing gets neither.

### Transparency and blur

**None.** This brand has no frosted glass. Fixed chrome is a solid brushed panel with a
seam; modals are solid; player overlays are solid corner panels. The old brand's
`backdrop-filter` chrome is gone — a deck's faceplate is opaque.

### Type

Three faces, three jobs, no overlap.

- **Michroma** (`--font-display`) — the wordmark and the player. Wide, technical, slow to
  read. Always uppercase, tracked .10–.13em, never below 12px, never more than three
  words. On the TV it runs at 5.5vh and the countdown numeral at 11vh.
- **Figtree** (`--font-body`) — everything read as a sentence, a song title, or a name.
  Weights 400/500/600/700; 600 for titles, 700 for keys and tabs.
- **JetBrains Mono** (`--font-mono`) — the silkscreen. Every label printed on the panel:
  section headings, panel titles, durations, tags, counts, waits, meter legends.

The `.silkscreen` utility is a package, not a size: 9.5px, .14em tracking, uppercase,
`--ink-3`. **The rule is simple — if it is language, it is Figtree; if it is data, it is
mono.** Inputs never go below 16px (iOS zooms otherwise).

### Corners

3px for keys, chips, fields and song rows. 4px for panels, queue rows and the player
stage. Machined edges, not moulded plastic. Knobs and radio buttons are the only circles;
avatars are square with a 3px radius.

### Interaction states

No hover language — this is a touch product, and the source defines almost no
`:hover`.

- **Off:** dim graphite, recessed or flat.
- **On:** amber, raised.
- **Press:** the key face travels 1px down over 90ms. That travel *is* the feedback;
  nothing flashes, nothing scales.
- **Swipe:** the row tracks the finger 1:1 and snaps open past 40% of its travel. A
  vertical drag is handed back to the list so the page still scrolls.
- **Focus:** a hard 2px amber ring with a chassis-coloured gap. Never blurred.
- **Disabled:** 45% opacity, colour unchanged.
- **Spent (already sung):** the key face is removed entirely and the text steps down the
  ink ramp. This is not decoration — **a song sung tonight is locked for the rest of the
  party**, so a played row is genuinely inert: no key face, no swipe actions, nothing to
  press but the star. It stays in the list so people can see what has been done.
  **Dim by colour, never by opacity:** a list row is the only opaque layer over its swipe
  actions, so any transparency lets them ghost through.

### Motion

Mechanical. `--dur-key` 90ms for a press, `--dur-ui` 180ms for a tab or tray,
`--dur-slow` 320ms for a screen. Nothing overshoots, nothing springs, nothing pulses for
attention. There are exactly two ambient motions: the slow amber sweep across a playing
queue row's fill (paused, not hidden, when audio pauses) and the countdown numeral's
200ms tick. The old brand's bouncing star, pulsing banner and glow blooms are gone.

### Song titles are never truncated

Site-wide rule: **a song title always shows in full.** Titles wrap and the row grows past
its minimum height rather than ellipsising — a half-read title is useless when you are
choosing what to sing or looking for your turn. This applies in the library, the queue,
the Me tab, song history and the player's corner panel.

The consequence: `--row-song`, `--row-queue` and `--row-artist` are **minimums, not fixed
heights**, and no row may be placed in a fixed-height container. Artist names, singer
names and silkscreen meta still ellipsise on one line; only titles wrap.

### Layout

One 390-ish column. **`YourTurn` is pinned to the top of the viewport and the bottom nav
to the base; the wordmark row above `YourTurn` scrolls away with the content.** The
singer's status is the one thing worth costing fixed screen height on every list, so it
was cut down to earn it: a 1.15rem headline, a 6px meter, and tightened padding.
Every tab opens with `--gap-4` below the header, separates blocks by `--gap-4`, and ends
with `--gap-5`. List rows inside a block sit 3px apart, so a list reads as one rack
rather than a set of cards.
`--gap-4` (14px) is the screen gutter and standard panel padding; `--gap-1` (2px) is only
ever the seam between adjacent keys. Row heights are fixed per list — 46px folder, 56px
song, 86px queue — so a list reads as a rack of identical channels.

---

## CONTENT FUNDAMENTALS

**Panel labels are silkscreen. Everything a person reads is a sentence.**

That split is the voice. A label is terse, uppercase, and printed on the machine:
`ROOM LEVEL`, `QUEUE 08`, `UP NEXT`, `ON STAGE`, `COMING UP`, `QUEUED`, `FAULT`. Write
labels in normal case in code and let the component uppercase them.

Sentences are plain, second person, and use contractions:

- Status is said **once, in one place**: `YourTurn`, the app header. A silkscreen
  `YOUR TURN` label, the wait as a Michroma value (`NOW`, `4 MIN`, `PAUSED`), a meter
  filling toward the singer's turn, and the pause key. No sentence version, no second
  copy on the Me tab. Loudness carries the urgency, not the wording — a lit amber strip for *now*,
  an amber rule for *next*, a hairline for *further down*.
- Empty states are a silkscreen headline naming the state, then one sentence pointing at
  the fix with the destination as an inline amber link: "**QUEUE EMPTY** / Tap a song in
  the *library* to queue it." Also "**NOTHING SUNG YET** / Songs land here once they have
  been played."
- Actions say what they act on, possessive where it is the singer's own: "Pause my
  songs", "Resume my songs", "My Account" — never a bare "Pause", because pausing the
  *room* is a different, admin-only thing.
- Keys are Title Case verb phrases: "Sign In", "Sign Out", "Update Account",
  "Create Room", "Create User", "Done", "Join as Guest".
- Placeholders are lowercase and literal: "search", "username or email", "password",
  "display name", "room password (required)".
- Destructive confirmations state the consequence in full and do not soften it: "Are you
  sure you want to sign out? Your upcoming songs will be removed from the queue, and as a
  guest, you won't be able to sign back into this account."

**The player states what happened.** Where the old brand joked — "CAN HAZ MOAR SONGZ?",
"OOPS..." — DECK reports: silkscreen `QUEUE EMPTY` over an amber "Add a song";
`FAULT` over "Media failed" and "see the queue for details". It still shouts, but by
being large and amber. Keep it to three words.

**No emoji. Anywhere.** The favourite control is a text ★ that lights amber; library
facets are words on keys. The old brand's ⭐ and its 🎵 ♪ 📅 ✨ facet labels are gone, and
reintroducing them breaks the system.

**Numbers are quiet.** Counts ride inline in mono at 10px with 75% opacity, never in a
coloured badge. Waits are humanised ("4 min"), durations are `m:ss`, dates are short
("Aug 29"). A continuous quantity becomes a VU meter rather than a number — there is no
numeric readout for volume, level, or progress anywhere in the product.

---

## ICONOGRAPHY

One set, one shape per name.

- **48 single-path SVG icons**, kept verbatim from the codebase: Material Design Icons
  geometry on a 24-box, plus three GitHub Octicons (16-box) used only by the docs footer,
  and one unused 32-box star. Path data lives in `components/core/Icon.jsx` and
  `assets/icons/icons.js`; it was copied programmatically and must not be hand-edited.
- **Monochrome, always.** `fill: currentColor`, colour from the parent. Amber means lit,
  `--ink-2` means normal, `--ink-5` means off.
- **Sized by height only.** `--icon-s/m/l/xl` = 16 / 22 / 26 / 30px. Width follows the
  viewBox. Row actions are 22px inside a 46px slot; transport and nav are 26px; play/pause
  is 30px.
- No icon font, no sprite sheet, no CDN icon library.
- **Do not draw new icons.** If a glyph is missing, take it from Material Design Icons at
  the same 24-box weight and add its real path data to the map.

### Brand assets

There is **no logo image**, and none should be drawn. Both marks are CSS geometry in
`components/core/Logo.jsx`:

- **Wordmark** — KARAOKE in `--ink` over PARTY in amber, stacked, Michroma, tracked
  .13em. Two channel labels silkscreened on a panel. Never on a light background, never
  on one line, never re-tracked.
- **Mark** — the volume knob: concentric circles with an amber index line at twelve
  o'clock, the same knob the transport uses. Minimum legible size 28px.

`assets/legacy/` holds the old Karaoke Eternal marks (app icon, mic glyphs, the README
product shot). They are kept for provenance and are **not part of this brand**.

---

## Index

| Path | What |
| --- | --- |
| `styles.css` | The entry point. Link this one file; it `@import`s everything else. |
| `tokens/fonts.css` | The three Google faces. |
| `tokens/colors.css` | Graphite ramps, ink ramp, the three signals. |
| `tokens/typography.css` | Families, weights, body and display scales, the silkscreen package. |
| `tokens/spacing.css` | 2px layout unit, gutter, targets, fixed row heights. |
| `tokens/effects.css` | Radii, bevel and well, brush and key gradients, focus ring. |
| `tokens/motion.css` | Three durations, the key ease, and every `@keyframes`. |
| `tokens/base.css` | `box-sizing: border-box`, element defaults, native fields as wells, the `.silkscreen` utility. |
| `guidelines/*.html` | 14 specimen cards (Colors, Type, Spacing, Effects, Motion, Brand). |
| `assets/icons/icons.js` | The 48-glyph path map, as a module. |
| `assets/legacy/` | Old Karaoke Eternal marks. Reference only. |
| `directions/` | The three rebrand candidates. `1b-deck.html` is the one this system is built on. |
| `ui_kits/app/` | The phone app: sign-in, library, queue, account, settings. |
| `ui_kits/player/` | The room player and every overlay state. Admin-only; launched from the Settings screen. |
| `SKILL.md` | Agent Skills entry point. |

### Components

Each directory has `<Name>.jsx`, `<Name>.d.ts`, `<Name>.prompt.md`, and one preview card.

- **`components/core/`** — `Icon`, `Button`, `SwipeRow`, `ButtonStar`, `VuMeter`, `Knob`,
  `Logo` (+`Mark`), `Spinner`
- **`components/forms/`** — `InputCheckbox`, `InputRadio`, `InputImage`, `Slider`
- **`components/surfaces/`** — `Panel`, `Modal`, `Accordion`, `TextOverlay`
- **`components/chrome/`** — `YourTurn`, `Navigation`, `Tabs`, `LibraryHeader`,
  `QueueHeader`, `ProgressBar`, and `PlaybackCtrl` (Settings > Player only)
- **`components/queue/`** — `SongHistoryList`
- **`components/items/`** — `ArtistItem`, `SongItem`, `QueueItem`, `UserImage`,
  `AlphaPicker`

`QueueItem` takes `showStar`; it is off on the Me tab, where the list is already your own
songs and starring is not the job you came to do.
- **`components/player/`** — `PlayerHeadline`, `PlayerOverlay`

There is no `TextInput` primitive, by design: `tokens/base.css` styles
`input[type=text|email|password|search]`, `textarea` and `select` as recessed wells, so a
native field is already on-brand.

#### Additions this rebrand introduced

- **`VuMeter`** — the signature readout. Segment count is a *visual* choice, not a data
  one: keep it high (14–30) so the bar reads as a level. Never map segments 1:1 onto a
  small quantity — a four-segment meter reads as four blocks, not a level. It replaces four different progress treatments
  from the old brand (scanner bar, queue-row fill, folder counts, player strip) with one.
- **`Knob`** — room volume. Vertical drag, so it can sit in a header above a swipeable
  list without conflict. Replaces `VolumeSlider`.
- **`Tabs`** — consolidates a tab row whose CSS was duplicated in `LibraryHeader.css` and
  `QueueHeader.css`.
- **`PlayerHeadline`** — replaces `ColorCycle`. Same job, no rainbow.
- **`YourTurn`** — the app header. A singer glancing at their phone mid-party is asking
  one question, so the answer sits at the top of every screen: when am I on, how deep in
  the rotation, and can I step out. It also drove a structural change: the queue's three
  tabs are **three interfaces, not three filters** — Queue is the rotation, History is
  what has been sung, and Me is the singer's own songs plus their history.
- **`SongHistoryList`** — the singer's past songs, shared by the Me tab and the Account
  screen. A record, not a menu: sung songs are locked, so the only control is the star,
  which favourites the song for a future party. In the source this list exists only inside
  `routes/Account/components/SongHistory`; surfacing it on the Me tab is a product change,
  not a restyle.
- **`Mark`** — the knob mark, exported alongside `Logo`.
- **`SwipeRow`** — swipe-to-reveal, replacing `Buttons`. The old pattern expanded a tray
  *inside* the row, which squeezed the title and read as pulling a menu out of the
  content. Now the row slides aside in one piece and labelled keys sit on the chassis
  beneath it: the row is a cartridge, the keys are the panel behind it. Each key is 72px
  with a glyph over a one-word silkscreen label — the label is what makes the payoff of
  the gesture obvious.

#### Removed from the old system

- `VolumeSlider` (→ `Knob` + `VuMeter`), `ColorCycle` (→ `PlayerHeadline`), `Buttons`
  (→ `SwipeRow`) and `UpNext` (→ `YourTurn`, which absorbed it).
- The Beon webfont, all glow filter tokens, all `backdrop-filter` tokens, the pink hue,
  the star bounce, the banner pulse, and every emoji.

#### Deliberately not built

- `ToggleAnimation` and `PaddedList` — behavioural wrappers with no visual identity.
- `SongInfo`, and the info affordance entirely. **There is no info icon anywhere in the
  product.** A row already carries everything a singer decides on — title, artist, tags,
  duration, star count — so a second screen restating it only cost a slot in a 390px row.
  The source's `INFO_OUTLINE` glyph stays in the icon map but is unused, and the
  `songInfo` store module has no UI entry point.
- A dedicated history *screen*. History appears in three places for three reasons: the
  queue's History tab (what the room has sung), the Me tab (what you have sung, to queue
  again), and the Account panel (your record). Same component, different affordances.
- `PlayerQR` — needs `react-qrcode-logo`. The player kit substitutes the `QR_CODE` glyph
  and documents the real behaviour.
- `EditRoom` / `EditUser` / `NoPlayer` / `FirstRun` — real screens, but they are Panels
  and Modals full of native fields; nothing new to define.
