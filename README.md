# Motion Controller

Turn a webcam into a game controller. Players move (aim, punch, fly, shoot) and your game receives actions, the way it would from a gamepad. Your game never touches the camera.

The **Motion Controller Runtime** runs on the player's computer. It owns the camera and recognises the motion. Your game connects to it through the SDK and gets events such as `fire` or an `aim` position.

- **Engines:** Unity (Input System device, plus calls shaped like the old `Input` class) and C/C++ (`libmotionctl`).
- **Platforms:** Windows 10/11 x64, and macOS 11 or later on Apple silicon (M1 or later). Intel Macs are not supported yet.
- **Price:** free during early access. You need a free licence for your game; see [Get a licence](#get-a-licence).

## For players

1. Download the runtime for your computer from the [latest release](https://github.com/atiqbitstream/motion-controller/releases/latest):
   - Windows: `MotionController-Runtime-<version>-Windows-x64-Setup.exe`
   - Mac with Apple silicon (M1 or later): `MotionController-Runtime-<version>-macOS-AppleSilicon.dmg`
2. Install it (see the first-launch warnings below).
3. Start the game. The runtime asks for the camera the first time. The picture never leaves your computer, is never saved, and the game never sees it.

### First-launch warnings

The runtime is not signed with a paid Apple or Microsoft certificate, so your computer warns you the first time.

- **Windows:** SmartScreen says "Windows protected your PC". Click **More info**, then **Run anyway**. The installer needs no administrator rights and installs for your user only.
- **macOS:** open the `.dmg` and drag **Motion Controller Runtime** to Applications. The first time, right-click (or Control-click) the app and choose **Open**, then **Open** again. If macOS still refuses, run this once in Terminal:

  ```sh
  xattr -dr com.apple.quarantine "/Applications/Motion Controller Runtime.app"
  ```

The runtime runs in the background (a tray icon on Windows, a menu bar icon on macOS), where you can choose the camera.

## For game developers

1. **Install the runtime** on your development machine, as a player would (above).
2. **Get a licence** for your game's app id (below). It is a small file you ship with your game.
3. **Add the SDK** from the [latest release](https://github.com/atiqbitstream/motion-controller/releases/latest):
   - Unity: `MotionController-Unity-<version>.zip`. Follow [Quick start: Unity](docs/quick-start-unity.md).
   - C/C++ or any engine that can call C: `MotionController-C-SDK-<version>.zip`. Follow [Quick start: C](docs/quick-start-c.md).
4. Before you release, go through the [shipping checklist](docs/shipping-checklist.md).

The full documentation is in [docs](docs/README.md): concepts, every capability, every error and what to do about it, and the C API.

## Get a licence

The runtime only accepts games that present a valid licence for their app id. During early access, licences are free.

1. Choose your game's **app id**, reverse-domain style, for example `com.yourstudio.yourgame`. It must match the `appId` in your action map.
2. [Open a licence request](https://github.com/atiqbitstream/motion-controller/issues/new?template=licence-request.yml) with your app id and the capabilities you use.
3. You receive a file named `<app id>.entitlement.json`. Put it in your game:
   - Unity: assign it to the bridge's **Entitlement** field (or pass it to `MotionInput.Begin`).
   - C: pass its bytes as `mc_config.entitlement` / `entitlement_len`.

A licence lasts 10 years, so a game you ship keeps working for its players. The runtime checks it on the player's computer, with no internet connection needed. Licence files are never posted publicly.

## What you get, and what you don't

Your game receives actions, axes, named numbers and state. It never receives camera frames, body points or anything about how motion is recognised. See [what the runtime protects](docs/protection.md) for the honest details.

## Help

- Something does not register: [troubleshooting](docs/troubleshooting.md).
- An error code: [errors](docs/errors.md).
- Anything else: [open an issue](https://github.com/atiqbitstream/motion-controller/issues/new). Attach a support bundle if you can. It holds versions and recent events, never images.

## Licence

The runtime and SDK are free to use under the terms in [LICENSE.md](LICENSE.md). This repository holds the releases and documentation; the runtime's source is not public.
