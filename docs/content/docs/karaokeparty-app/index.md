---
title: KaraokeParty (the app)
description: Documentation for KaraokeParty (the app)
resources:
- src: 'app-library.png'
  params:
    galleryOrder: 1
- src: 'app-queue.png'
  params:
    galleryOrder: 2
- src: 'app-queue-me.png'
  params:
    galleryOrder: 3
- src: 'app-account.png'
  params:
    galleryOrder: 4
- src: 'app-settings.png'
  params:
    galleryOrder: 5
- src: 'app-displayctrl.png'
  params:
    galleryOrder: 6
- src: 'app-player.jpg'
  params:
    galleryOrder: 7
---

KaraokeParty is a modern mobile browser app that lets everyone join without having to install anything on their phones. It's built for touch, but a mouse is supported in desktop browsers (click and drag to emulate swipe gestures).

The bottom navigation has three destinations for everyone - Library, Queue and My Account - plus Settings for admins. The player is not one of them: it's a room fixture set up once from [Settings](#player-admin-only).

- [Status strip](#status-strip)
- [Library](#library)
- [Queue](#queue)
- [My Account](#my-account)
- [Settings (admin only)](#settings-admin-only)
- [Player](#player)

## Status strip

Once a player is in the room and you have something queued, a status strip appears at the top of every screen. It shows your place in the rotation, how long until your turn (counting down as the player plays), and the song you're up next with. When it's your turn it says so.

The strip also carries the pause key. Pausing keeps your songs in the queue but takes you out of the rotation, so the party moves on without you - useful for a drink run or a phone call. Press it again to resume and you're back in line. While paused, your rows show a pause icon instead of a wait time.

## Library

The library lists available songs organized by artist. The header has a search field with a star toggle that narrows the list to your starred songs, and tabs for browsing by **Artists** or **Songs**.

<div class="row">
  {{% img "app-library.png" "Library view" /%}}
  {{% img "app-library2.png" "Starred songs" /%}}
</div>

Tap an artist to expand it, then tap a song to queue it. Queued songs show `QUEUED` and go inert, and songs already sung tonight are dimmed - one tap is the only way to queue, so there's nothing to undo by accident.

Every song row also has a star, with the number of stars that song has across the room. Starring is how you keep a shortlist; the star toggle in the search row filters down to it.

Songs show their duration, and any tags in the filename's trailing `[...]` group appear next to the artist. When a song has multiple versions (media files), admins see an italicized number after the title, and media in the folder highest in the [Media Folders](#preferences-admin-only) list will be used.

## Queue

The queue view has three tabs:

- **Queue** - the room's rotation: the current song and everything still coming
- **Me** - your own upcoming songs, plus what you've sung
- **History** - what the room has sung tonight, newest first

<div class="row">
  {{% img "app-queue.png" "Queue view" /%}}
  {{% img "app-queue-history.png" "History tab" /%}}
</div>

KaraokeParty automatically manages the queue using a round-robin method for fairness, without penalizing those joining later in the party. For example, a latecomer will be able to sing right after the next-up singer regardless of how long the queue was when they joined. Singers who have [paused](#status-strip) are skipped until they resume.

Swiping left on a song reveals its available actions:

<table class="button-descriptions">
  <tbody>
  <tr>
    <td>
      <svg viewBox="0 0 24 24">
        <path d="M5 4v2h14V4H5zm0 10h4v6h6v-6h4l-7-7-7 7z"/>
      </svg>
    </td>
    <td>Top</td>
    <td>Moves the song to become the next one that user sings. Does *not* affect a user's place in the queue. Admins only, on the Queue tab.</td>
  </tr>
  <tr>
    <td>
      <svg class="danger" viewBox="0 0 24 24">
        <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8"/>
      </svg>
    </td>
    <td>Replay</td>
    <td>Restarts the current song from the beginning.</td>
  </tr>
  <tr>
    <td>
      <svg class="danger" viewBox="0 0 24 24">
        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
      </svg>
    </td>
    <td>Skip</td>
    <td>Skips the current song and plays the next one.</td>
  </tr>
  <tr>
    <td>
      <svg class="danger" viewBox="0 0 24 24">
        <path d="M14.12 10.47 12 12.59l-2.13-2.12-1.41 1.41L10.59 14l-2.12 2.12 1.41 1.41L12 15.41l2.12 2.12 1.41-1.41L13.41 14l2.12-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4zM6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6zM8 9h8v10H8z"/>
      </svg>
    </td>
    <td>Remove</td>
    <td>Removes an upcoming song.</td>
  </tr>
  </tbody>
</table>

Admins can manage anyone's queued songs, while standard users and guests can only manage their own. Replay and Skip act on the song that's playing right now. Songs already sung are locked and have no actions - use the Library to queue one again.

Signing out removes your upcoming songs from the queue.

### The Me tab

<div class="row">
  {{% img "app-queue-me.png" "The Me tab" /%}}
</div>

The Me tab is your own list. **Drag to reorder** your upcoming songs - the order among your songs is yours to set, while the rotation between singers stays automatic - and **swipe to remove** one. Below the list is a shortcut back to the Library and a **Sung Tonight** panel of your history, where each song can be starred.

## My Account

The My Account view lets you change your username, password, display name or picture, and sign out.

<div class="row">
  {{% img "app-account.png" "Account view" /%}}
</div>

Below that, **Song History** lists the songs you've sung with the date of each, and lets you star them. History is kept per song rather than per party, so it carries over from one night to the next and survives the library being re-scanned.

## Settings (admin only)

Admins get a fourth navigation entry with everything that configures the party: Rooms, Users, Player and Preferences.

<div class="row">
  {{% img "app-settings.png" "Settings view" /%}}
</div>

- [Rooms (admin only)](#rooms-admin-only)
- [Users (admin only)](#users-admin-only)
- [Player (admin only)](#player-admin-only)
- [Preferences (admin only)](#preferences-admin-only)

### Rooms (admin only)

The Rooms panel allows admins to create, edit or remove rooms.

KaraokeParty uses "rooms" to organize sessions by time and space (spacetime?) Users choose an open room when signing in, and each room has its own queue. **Don't re-use rooms** - create a new room before each session so that you start with an empty queue, then set the room to `closed` when finished.

<div class="row">
  {{% img "app-settings-room.png" "Room editor" /%}}
</div>

Rooms have a number of options, including:

- **Name**: The room name users will see when signing in (if more than one open room)
- **Password**: An optional password users will be required to enter when signing in
- **Status**: Rooms can have one of the following statuses:
  - `open` Can be signed in to and have songs queued
  - `closed` Can no longer be signed in to or have more songs queued. When closing, current occupants are unaffected and can continue playing through the existing queue
- **Users**: Only users with existing accounts can join a room by default. You can optionally allow users to join with new accounts and/or as guests
- **QR Code**: Displays a QR code in the room's player that will link users to the app, automatically choosing the room and optionally including the room's password if one is set

<aside class="warn">
  {{% icon-warn %}}
  <p>Removing a room will also remove its queue, so the history of songs played during that session will be lost.</p>
</aside>

### Users (admin only)

The Users panel allows admins to create, edit or remove users.

<div class="row">
  {{% img "app-settings-user.png" "User editor" /%}}
</div>

### Player (admin only)

The Player panel is the only place the player is managed from. It shows whether a player is connected to your room, and holds:

- **Open Player Here**: Opens the player in a new tab on the machine you're using. Do this on the system connected to your display and speakers.
- **Playback controls**: The room's transport (play/pause, skip and so on), shown once a player is connected.
- **Show Join Code**: Displays the room's QR code and link so singers can join from their phones.
- **ReplayGain (clip-safe)**: [ReplayGain](https://en.wikipedia.org/wiki/ReplayGain){{% icon-external %}} metadata tags allow the player to automatically minimize volume differences between songs, resulting in a better experience for all, and without affecting the dynamic range of each song (no compression). This option should generally only be enabled when you know all of your media is properly tagged. It normally reduces the player's overall volume significantly, so just turn your output up, and/or your mics down.
- **Display**: The player's display options - CDG size and alpha, MP4 alpha, video background keying, and the visualizer and its sensitivity.

<div class="row">
  {{% img "app-displayctrl.png" "Display options" /%}}
</div>

### Preferences (admin only)

The Preferences panel holds the **Media Folders** list. Add folders with [supported media files]({{< ref "docs/karaokeparty-server#media-files" >}}) to scan them into the library. You can re-arrange the folder order by dragging and dropping, and when songs have multiple versions the one in the folder highest in the list will be used.

## Player

The player is just another part of the app, and is designed to run fullscreen on the system handling audio/video for a [room](#rooms-admin-only). The latest versions of these browsers are officially supported:

  - Chromium/Chrome/Edge
  - Firefox
  - Safari

<div class="row">
  {{% img "app-player.jpg" "Player view" /%}}
</div>

To start a player, go to the system driving your audio, sign in to the desired room as an admin, and use **Open Player Here** in [Settings > Player](#player-admin-only). You can also navigate to `/player` directly.

Once a player is in the room, the transport and display options in that same panel become the room's controls. Between songs the player runs a short intermission - roughly fifteen seconds - that names and pictures the next singer, so they have time to get to the mic, and shows the room's join QR code while it waits.

<aside class="info">
  {{% icon-info %}}
  <p>Starting playback inside the player (rather than on a remote device) helps avoid browser auto-play restrictions. See the <a href="{{< ref "faq#enabling-autoplay" >}}">F.A.Q.</a> for more on how to enable auto-play in your browser.</p>
</aside>
