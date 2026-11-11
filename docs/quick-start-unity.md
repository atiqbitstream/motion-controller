# Quick start: Unity

The Unity package makes the runtime an Input System device. Its controls are the actions of your action map. Projects still on the old Input Manager get calls in the same shape as `Input.GetButtonDown` and `Input.GetAxis`.

Tested with Unity 2022.3 on Windows 11 x64. macOS is built and included but not yet tested inside Unity.

## 1. Install

1. Install the **Motion Controller Runtime** on your machine (see the [main page](../README.md#for-players)).
2. Download `MotionController-Unity-<version>.zip` from the [latest release](https://github.com/atiqbitstream/motion-controller/releases/latest) and unzip it somewhere permanent, for example next to your project.
3. In Unity: *Window > Package Manager > + > Add package from disk*, and choose the unzipped folder's `package.json`. Unity installs the Input System package with it.
4. If Unity asks to switch to the new input backends, choose **No** if your game still calls `Input.GetAxis`. The package works with *Active Input Handling* set to *Both* or either one.

The native library is already inside the package (`Runtime/Plugins`): `motionctl.dll` for Windows and `libmotionctl.dylib` for macOS.

## 2. Get a licence and write your action map

1. Choose your app id, for example `com.yourstudio.yourgame`, and [request a licence](../README.md#get-a-licence). Put the `.entitlement.json` file you receive in your `Assets` folder.
2. Write your action map (`motionctl-actionmap/1`): your actions, which capability drives each, and your contexts. Its `appId` must be your licence's app id. The package's sample, `Samples~/TargetRush/TargetRush.actionmap.json`, is a complete one. Import it from *Package Manager > Motion Controller > Samples*.

## 3. Input System

1. Add a **MotionControllerBridge** to your first scene. Set its **App Id**, and give it the **Action Map** and the **Entitlement** (your licence file).
2. Bind Input Actions to `<MotionController>/<action>`:
   - a `button` or `event` action is a Button;
   - an `axis2` action is a Vector2 (0..1 each way, in the mirrored view).

```csharp
bridge.SetContext("round");            // follow your game's state
bridge.Invalidate();                   // a new target, a respawn: a hold begun before does not fire after
```

- **Status:** `bridge.Status` says what the bridge is doing, in words you can show the player.
- **Event fields:** read them while handling `EventReceived` with `bridge.TryGetField(ev, "command", out var v)`.
- **Support bundle:** `bridge.Client.Diagnostics()`.

Read the device's values in the player's update (a MonoBehaviour's `Update`, or an action callback).

## 3b. The old Input Manager

```csharp
using MotionCtl.Legacy;
using UnityEngine;

public sealed class Player : MonoBehaviour
{
    [SerializeField] TextAsset actionMap;     // your action map
    [SerializeField] TextAsset entitlement;   // your licence file

    void Awake() => MotionInput.Begin(actionMap, entitlement);

    void Update()
    {
        Vector2 aim = MotionInput.GetAxis2("aim");
        if (MotionInput.GetButtonDown("fire")) Fire(aim);
    }

    void Fire(Vector2 at) { }
    void OnGUI() => GUILayout.Label(MotionInput.Status);
}
```

Use the bridge or `MotionInput`, not both: each opens its own session.

## 4. The editor panel

*Window > Motion Controller* shows the runtime's version, health and capabilities while you are not in Play Mode. It says in words when the runtime is not installed or not running.

## When something is wrong

`bridge.Status` and `MotionInput.Status` say it in words: the runtime is not installed, not running, or the licence was refused (and why). The [errors](errors.md) page lists every case.
