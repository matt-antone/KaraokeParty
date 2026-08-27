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

Join the [Karaoke Eternal Discord Server](https://discord.gg/PgqVtFq) for general support and development chat, or just to say hi!

## Contributing & Development

Contributions are welcome! Please join the `#dev` channel of the [Discord Server](https://discord.gg/PgqVtFq) before embarking on major features; the project's scope is limited to ensure success.

Make sure you have [Node.js](https://nodejs.org/en/) v24 or later, then:

1. Fork and clone the repo
2. `npm i`
3. `npm run dev` and look for "Web server running at" for the **server URL**
