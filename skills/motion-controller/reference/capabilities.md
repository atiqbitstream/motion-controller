# Capabilities (quick reference)

Generated from the runtime. Bind an output to an action of the kind shown: axis2 for a position, event for a one-shot, button for a hold. Full detail: ask the MCP server (describe_capability) or see docs/capabilities.md.

| Capability | Family | Trust | Outputs (bind as) |
|---|---|---|---|
| `pistol.aim@1` | pointer | preview | aim (axis2) |
| `pistol.trigger@1` | weapon | preview | pistolTrigger (event) |
| `pistol.holdFire@1` | weapon | preview | holdFire (event) |
| `pistol.reload@1` | weapon | preview | reload (event) |
| `rifle.hold@1` | weapon | ga | rifleHold (button) |
| `rifle.aim@1` | weapon | ga | rifleAim (button) |
| `rifle.trigger@1` | weapon | preview | rifleTrigger (event) |
| `rifle.reload@1` | weapon | preview | rifleReload (event) |
| `climb.reach@1` | locomotion | preview | climbReachLeft (event), climbReachRight (event), climbReachBoth (event) |
| `locomotion.walk@1` | locomotion | preview | walk (button), run (button) |
| `flight.fly@1` | locomotion | preview | flightTakeoff (event), flightAirborne (button), flightCommand (event), flightSmash (event), flightImpact (event), flightLanding (event), flightTouchdown (event), flightHome (event) |
| `hand.snap@1` | manipulation | preview | snap (event) |
| `tk.arm-aim@1` | pointer | preview | tkAimLeft (axis2), tkAimRight (axis2), tkHoldAimLeft (axis2), tkHoldAimRight (axis2) |
| `tk.manipulate@1` | manipulation | preview | tkGrab (event), tkThrowReady (button), tkRelease (event), tkSlam (event), tkHoldLost (button), tkSwat (button), tkSweep (event) |
| `ghost.hands@1` | other | preview | — |
| `ghost.punch@1` | strike | preview | ghostPunch (event) |
| `ghost.kick@1` | strike | preview | ghostKick (event) |
| `hand.pose@1` | other | preview | open (button), fist (button), point (button), gun (button), pinch (button) |
| `hand.gesture@1` | manipulation | preview | swipe (event), punch (event), grab (event), release (event), circle (event), trigger (event) |
| `combat.strikes@1` | strike | preview | jab (event), cross (event), uppercut (event), elbow (event) |
| `combat.kicks@1` | strike | ga | kick (event), sideKick (event), roundhouse (event) |
| `combat.blocks@1` | other | preview | blockLeft (button), blockRight (button), blockBoth (button), guard (button) |
| `combat.grab@1` | manipulation | ga | grabLeft (button), grabRight (button) |
| `combat.claws@1` | strike | ga | clawsOut (event), clawsIn (event) |
| `combat.dodge@1` | other | preview | dodgeLeft (event), dodgeRight (event), duck (event) |
| `archery.release@1` | weapon | ga | drawCandidate (event), arrowRelease (event) |
| `archery.draw@1` | weapon | preview | bowDraw (button), bowFullDraw (event) |
| `archery.aim@1` | weapon | preview | bowAim (button), bowPoint (axis2) |
| `archery.nock@1` | weapon | preview | nock (event) |
| `archery.shot@1` | weapon | preview | arrowShot (event) |
