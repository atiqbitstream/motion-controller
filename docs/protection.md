# What the runtime protects, and what it does not

The Motion Controller runtime is built so that recognising motion stays inside it. This page says plainly how far that goes. It raises the cost of taking the recognition logic. **It does not make taking it impossible**, and nothing in this SDK claims otherwise.

## What it protects

- **The recognition logic never runs in your game.** It runs in the runtime's own process. Your game receives derived events (actions, axes, fields, state) and never the camera's frames, the tracker's points or how a motion is recognised. No SDK, adapter or message contains recognition code.
- **The camera belongs to the runtime.** Your game never opens it and never asks the player for permission. The runtime's camera page allows outside connections to nothing, and the runtime needs no microphone.
- **Support bundles stay clean.** `diagnostics()` returns versions, the session, health and recent events. It never contains a frame, an image, a landmark or anything about recognition.
- **Native games talk to the genuine runtime.** Over the socket, the runtime proves itself with an Ed25519 signature that `libmotionctl` checks against keys built into it, so a look-alike runtime is refused (`MC_ERR_AUTH`). Every later frame carries a sequence number and a MAC, so a forged, replayed or reordered frame closes the connection. The socket sits in a folder only the user can open. The [protocol reference](protocol.md) has the details.
- **Licences are checked offline, with public keys only.** The licence service's signing key never ships in the runtime or your game. An entitlement is signed for your app id and the capabilities it covers. It has a validity window with an offline grace period, and later entitlements retire earlier ones.
- **The installed runtime is locked down.** It cannot be started as plain Node, takes no debugger or `NODE_OPTIONS`, loads its code only from its own archive, and checks that archive against the hash recorded when it was built. A changed archive does not start.
- **What the runtime loads is pinned.** Updates are accepted only when signed by a threshold of release keys. They are never older than what is installed, and the artifact must match its published length and hash. Every model and the WASM runtime are pinned by hash and size, and a mismatch is refused.
- **Player profiles are sealed on disk.** A player's calibration is encrypted at rest (AES-256-GCM), with a key from the platform's secret store in the desktop shell, or else in a key file only the user can read. One player's file cannot pass as another's.

## What it does not protect

- **The machine's owner can read the runtime.** Someone who controls the computer can read the runtime's code and run it without the entitlement check. Bytecode and a native port, both later, would make that harder, not impossible.
- **Licences stop casual copying, not a determined attacker.** They keep one game's licence from being used by another game. They do not stop someone on their own machine who sets out to bypass them.
- **A licence can be copied out of a shipped game.** It is tied to your app id, not to a machine, so someone who copies it can use it only by claiming to be your game.
- **The runtime's own key ships inside it.** It is what lets `libmotionctl` recognise the genuine runtime. Someone who extracts it from an installed copy could impersonate the runtime on that machine.
- **The same user is trusted.** The runtime does not yet check which process is connecting.
- **Validity is checked at `HELLO`.** A session that outlives its entitlement's grace keeps playing until it reconnects. The runtime works offline, so it learns that a licence was revoked only from a newer one a game presents.
- **The installers are not signed with a paid certificate.** Players see a first-launch warning (see the main page). The runtime's code is bundled JavaScript, not compiled to bytecode.

## What this means for your game

- Treat the runtime as an input device, not as protection for your game. It does not protect your own code or assets.
- Ship the licence with your game and present it at connect (the Unity bridge's Entitlement field, `MotionInput.Begin`, or `mc_config.entitlement`).
- Handle `UNAUTHORIZED` as described in [errors](errors.md). It names the reason (`MISSING`, `EXPIRED`, `REVOKED`, `WRONG_APP`, ...).
