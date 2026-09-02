# KaraokeParty

Host awesome karaoke parties where everyone can easily find and queue songs from their phone's browser. The player is also fully browser-based with support for MP3+G, MP4 videos and WebGL visualizations. The server is self-hosted and runs on nearly everything.

[![KaraokeParty](/docs/assets/images/README.jpg?raw=true)](/docs/assets/images/README.jpg?raw=true)

<p align="center">
  <i>App in mobile browser (top) controlling player in desktop browser (bottom)</i>
</p>

## Features

- Plays:
  - MP3+G (MP3 with CDG lyrics; including zipped)
  - MP4 videos
  - Music-synced visualizations (with automatic lyrics background removal)
- Fast, modern mobile browser app designed for "karaoke conditions"
- Easy joining with QR codes and guest accounts
- Multiple simultaneous rooms/queues (optionally password-protected)
- Dynamic queues keep parties fair, fun and no-fuss
- Singers manage their own spot:
  - A **Me** tab with drag-to-reorder and swipe-to-remove for your own upcoming songs
  - A wait-time readout with a pause key, so you can step away without losing your place
  - A **History** tab of what the room has sung tonight, plus your own song history across parties
- A short intermission between songs that names and shows the next singer
- Fully self-hosted
- No ads or telemetry

Microphones are *not* required since the player itself only outputs music - this allows your audio setup to be as simple or complex as you like. See the [F.A.Q.](docs/content/faq/recommended-audio-microphone-setup.md) for more information.

## Getting Started

KaraokeParty basically has 3 parts. See [Getting Started](docs/content/docs/getting-started/index.md) to get up and running step-by-step, or jump to the documentation for each part below:

- **[Server:](docs/content/docs/karaokeparty-server/index.md)** Runs on pretty much anything to serve the web app and your media files, including a Windows PC, Mac, or a dedicated server like a Raspberry Pi or Synology NAS.
- **[App:](docs/content/docs/karaokeparty-app/index.md)** Fast, modern mobile web app designed for "karaoke conditions".
- **[Player:](docs/content/docs/karaokeparty-app/index.md#player)** Just another part of the app, but meant to run fullscreen on the system handling audio/video for a [room](docs/content/docs/karaokeparty-app/index.md#rooms-admin-only)

## Installation

There are several [installation methods](docs/content/docs/karaokeparty-server/index.md#installation) available for KaraokeParty Server.

## Credits

KaraokeParty is a fork of [Karaoke Eternal](https://github.com/bhj/KaraokeEternal) by RadRoot LLC, used under the ISC license.

## Discord & Support

For bugs and requests specific to this fork, open an [issue](https://github.com/matt-antone/KaraokeParty/issues). For general karaoke-system support and development chat, the upstream [Karaoke Eternal Discord Server](https://discord.gg/PgqVtFq) is the place to be.

## Contributing & Development

Contributions are welcome! Please open an issue before embarking on major features; the project's scope is limited to ensure success.

Make sure you have [Node.js](https://nodejs.org/en/) v24 or later and [Bun](https://bun.sh) v1.2 or later, then:

1. Fork and clone the repo
2. `bun install`
3. `npm run dev` and look for "Web server running at" for the **server URL**

Other useful scripts: `npm test` (vitest), `npm run lint`, `npm run typecheck`, and `npm run build` followed by `npm run serve` for a production run.

## KaraokeParty vs. Karaoke Eternal

KaraokeParty tracks Karaoke Eternal for the media, scanning and server side of things, and diverges on how singers experience the party. Everything below is a difference; everything not listed (media formats, rooms, guest accounts, QR joining, the scanner, the metadata parser, the visualizer) works the same way.

| | KaraokeParty | Karaoke Eternal |
| --- | --- | --- |
| **Interface** | DECK — a dark, mixing-desk visual system with its own type, tokens and controls | The original Karaoke Eternal UI |
| **Queue screen** | Three tabs: *Queue*, *Me* and *History* | A single queue list |
| **Reordering your songs** | Any singer drags their own upcoming songs on the *Me* tab; the shared queue stays admin-only | Reordering the queue is admin-only |
| **Stepping away** | Pause your spot in the rotation and resume when you're back; the round-robin skips you while paused | No equivalent — remove and re-queue the song |
| **Wait time** | A header strip shows how long until your turn, and whether you're up now | Position is implied by the queue list |
| **Between songs** | A 15-second intermission that names and pictures the next singer | Songs follow back-to-back |
| **Song history** | Kept per user and survives re-scans, shown on the *Me* tab and your account page | Not kept |
| **Tooling** | Bun for installs and the lockfile | npm |

Both are self-hosted, ad-free and telemetry-free, and both are ISC-licensed.
