# Player UI kit

The fullscreen room player, rebuilt on DECK. 16:9, because it lives on a TV.

**Admin-only, and opened from Settings.** There is no Player tab: the host opens it once
on the machine driving the room's audio, from the `Player` panel in Settings, which also
holds its status, join code and display options. Singers only ever see it across the room.

Built from `src/routes/Player` — `PlayerController`, `PlayerTextOverlay` and
`PlayerQR` — restyled to the graphite/amber faceplate.

## What is real and what stands in

Real: every overlay state, the transport strip, and their exact type sizes,
positions and panel treatments.

Standing in: the media layer. `MediaStandIn` paints a colour field of roughly the
right value with two lines of placeholder lyric — enough to judge overlay contrast.
The QR code is the `QR_CODE` glyph rather than a real code.

## Overlay states

| State | When |
| --- | --- |
| `upNow` | First seconds of a song — a corner panel naming who is on stage, singer in amber. |
| `upNextTease` | Last seconds — the same panel naming who is next, in ink. |
| `intermission` | Between songs. The only takeover: next song, face, name, countdown, coming up, over a warm amber wash. |
| `idle` | Loaded but not started. A knob-styled play key, because browsers will not autoplay without a tap. |
| `empty` | Nothing queued. Silkscreen "queue empty" over an amber "Add a song". |
| `errored` | Media failed. "Fault" / "Media failed" / "see the queue for details". |

## What changed from the old brand

The rainbow per-character `ColorCycle` is gone, along with "CAN HAZ MOAR SONGZ?"
and "OOPS...". The player still shouts, but by being large and amber rather than by
being multicoloured and jokey — and the messages now say what happened
("Media failed", "see the queue for details") instead of performing.
