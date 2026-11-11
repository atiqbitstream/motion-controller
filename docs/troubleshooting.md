# Troubleshooting

## First: is it the runtime or the game?

Run the C SDK's `hello_motion` example with your action map and licence (see [Quick start: C](quick-start-c.md)), or open Unity's *Window > Motion Controller* panel, and make the movement.

- **The action appears there:** the runtime is fine, and the problem is in the game's integration (its action map, context or binding).
- **It does not appear:** look at the health and its advice.

## The health tells you what the player should do

| Tracking | What it means | What to show |
|---|---|---|
| `ok` | Tracking at the expected rate | Nothing |
| `slow` | Fewer frames than the capabilities need | The advice (often: more light, close other camera apps) |
| `stalled` | No tracking results; also when the camera was lost (unplugged or taken by another application), while the runtime reopens it | The advice, and that it is reconnecting |
| `lost` | No player in view | The advice ("Step back so your head and shoulders are in the picture") |
| `off` | No game needs the camera; or it could not be opened (see `tracking.camera`) | Nothing; or the advice |

`health.environment.state` `not-ready` or `changed`: show its `advice` (the reasons are in `health.reasons`); for `changed`, `incomplete` or `not-checked`, offer the setup check (`requestCalibration('base.environment')`). A pointing game whose players are told the screen is out of reach: offer `pistol.aim`'s calibration too.

`health.recalibrate` lists a capability: its stored calibration was made under another camera, resolution or lighting (or, for the pistol's aim, at another distance); show its reasons and offer `requestCalibration` for it. A reason that the camera gives pictures smaller than a capability was tested at: the player's camera delivers less than 1280x720 (`tracking.resolution`); a better camera, or the same camera at its full resolution, clears it. `tracking.camera.device` `chosen-missing`: the camera chosen in the Motion Controller is not connected and the computer's default is used.

When the state is `off` or `stalled`, `tracking.camera.state` (when the runtime sends it) says why: `permission-denied` (show the advice: the player allows the camera for the Motion Controller in the computer's privacy settings), `no-camera`, `in-use` or `failed`. `health.privacy.state` `breach` means the runtime stopped tracking because something left the computer: the player restarts the runtime, and if it happens again, reinstalls it (attach a support bundle).

## No events arrive

- **The capability is not in the current context.** Check `setContext` and the map's contexts. A capability outside the context does not run.
- **You did not drain.** Handlers run during `drain()`, once per frame.
- **The action map's output name is wrong.** Opening the session fails with `INVALID_ACTION_MAP` listing it.
- **The capability is optional and unavailable.** Read `unavailable` in the open result.
- **Events arrived before an `invalidate` and were dropped on purpose.** Every event carries its `contextEpoch`.

## Gaps in `seq`

The game did not drain often enough and the runtime's queue overran. A `system.overrun` notice says how many events were lost. Drain every frame.

## The wrong hand

When the hand layer is not sure which hand is which (the hands crossed, or the body is out of view), flight's `sidesCertain` and a snap's `certain` are 0. Do not act on the side then.

A known limitation: with no body in view and no earlier assignment, the sides come from the hand tracker's own labels, which in recorded sessions were most often the opposite of the player's sides. Those frames are always marked uncertain.

## Disconnections

The runtime restarted or stopped:

- **Unity:** the bridge and `MotionInput` reconnect by themselves.
- **C:** `mc_reconnect` restores the map and context.

Everything held is released on a disconnect.

## The runtime refuses the game

`MC_ERR_ENTITLEMENT` (Unity: "The runtime refused this app id") means the licence is missing, for another app id, or expired. The message says which. Check that the action map's `appId`, the bridge's App Id and the licence's app id are the same.

## Errors

Every code has a meaning and a fix: [errors](errors.md).

## Asking for help

[Open an issue](https://github.com/atiqbitstream/motion-controller/issues/new) and attach a support bundle: `Diagnostics()` in Unity or `mc_diagnostics_dump` in C. It holds versions, the session, health over the last minute and the last events. It never holds a frame, an image or a landmark.
