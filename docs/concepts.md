# Concepts

## The runtime

One runtime per machine, shared by every game. It holds the camera permission, opens the camera only while a game has a session (and releases it 30 s after the last one ends), recognises motion in its own process, and serves games over a local connection:

- **Native games** (C, Unity, Unreal) use an authenticated Unix domain socket. The runtime proves itself with a signature the library checks, and every frame is authenticated.
- **Web games** use a loopback WebSocket, admitted by origin.

Your game never sees a camera frame, a landmark, a threshold or how anything is recognised.

## Sessions

`connect` says HELLO: your app id, your SDK, and your entitlement (a signed licence file; a release runtime refuses a game without one). `open(actionMap)` opens the session. One game drives the controller at a time.

The session ends with `close`, or when the connection drops. Everything held is then released: a game must treat a `canceled` phase as a release.

### What a session is sent

Besides its actions, a session is sent analog events (aim), capabilities' state events and the health once a second. Each can be turned off when you open the session, and the snapshot has everything either way:

- **JavaScript:** `open(map, { analogEvents: false, stateEvents: false, tracking: false })`.
- **C:** `mc_session_opts.deliver_off` with `MC_DELIVER_NO_ANALOG`, `MC_DELIVER_NO_STATE` and `MC_DELIVER_NO_TRACKING`.

`rawGestures` (capability events not bound to an action) is not offered: bind the outputs you need as actions.

## Capabilities

What the runtime can recognise, each with a permanent id and a major version: `pistol.trigger@1`, `flight.fly@1`, `climb.reach@1`.

- `capabilities()` lists them with what they emit, what they provide continuously, the numbers their events carry, their runtime-owned state, what they need from the camera, and their tier.
- `ga` capabilities are validated; `preview` ones work but may change. A `ga` capability whose validation rests on development data only (the recordings its definition was designed on, with no held-out recordings yet) says so in its descriptor's `validation` (`development-data`): today combat's grabs and claws. Show it to your testers as "validated, development data".
- The [catalogue](capabilities.md) lists them all.

## The action map

Your game's own vocabulary, mapped to capabilities: a JSON document (`motionctl-actionmap/1`) you write once.

- **Actions.** Each has a name and a kind:
  - `button`: held while the motion lasts, phases `started` and `ended`;
  - `event`: a one-shot, phase `performed`;
  - `axis2`: a position in the mirrored view, 0..1 each way.

  Each action is bound to a capability's output (`{ "capability": "pistol.trigger@^1", "output": "pistolTrigger" }`).
- **`requires` and `optional`.** A required capability the runtime lacks fails the session (`CAPABILITY_UNKNOWN`). An optional one is left out and reported in `unavailable`, and its actions simply never fire.
- **Contexts.** Which capabilities run when (`menu`, `round`, `sky`), with `initialContext`. Switch with `setContext`. A capability that is not in the current context does not run at all, and its held actions arrive as `canceled`. One the new context keeps running starts afresh too: what it held arrives as `canceled`, and a hold must be made again (flight excepted: a player in the air flies on).

### Shaping an aim

An axis binding may add a dead zone and smoothing to the position it is given: `{ "capability": "pistol.aim@^1", "output": "aim", "deadZone": 0.02, "smoothingMs": 80 }`. The limits are in the capability's descriptor (`config`; for an aim: dead zone up to 0.05 of the view, smoothing up to 200 ms), and a map outside them is refused. They shape what your game receives; how the aim is recognised does not change.

It may also turn and scale the position: `"invertY": true` turns the vertical over (`y` becomes `1 - y`), `"sensitivity": 1.5` scales the distance from the centre of the view (0.5 to 2; the result is held to 0..1, so at 2 half the movement reaches the edge), and `"curve"` names the response curve (`linear`, the one there is). These come first; the dead zone and smoothing then work on what they give, in the units your game receives. A locked aim (`tk.arm-aim`) takes none of them, and its dead zone and smoothing are 0.

### Holding a button

A button binding on an output that starts and ends may ask for a hold: `{ "capability": "hand.pose@^1", "output": "fist", "holdMs": 500 }`. The action starts only once the input has been held that long (up to 2000 ms), in the first frame that reaches it; a shorter press is not delivered at all, neither its start nor its end. The release arrives as the engine reports it. While the hold is waiting the action is not active in the state, and a context change or `invalidate()` forgets it without sending anything, because your game never saw it start. Once started, it closes as any held action does (`ended`, or `canceled`). An output that happens once has nothing to hold, and a map that asks for one is refused.

## When the world changes: invalidate

Call `invalidate()` when the world changes under the player's hands: a new target, a respawn. Nothing decided before that moment is delivered, whatever is held arrives as `canceled`, and a hold must be made again. That stops an aim begun against the old target from firing at the new one.

