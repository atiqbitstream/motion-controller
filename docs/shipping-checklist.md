# Shipping checklist

Before you release a game that uses the Motion Controller.

## Licensing

- [ ] Your game presents its licence at connect: the bridge's **Entitlement** in Unity (or `MotionInput.Begin(map, entitlement)`), `mc_config.entitlement` in C.
- [ ] The action map's `appId` is the licence's app id, and the licence covers every capability the map uses.
- [ ] You tested the build you ship against the installed runtime, not only in the editor.

## The runtime on the player's machine

- [ ] Handle `NOT_INSTALLED` and `NOT_RUNNING`: tell the player to install the runtime from `mc_install_url()` (this repository's latest release).
- [ ] Tell players about the first-launch warning (the runtime is not signed with a paid certificate): *More info > Run anyway* on Windows; right-click > *Open* on macOS.

## Your integration

- [ ] Every action is reachable: try each one with the editor panel or `hello_motion`.
- [ ] `SetContext` follows your game's states, and `Invalidate` is called when the world changes under the player's hands.
- [ ] `canceled` is handled as a release.
- [ ] Health advice is shown to the player when tracking is not `ok`.
- [ ] Hand-specific actions are ignored while the sides are uncertain (`sidesCertain`, `certain` = 0).
- [ ] Unknown event families are skipped, not misread.
- [ ] Capabilities marked `preview` are used knowing they may change.

## Privacy statement (what you can tell players)

The game uses the Motion Controller runtime, which runs on your computer and uses your camera to recognise your movements. The camera image never leaves your computer, is never saved, and is never seen by this game: the game receives only the actions you make (for example "fire" or "take off").

## Support

- [ ] Your support flow can collect a diagnostics bundle (`Diagnostics()`, `mc_diagnostics_dump`). It contains no images or body data.
