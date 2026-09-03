# Feature Backlog — KaraokeParty

Features we intend to build, with enough detail to start from. Sibling to
[competitive-features.md](competitive-features.md), which is a dated research
report on what competitors have; this file is the living list and includes
ideas of our own that no competitor ships.

Neither file is published — Hugo serves `docs/content/`.

**Status key:** `spec` needs design decisions resolved · `ready` can be picked up · `shipped`

---

## Shipped

- **Per-song key change** — queue metadata, Song Settings dialog on the Me tab, playback pitch shift, per-singer key memory. Was Tier 1 in the research report.
- **Reset a room for a new night** — Reset for New Night in the Edit Room dialog, admin-gated. Empties the room's queue, lifts its pauses, and clears the player's `historyJSON`. `songHistory` untouched. Rooms are now reusable across nights.

---

## Music Trivia

**Status:** spec · **Effort:** medium-high · **Source:** our own idea, no surveyed competitor ships it

Trivia rounds that take a turn in the rotation, so the party has something to
do between singers and quiet guests have a way to play. Questions come from the
[Open Trivia Database](https://opentdb.com/), music category.

### Intent

- A room setting turns trivia **on or off**.
- While on, a trivia round **sits in the queue like any other singer** and takes its turn in the rotation.
- While on, **there is always exactly one trivia round in the queue** — as one plays, the next is queued behind it.
- Guests answer on their phones through a **dialog with four coloured buttons: red, blue, green, purple**. The colours match the four answers shown on the player screen; the phone shows no text, only colour.
- A room setting sets the **question countdown** — how long an answer is open.
- The player screen shows a **scoreboard of everyone who has answered at least once**. Nobody who has not played appears.
- A room setting **resets the scores**.

### The API, verified

`GET https://opentdb.com/api.php?amount=5&category=12&type=multiple`

- Category **12** is `Entertainment: Music`. `type=multiple` returns exactly **one `correct_answer` and three `incorrect_answers`** — four total, which is where the four buttons come from. No API key.
- **Rate limit: one request per IP per five seconds** (response code 5). Fetching per question at speed will fail; fetch in batches.
- **Session tokens** stop repeats within a session. They expire after **six hours of inactivity**, and return code 4 once the category is exhausted, at which point the token must be reset. A long party can exhaust the music category.
- Responses are **HTML-entity encoded by default** (`&#039;`, `&quot;`). Pass `encode=base64` or `encode=url3986` rather than writing an entity decoder.
- Answers arrive **unshuffled** — `correct_answer` is a separate field, so the four must be shuffled before display or the answer is always in the same place.
- Content is **CC BY-SA 4.0**. Attribution to OpenTDB is a licence obligation, not a courtesy — it needs to appear on screen or in the docs.

### Open questions to settle before building

These are real conflicts with how the app is built today, not speculation.

1. **The palette has no blue, green or purple.** DECK is amber (`--vu`), teal (`--standby`) and red (`--alert`) on graphite. Red/blue/green/purple would be the first colours defined outside the token file, which `deck-rules.test.ts` fails the build for. Either four answer colours join the token file as a deliberate, tested addition, or the answers are distinguished some other way. Worth noting the design system's own instinct would be shape and position over colour.

2. **Colour alone is not an accessible mapping.** Roughly one in twelve men cannot separate red from green. Each answer wants a second channel — a shape, a numeral, or its position — carried identically on the phone and the screen.

3. **A queue row has no place for a non-singer.** `queue` is `queueId, roomId, songId, userId` with `userId` a NOT NULL foreign key to `users`, and every row joins to `media` for the player to load. A trivia round has no singer and no media. It needs either a reserved system user and a synthetic media type, or the queue needs a row type — the second is cleaner and more invasive.

4. **The rotation is keyed on `userId`.** `getRoundRobinQueue` spaces singers apart from one another. A trivia round must take a turn without counting as a singer whose turn was used, or trivia will distort whose turn is next.

5. **"Always one queued" needs a trigger.** Something has to re-queue after each round plays, and it has to be idempotent — two clients racing must not queue two rounds. The server is the only safe place for it.

6. **Parties run on a LAN and may have no internet.** The API is a live network call with a five-second rate limit. Questions must be prefetched and cached locally well ahead of use, with defined behaviour when the cache runs dry mid-party.

7. **Scores need somewhere to live.** Per room, per user, plus a reset. New table, and a decision on whether scores survive a room closing or the night ending.

8. **Who may answer?** Everyone in the room, or only people in the queue? Presumably everyone — that is the point of giving quiet guests something to do — but it decides whether answering requires a queue entry.

### Sketch of the work

- Room prefs: `isTriviaEnabled`, `triviaCountdownSeconds`, and a reset-scores action, alongside the existing per-room prefs.
- Server: a question cache with prefetch and a session token; queue insertion that keeps exactly one round pending; answer collection closed by the countdown; score tally per room.
- Player: a question screen with four answers and the scoreboard.
- Remote: the four-button answer dialog, opening when a round starts and closing when the countdown ends.

---

## Reset a room for a new night

**Status:** shipped · **Effort:** low · **Source:** our own idea

A button on the room that hands it back empty, so the same room can host more
than one night instead of a new one being created each time.

### Intent

- A **room setting** resets the room.
- Afterwards the room behaves like a new one: empty queue, nobody paused, and
  the whole library **selectable again**.

### How "played" works today, verified

Worth reading before building, because the obvious implementation resets the
wrong thing.

- A played song's library row is **disabled**, not hidden — `SongItem.tsx` sets `disabled={isUpcoming || isPlayed}`, so it renders greyed and cannot be tapped. That is the behaviour this feature switches off.
- `isPlayed` comes from `getSongsStatus`, which reads **`status.historyJSON`**: a JSON array of `queueId`s for the player's current session.
- That array is **not in the database**. `PlayerController` appends to it as each song plays and it rides to the room on `PLAYER_STATUS`. It lives in the running player and nowhere else.
- So this is a **command to the player**, like replay and next, not a database write. Reset means asking the player to empty the array and push its status.
- Replay already rewinds part of it: `PlayerController` splices the history back to the replayed `queueId`.
- **Because it is player state, closing or reloading the player already clears it.** This feature is a deliberate button for the same effect, and that is worth confirming is what is wanted — if the intent is for the reset to survive a player restart, the history has to move to the database first, which is a much larger change.

### The trap

There are two different things called history, and resetting the wrong one
destroys data a guest cares about.

| | What it is | Should this button touch it? |
|---|---|---|
| `status.historyJSON` | queueIds played in the player's current session; drives the library disabling | **Yes** — this is the feature |
| `songHistory` table | per user, per song, keyed on normalized artist/title; survives nights and library rescans; shown in **Sung Tonight** and on the Account view | **No** — this is a guest's personal record of everything they have ever sung |

### What the spec above got wrong

Both corrections came out of driving the built feature against a real library.

1. **Clearing the history does not re-open the library.** `SongItem` disables on `isUpcoming || isPlayed`, and a played song's queue row survives. Emptying `historyJSON` only flips the row from *played* to *upcoming* — still disabled, and now it plays again when its turn comes round. The spec traced the `isPlayed` path and missed the other half of the condition.

2. **The stated use is between nights, and there the history reset is a no-op.** Closing the player already empties `historyJSON`. What actually survives the night is the queue, which is why the docs used to say to create a room per session. Reuse needs the queue cleared, so that is what the button does.

### How it was settled

1. **What it does:** empties the room's queue, deletes its `queuePauses` rows, and commands the player to clear `historyJSON` — a room handed back in the state a new one arrives in. A pause left over from last night would silently keep a singer out of the rotation with nothing on screen to explain it, hence the second delete.
2. **Where the button lives:** the Edit Room dialog, next to Remove Room, labelled **Reset for New Night**. It targets a `roomId` rather than the sender's own room, so an admin can reset a room they are not signed in to — which is the between-nights case.
3. **Who may press it:** admins. `ROOM_RESET_REQUEST` checks `sock.user.isAdmin`, the same gate `ROOM_PREFS_PUSH_REQUEST` uses.
4. **Confirmed** with a `confirm()`, matching Remove Room and Remove User.

The queue is a database write pushed with `QUEUE_PUSH`; the played list is not in the database, so it takes a command — the player stamps `_lastHistoryResetTime` and `PlayerController` empties `historyJSON` and pushes its status, the same path a skip takes.