Every event carries the `contextEpoch` it was decided in.

## Events

Each event has an envelope:

- `seq`: gap-free per connection. A gap means events were lost, and a `system.overrun` notice says how many.
- `tCapture`: when the camera frame was captured, on the runtime's clock in microseconds.
- `tDelivered`: when the runtime queued it.
- `family`: `action`, `analog`, `state`, `tracking`, `calibration` or `system`.
- `capability`, `action`, `phase`, `value`, `confidence`.
- Optional `vector` (a position), `hand` and `trigger` (`pull` or `hold`).

Drain events once per game frame (`drain()`; `mc_drain_events`). An event family your SDK version does not know is passed through or skipped, never mistaken for something else.

## Fields and runtime-owned state

Some capabilities give more than a press:

- **Event fields.** Named numbers on their events, declared in the descriptor. Flight's `flightCommand` carries `command`; `flightImpact` carries its intensity and position. A climbing reach carries the arm's direction, its outward `speed` and whether it went out to the side.
- **Runtime-owned state.** Sent as `state` events when it changes, and kept in the state snapshot. Flight's `state`, `command`, `x`, `y`, `z`, `vx`, `vy`, `vz`, `heading`, `takeoff`, `leftHand`, `rightHand` and `sidesCertain` are one example; walking's `stride`, `intensity`, `speed` and `reason` (why the player is not walking, for a hint) another.

Fields are numbers only. An enumeration is an index into the descriptor's `values`, and a flag is 0 or 1. Read them with:

- JavaScript: `e.fields` and `onState(capability, fn)`;
- C: `mc_event_field` and `mc_event_fields`;
- Unity: `TryGetField`, `CapabilityState`;
- Unreal: `GetCapabilityState`, `GetActionField`.

**Flight's physics is the runtime's.** Flight's position, velocity and altitude come from a reference physics the runtime runs. Your game may follow it, or use the commands with its own physics. Nothing your game does feeds back into the recognition.

## Which hand is which, and how sure

The runtime matches the tracked hands to the player's left and right by the body's wrists. When the evidence is ambiguous (the hands crossing, or no body in view), it keeps the previous assignment and says it is **uncertain**: flight's `sidesCertain` is 0, and a snap's `certain` is 0.

When the sides are uncertain, do not act on which hand did something: a one-handed booster's side, or a left-hand-only spell. A hand the tracker loses is never reused: its side is empty from the first frame it is lost.

## Health

The runtime pushes its health once a second:

- **Tracking state:** `ok`, `slow`, `stalled`, `lost` or `off`.
- **Numbers:** fps and latency; while the camera runs, also inference time (`inferMsAvg`, `inferMsP95`), dropped frames (`droppedFrames`, `droppedPct`), how often the tracker restarted itself (`trackerRestarts`) and the size of the pictures the camera delivers (`tracking.resolution`); and memory (`health.memory`: the runtime's, and the camera page's where its engine reports it, in MB). These are optional: an older runtime does not send them.
- **Resolution below a capability's minimum:** a capability may declare the smallest picture its recordings were made at (`requires.minResolution`; today the pistol's four and the hand poses and gestures, 1280x720). A smaller picture puts a note in `health.notes` naming them; `ok` stays true, because that size is where they were tested, not a measured limit. They still run.
- **Advice:** a sentence you may show the player ("Step back so your head and shoulders are in the picture").
- **The camera** (`tracking.camera`, optional): its state and the runtime's camera permission, so you can tell why tracking is `off` or `stalled`: `permission-denied` (the player or the computer's privacy settings refused the camera; the player has to allow the Motion Controller there), `no-camera`, `in-use` (another program has it), `lost` (unplugged; reconnecting), `failed`, or `ready`, `opening`, `closed`. `permission` is `granted`, `denied`, `prompt` or `unknown`. Its `detail` is the advice in those cases. `device` says which camera is open against the one the player chose in the Motion Controller: `default` (none chosen), `chosen`, `chosen-by-name` (found by its name: its id changed after a restart), or `chosen-missing` (not connected: the default is used). The camera's name never reaches your game.
- **Privacy** (`health.privacy`, optional): the runtime checks, each time the tracker starts and every minute, that nothing the camera sees leaves the computer. On a `breach` it stops tracking, releases the camera and keeps it closed until it is restarted; `ok` is then false with the reason.
- **The environment** (`health.environment`, optional, while the camera tracks for the game with the controller): the player's stored setup check (see [the environment check](#the-environment-check)) judged against what your running capabilities need, and against what the camera shows now. `state` is `ready`, `not-ready` (the reasons say why, in plain words: too dark, the hand not reliably in view, too far, out of reach), `changed` (another camera, or the lighting or the player's distance far from the check's: check again), `incomplete` (something needed was not measured well enough: check again; `missing` names the steps), `no-hand` (it is judged once a hand is in view) or `not-checked` (no check yet). `advice` is what the player can do. `not-ready` and `changed` make `ok` false, with their reasons among `reasons`; `not-checked` changes nothing.

