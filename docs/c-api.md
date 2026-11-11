

# C API reference (libmotionctl)

The C ABI every engine adapter wraps (Unity: P/Invoke; Unreal: linked statically). One client per game; call it from one thread. Include `motionctl.h`; link `libmotionctl`. The full header is the source of truth.

## Functions

### `mc_create`

```c
mc_status mc_create(const mc_config *cfg, mc_client **out);
```

### `mc_connect`

```c
mc_status mc_connect(mc_client *c, uint32_t timeout_ms);
```

Connect and authenticate: the runtime proves itself with a signature this library checks against the keys built into it, and every frame afterwards is authenticated.

### `mc_diagnostics_dump`

```c
mc_status mc_diagnostics_dump(mc_client *c, const char **json_out);
```

A support bundle, as JSON (motionctl-diagnostics/1): versions, the session, its capabilities, health over the last minute and the last events delivered. Never a frame, an image or a landmark. The string belongs to the client and lives until the next call.

### `mc_capabilities`

```c
mc_status mc_capabilities(mc_client *c, const char **json_out);
```

The capability descriptors, as JSON. The string belongs to the client and lives until the next call.

### `mc_open_session`

```c
mc_status mc_open_session(mc_client *c, const mc_session_opts *opts);
```

### `mc_set_context`

```c
mc_status mc_set_context(mc_client *c, const char *context);
```

Switch to another context of your action map. Actions of capabilities it stops arrive as MC_PHASE_CANCELED.

### `mc_invalidate`

```c
mc_status mc_invalidate(mc_client *c, int all);
```

The world changed under the player's hands (a new target): nothing decided before now is delivered, and a held action must be held again. all != 0 also releases every open action.

### `mc_drain_events`

```c
mc_status mc_drain_events(mc_client *c, mc_event *buf, uint32_t cap, uint32_t *n);
```

Non-blocking. Call once per game frame. When the runtime went away it returns MC_ERR_DISCONNECTED and may still hand over events (*n > 0) that arrived before: handle them, then mc_reconnect.

### `mc_state`

```c
mc_status mc_state(mc_client *c, mc_state_snapshot *out);
```

### `mc_health`

```c
mc_status mc_health(mc_client *c, mc_health_report *out);
```

How well the player is seen, and the runtime's advice for them: the latest health the runtime pushed (about once a second). Tracking reaches a game here, not as MC_FAMILY_TRACKING events.

### `mc_request_calibration`

```c
mc_status mc_request_calibration(mc_client *c, const char *capability);
```

Ask the runtime to run a capability's guided calibration, or "base.environment" for the environment check. Returns MC_OK if it started one, MC_ERR_CAPABILITY_UNAVAILABLE with the reason if it refused. Its progress and its end arrive as MC_FAMILY_CALIBRATION events: the last one has MC_PHASE_ENDED.

### `mc_set_focus`

```c
mc_status mc_set_focus(mc_client *c, int focused);
```

### `mc_reconnect`

```c
mc_status mc_reconnect(mc_client *c, uint32_t timeout_ms);
```

After the runtime went away (mc_drain_events returned MC_ERR_DISCONNECTED): connect again and restore the session (the same action map and delivery options, the last context). Documents sent with mc_configure are not restored: the new session starts with the runtime's own, so send them again (flight's world: once the player is on the ground). On success a system event "reconnected" is queued; event numbers start again from 1. Blocks for up to timeout_ms: call it off the game thread, or with a short timeout, and retry.

### `mc_configure`

```c
mc_status mc_configure(mc_client *c, const char *capability, const char *document_json);
```

Give a capability of the open session a document it accepts (its descriptor's "accepts"), as JSON: flight's world ("motionctl-flight-world/1"). Lasts until the session ends. Flight takes it only while the player is on the ground (otherwise MC_ERR_BUSY). Never changes how motion is recognised.

### `mc_tk_holding`

```c
mc_status mc_tk_holding(mc_client *c, const char *hand, int holding);
```

Telekinesis (tk.manipulate): whether this hand ("left" or "right") holds something in the game now (holding 0 or 1). Call it when the hand takes hold and when it lets go, not every frame (at most 20 a second per hand). From the first call, that hand's hold in the runtime follows it: a grab that took nothing starts no hold, a let-go ends it (after a slam: the slam taken). Without it the runtime holds from every grab until its release. One flag, nothing else of the game's world. Like mc_set_focus it has no answer and is not waited for: a refusal (a map without tk.manipulate, too many) is not reported here.

### `mc_close`

```c
mc_status mc_close(mc_client *c);
```

Close the session and free the client.

### `mc_action_name`

```c
const char *mc_action_name(const mc_client *c, uint32_t code);
```

### `mc_capability_name`

```c
const char *mc_capability_name(const mc_client *c, uint32_t capability_id);
```

### `mc_last_error`

```c
const char *mc_last_error(const mc_client *c);
```

### `mc_status_name`

```c
const char *mc_status_name(mc_status s);
```

### `mc_install_url`

```c
const char *mc_install_url(void);
```

### `mc_version`

```c
const char *mc_version(void);
```

### `mc_event_field`

```c
int mc_event_field(const mc_client *c, const mc_event *e, const char *name, double *out);
```

1 and the value in *out if the event has the field, otherwise 0.

### `mc_event_fields`

```c
uint32_t mc_event_fields(const mc_client *c, const mc_event *e, const mc_field **out);
```

All of the event's fields: their count, and *out pointing at them (NULL when none).

## Types

- `mc_config`
- `mc_session_opts`
- `mc_event`
- `mc_state_snapshot`
- `mc_health_report`
- `mc_field`
