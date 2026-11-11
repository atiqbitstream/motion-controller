

# Errors

Every failure a game can see has a code it can switch on and a sentence it may show a person. The JavaScript SDK throws `MotionControllerError` with `status`; the C library returns an `mc_status` (its message is in `mc_last_error`); Unity and Unreal surface the same through their status text.

| Protocol status | C | What it means | What to do |
|---|---|---|---|
| `NOT_INSTALLED` | `MC_ERR_NOT_INSTALLED` | No Motion Controller runtime is installed on this machine. | Show the player `mc_install_url()` (or ship the bootstrapper with your installer). |
| `NOT_RUNNING` | `MC_ERR_NOT_RUNNING` | The runtime is installed but not running. | Ask the player to start it; it normally starts at login. Retry `connect` after a few seconds. |
| `VERSION_MISMATCH` | `MC_ERR_VERSION` | Your SDK speaks a protocol version outside what this runtime supports. | Update the SDK in your game, or ask the player to update the runtime; the message names both versions. |
| `UNAUTHORIZED` | `MC_ERR_ENTITLEMENT` | No valid entitlement for your app id, or your action map uses a capability it does not cover. The error detail names the reason (MISSING, EXPIRED, REVOKED, WRONG_APP, ...). | Ship your current entitlement with the game and present it at connect; check the app id in the action map matches it. |
| `CAMERA_UNAVAILABLE` | `MC_ERR_CAMERA` | The runtime could not open a camera: none connected, another application has it, or permission was refused. | Tell the player what the health advice says; the runtime keeps trying when a camera appears. |
| `CAPABILITY_UNKNOWN` | `MC_ERR_CAPABILITY_UNKNOWN` | Your action map names a capability this runtime does not have (a newer one, or a typing error). | Check the id against `capabilities()`; list capabilities a game can play without under `optional`. |
| `CAPABILITY_UNAVAILABLE` | `MC_ERR_CAPABILITY_UNAVAILABLE` | The capability exists but cannot run now (for example its body tracking is off). | Retry later, or make it `optional` and play without it. |
| `INVALID_ACTION_MAP` | `MC_ERR_INVALID_ACTION_MAP` | The action map is malformed or contradicts itself; the error detail lists each problem. | Fix each listed problem; validate the map in Controller Studio first. |
| `DISCONNECTED` | `MC_ERR_DISCONNECTED` | The session is closed or the connection dropped (the runtime stopped or restarted). | Reconnect (the JS SDK's `reconnect()`; the engine adapters retry by themselves); held actions were released. |
| `INVALID_STATE` | `MC_ERR_BUSY` | The message is not allowed now: before HELLO or OPEN_SESSION, or another game already has the controller. | Open your session first; if another game is playing, close it. |
| `INVALID_CONFIGURATION` | `MC_ERR_INVALID_CONFIGURATION` | A CONFIGURE document the capability does not accept: the wrong format, a part it does not know, or geometry that cannot be flown in; the error detail lists each problem. | Fix each listed problem; check the capability's `accepts` in the catalogue. |

## C-only codes

| C | What it means | What to do |
|---|---|---|
| `MC_OK` | Success. | — |
| `MC_ERR_AUTH` | The runtime failed to prove itself (its signature is not one this library trusts), or a frame failed authentication. | Something other than the genuine runtime answered on the socket, or the library is a build for another key: install the official runtime; do not continue the session. |
| `MC_ERR_INVALID_ARG` | A null pointer or an impossible argument was passed. | Check the call. |
| `MC_ERR_INTERNAL` | Something unexpected in the library or the runtime (out of memory, a malformed reply). | Attach `mc_diagnostics_dump` to a support ticket. |
| `MC_ERR_TIMEOUT` | The runtime did not answer in time. | Retry; if it persists the runtime may be stuck: ask the player to restart it. |