A lost camera is reported as `stalled` with that reason, and the runtime reopens it by itself when it can. When the player allows the camera after refusing it, the runtime opens it again where the platform reports the change; otherwise (macOS usually asks for the app to be reopened) the next session opens it.

## Calibration

`requestCalibration(capability)` asks the runtime to run a capability's guided calibration. Which capabilities have one is in the catalogue: a descriptor's `calibration` lists its stages. Today: walking (`locomotion.walk`), about a minute: stand, walk in place, run in place, then a smaller run; the pistol's aim (`pistol.aim`), the player's control area, about ten seconds: the hand held still at the centre and at the four edges of a comfortable reach; the bow's straight ahead (`archery.aim`), one arrow; the arms' straight ahead (`tk.arm-aim`), each arm held still in turn.

- **Asking:** the capability must be in your map and running in the current context. The answer (`CALIBRATION`) is `started`, or `refused` with the reason (no flow, not running now, one already running). It is the only `CALIBRATION` message a flow gets: its progress and its end are events.
- **While it runs:** the session receives `calibration` events. Each has `action` (the capability's id), `value` (the progress, 0..1) and the fields `stage` (an index into the descriptor's stages: show the player what to do) and `progress`. The capability's own actions are paused.
- **At the end:** a last event (phase `ended`), and nothing else: no `CALIBRATION` message follows (its type's `progress` and `done` are reserved and never sent). It carries `ok`, and `message`: how it ended in a sentence you may show the player ("Control area set.", or why nothing was changed; older runtimes send none). When `ok` is 1, what it learned is kept in the player's profile and used from then on, in this session and later ones. Its `stage` is the last stage: for the pistol's aim it says how it ended (`done`, `done-with-warnings`, or why nothing was changed: `box-too-small`, `not-held-still`, `not-far-enough`, `hand-not-seen`, `cancelled`).
- **Cancelling:** switch to a context where the capability does not run; nothing is changed.

The snapshot's `calibration` says what is running, its progress, and which active capabilities need calibrating (`needed`): those with a flow but nothing learned yet, and those whose calibration no longer fits (`stale`): it was made with another camera or resolution, or the lighting or the player's distance (the pistol's aim only) changed a lot since. While the camera tracks for your game, health lists the latter in `health.recalibrate`, each with its reasons in plain words, and among `health.reasons` (so `ok` is false): ask for that calibration again. A calibration made before the runtime recorded these (before 10 November 2026) is not judged.

### The environment check

`requestCalibration('base.environment')` (`BASE_ENVIRONMENT`) checks the room, the camera and where the player is: the first stage of the base calibration. It calibrates no capability, so it may be asked in any context and pauses nothing. It asks the player, a few seconds each, for: nothing (the camera), a hand raised where they will play, a sweep of a comfortable area, a push toward the camera and back, and, when your map's capabilities need them, a closed hand carried sideways and both hands held apart. A step that needs a hand waits (up to 15 s) until one is in view; the sweep, the push and both hands go on (up to 15, 12 and 10 s) until the movement covers what is needed.

- **Events:** `calibration` events with `action` `base.environment`; `stage` indexes `BASE_ENVIRONMENT_STAGES` (`camera`, `hands`, `reach`, `depth`, `carry`, `two-hands`, then how it ended: `ready`, `not-ready`, `incomplete`, `cancelled`); the field `waiting` is 1 while a step waits for the hand it asks for. Show the player what the stage asks.
- **What it is judged against:** what the capabilities need, never a number of yours. The pistol's capabilities and archery's carry what the runtime knows those games need (one hand pointing, the fingers resolvable, a second hand now and then for the pistol's reload; both hands and room to hold them apart for archery); hand poses and gestures, the defaults. Capabilities that read the body (combat, walking, climbing, flight, the arena's telekinesis, the ghost hands, the snap, the rifle) are judged on the camera alone: its frame rate, its regularity and the lighting. The scan covers every context of your map; health judges what runs now.
- **At the end:** the check is kept in the player's profile whatever it found (`ok` 1; `cancelled` keeps nothing), and health judges it from then on, in this session and later ones. Whether the screen can be reached is judged with the player's control area if they have one (`pistol.aim`'s calibration), else the runtime's own: run both for a pointing game.

## Support

`diagnostics()` (C: `mc_diagnostics_dump`) returns a support bundle: versions, the session, the capabilities it uses, a minute of health and the last 50 events. It never contains a frame, an image or a landmark.
