# Motion Controller

**Play games with your body, using just your webcam. No special equipment.**

Your webcam watches you move. You aim with your hand, pull a trigger with your finger, punch, fly, duck. A game turns those movements into controls, the way a gamepad would. There is nothing to hold and nothing to wear.

The part that watches the camera is a small free app called the **Motion Controller Runtime**. It runs quietly in the background on your own computer. Everything it sees stays on your computer: the picture is never saved, never sent anywhere, and never shown to the game. The game is only told things like "fire" or "aim here".

- **Works on:** Windows 10 and 11, and Macs with Apple chips (M1 or newer).
- **Costs:** nothing right now.
- **You need:** a computer with a webcam, and a bit of room to move your hands or body.

## Which of these are you?

- **"I just want to try it."** → [I want to try it](#i-want-to-try-it)
- **"I make games and want to add this."** → [I make games](#i-make-games)

---

## I want to try it

Right now this is brand new, so there is no ready-made game to click and play yet. That is coming. What you can do today is install the app and know it works, so you are ready the moment a game is here.

**Step 1 — Download the app.** Go to the [downloads page](https://github.com/atiqbitstream/motion-controller/releases/latest) and pick the file for your computer:

| Your computer | File to download |
|---|---|
| Windows (most PCs) | the file ending in **`Windows-x64-Setup.exe`** |
| Mac with an Apple chip (M1, M2, M3 or newer) | the file ending in **`macOS-AppleSilicon.dmg`** |

Not sure which Mac you have? Click the Apple menu in the top-left corner, then "About This Mac". If it says "Apple M1" (or M2, M3, and so on), use the Mac file. Older Intel Macs are not supported yet.

**Step 2 — Open the file you downloaded and install it.**

- **Windows:** double-click the file. Windows may show a blue box saying "Windows protected your PC". This is normal for new apps. Click the small **"More info"** text, then the **"Run anyway"** button. It installs just for you and does not need an administrator.
- **Mac:** double-click the file, then drag the **Motion Controller Runtime** icon onto the **Applications** folder shown next to it. The first time you open it, hold **Control**, click the app, and choose **Open**, then **Open** again in the box that appears. You only do this once.

Why the warnings? The app is brand new and not yet stamped with a paid certificate from Apple or Microsoft. The warning is about that stamp, not about anything being wrong with the app.

**Step 3 — Let it see the camera.** The app lives in the background: a tiny icon in the system tray on Windows (bottom-right), or the menu bar on Mac (top-right). Click it to pick which camera to use. The first time a game uses it, your computer asks permission for the camera. Say yes.

That's it. The app is ready and waiting. When a game that uses it comes out, you just start the game and move.

**Your privacy, in plain words:** the camera picture is looked at only on your own computer, only while a game is actually running, and is thrown away immediately. It is never recorded and never leaves your machine. Games get the moves, never the picture.

---

## I make games

You can add webcam motion control to a Unity or C/C++ game. Players install the free runtime above; your game talks to it and receives actions like `fire`, `reload`, or an `aim` position, exactly as it would read a gamepad. Your game never touches the camera or the recognition.

**In short:**

1. Install the runtime on your own machine (the steps above).
2. [Ask for a free licence](#get-a-licence) for your game.
3. Add the SDK and follow one short guide:
   - **Unity:** download the **`Unity`** zip from the [downloads page](https://github.com/atiqbitstream/motion-controller/releases/latest) and follow [Quick start: Unity](docs/quick-start-unity.md).
   - **C, C++, or another engine:** download the **`C-SDK`** zip and follow [Quick start: C](docs/quick-start-c.md).
4. Before you ship, run through the [shipping checklist](docs/shipping-checklist.md).

The C SDK includes a tiny ready-to-build example (`hello_motion`) that connects, shows your licence working, and prints each move you make. It is the fastest way to see the whole thing run.

Everything else is in the [documentation](docs/README.md): the ideas behind it, every motion it can recognise, every error and what to do about it, and the full reference.

### Get a licence

The runtime only runs games that carry a valid licence. During early access they are free and last 10 years, so a game you ship keeps working for your players with no internet needed.

1. Pick an **app id** for your game. It looks like a backwards web address, for example `com.yourstudio.yourgame`. It must match the `appId` inside your action map.
2. [Open a licence request](https://github.com/atiqbitstream/motion-controller/issues/new?template=licence-request.yml) and fill in the short form.
3. You get back a small file named after your app id. Drop it into your game (the quick starts show exactly where). Licence files are never posted in public.

---

## Getting help

- A move isn't registering → [troubleshooting](docs/troubleshooting.md)
- You saw an error code → [errors](docs/errors.md)
- Anything else → [open an issue](https://github.com/atiqbitstream/motion-controller/issues/new) and describe what happened

## The fine print

The runtime and SDK are free to use under the terms in [LICENSE.md](LICENSE.md). This page holds the downloads and the documentation. The runtime's own source code is not public.
