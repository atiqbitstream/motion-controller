# Motion Controller SDK documentation

Webcam motion as a game controller. The **Motion Controller Runtime**, installed on the player's computer, owns the camera and recognises motion. Your game connects to it through the SDK and receives actions, as it would from a gamepad. It never handles the camera, body points or recognition.

| Start here | |
|---|---|
| [Concepts](concepts.md) | The runtime, sessions, capabilities, action maps, contexts, events, fields and state, health |
| [Quick start: Unity](quick-start-unity.md) | The Input System device, and calls shaped like the old `Input` class |
| [Quick start: C](quick-start-c.md) | `libmotionctl`, for C, C++ and any engine that can call C |
| [Capability catalogue](capabilities.md) | Every capability, its outputs, fields and state |
| [Errors](errors.md) | Every error code, what it means and what to do |
| [C API reference](c-api.md) | `libmotionctl` |
| [Protocol reference](protocol.md) | Every message between a game and the runtime |
| [Camera and room](environment.md) | What the player needs |
| [Troubleshooting](troubleshooting.md) | Health, tracking, support bundles |
| [Shipping checklist](shipping-checklist.md) | Before you release |
| [What the runtime protects](protection.md) | What it protects, and what it does not |

**Status.** Early access, version 0.1. Windows x64, and macOS on Apple silicon. Capabilities marked `preview` may change. Unreal and browser (JavaScript) games are not supported in this release.
