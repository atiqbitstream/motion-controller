# Quick start: C

`libmotionctl` is the C library the Unity package wraps: fixed-size events, no allocation while draining, and an authenticated connection to the runtime. Use it from C, C++, or any engine that can call C.

## What is in the C SDK zip

| | |
|---|---|
| `include/motionctl.h` | The header |
| `lib/macos/libmotionctl.a`, `libmotionctl.dylib` | macOS 11 or later, universal (Apple silicon and Intel) |
| `lib/windows-x64/motionctl.dll`, `motionctl.lib` | Windows x64: the DLL and its import library |
| `lib/windows-x64/libmotionctl.lib` | Windows x64, static (define `MOTIONCTL_STATIC` and link `bcrypt.lib`) |
| `examples/hello_motion.c` | A complete program: connect, present the licence, open a session, print actions |
| `examples/game.actionmap.json` | An action map for it (change its `appId` to yours) |

## Build and run the example

You need the runtime installed and running, and a [licence](../README.md#get-a-licence) for the action map's `appId`.

macOS:

```sh
cc -std=c11 -Iinclude examples/hello_motion.c lib/macos/libmotionctl.a -o hello_motion
./hello_motion examples/game.actionmap.json com.yourstudio.yourgame.entitlement.json 10
```

Windows, in a *x64 Native Tools Command Prompt for VS*:

```bat
cl /std:c11 /Iinclude examples\hello_motion.c lib\windows-x64\motionctl.lib
copy lib\windows-x64\motionctl.dll .
hello_motion examples\game.actionmap.json com.yourstudio.yourgame.entitlement.json 10
```

It prints `connect: MC_OK` when the runtime accepted your licence, then each action you perform.

## The game loop

```c
#include "motionctl.h"

mc_config cfg = { .app_id = "com.yourstudio.yourgame", .client_name = "yourgame/1.0",
                  .entitlement = licence_bytes, .entitlement_len = licence_len };
mc_client *c = NULL;
mc_create(&cfg, &c);
mc_status s = mc_connect(c, 3000);
if (s != MC_OK) { show_player(mc_last_error(c), mc_install_url()); return; }
mc_session_opts o = { .action_map_json = action_map_json };
mc_open_session(c, &o);

for (;;) {                                           /* once per game frame */
  mc_event ev[256]; uint32_t n = 0;
  if (mc_drain_events(c, ev, 256, &n) != MC_OK && n == 0) break;   /* disconnected: reconnect */
  for (uint32_t i = 0; i < n; i++) {
    if (ev[i].family == MC_FAMILY_ACTION && ev[i].phase == MC_PHASE_PERFORMED) on_action(ev[i].name);
    /* MC_FAMILY_UNKNOWN: a newer runtime's family; skip it */
  }
}
mc_close(c);
```

- **Fields:** an event's fields are valid until the next `mc_drain_events`. Keep the values you need (`mc_event_field`).
- **Contexts:** `mc_set_context(c, "round")`. **World changes:** `mc_invalidate(c, 0)`.
- **Status:** `mc_state` is a snapshot and `mc_health` a report.
- **Not installed or not running:** `mc_connect` returns `MC_ERR_NOT_INSTALLED` or `MC_ERR_NOT_RUNNING`; show the player `mc_install_url()`.
- **Licence refused:** `MC_ERR_ENTITLEMENT`, and `mc_last_error` says why.

The [C API reference](c-api.md) lists every call.
