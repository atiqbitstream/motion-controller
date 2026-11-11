
# Protocol reference

The messages between a game (its SDK) and the Motion Controller runtime, as `@motionctl/protocol` declares them. The JavaScript SDK, `libmotionctl` and the engine adapters speak this for you; read this to debug a session, or to write a client for another engine. Every message is a JSON object with a `type`. The same messages travel over every transport: a transport only frames and authenticates them.

Contents: [versioning](#versioning) · [transports and framing](#transports-and-framing) · [the session](#the-session) · [client to runtime](#client-to-runtime) · [runtime to client](#runtime-to-client) · [shared types](#shared-types).

## Versioning

- **The protocol: 1.** `HELLO` carries the client's `protocol`. The runtime serves its own version and the 2 before it (today only 1: there is none before it), and answers anything else with `VERSION_MISMATCH`. The number rises when a message changes meaning, never for an added optional field.
- **The event envelope: `schema` 1.** Additive changes keep the number; a removal or a changed meaning raises it.
- **Additive means a client ignores what it does not know:** an unknown field, an unknown event `family`, an unknown `SYSTEM` event, an unknown value of an open set (a descriptor's `validation`). Never fail on one.
- **The action map: `motionctl-actionmap/1`.** Its JSON Schema is [motionctl-actionmap-1.schema.json](motionctl-actionmap-1.schema.json).
- **Capabilities** are pinned in the action map as `id@^major`. Within a major version a capability's id and output names do not change; see the [capability catalogue](capabilities.md).
- **The support bundle: `motionctl-diagnostics/1`.**

## Transports and framing

| Transport | For | Where |
|---|---|---|
| In-process | Tests, and a page developed with the runtime beside it | `inProcessTransport(runtime)` |
| Loopback WebSocket | Web games and the development tools | `ws://127.0.0.1:<port>/v1/client` |
| Unix domain socket, named pipe on Windows | Native games, through `libmotionctl` | macOS `~/Library/Application Support/MotionController/motionctl.sock`; Linux `$XDG_RUNTIME_DIR/motionctl/<uid>.sock`, or `/tmp/motionctl-<uid>/motionctl.sock` without `XDG_RUNTIME_DIR`; Windows `\\.\pipe\motionctl-<user>` (not built yet) |

### The WebSocket

- A request is `{ "id": <number or string>, "msg": <client message> }`. Its answer is `{ "re": <the id>, "replies": [<runtime messages>] }`: every reply, in order, possibly none. Anything the runtime sends on its own (events, health, notices) is `{ "push": <runtime message> }`.
- The server listens on the loopback address only. A browser page is admitted by its `Origin`, from the runtime's allow-list (`MOTIONCTL_ALLOWED_ORIGINS` in development), and by nothing else. A native client sends no `Origin` and must add `?token=<token>` to the address.
- The port and that token are in the runtime's discovery file, `runtime.json` in its home folder, written fresh at every start and readable by the user alone: `{ "port", "token", "pid", "runtimeVersion", "startedAt" }`. In development the runtime prints its port.
- A malformed request (not `{ id, msg }` with a `msg.type`) is answered with `ERROR` `INVALID_STATE`. Close codes: 4400 (badRequest), 4401 (unauthorised), 4403 (forbidden), 4409 (replaced), 4429 (tooManyErrors); a message over 1 MiB closes with 1009.

### The socket (native clients)

- Every frame is a 4-byte big-endian length, then that many bytes. A frame over 1 MiB closes the connection before it is read.
- **The handshake** is the only plain frame each way. The client sends `{ "auth": { "nonceC": <32 random bytes, hex>, "entitlement"?: <the entitlement, base64> }, "msg": <HELLO> }`. The entitlement checked is this one, never one inside the `HELLO`. A refused `HELLO` is answered with `{ "replies": [<ERROR>] }` and the connection closes. Otherwise the runtime answers `{ "auth": { "sessionId", "nonceR": <32 bytes, hex>, "runtimeCert": <base64> }, "replies": [<WELCOME>, ...] }`.
- **The runtime proves it is the runtime:** `runtimeCert` is its Ed25519 signature over `nonceC ‖ sessionId` (bytes of the nonce, then the id's UTF-8). The client checks it against the runtime public keys built into it, and stops with `MC_ERR_AUTH` if it does not verify: a look-alike socket cannot pass as the runtime.
- **The session key:** `K = HKDF-SHA256(ikm = nonceC ‖ nonceR ‖ sessionId ‖ SHA-256(entitlement), salt = "motionctl/1", info = "session-key", 32 bytes)`, with 32 zero bytes for the hash when no entitlement was sent.
- **Every later frame** is `seq ‖ mac ‖ json`: `seq` 8 bytes big-endian, from 1 in each direction and each exactly one more than the last; `mac` the first 16 bytes of `HMAC-SHA256(K, seq ‖ json)`. A frame with a wrong number or MAC closes the connection, so a forged, replayed or reordered frame is refused. The JSON is the WebSocket's: `{ id, msg }` from the client, `{ re, replies }` and `{ push }` from the runtime.

### On every transport

- **A client that stops reading** does not grow the runtime's memory: past 1 MiB queued to it, pushes are dropped and counted, and when it has caught up it receives `SYSTEM` `overrun` with `lost`. Replies are never dropped. Event `seq` numbers show the gap too.
- **A connection that closes** closes its session: its held actions are released, as with `CLOSE`.

## The session

A connection says `HELLO` first; with `WELCOME` it is greeted. `OPEN_SESSION` opens a session from an action map; then the runtime pushes `EVENTS` each frame something happened, `HEALTH` once a second, and `SYSTEM` notices. `CLOSE` ends it. Several games may hold sessions; one at a time has the controller (its input) and the others wait (`SYSTEM` `focus`).

Errors are `ERROR` messages with `inReplyTo` the request's `type`; every code, its cause and its fix, is in [errors](errors.md). After `CLOSE` every message is answered with `DISCONNECTED`; a message `type` the runtime does not know, with `INVALID_STATE`. The codes:

`NOT_INSTALLED`, `NOT_RUNNING`, `VERSION_MISMATCH`, `UNAUTHORIZED`, `CAMERA_UNAVAILABLE`, `CAPABILITY_UNKNOWN`, `CAPABILITY_UNAVAILABLE`, `INVALID_ACTION_MAP`, `DISCONNECTED`, `INVALID_STATE`, `INVALID_CONFIGURATION`

`SYSTEM` events: `overrun`, `disconnected`, `reconnected`, `entitlement`, `camera`, `focus`.

| Message | Accepted | Answered with | Errors |
|---|---|---|---|
| [`HELLO`](#hello) | First, on every connection. | `WELCOME`; then `SYSTEM` `entitlement` when the entitlement has expired but is inside its offline grace (the game plays, and is told while there is time to refresh). | `VERSION_MISMATCH` (the message names both versions); `UNAUTHORIZED` with the reason in `detail` (`MISSING` when the runtime requires an entitlement and none was given; otherwise the verifier's, such as `EXPIRED`, `REVOKED`, `WRONG_APP`). |
| [`LIST_CAPABILITIES`](#list_capabilities) | After `HELLO`. | `CAPABILITIES`: every descriptor. | `INVALID_STATE` before `HELLO`. |
| [`OPEN_SESSION`](#open_session) | After `HELLO`. | `SESSION_OPENED`. If another game has the controller, a `SYSTEM` `focus` push follows: this session waits until it claims it with `SET_FOCUS`. | `INVALID_ACTION_MAP` (each problem in `detail`); `CAPABILITY_UNKNOWN` when the only problem is capabilities this runtime does not have (an optional one is listed in `unavailable` instead, and the session opens); `UNAUTHORIZED` (`WRONG_APP`: the map is for another app than the entitlement; or capabilities the entitlement does not cover, in `detail`); `INVALID_CONFIGURATION` for session options it does not offer; `INVALID_STATE` before `HELLO`. |
| [`SET_CONTEXT`](#set_context) | With a session open. | `CONTEXT_CHANGED`. The change stops what the new context does not list and resets what it keeps running (flight excepted: a player in the air flies on); every open action of either arrives as `canceled` at once, and a hold must be made again. Without the controller, the context is kept for when this game gets it (`active` is empty). | `INVALID_ACTION_MAP` for a context the map does not have; `INVALID_STATE` without a session. |
| [`INVALIDATE`](#invalidate) | With a session open and the controller. | `CONTEXT_CHANGED` with the new epoch. Events decided before it are dropped; everything running is reset, so with either scope every open action arrives as `canceled` at once, and a hold must be made again. | `INVALID_STATE` without a session or without the controller. |
| [`GET_STATE`](#get_state) | With a session open. | `STATE`: the snapshot. | `INVALID_STATE` without a session. |
| [`REQUEST_CALIBRATION`](#request_calibration) | With a session open and the controller, for a capability the map uses and that runs in the current context; or `base.environment` (the environment check) in any context. | `CALIBRATION` `started`, or `refused` with the reason (no flow, not used, not running now, another flow running). Progress and the end arrive as `calibration` events, the last with phase `ended`, `ok` and `message` (`CALIBRATION` is never sent with `progress` or `done`); the capability's actions are paused while it runs (the environment check pauses nothing). The environment check's verdict is in `HEALTH` (`health.environment`). | `INVALID_STATE` without a session or without the controller. |
| [`SET_FOCUS`](#set_focus) | With a session open. | Nothing. `true` takes the controller from whichever game has it; `false` hands it to the next game. Each game affected is told with a `SYSTEM` `focus` push. | `INVALID_STATE` without a session. |
| [`CLOSE`](#close) | Any time. | `SYSTEM` `disconnected`. Held actions are released; the connection can then be closed. | None. |
| [`GET_DIAGNOSTICS`](#get_diagnostics) | After `HELLO`. | `DIAGNOSTICS`: a support bundle. | `INVALID_STATE` before `HELLO`. |
| [`CONFIGURE`](#configure) | With a session open and the controller, for a capability the map uses that lists the document's format in `accepts`. | `CONFIGURED`. It lasts until the session ends. | `CAPABILITY_UNKNOWN` (the map does not use it); `INVALID_CONFIGURATION` (it accepts none, or the document is wrong: each problem in `detail`); `INVALID_STATE` when the capability cannot take it now (flight: the player is in the air), or without a session or the controller. |
| [`TK_HOLDING`](#tk_holding) | With a session open and the controller, for a map that uses `tk.manipulate`: when a hand takes hold in the game and when it lets go (at most `TK_HOLDING_PER_SECOND`, 20, a second per hand). | Nothing. From the next frame that hand's hold follows it: a grab that took nothing starts no hold, a take begins the hold at the grab it answered, a let-go ends it (after a `tkSlam`: the slam taken). It lasts while this game has the controller; when another game takes it, the runtime holds from every grab again. | `CAPABILITY_UNKNOWN` (the map does not use `tk.manipulate`); `INVALID_CONFIGURATION` (anything but `hand` `left` or `right` and `holding` true or false: each problem in `detail`); `INVALID_STATE` past the rate, or without a session or the controller. |

## Client to runtime

### HELLO

`Hello`

| Field | Type | | Meaning |
|---|---|---|---|
| `protocol` | `number` | required |  |
| `client` | `string` | required | The SDK and its version, for diagnostics only. |
| `appId` | `string` | required |  |
| `entitlement` | `string` | optional | The game's signed entitlement (a motionctl-entitlement/1 document). A release runtime needs one; a development runtime checks one if it is given. Over the socket transport it travels in the handshake instead, where it is also bound into the session key. |

### LIST_CAPABILITIES

`ListCapabilities`

No fields besides `type`.

### OPEN_SESSION

`OpenSession`

| Field | Type | | Meaning |
|---|---|---|---|
| `actionMap` | `ActionMap` | required |  |
| `options` | `SessionOptions` | optional |  |

### SET_CONTEXT

`SetContext`

| Field | Type | | Meaning |
|---|---|---|---|
| `name` | `string` | required |  |

### INVALIDATE

`Invalidate`: The game says the world changed under the player's hands: a new target, a cutscene, a respawn. The runtime drops anything decided before now and makes held actions start again from scratch, so a hold begun against the old world can never fire into the new one.

| Field | Type | | Meaning |
|---|---|---|---|
| `scope` | `'held' \| 'all'` | required |  |
| `reason` | `string` | optional | For the runtime's diagnostics log; not interpreted. |

### GET_STATE

`GetState`

No fields besides `type`.

### REQUEST_CALIBRATION

`RequestCalibration`: Run a guided calibration flow. `capability` names a capability of the session's map that has one (its descriptor's `calibration`), or `base.environment` (BASE_ENVIRONMENT): the base calibration's environment check, for any open session, whatever runs. It asks the player for a few seconds each of: nothing (the camera), a hand where they will play, a sweep of a comfortable area, a push toward the camera and back, and, when the map's capabilities need them, a closed hand carried sideways and both hands apart. The scan is kept in the player's profile and judged against what the running capabilities need, in health.

| Field | Type | | Meaning |
|---|---|---|---|
| `capability` | `string` | required | The capability to calibrate, or `base.environment` for the environment check. |

### SET_FOCUS

`SetFocus`

| Field | Type | | Meaning |
|---|---|---|---|
| `focused` | `boolean` | required |  |

### CLOSE

`Close`

No fields besides `type`.

### GET_DIAGNOSTICS

`GetDiagnostics`: Ask for a support bundle: what a developer attaches to a support ticket. Allowed after HELLO.

No fields besides `type`.

### CONFIGURE

`Configure`: Give a capability of the open session a document it accepts (its descriptor's `accepts`): flight's world. Allowed after OPEN_SESSION, for a capability the session's map uses; it lasts until the session ends. Flight takes it only while the player is on the ground. Nothing a game sends ever changes how motion is recognised.

| Field | Type | | Meaning |
|---|---|---|---|
| `capability` | `string` | required |  |
| `document` | `unknown` | required |  |

### TK_HOLDING

`TkHolding`: Telekinesis's one answer from the game: whether this hand holds something now. Send it when the game takes hold with that hand and when it lets go, not every frame (at most `TK_HOLDING_PER_SECOND` a second per hand), for a session whose map uses `tk.manipulate`, with the controller. From the first one, that hand's hold in the runtime follows the game's answer: a grab that took nothing starts no hold (so no release, slam or thrust follows it), a take begins the hold at the grab it answered, and a let-go ends it (after a `tkSlam`: the slam taken). A game that never sends it gets the runtime's own holds, from every grab until its release. It is one flag: never an object, a position, a threshold or anything else of the game's world, and it never changes how a motion is recognised.

| Field | Type | | Meaning |
|---|---|---|---|
| `hand` | `'left' \| 'right'` | required | The hand, as tk.manipulate's events name it. |
| `holding` | `boolean` | required | Whether that hand holds something in the game now. |

## Runtime to client

### WELCOME

`Welcome`

| Field | Type | | Meaning |
|---|---|---|---|
| `protocol` | `number` | required |  |
| `runtimeVersion` | `string` | required |  |
| `sessionId` | `string` | required |  |
| `clockOffsetUs` | `number` | required | Add this to a `tCapture` or `tDelivered` to read it on the client's own monotonic clock, in microseconds. The runtime measures it once at the handshake. |

### CAPABILITIES

`Capabilities`

| Field | Type | | Meaning |
|---|---|---|---|
| `descriptors` | `CapabilityDescriptor[]` | required |  |

### SESSION_OPENED

`SessionOpened`

| Field | Type | | Meaning |
|---|---|---|---|
| `actions` | `string[]` | required | The action names the runtime resolved, in the map's order. |
| `contexts` | `string[]` | required |  |
| `context` | `string` | required |  |
| `contextEpoch` | `number` | required |  |
| `unavailable` | `{capability: string; status: McError['status']}[]` | required | Optional capabilities the runtime does not have or cannot run now, with the reason. |

### CONTEXT_CHANGED

`ContextChanged`

| Field | Type | | Meaning |
|---|---|---|---|
| `name` | `string` | required |  |
| `epoch` | `number` | required |  |
| `active` | `string[]` | required | Capabilities active in the new context. |

### EVENTS

`Events`

| Field | Type | | Meaning |
|---|---|---|---|
| `batch` | `PublicEvent[]` | required |  |

### STATE

`State`

| Field | Type | | Meaning |
|---|---|---|---|
| `snapshot` | `ControllerState` | required |  |

### CALIBRATION

`Calibration`: The answer to REQUEST_CALIBRATION, and only that (the implementation spec's `REQUEST_CALIBRATION{kind}` → `CALIBRATION{status}`): `started`, or `refused` with the reason. A flow's progress and its end are `calibration` events: the last has phase `ended`, with `ok` and `message`. `progress` and `done` are never sent: they are kept in the type so existing clients that name them still compile.

| Field | Type | | Meaning |
|---|---|---|---|
| `capability` | `string` | required |  |
| `status` | `'started' \| 'progress' \| 'done' \| 'refused'` | required | `started` or `refused`. `progress` and `done` are reserved and never sent: the end of a flow is its last `calibration` event (phase `ended`). |
| `progress` | `number` | required | 0 in every answer: the progress is in the flow's `calibration` events. |
| `reason` | `string` | optional | Why it was refused, when it was. |

### HEALTH

`Health`

| Field | Type | | Meaning |
|---|---|---|---|
| `tracking` | `TrackingStatus` | required |  |
| `health` | `HealthStatus` | required |  |

### SYSTEM

`System`

| Field | Type | | Meaning |
|---|---|---|---|
| `event` | `SystemEvent` | required |  |
| `lost` | `number` | optional | How many events were lost, for `overrun`. |
| `detail` | `string` | optional |  |

### ERROR

`ErrorMessage`

| Field | Type | | Meaning |
|---|---|---|---|
| `error` | `McError` | required |  |
| `inReplyTo` | `ClientMessage['type']` | optional | The client message this answers, when it answers one. |

### DIAGNOSTICS

`Diagnostics`

| Field | Type | | Meaning |
|---|---|---|---|
| `bundle` | `DiagnosticsBundle` | required |  |

### CONFIGURED

`Configured`

| Field | Type | | Meaning |
|---|---|---|---|
| `capability` | `string` | required |  |
| `format` | `string` | required |  |

## Shared types

The parts the messages are made of, file by file.


### SessionOptions

What a session is sent besides its actions. Each is on unless the game turns it off. `rawGestures` (capability events not bound to an action) is not offered: this runtime has none, so asking for it is refused.

| Field | Type | | Meaning |
|---|---|---|---|
| `analogEvents` | `boolean` | optional | Analog events for axis actions, one per axis per frame it moved. The snapshot (GET_STATE) has the axes either way. |
| `stateEvents` | `boolean` | optional | `state` events for capabilities' runtime-owned state. The snapshot has the state either way. |
| `tracking` | `boolean` | optional | The runtime's HEALTH pushes (once a second). GET_STATE has the tracking either way. |
| `rawGestures` | `boolean` | optional | Not offered by this runtime; true is refused. |

### DiagnosticsBundle

A support bundle: versions, this session's map and context, the capabilities it uses, the health now and over the last minute, and the last events delivered. Never a frame, a landmark, an image or anything about how motion is recognised.

| Field | Type | | Meaning |
|---|---|---|---|
| `format` | `typeof DIAGNOSTICS_FORMAT` | required |  |
| `createdAt` | `string` | required |  |
| `runtimeVersion` | `string` | required |  |
| `protocol` | `number` | required |  |
| `client` | `string` | required |  |
| `appId` | `string` | required |  |
| `sessionId` | `string` | required |  |
| `session` | `{state: 'greeted' \| 'open' \| 'closed' \| 'new'; context: string \| null; contextEpoch: number; actions: string[]; contexts: string[]; unavailable: {capability: string; status: string}[]; eventsDelivered: number; eventsLost: number;}` | required |  |
| `capabilities` | `CapabilityDescriptor[]` | required | The descriptors of the capabilities the session's map uses (all of them before a session opens). |
| `health` | `{now: {tracking: TrackingStatus; health: HealthStatus}; history: {at: string; tracking: TrackingStatus}[]}` | required |  |
| `lastEvents` | `PublicEvent[]` | required | The last events delivered to this session, newest last (at most 50). |
| `privacy` | `string` | required | What the bundle never contains, said in it. |


### EventFamily

What kind of thing happened. A game may switch on this without knowing the capability.

- `'action'`: A bound action's button-like phase change (pressed, performed, released).
- `'analog'`: A continuous axis the runtime updates (aim). Coalesced to one event per axis per frame.
- `'tracking'`: Tracking state changed (the player left the view, tracking recovered).
- `'calibration'`: A calibration flow started, progressed or finished.
- `'system'`: The runtime itself (overrun, disconnected, reconnected, entitlement).
- `'state'`: A capability's runtime-owned state changed (R7: flight's mode, command, and its reference body). One event per capability per frame in which a value changed; `fields` holds every value, named as the descriptor's `state`, and `action` is the capability's id. Coalesced like `analog`.

### EventPhase

The phase of an action event. `canceled` means the action was open (started) and the runtime closed it without a natural end: the context changed, the capability was deactivated, or tracking was lost. A game must treat it as a release.

```ts
type EventPhase = 'started' | 'performed' | 'ended' | 'canceled';
```

### EventTrigger

Where a discrete action came from, when a capability offers more than one way to perform it.

```ts
type EventTrigger = 'pull' | 'hold';
```

### Vector2

| Field | Type | | Meaning |
|---|---|---|---|
| `x` | `number` | required |  |
| `y` | `number` | required |  |

### PublicEvent

| Field | Type | | Meaning |
|---|---|---|---|
| `schema` | `typeof EVENT_SCHEMA` | required |  |
| `seq` | `number` | required | Gap-free within one client session, from 1. A gap means the client lost events (the ring overran); the runtime also sends `system.overrun` when that happens. |
| `frameSeq` | `number` | required | The processed frame the event was decided in. Never decreases within a session. |
| `tCapture` | `number` | required | When the frame this event was decided in was captured, in microseconds on the runtime's monotonic clock (the handshake gives the offset to the client's clock). It is the frame's time, never a recogniser's internal stamp, so every event has a valid time. |
| `tDelivered` | `number` | required | When the runtime queued the event, same clock and unit. `tDelivered - tCapture` is the runtime's own latency. |
| `contextEpoch` | `number` | required | The value of the context epoch when the event was decided. A client may ignore it; the runtime drops stale events. |
| `player` | `number` | required | Which player the event belongs to. Always 1 in this version; reserved for local multi-player. |
| `family` | `EventFamily` | required |  |
| `capability` | `string` | required | The capability that produced it, as `id@majorVersion` (for example `pistol.trigger@1`). Empty for `system`. |
| `action` | `string` | required | The action map's name for what happened (`fire`, `reload`, `aim`), or the system event's name. |
| `phase` | `EventPhase` | required |  |
| `value` | `number` | required | 0..1 for a button-like action; the analog magnitude for an axis. |
| `vector` | `Vector2` | optional | Present for axis actions: the aim in the mirrored view, each component 0..1. |
| `confidence` | `number` | required | 0..1, the capability's own confidence in this event. |
| `trigger` | `EventTrigger` | optional | Present when the capability offers more than one way to perform the action. |
| `hand` | `'left' \| 'right' \| 'unknown'` | optional | Which hand performed it, when the capability knows. |
| `fields` | `Record<string, number>` | optional | The capability's own numbers for this event (an action's declared `fields`, or a `state` event's values), named as its descriptor declares them. Present only when the capability declares fields. |
| `message` | `string` | optional | On a calibration flow's last event (family `calibration`, phase `ended`): how it ended, in plain words, for the player ("Control area set.", or why nothing was changed). A game may show it. Never a device's name. Absent on every other event. |

### SystemEvent

```ts
type SystemEvent = (typeof SYSTEM_EVENTS)[number];
```


### TrackingState

How well the runtime can see the player.

- `'ok'`: Tracking at full rate.
- `'slow'`: Tracking, but below the rate the capabilities were validated at.
- `'stalled'`: The tracker is running but producing nothing (the camera stalled).
- `'lost'`: The player is not in view.
- `'off'`: No camera is open.

### TrackingStatus

| Field | Type | | Meaning |
|---|---|---|---|
| `state` | `TrackingState` | required |  |
| `fps` | `number` | required | Processed frames a second. |
| `latencyP95Ms` | `number` | required | Capture to delivery, 95th percentile, in milliseconds. |
| `hands` | `number` | required | How many hands are in view now. |
| `body` | `boolean \| null` | required | Whether the body is in view now, or null when body tracking is off. |
| `confidence` | `number` | required | 0..1: how sure the runtime is of what it is tracking. |
| `advice` | `string` | required | One sentence a game may show its player when the state is not `ok`. |
| `delegate` | `'GPU' \| 'CPU'` | optional | The inference delegate in use (GPU or CPU), when the camera is running. |
| `inferMsAvg` | `number` | optional | Inference time per frame since the tracker started, average, in milliseconds (the first, cold inference left out). |
| `inferMsP95` | `number` | optional | Inference time per frame since the tracker started, 95th percentile, in milliseconds. |
| `droppedFrames` | `number` | optional | Camera frames not tracked since the tracker started: replaced by a newer frame while the tracker was busy, or never handed to it. |
| `droppedPct` | `number` | optional | `droppedFrames` as a percentage of the frames the camera presented, 0..100. |
| `trackerRestarts` | `number` | optional | Times the tracker was recreated by itself (after repeated errors, or after 3 s without an answer) since the runtime started its camera page. |
| `camera` | `CameraStatus` | optional | The camera's own state and the runtime's camera permission, when the runtime knows them: why the state is `off` or `stalled`. |
| `resolution` | `{width: number; height: number}` | optional | The size of the pictures the camera delivers, in pixels, while it runs. When it is smaller than a running capability's `requires.minResolution`, health says so among its reasons. |

### CameraState

What the camera is doing, so a game can tell a refused permission from a missing or busy camera.

- `'ready'`: Open and delivering pictures.
- `'opening'`: Being opened.
- `'closed'`: Closed: no game needs it now.
- `'permission-denied'`: The runtime is not allowed to use the camera: the player declined, or the computer's privacy settings forbid it.
- `'no-camera'`: No camera is connected.
- `'in-use'`: Another program is using the camera.
- `'lost'`: It was open and went away (unplugged or taken); the runtime is reconnecting.
- `'failed'`: It could not be opened for another reason; `detail` says which.

### CameraStatus

| Field | Type | | Meaning |
|---|---|---|---|
| `state` | `CameraState` | required |  |
| `permission` | `'granted' \| 'denied' \| 'prompt' \| 'unknown'` | required | The runtime's camera permission as far as the platform tells: `prompt` = not asked yet; `unknown` = the platform does not say. |
| `detail` | `string` | required | One sentence a game may show its player. |
| `device` | `CameraDevice` | optional | Which camera is open, against the one the player chose in the runtime (never its name), once one is open. |

### CameraDevice

Which camera the runtime opened, against the player's choice. A camera's id can change when the computer restarts or on another system; its name then finds it.

- `'default'`: No camera was chosen: the computer's default camera is open.
- `'chosen'`: The chosen camera is open, found by its id.
- `'chosen-by-name'`: The chosen camera is open, found by its name (its id had changed).
- `'chosen-missing'`: The chosen camera is not connected: the computer's default camera is open instead.

### PrivacyStatus

The runtime's privacy self-check: run on the camera page and in its tracker worker each time the tracker starts, and every minute while it runs. Nothing the camera sees may leave the computer.

| Field | Type | | Meaning |
|---|---|---|---|
| `state` | `'passed' \| 'blocked' \| 'breach' \| 'unknown'` | required | `passed`: nothing was fetched from outside the runtime and the frames go only to this computer. `blocked`: something tried, the content policy refused it, nothing left. `breach`: something was reached outside the computer; the runtime stopped tracking and released the camera, and it will not open it again until it is restarted. `unknown`: the tracker did not answer the check (it is repeated). |
| `checkedAt` | `string` | required | When the check last ran (ISO 8601). |
| `external` | `string[]` | required | What was reached outside the runtime, at most 10 addresses. |
| `blocked` | `string[]` | required | What the content policy refused, at most 10 addresses. |
| `detail` | `string` | required | One sentence. |

### PlayerStatus

| Field | Type | | Meaning |
|---|---|---|---|
| `playerId` | `number` | required | Always 1 in this version. |
| `calibrated` | `boolean` | required | Whether this player has a calibration the active capabilities can use. |
| `profileName` | `string` | optional | The profile's display name, when it has one. |

### CalibrationStatus

| Field | Type | | Meaning |
|---|---|---|---|
| `running` | `string \| null` | required | Which capability is being calibrated now, or null. |
| `progress` | `number` | required | 0..1 through the running flow. |
| `needed` | `string[]` | required | Capability ids whose calibration is missing or stale. |
| `stale` | `string[]` | optional | Those of `needed` whose stored calibration no longer fits: it was made with another camera or resolution, or the lighting or the player's distance changed a lot since (health's `recalibrate` says which, in plain words). Present only when there are some. |

### HealthStatus

| Field | Type | | Meaning |
|---|---|---|---|
| `ok` | `boolean` | required | Whether the runtime as a whole is fit to play. |
| `reasons` | `string[]` | required | What is wrong, in plain words, when it is not. |
| `runtimeVersion` | `string` | required | The runtime's version, for a diagnostics screen. |
| `privacy` | `PrivacyStatus` | optional | The privacy self-check's last result, once it has run. A `breach` makes `ok` false and is among the reasons. |
| `environment` | `EnvironmentStatus` | optional | The environment check, while the camera is tracking for the game that has the controller: whether the room, the camera and where the player is suit what its running capabilities need, from the player's stored scan (`base.environment`) and what the camera shows now. When it fails, `ok` is false and its reasons are among `reasons`. |
| `recalibrate` | `RecalibrationNotice[]` | optional | The running capabilities whose stored calibration no longer fits the camera, its resolution or the room now, while the camera tracks for the game that has the controller: each with why, in plain words. Request their calibration again. Present only when there are some; each is also among `reasons` (so `ok` is false). A calibration made before the runtime recorded the camera and lighting it was made under is not judged. |
| `memory` | `MemoryStatus` | optional | Memory in use, in megabytes, for a diagnostics screen. |
| `notes` | `string[]` | optional | Things a game may show the player that do not make `ok` false: the runtime has no evidence they stop play. Today: the camera gives smaller pictures than a running capability was tested at (its descriptor's `requires.minResolution`, the size of every recording it was validated on; nothing shows it failing below). Present only when there are some. |

### RecalibrationNotice

| Field | Type | | Meaning |
|---|---|---|---|
| `capability` | `string` | required | The capability id. |
| `reasons` | `string[]` | required | Why its calibration no longer fits, in plain words ("the lighting changed a lot (brightness 120 then, 50 now)"). |

### MemoryStatus

| Field | Type | | Meaning |
|---|---|---|---|
| `runtimeMb` | `number` | optional | The runtime process's resident memory, in megabytes. |
| `cameraPageMb` | `number` | optional | The camera page's script memory in use, in megabytes, while the camera runs, where its browser engine reports it. |

### EnvironmentState

Where the environment check stands (HealthStatus.environment). The base calibration's first stage, requested as `base.environment`.

- `'ready'`: The stored scan meets what the running capabilities need, and the setup still looks as it did.
- `'not-ready'`: The stored scan does not meet it: the reasons say why (too dark, the hand not reliably in view, too close, ...).
- `'incomplete'`: Something the running capabilities need was not measured well enough: scan again (`missing` names the steps).
- `'changed'`: The camera, its resolution, the lighting or the player's distance changed a lot since the scan: scan again.
- `'no-hand'`: The scan is judged once the player's hand is in view: where the player is now is compared with it first.
- `'not-checked'`: This player has no scan: request `base.environment`.

### EnvironmentStatus

| Field | Type | | Meaning |
|---|---|---|---|
| `state` | `EnvironmentState` | required |  |
| `checkedAt` | `string \| null` | required | When the stored scan was made (ISO 8601), or null without one. |
| `advice` | `string[]` | required | What the player can do about it, one sentence each, in the runtime's words. Empty when there is nothing to do. |
| `missing` | `string[]` | required | For `incomplete`: the scan steps that would decide it (names from `BASE_ENVIRONMENT_STAGES`). |

### ControllerState

| Field | Type | | Meaning |
|---|---|---|---|
| `frameSeq` | `number` | required | The frame this snapshot describes. |
| `tCapture` | `number` | required | That frame's capture time, in microseconds on the runtime's clock. |
| `context` | `string` | required | The context the session is in now, and its epoch. |
| `contextEpoch` | `number` | required |  |
| `actions` | `Record<string, {active: boolean; value: number}>` | required | Every button and event action by name: is it active now, and how strongly. |
| `axes` | `Record<string, Vector2>` | required | Every axis action by name. |
| `tracking` | `TrackingStatus` | required |  |
| `player` | `PlayerStatus` | required |  |
| `calibration` | `CalibrationStatus` | required |  |
| `health` | `HealthStatus` | required |  |
| `focus` | `boolean` | required | Whether this client is the one the runtime is sending input to. |
| `capabilities` | `Record<string, Record<string, number>>` | optional | Each active capability's runtime-owned state, by capability id, when any keeps one (see `CapabilityDescriptor.state`). |


### Signal

What signals a capability needs from the tracker. The runtime, not the game, configures acquisition from these.

```ts
type Signal = 'hands' | 'body';
```

### Tier

How ready a capability is for a shipped game.

- `'ga'`: Shipped and supported; its id and event names will not change within a major version.
- `'preview'`: Usable, but its behaviour may still change between runtime versions. A game should not depend on it.

### ValidationNote

What a `ga` capability's validation rests on, when a game should know it is weaker than the rest. Today one value: `development-data`, validated on the recordings its definition was designed on, with no held-out recordings of its own yet (shown as "VALIDATED — DEVELOPMENT DATA"). Further values may be added; a client that does not know one shows it as it is.

```ts
type ValidationNote = 'development-data';
```

### FieldSpec

A named number a capability attaches to an event, or keeps as its runtime-owned state (R7). Numbers only, so every binding (JavaScript, C, C#, C++) carries them the same way: an enumeration is a number indexing `values`, a flag is 0 or 1. Additive to the envelope: a client that does not know a field ignores it.

| Field | Type | | Meaning |
|---|---|---|---|
| `name` | `string` | required |  |
| `kind` | `'number' \| 'enum' \| 'flag'` | required |  |
| `unit` | `string` | optional | For a number: its unit (`m`, `m/s`, `rad`, `torso/s`, `0..1`). |
| `values` | `string[]` | optional | For an enumeration: the names its values index, in order. |
| `description` | `string` | required |  |

### ActionSpec

A discrete output: something that happens and ends.

| Field | Type | | Meaning |
|---|---|---|---|
| `output` | `string` | required | The output's name, as an action map binds it (for example `pistolTrigger`). |
| `phases` | `('started' \| 'performed' \| 'ended')[]` | required | The phases it can report. A one-shot output reports only `performed`. |
| `directions` | `string[]` | optional | Present when the output distinguishes a direction (`up`, `left`, ...). |
| `triggers` | `('pull' \| 'hold')[]` | optional | Present when the capability can produce the output in more than one way. |
| `fields` | `FieldSpec[]` | optional | The numbers its events carry in `fields`, when it has any. |

### AxisSpec

A continuous output: something that has a value on every frame.

| Field | Type | | Meaning |
|---|---|---|---|
| `output` | `string` | required |  |
| `kind` | `'point' \| 'scalar'` | required | `point` is a 2-component position in the mirrored view, each component 0..1. |

### CapabilityRequirements

| Field | Type | | Meaning |
|---|---|---|---|
| `signals` | `Signal[]` | required |  |
| `hands` | `number` | required | How many hands must be in view for the capability to work. 0 = it reads the body only. |
| `minFps` | `number` | required | The lowest tracking rate the capability was validated at, in frames a second. |
| `minResolution` | `{width: number; height: number}` | optional | The smallest camera picture the capability was validated at, in pixels, where its validation recordings say (TARGET_CONTROLLER_ ARCHITECTURE layer A: a capability may declare `minFps`/`minResolution`). Absent: its recordings do not say. Health names a running capability whose minimum the camera does not meet. |
| `framing` | `string` | required | What must be in the picture, in plain words, for a game to tell its player. |

### ConfigField

A configuration value a game may set. The runtime declares the range it allows; a game never sees the recognition threshold behind it, and the runtime clamps anything out of range rather than failing.

| Field | Type | | Meaning |
|---|---|---|---|
| `name` | `string` | required |  |
| `kind` | `'number' \| 'boolean' \| 'enum'` | required |  |
| `min` | `number` | optional |  |
| `max` | `number` | optional |  |
| `options` | `string[]` | optional |  |
| `default` | `number \| boolean \| string` | required |  |
| `description` | `string` | required | One sentence a developer can read. |

### CapabilityDescriptor

| Field | Type | | Meaning |
|---|---|---|---|
| `id` | `string` | required | Stable, permanent once shipped, for example `pistol.trigger`. |
| `version` | `number` | required | Major version of the capability's public behaviour. An action map pins `id@^major`. |
| `family` | `'pointer' \| 'weapon' \| 'strike' \| 'locomotion' \| 'manipulation' \| 'other'` | required | What kind of input it is, for grouping in a tool. |
| `title` | `string` | required | A short human name for a chooser. |
| `emits` | `ActionSpec[]` | required |  |
| `provides` | `AxisSpec[]` | required |  |
| `state` | `FieldSpec[]` | optional | The capability's runtime-owned state, when it keeps one (flight: its mode, command, the reference body's position, velocity and heading). Sent as `state` events, one each frame it changed, and in the state snapshot. |
| `accepts` | `{format: string; description: string}[]` | optional | The documents a game may give this capability with CONFIGURE (versioned formats, such as flight's `motionctl-flight-world/1`: the walls and the flying box of the game's world). Never a threshold: how motion is recognised is not configurable. |
| `calibration` | `{stages: string[]; description: string}` | optional | The capability has a guided calibration flow (REQUEST_CALIBRATION). While it runs the session receives `calibration` events: `action` the capability's id, `value` the progress 0..1, and fields `stage` (an index into `stages`), `progress`, and, on the last (phase `ended`), `ok` (1: learned and kept in the player's profile). |
| `requires` | `CapabilityRequirements` | required |  |
| `tier` | `Tier` | required |  |
| `validation` | `ValidationNote` | optional | Present when the capability's validation is weaker than its tier suggests: `development-data` when any of its motions is validated on development data only (combat's grabs and claws). Absent otherwise. Additive: a client that does not know the field ignores it. |
| `config` | `ConfigField[]` | required |  |


### ActionKind

- `'button'`: Pressed and released, like a button: `started` then `ended`.
- `'event'`: One-shot: `performed` only.
- `'axis2'`: A 2-component position, updated every frame.

### ActionBinding

| Field | Type | | Meaning |
|---|---|---|---|
| `capability` | `string` | required | The capability, pinned as `id@^major` (for example `pistol.trigger@^1`). |
| `output` | `string` | required | Which of that capability's outputs drives this action. |
| `direction` | `string` | optional | Only this direction fires the action, when the output has directions. |
| `hand` | `'left' \| 'right'` | optional | Only this hand fires it. |
| `minConfidence` | `number` | optional | Below this confidence the runtime drops the event. 0..1. |
| `deadZone` | `number` | optional | An axis only: a movement smaller than this (in the view's 0..1 units) from what was last delivered is not passed on. Within the capability's declared limit (its descriptor's `config`, `deadZone`). Default 0. |
| `smoothingMs` | `number` | optional | An axis only: extra smoothing, a time constant in milliseconds. Within the declared limit (`smoothingMs`). Default 0. |
| `invertY` | `boolean` | optional | An axis only: the vertical component turned over (`y` becomes `1 - y`: up in the view gives down). Default false. |
| `sensitivity` | `number` | optional | An axis only: a scale on the distance from the view's centre (0.5, 0.5), each component then held to 0..1: 2 reaches the edge of the view with half the movement. Within the declared limit (`sensitivity`). Default 1. |
| `curve` | `'linear'` | optional | An axis only: the response curve on the distance from the centre, one of the declared options (`curve`). Default `linear`. |
| `holdMs` | `number` | optional | A button only, on an output that starts and ends: the action starts only once the input has been held this many milliseconds, and a shorter press is not delivered at all. Within the declared limit (`holdMs`). Default 0. |

### ActionDef

| Field | Type | | Meaning |
|---|---|---|---|
| `name` | `string` | required | The game's own name, which comes back on every event. |
| `kind` | `ActionKind` | required |  |
| `from` | `ActionBinding[]` | required | One or more sources. Several bindings on one action are alternatives (trigger pull or hold-to-fire). |

### ContextDef

A named game state and the capabilities that may run in it. Switching context is how a game turns recognition on and off: everything not listed is deactivated, its open actions are closed, and held actions start afresh.

| Field | Type | | Meaning |
|---|---|---|---|
| `name` | `string` | required |  |
| `capabilities` | `string[]` | required | Capability ids (unpinned, as in `requires`) that run in this context. |

### ActionMap

| Field | Type | | Meaning |
|---|---|---|---|
| `schema` | `typeof ACTION_MAP_SCHEMA` | required |  |
| `appId` | `string` | required | The game's identifier, for entitlements and diagnostics. |
| `requires` | `string[]` | required | Capabilities the game cannot run without. A missing one fails OPEN_SESSION. |
| `optional` | `string[]` | optional | Capabilities the game uses when present. A missing one is reported, and the session still opens. |
| `actions` | `ActionDef[]` | required |  |
| `contexts` | `ContextDef[]` | required |  |
| `initialContext` | `string` | required | The context the session starts in. Must name one of `contexts`. |


### McStatus

```ts
type McStatus = (typeof MC_STATUS)[number];
```

### McError

Every failure a client sees: a code it can switch on, and a sentence it may show a person.

| Field | Type | | Meaning |
|---|---|---|---|
| `status` | `Exclude<McStatus, 'OK'>` | required |  |
| `message` | `string` | required |  |
| `detail` | `string[]` | optional | The action-map entries or capability ids the failure is about, when it is about some of them. |
