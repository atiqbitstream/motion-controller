---
name: motion-controller
description: Add webcam motion control to a game with the Motion Controller Runtime and SDK (Unity or C/C++). Use when the user wants players to aim, shoot, punch, kick, fly, climb or otherwise control a game by moving in front of a webcam, when they mention the Motion Controller runtime, libmotionctl, an action map (motionctl-actionmap), or a .entitlement.json licence, or when they ask to integrate webcam motion input without a gamepad, VR or extra hardware.
---

# Motion Controller integration

Help a developer add webcam motion control to their game. A free **runtime** on the player's machine owns the camera and recognises motion; the game connects through the SDK and receives actions (`fire`, `aim`, `jump`) like a gamepad. The game never touches the camera or the recognition.

Everything the developer downloads is at **https://github.com/atiqbitstream/motion-controller** (the "repo" below). The runtime's source is not public; you integrate against the SDK.

## Before you start

Figure out two things from the user:

1. **Engine** — Unity, or C/C++ (or another engine that can call C). These are the two supported paths.
2. **What the player should do** — the movements, and the game action each should trigger (for example "point to aim", "pull the index finger to fire", "raise both arms to fly").

If the **Motion Controller MCP server** is available in this session (tools like `list_capabilities`, `create_action_map`, `check_runtime`), use it: it lists the real capabilities, writes a valid action map and checks it. If it is not, use `reference/capabilities.md` here and write the action map by hand to the shape below. The developer can add the MCP server from the repo's `tools/mcp` folder; suggest it if they will iterate.

## The steps

### 1. The runtime is installed and running

The developer needs the runtime on their own machine to test. Point them to the repo's latest release: the Windows installer or the macOS Apple-silicon dmg. It runs in the background (tray or menu-bar icon) and holds the camera. With the MCP server, `check_runtime` confirms it is running. Without it, they start the app and pick a camera.

### 2. Choose capabilities and write the action map

Each capability recognises one kind of motion and has named **outputs**. The action map (`motionctl-actionmap/1`) maps your game's actions to those outputs. Pick capabilities from `reference/capabilities.md` (or `list_capabilities`), then build the map. Its shape:

```json
{
  "schema": "motionctl-actionmap/1",
  "appId": "com.yourstudio.yourgame",
  "requires": ["pistol.aim", "pistol.trigger"],
  "actions": [
    { "name": "aim",  "kind": "axis2", "from": [{ "capability": "pistol.aim@^1",     "output": "aim" }] },
    { "name": "fire", "kind": "event", "from": [{ "capability": "pistol.trigger@^1", "output": "pistolTrigger" }] }
  ],
  "contexts": [
    { "name": "menu",  "capabilities": ["pistol.aim"] },
    { "name": "round", "capabilities": ["pistol.aim", "pistol.trigger"] }
  ],
  "initialContext": "menu"
}
```

Rules that keep a map valid (the MCP `create_action_map` applies them for you):

- **Action `kind` must match the output.** A position (like `aim`) is `axis2`. A one-shot (like `pistolTrigger`) is `event`. A motion that is held (phases `started`/`ended`) is `button`.
- `appId` is reverse-domain (`com.studio.game`) and must match the licence you will request.
- Every capability an action uses goes in `requires` (or `optional` for ones the game can play without).
- `contexts` are the sets of capabilities active in each game state; switch between them at runtime. `initialContext` names one of them.

Validate the finished map with `validate_action_map`, or `reference/example-targetrush.json` shows a complete one.

### 3. Wire it into the engine

**Unity** — download the `Unity` zip from the release and add it (*Package Manager > + > Add package from disk*). Add a `MotionControllerBridge` to the first scene, set its **App Id**, the **Action Map** (your JSON) and the **Entitlement** (the licence from step 4). Bind Input Actions to `<MotionController>/<action>` — a `button`/`event` action is a Button, an `axis2` action is a Vector2. Read the values in a MonoBehaviour's `Update`. The full guide is `reference/quick-start-unity.md`.

**C / C++** — download the `C-SDK` zip. Include `motionctl.h`, link the library, call `mc_create` (with the licence bytes in `mc_config.entitlement`), `mc_connect`, `mc_open_session`, then `mc_drain_events` once per frame. The zip's `examples/hello_motion.c` is a complete, buildable loop; start from it. The full guide is `reference/quick-start-c.md`.

### 4. Get the licence

The runtime only runs games that carry a valid licence (entitlement) for their `appId`. During early access it is free and lasts 10 years. Have the developer open a request at the repo (`issues/new?template=licence-request.yml`) with their `appId` and the capabilities they use. They receive a `<appId>.entitlement.json` file to drop into the game (the Unity bridge's Entitlement field, or `mc_config.entitlement` in C). You cannot issue it; only the project owner can. `licensing_help` gives the exact link and steps.

### 5. Test

Build and run against the installed runtime (not only in the editor). Confirm each action fires when the player makes the motion. If a session is refused:

- `INVALID_ACTION_MAP` → run `validate_action_map`; a capability id or output name is wrong.
- `MC_ERR_ENTITLEMENT` / `UNAUTHORIZED` → the licence is missing, for another `appId`, or expired. Check the three app ids match (map, bridge, licence).
- Health is not `ok` → show the player its advice (more light, step back, close other camera apps).

## Hard rules

- Never claim the runtime hides the camera from the game by magic: it is a separate process that sends only actions. State the privacy honestly — the picture stays on the player's machine and is never sent to the game.
- Do not invent capability ids or outputs. Use only those `list_capabilities` / `reference/capabilities.md` list; a wrong id fails the session.
- Do not try to issue or forge a licence, bypass the licence check, or read the runtime's internals. Integrate against the SDK only.
- Bind an output only to a matching action kind (step 2); a mismatch is the most common integration bug.

## Reference files

- `reference/capabilities.md` — every motion, its family, trust and outputs.
- `reference/example-targetrush.json` — a complete, valid action map.
- `reference/quick-start-unity.md`, `reference/quick-start-c.md` — the engine guides.
