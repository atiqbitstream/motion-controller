

# Capability catalogue

Every capability this runtime offers, as a game sees it: what it emits, what it provides continuously, the numbers its events carry, its runtime-owned state, what it needs from the camera, and how far it is trusted. A game names capabilities in its action map as `id@^version`.

`preview` means the capability has not been validated to general availability: build with it, but expect it to change. `ga (development data)` means it is validated, but on the recordings its definition was designed on, with no held-out recordings of its own yet: the descriptor says so in `validation` (`development-data`). Trust and the evidence behind it are in `docs/Commercial runtime progress.md`.

| Capability | Family | Tier | Needs |
|---|---|---|---|
| [`pistol.aim@1`](#pistolaim) Pistol aim | pointer | preview | hands, 1 hand(s) |
| [`pistol.trigger@1`](#pistoltrigger) Pistol trigger | weapon | preview | hands, 1 hand(s) |
| [`pistol.holdFire@1`](#pistolholdFire) Fire by holding the aim | weapon | preview | hands |
| [`pistol.reload@1`](#pistolreload) Pistol reload | weapon | preview | hands, 2 hand(s) |
| [`rifle.hold@1`](#riflehold) Rifle hold | weapon | ga | body, 2 hand(s) |
| [`rifle.aim@1`](#rifleaim) Rifle aim | weapon | ga | body, 2 hand(s) |
| [`rifle.trigger@1`](#rifletrigger) Rifle trigger | weapon | preview | hands, body, 2 hand(s) |
| [`rifle.reload@1`](#riflereload) Rifle reload | weapon | preview | body, 2 hand(s) |
| [`climb.reach@1`](#climbreach) Climbing reach | locomotion | preview | body |
| [`locomotion.walk@1`](#locomotionwalk) Walking and running by the arms | locomotion | preview | body |
| [`flight.fly@1`](#flightfly) Superhero flight | locomotion | preview | body, hands |
| [`hand.snap@1`](#handsnap) Finger snap | manipulation | preview | hands, body |
| [`tk.arm-aim@1`](#tkarm-aim) Telekinesis arm aim | pointer | preview | body, hands |
| [`tk.manipulate@1`](#tkmanipulate) Telekinesis | manipulation | preview | body, hands |
| [`ghost.hands@1`](#ghosthands) Ghost hands | other | preview | hands, body |
| [`ghost.punch@1`](#ghostpunch) Ghost hands punches | strike | preview | body, hands |
| [`ghost.kick@1`](#ghostkick) Ghost hands kicks | strike | preview | body |
| [`hand.pose@1`](#handpose) Hand poses | other | preview | hands, 1 hand(s) |
| [`hand.gesture@1`](#handgesture) Hand gestures | manipulation | preview | hands, 1 hand(s) |
| [`combat.strikes@1`](#combatstrikes) Punches and elbows | strike | preview | hands, body |
| [`combat.kicks@1`](#combatkicks) Kicks | strike | ga | body |
| [`combat.blocks@1`](#combatblocks) Blocks and guard | other | preview | body |
| [`combat.grab@1`](#combatgrab) Grabs | manipulation | ga (development data) | hands, body |
| [`combat.claws@1`](#combatclaws) Claws | strike | ga (development data) | body |
| [`combat.dodge@1`](#combatdodge) Dodges and duck | other | preview | body |
| [`archery.release@1`](#archeryrelease) Release the arrow | weapon | ga | hands, 2 hand(s) |
| [`archery.draw@1`](#archerydraw) Draw the bow | weapon | preview | hands, 2 hand(s) |
| [`archery.aim@1`](#archeryaim) Bow raised to aim | weapon | preview | hands, body, 2 hand(s) |
| [`archery.nock@1`](#archerynock) Nock an arrow | weapon | preview | hands, 2 hand(s) |
| [`archery.shot@1`](#archeryshot) Shoot the arrow when the draw hand opens | weapon | preview | hands, body |

## pistol.aim

**Pistol aim**, version 1, pointer, preview. Needs hands (1 hand(s)) at 30 fps or more, with pictures of 1280x720 or more (`minResolution`: what its recordings were made at).

Framing: One hand in the picture, pointing at the screen.

Continuous: `aim` (a position in the mirrored view, 0..1 each way).

Guided calibration (`requestCalibration`): About ten seconds: hold your hand still in the middle of where it is comfortable, then at the left, right, top and bottom edges of your comfortable reach, each until it is taken. That area becomes this player's control area: the aim covers the whole screen within it, and every hand event's position (the trigger's, firing by holding) is read through it. Kept in the player's profile. The last stage says how it ended: done; done-with-warnings (kept, though the camera or tracking was not ideal); or nothing changed because the area was too small to aim with (reach wider), or a point was not taken within a minute (not-held-still, not-far-enough from the centre, hand-not-seen), or it was cancelled. Stages, as the `stage` field of its `calibration` events: 0 centre, 1 left, 2 right, 3 up, 4 down, 5 done, 6 done-with-warnings, 7 box-too-small, 8 not-held-still, 9 not-far-enough, 10 hand-not-seen, 11 cancelled.

## pistol.trigger

**Pistol trigger**, version 1, weapon, preview. Needs hands (1 hand(s)) at 30 fps or more, with pictures of 1280x720 or more (`minResolution`: what its recordings were made at).

Framing: The shooting hand in the picture, index finger forward.

| Output | Phases | Fields |
|---|---|---|
| `pistolTrigger` | performed (by pull) |  |

## pistol.holdFire

**Fire by holding the aim**, version 1, weapon, preview. Needs hands at 30 fps or more, with pictures of 1280x720 or more (`minResolution`: what its recordings were made at).

Framing: The shooting hand in the picture, held still on the target.

| Output | Phases | Fields |
|---|---|---|
| `holdFire` | performed (by hold) |  |

## pistol.reload

**Pistol reload**, version 1, weapon, preview. Needs hands (2 hand(s)) at 30 fps or more, with pictures of 1280x720 or more (`minResolution`: what its recordings were made at).

Framing: Both hands in the picture.

| Output | Phases | Fields |
|---|---|---|
| `reload` | performed |  |

## rifle.hold

**Rifle hold**, version 1, weapon, ga. Needs body (2 hand(s)) at 30 fps or more.

Framing: Head, shoulders and both hands in the picture.

| Output | Phases | Fields |
|---|---|---|
| `rifleHold` | started, ended |  |

## rifle.aim

**Rifle aim**, version 1, weapon, ga. Needs body (2 hand(s)) at 30 fps or more.

Framing: Head, shoulders and both hands in the picture.

| Output | Phases | Fields |
|---|---|---|
| `rifleAim` | started, ended |  |

## rifle.trigger

**Rifle trigger**, version 1, weapon, preview. Needs hands and body (2 hand(s)) at 30 fps or more.

Framing: Head, shoulders and both hands in the picture.

| Output | Phases | Fields |
|---|---|---|
| `rifleTrigger` | performed |  |

## rifle.reload

**Rifle reload**, version 1, weapon, preview. Needs body (2 hand(s)) at 30 fps or more.

Framing: Head, shoulders and both hands in the picture.

| Output | Phases | Fields |
|---|---|---|
| `rifleReload` | performed |  |

## climb.reach

**Climbing reach**, version 1, locomotion, preview. Needs body at 30 fps or more.

Framing: Head, shoulders, arms and hips in the picture, standing, with room to reach up.

| Output | Phases | Fields |
|---|---|---|
| `climbReachLeft` | performed | `dirX` (number): Where the reaching arm points from the shoulder, a unit vector in the picture's plane: x, + toward the player's right (the right of the mirrored view).<br>`dirY` (number): The same vector's y, + up (unlike a position on the screen, which grows downward).<br>`speed` (number, torso/s): How fast the hand thrust outward, away from the body's middle, at its quickest during the reach, in the player's torso lengths (shoulders to hips) a second, so it does not depend on their size or distance. Small for a straight rise; a lunge for a far hold is a quick thrust.<br>`outToSide` (flag: 0 or 1): 1 when the reach went far out to the side, the arm near level, rather than up above the head: a game may take it only for a hold far to that side.<br>`handOutOfView` (flag: 0 or 1): 1 when the reaching hand was not seen (usually above the top of the picture) and the reach was read from the raised arm: the player may need to step back. |
| `climbReachRight` | performed | `dirX` (number): Where the reaching arm points from the shoulder, a unit vector in the picture's plane: x, + toward the player's right (the right of the mirrored view).<br>`dirY` (number): The same vector's y, + up (unlike a position on the screen, which grows downward).<br>`speed` (number, torso/s): How fast the hand thrust outward, away from the body's middle, at its quickest during the reach, in the player's torso lengths (shoulders to hips) a second, so it does not depend on their size or distance. Small for a straight rise; a lunge for a far hold is a quick thrust.<br>`outToSide` (flag: 0 or 1): 1 when the reach went far out to the side, the arm near level, rather than up above the head: a game may take it only for a hold far to that side.<br>`handOutOfView` (flag: 0 or 1): 1 when the reaching hand was not seen (usually above the top of the picture) and the reach was read from the raised arm: the player may need to step back. |
| `climbReachBoth` | performed | `leftDirX` (number): Where the left arm points from the shoulder, a unit vector in the picture's plane: x, + toward the player's right (the right of the mirrored view).<br>`leftDirY` (number): The same vector's y, + up (unlike a position on the screen, which grows downward).<br>`rightDirX` (number): Where the right arm points from the shoulder, a unit vector in the picture's plane: x, + toward the player's right (the right of the mirrored view).<br>`rightDirY` (number): The same vector's y, + up (unlike a position on the screen, which grows downward).<br>`speed` (number, torso/s): How fast the hand thrust outward, away from the body's middle, at its quickest during the reach (the quicker arm's), in the player's torso lengths (shoulders to hips) a second, so it does not depend on their size or distance. Small for a straight rise; a lunge for a far hold is a quick thrust.<br>`outToSide` (flag: 0 or 1): 1 when the reach went far out to the side, the arm near level, rather than up above the head: a game may take it only for a hold far to that side.<br>`handOutOfView` (flag: 0 or 1): 1 when the reaching hand was not seen (usually above the top of the picture) and the reach was read from the raised arm: the player may need to step back. |

## locomotion.walk

**Walking and running by the arms**, version 1, locomotion, preview. Needs body at 30 fps or more.

Framing: Facing the camera, shoulders, hips and both hands in the picture, arms free to swing.

| Output | Phases | Fields |
|---|---|---|
| `walk` | started, ended |  |
| `run` | started, ended |  |

Runtime-owned state (sent as `state` events when it changes, and in the state snapshot):

- `stride` (enum: 0 idle, 1 walk, 2 run): What the `walk` and `run` outputs follow: standing, walking or running. Running ends only after a short spell at a walking pace, so a brief dip does not end it.
- `moving` (flag: 0 or 1): 1 while the arms' walking rhythm is seen this frame. When it stops, the stride stays walk or run until the reference speed has eased down to 0.
- `intensity` (number, 0..1): How much the gait is a run: 0 a walk, 1 a run (after walking's calibration, judged against this player's own walk and run). 0 while no rhythm is seen.
- `speed` (number, m/s): The reference walker's speed: eased toward 1.4 m/s at a walk and 4 m/s at a run by the intensity, and down to 0 when the rhythm stops. A game scales it to its own world.
- `reason` (enum: 0 walking, 1 no rhythm, 2 one arm, 3 hands high, 4 twisting, 5 not seen): Why the player is not walking now, for a hint on screen: no rhythm (swing both arms in turn), one arm (only one arm is swinging), hands high (one hand should be low, as in a walk), twisting (face the camera), not seen (step into view).
- `bodyTurn` (number, deg): How far the shoulders are turned from facing the camera (+ toward the player's left); 0 when the body is not seen.

Guided calibration (`requestCalibration`): About a minute: stand in view, walk in place with ordinary arm swings, run in place, then a smaller run. It learns how this player walks and runs, so the run is told apart from the walk by their own movement. Walking is paused while it runs. Stages, as the `stage` field of its `calibration` events: 0 ready, 1 walk-get-set, 2 walk, 3 run-get-set, 4 run, 5 relaxed, 6 done, 7 cancelled.

## flight.fly

**Superhero flight**, version 1, locomotion, preview. Needs body and hands at 30 fps or more.

Framing: Standing, head to hips and both arms in the picture, with room to raise the arms.

| Output | Phases | Fields |
|---|---|---|
| `flightTakeoff` | performed |  |
| `flightAirborne` | started, ended |  |
| `flightCommand` | performed | `command` (enum: 0 hover, 1 forward, 2 boost, 3 backward, 4 ascend, 5 rise, 6 glide, 7 descend, 8 left, 9 right, 10 upLeft, 11 upRight, 12 backUpLeft, 13 backUpRight, 14 land): The command now in force. |
| `flightSmash` | performed | `intensity` (number, 0..1): How hard the dive is.<br>`hand` (enum: 0 left, 1 right): The striking fist. |
| `flightImpact` | performed | `intensity` (number, 0..1): The strike's intensity.<br>`radius` (number, m): The reference blast radius.<br>`damage` (number, 0..1): The reference damage.<br>`push` (number, m/s): The reference push.<br>`x` (number, m): Where it hit: offset from home, right.<br>`y` (number, m): Height (0: the ground).<br>`z` (number, m): Offset from home, toward the camera. |
| `flightLanding` | performed | `reason` (enum: 0 guided down, 1 tracking lost): Why the landing began. |
| `flightTouchdown` | performed | `smash` (flag: 0 or 1): 1 when the touchdown is a smash's impact. |
| `flightHome` | performed |  |

Runtime-owned state (sent as `state` events when it changes, and in the state snapshot):

- `state` (enum: 0 GROUNDED, 1 POSE_CANDIDATE, 2 ACTIVATION_HOLD, 3 LIFTOFF, 4 AIRBORNE, 5 SMASH, 6 LANDING, 7 RECOVERY): The pilot's state.
- `command` (enum: 0 hover, 1 forward, 2 boost, 3 backward, 4 ascend, 5 rise, 6 glide, 7 descend, 8 left, 9 right, 10 upLeft, 11 upRight, 12 backUpLeft, 13 backUpRight, 14 land): The command in force.
- `x` (number, m): The reference body's offset from home: right.
- `y` (number, m): Its altitude.
- `z` (number, m): Its offset toward the camera (forward is −z).
- `vx` (number, m/s): Its velocity, x.
- `vy` (number, m/s): Its velocity, y.
- `vz` (number, m/s): Its velocity, z.
- `heading` (number, rad): Its heading (+ turned left).
- `takeoff` (number, 0..1): The take-off hold's progress.
- `leftHand` (flag: 0 or 1): The hand layer had a hand on the player's left this frame (its grip and palm reached the pilot).
- `rightHand` (flag: 0 or 1): The same for the right.
- `sidesCertain` (flag: 0 or 1): The hand layer was sure which hand is which; 0: kept from before or taken from the tracker's labels, and the sides may be the wrong way round.

Accepts (with `configure`, during a session):

- `motionctl-flight-world/1`: The game's world for the reference body: "walls" (up to 256, each {"at": [x, y, z], "half": [x, y, z]} in metres, home-relative unless "home" is given), "bounds" {x, zFar, zNear, minY, maxY} (the flying box, metres from home; it must hold the 1.2 m hover height), "home" {x, y, z}. Only while the player is on the ground; it lasts until the session ends.

## hand.snap

**Finger snap**, version 1, manipulation, preview. Needs hands and body at 30 fps or more.

Framing: The snapping hand in the picture, palm toward the camera, and the body (to tell the hands apart).

| Output | Phases | Fields |
|---|---|---|
| `snap` | performed | `certain` (flag: 0 or 1): The hand layer was sure which hand is which; 0: the side named may be the other hand. |

## tk.arm-aim

**Telekinesis arm aim**, version 1, pointer, preview. Needs body and hands at 30 fps or more.

Framing: Standing, head to hips and both arms in the picture, the hands toward the camera.

Continuous: `tkAimLeft` (a position in the mirrored view, 0..1 each way), `tkAimRight` (a position in the mirrored view, 0..1 each way), `tkHoldAimLeft` (a position in the mirrored view, 0..1 each way), `tkHoldAimRight` (a position in the mirrored view, 0..1 each way).

Runtime-owned state (sent as `state` events when it changes, and in the state snapshot):

- `leftAiming` (flag: 0 or 1): The left free aim has a point (a lowered arm aims at nothing).
- `rightAiming` (flag: 0 or 1): The right free aim has a point.
- `leftZeroed` (flag: 0 or 1): The left arm's straight-ahead is set (without one of its own it points from the other arm's; with neither, the aim is the hand's place before the shoulders).
- `rightZeroed` (flag: 0 or 1): The right arm's straight-ahead is set.

Guided calibration (`requestCalibration`): Each arm in turn, the left then the right: point it at the middle of the screen and hold it still for a second. That direction becomes the arm's straight ahead, so its aim follows the arm from there. Kept in the player's profile. Stages, as the `stage` field of its `calibration` events: 0 left-straight-ahead, 1 right-straight-ahead, 2 done, 3 cancelled.

## tk.manipulate

**Telekinesis**, version 1, manipulation, preview. Needs body and hands at 30 fps or more.

Framing: Standing, head to hips and both arms in the picture, the hands toward the camera.

| Output | Phases | Fields |
|---|---|---|
| `tkGrab` | performed | `certain` (flag: 0 or 1): The hand layer was sure which hand is which. |
| `tkThrowReady` | started, ended | `speed` (number, m/s): The forward thrust's speed when it began (the arm's extension, or the fist growing toward the camera).<br>`cue` (enum: 0 armExtension, 1 fistGrowth): What showed the thrust. |
| `tkRelease` | performed | `kind` (enum: 0 setDown, 1 thrust, 2 swing, 3 flick, 4 drop): How the hand let go: set down, after a thrust, after a fast swing of the arm, after a fast flick of the aim, or dropped (the hand lost for 0.9 s). A hand whose identity is unsure always sets down.<br>`speed` (number, m/s): The throw's speed for a thrust or a swing, before the game's mass limit (0 otherwise).<br>`flickX` (number): For a flick: the aim's velocity across over the 150 ms before the hand opened (screen widths per second, + right).<br>`flickY` (number): For a flick: the aim's velocity up (screen heights per second, + up).<br>`raised` (flag: 0 or 1): The wrist was raised above the shoulder (a gentle release there may float, where the game has room).<br>`certain` (flag: 0 or 1): The hand layer was sure which hand is which.<br>`openMs` (number, ms): How long before this event the hand opened (the flick and the throw's aim are read at the opening). |
| `tkSlam` | performed | `handSpeed` (number): How fast the hand came down (screen heights per second).<br>`speed` (number, m/s): The slam's speed, 6..14 by the hand, before the game's mass limit. The hold goes on for the runtime: a game that refuses the slam (too low, two hands) keeps the object, and the later release is decided as before; a game that tells the runtime it let go (TK_HOLDING) has taken it. |
| `tkHoldLost` | started, ended |  |
| `tkSwat` | started, ended | `side` (enum: 0 left, 1 right): Toward which side of the screen the open hand swatted.<br>`speed` (number, m/s): The wrist's sideways speed (ended: when it has slowed enough for the next swat). |
| `tkSweep` | performed | `speed` (number, m/s): How fast both open hands blasted forward. |

Runtime-owned state (sent as `state` events when it changes, and in the state snapshot):

- `leftClosing` (flag: 0 or 1): The left hand's grip is closing (a game keeps its target while it closes).
- `leftGrabbed` (flag: 0 or 1): The left hand's grip grab is on.
- `leftDepth` (number, m): How far the left hand has asked its held object to come toward the player since the grab (the haul, and precision mode's push and pull), at the reference scale (10 m per m of arm pulled in), before any near or far limit: a game applies each change within its own limits. 0 while it holds nothing.
- `leftHauling` (flag: 0 or 1): The left hand's haul moved its object nearer in the last 150 ms.
- `leftTurn` (number, rad): The left wrist's roll since the grab, steadied (a slow drift does not turn the object). 0 while it holds nothing.
- `leftPush` (number, m): The left arm's smoothed length since the grab (+ longer): one arm out and the other back turns an object held by both. 0 while it holds nothing.
- `leftPrecision` (flag: 0 or 1): Precision mode for the left hand: the other hand is raised open while this one holds (its depth then follows the arm; no throw, slam or haul).
- `leftSwat` (enum: 0 none, 1 left, 2 right): The left open hand swatting sideways this frame, toward the screen's left or right (none: not swatting).
- `leftCertain` (flag: 0 or 1): The hand layer is sure which hand is which (0: the left hand may be the other; it neither throws nor slams).
- `rightClosing` (flag: 0 or 1): The right hand's grip is closing (a game keeps its target while it closes).
- `rightGrabbed` (flag: 0 or 1): The right hand's grip grab is on.
- `rightDepth` (number, m): How far the right hand has asked its held object to come toward the player since the grab (the haul, and precision mode's push and pull), at the reference scale (10 m per m of arm pulled in), before any near or far limit: a game applies each change within its own limits. 0 while it holds nothing.
- `rightHauling` (flag: 0 or 1): The right hand's haul moved its object nearer in the last 150 ms.
- `rightTurn` (number, rad): The right wrist's roll since the grab, steadied (a slow drift does not turn the object). 0 while it holds nothing.
- `rightPush` (number, m): The right arm's smoothed length since the grab (+ longer): one arm out and the other back turns an object held by both. 0 while it holds nothing.
- `rightPrecision` (flag: 0 or 1): Precision mode for the right hand: the other hand is raised open while this one holds (its depth then follows the arm; no throw, slam or haul).
- `rightSwat` (enum: 0 none, 1 left, 2 right): The right open hand swatting sideways this frame, toward the screen's left or right (none: not swatting).
- `rightCertain` (flag: 0 or 1): The hand layer is sure which hand is which (0: the right hand may be the other; it neither throws nor slams).

## ghost.hands

**Ghost hands**, version 1, other, preview. Needs hands and body at 30 fps or more.

Framing: One or both hands in the picture, and the body (to tell the hands apart).

Runtime-owned state (sent as `state` events when it changes, and in the state snapshot):

- `leftPresent` (flag: 0 or 1): The hand layer has a hand on the player's left this frame, with the tracker's 3D points; 0: the left pose below is the last one seen (fade it out), or a straight hand before any.
- `leftQx` (number): The left hand's orientation, a unit quaternion's x (camera space: x right, y up, z toward the viewer): the rotation from the rig's rest pose (the WebXR generic hand, left) to the hand.
- `leftQy` (number): The left hand's orientation, a unit quaternion's y (camera space: x right, y up, z toward the viewer): the rotation from the rig's rest pose (the WebXR generic hand, left) to the hand.
- `leftQz` (number): The left hand's orientation, a unit quaternion's z (camera space: x right, y up, z toward the viewer): the rotation from the rig's rest pose (the WebXR generic hand, left) to the hand.
- `leftQw` (number): The left hand's orientation, a unit quaternion's w (camera space: x right, y up, z toward the viewer): the rotation from the rig's rest pose (the WebXR generic hand, left) to the hand.
- `leftThumb1` (number, 0..1): The thumb's base flexion of the left hand, as a fraction of the rig's natural range (0: straight or closed together).
- `leftThumb2` (number, 0..1): The thumb's middle joint flexion of the left hand, as a fraction of the rig's natural range (0: straight or closed together).
- `leftThumb3` (number, 0..1): The thumb's end joint flexion of the left hand, as a fraction of the rig's natural range (0: straight or closed together).
- `leftIndex1` (number, 0..1): The index finger's knuckle flexion of the left hand, as a fraction of the rig's natural range (0: straight or closed together).
- `leftIndex2` (number, 0..1): The index finger's middle joint flexion of the left hand, as a fraction of the rig's natural range (0: straight or closed together).
- `leftIndex3` (number, 0..1): The index finger's end joint flexion of the left hand, as a fraction of the rig's natural range (0: straight or closed together).
- `leftMiddle1` (number, 0..1): The middle finger's knuckle flexion of the left hand, as a fraction of the rig's natural range (0: straight or closed together).
- `leftMiddle2` (number, 0..1): The middle finger's middle joint flexion of the left hand, as a fraction of the rig's natural range (0: straight or closed together).
- `leftMiddle3` (number, 0..1): The middle finger's end joint flexion of the left hand, as a fraction of the rig's natural range (0: straight or closed together).
- `leftRing1` (number, 0..1): The ring finger's knuckle flexion of the left hand, as a fraction of the rig's natural range (0: straight or closed together).
- `leftRing2` (number, 0..1): The ring finger's middle joint flexion of the left hand, as a fraction of the rig's natural range (0: straight or closed together).
- `leftRing3` (number, 0..1): The ring finger's end joint flexion of the left hand, as a fraction of the rig's natural range (0: straight or closed together).
- `leftPinky1` (number, 0..1): The little finger's knuckle flexion of the left hand, as a fraction of the rig's natural range (0: straight or closed together).
- `leftPinky2` (number, 0..1): The little finger's middle joint flexion of the left hand, as a fraction of the rig's natural range (0: straight or closed together).
- `leftPinky3` (number, 0..1): The little finger's end joint flexion of the left hand, as a fraction of the rig's natural range (0: straight or closed together).
- `leftSpread` (number, 0..1): How far the fingers are fanned apart of the left hand, as a fraction of the rig's natural range (0: straight or closed together).
- `leftThumbOut` (number, 0..1): How far the thumb is swung out from the palm (1: as in a finger gun) of the left hand, as a fraction of the rig's natural range (0: straight or closed together).
- `rightPresent` (flag: 0 or 1): The hand layer has a hand on the player's right this frame, with the tracker's 3D points; 0: the right pose below is the last one seen (fade it out), or a straight hand before any.
- `rightQx` (number): The right hand's orientation, a unit quaternion's x (camera space: x right, y up, z toward the viewer): the rotation from the rig's rest pose (the WebXR generic hand, right) to the hand.
- `rightQy` (number): The right hand's orientation, a unit quaternion's y (camera space: x right, y up, z toward the viewer): the rotation from the rig's rest pose (the WebXR generic hand, right) to the hand.
- `rightQz` (number): The right hand's orientation, a unit quaternion's z (camera space: x right, y up, z toward the viewer): the rotation from the rig's rest pose (the WebXR generic hand, right) to the hand.
- `rightQw` (number): The right hand's orientation, a unit quaternion's w (camera space: x right, y up, z toward the viewer): the rotation from the rig's rest pose (the WebXR generic hand, right) to the hand.
- `rightThumb1` (number, 0..1): The thumb's base flexion of the right hand, as a fraction of the rig's natural range (0: straight or closed together).
- `rightThumb2` (number, 0..1): The thumb's middle joint flexion of the right hand, as a fraction of the rig's natural range (0: straight or closed together).
- `rightThumb3` (number, 0..1): The thumb's end joint flexion of the right hand, as a fraction of the rig's natural range (0: straight or closed together).
- `rightIndex1` (number, 0..1): The index finger's knuckle flexion of the right hand, as a fraction of the rig's natural range (0: straight or closed together).
- `rightIndex2` (number, 0..1): The index finger's middle joint flexion of the right hand, as a fraction of the rig's natural range (0: straight or closed together).
- `rightIndex3` (number, 0..1): The index finger's end joint flexion of the right hand, as a fraction of the rig's natural range (0: straight or closed together).
- `rightMiddle1` (number, 0..1): The middle finger's knuckle flexion of the right hand, as a fraction of the rig's natural range (0: straight or closed together).
- `rightMiddle2` (number, 0..1): The middle finger's middle joint flexion of the right hand, as a fraction of the rig's natural range (0: straight or closed together).
- `rightMiddle3` (number, 0..1): The middle finger's end joint flexion of the right hand, as a fraction of the rig's natural range (0: straight or closed together).
- `rightRing1` (number, 0..1): The ring finger's knuckle flexion of the right hand, as a fraction of the rig's natural range (0: straight or closed together).
- `rightRing2` (number, 0..1): The ring finger's middle joint flexion of the right hand, as a fraction of the rig's natural range (0: straight or closed together).
- `rightRing3` (number, 0..1): The ring finger's end joint flexion of the right hand, as a fraction of the rig's natural range (0: straight or closed together).
- `rightPinky1` (number, 0..1): The little finger's knuckle flexion of the right hand, as a fraction of the rig's natural range (0: straight or closed together).
- `rightPinky2` (number, 0..1): The little finger's middle joint flexion of the right hand, as a fraction of the rig's natural range (0: straight or closed together).
- `rightPinky3` (number, 0..1): The little finger's end joint flexion of the right hand, as a fraction of the rig's natural range (0: straight or closed together).
- `rightSpread` (number, 0..1): How far the fingers are fanned apart of the right hand, as a fraction of the rig's natural range (0: straight or closed together).
- `rightThumbOut` (number, 0..1): How far the thumb is swung out from the palm (1: as in a finger gun) of the right hand, as a fraction of the rig's natural range (0: straight or closed together).
- `sidesCertain` (flag: 0 or 1): The hand layer was sure which hand is which; 0: kept from before or taken from the tracker's labels, and the sides may be the wrong way round.

## ghost.punch

**Ghost hands punches**, version 1, strike, preview. Needs body and hands at 30 fps or more.

Framing: Head to hips and both hands in the picture, facing the camera.

| Output | Phases | Fields |
|---|---|---|
| `ghostPunch` | performed | `kind` (enum: 0 jab, 1 cross): Which punch, by the hand that threw it: the jab is the left hand's, the cross the right's.<br>`x` (number, shoulder widths): Where the fist was at the punch's deepest point, across: from the middle of the shoulders, positive toward the player's right.<br>`y` (number, shoulder widths): Where the fist was at the punch's deepest point, up and down: from the middle of the shoulders, positive downward (above the shoulders is negative).<br>`reach` (number, 0..1.5): How far the fist came toward the camera there, from its size in the picture: 0 at the player's own guard, 1 a full punch.<br>`gain` (number, 0..1.5): How much reach the punch gained from where it started. |

## ghost.kick

**Ghost hands kicks**, version 1, strike, preview. Needs body at 30 fps or more.

Framing: The whole body in the picture, feet included (or down to the knees), with room to kick.

| Output | Phases | Fields |
|---|---|---|
| `ghostKick` | performed | `source` (enum: 0 ankle, 1 knee): What the kick was read from: the foot, or the knee when the feet are out of the picture.<br>`x` (number, shoulder widths): Where the foot (the knee, for a knee kick) was at the kick's top, across: from the middle of the shoulders, positive toward the player's right.<br>`y` (number, shoulder widths): Where the foot (the knee) was at the kick's top, up and down: from the middle of the shoulders, positive downward.<br>`height` (number, shoulder widths): How high it rose: a foot above the other foot, a knee above its hip.<br>`forward` (number, m): How far ahead of the hips, toward the camera, it was at the top (the pose model's depth: coarse). |

## hand.pose

**Hand poses**, version 1, other, preview. Needs hands (1 hand(s)) at 30 fps or more, with pictures of 1280x720 or more (`minResolution`: what its recordings were made at).

Framing: One or both hands in the picture.

| Output | Phases | Fields |
|---|---|---|
| `open` | started, ended |  |
| `fist` | started, ended |  |
| `point` | started, ended |  |
| `gun` | started, ended |  |
| `pinch` | started, ended |  |

## hand.gesture

**Hand gestures**, version 1, manipulation, preview. Needs hands (1 hand(s)) at 30 fps or more, with pictures of 1280x720 or more (`minResolution`: what its recordings were made at).

Framing: One hand in the picture, with room to move.

| Output | Phases | Fields |
|---|---|---|
| `swipe` | performed |  |
| `punch` | performed |  |
| `grab` | performed |  |
| `release` | performed |  |
| `circle` | performed |  |
| `trigger` | performed |  |

## combat.strikes

**Punches and elbows**, version 1, strike, preview. Needs hands and body at 30 fps or more.

Framing: Head to hips and both arms in the picture, standing side-on or facing the camera.

| Output | Phases | Fields |
|---|---|---|
| `jab` | performed |  |
| `cross` | performed |  |
| `uppercut` | performed |  |
| `elbow` | performed |  |

## combat.kicks

**Kicks**, version 1, strike, ga. Needs body at 30 fps or more.

Framing: The whole body in the picture, with room to kick.

| Output | Phases | Fields |
|---|---|---|
| `kick` | performed |  |
| `sideKick` | performed |  |
| `roundhouse` | performed |  |

## combat.blocks

**Blocks and guard**, version 1, other, preview. Needs body at 30 fps or more.

Framing: Head, shoulders and both arms in the picture.

| Output | Phases | Fields |
|---|---|---|
| `blockLeft` | started, ended |  |
| `blockRight` | started, ended |  |
| `blockBoth` | started, ended |  |
| `guard` | started, ended |  |

## combat.grab

**Grabs**, version 1, manipulation, ga (development data): validated on development data only (`validation`: `development-data`). Needs hands and body at 30 fps or more.

Framing: Head, shoulders and both hands in the picture.

| Output | Phases | Fields |
|---|---|---|
| `grabLeft` | started, ended |  |
| `grabRight` | started, ended |  |

## combat.claws

**Claws**, version 1, strike, ga (development data): validated on development data only (`validation`: `development-data`). Needs body at 30 fps or more.

Framing: Head, shoulders and both hands in the picture.

| Output | Phases | Fields |
|---|---|---|
| `clawsOut` | performed |  |
| `clawsIn` | performed |  |

## combat.dodge

**Dodges and duck**, version 1, other, preview. Needs body at 30 fps or more.

Framing: Head and shoulders in the picture, with room to move to either side and down.

| Output | Phases | Fields |
|---|---|---|
| `dodgeLeft` | performed |  |
| `dodgeRight` | performed |  |
| `duck` | performed |  |

## archery.release

**Release the arrow**, version 1, weapon, ga. Needs hands (2 hand(s)) at 30 fps or more.

Framing: Both hands and the head in the picture, the draw hand coming back to the face.

| Output | Phases | Fields |
|---|---|---|
| `drawCandidate` | performed |  |
| `arrowRelease` | performed |  |

## archery.draw

**Draw the bow**, version 1, weapon, preview. Needs hands (2 hand(s)) at 30 fps or more.

Framing: Both hands and the head in the picture.

| Output | Phases | Fields |
|---|---|---|
| `bowDraw` | started, ended |  |
| `bowFullDraw` | performed |  |

## archery.aim

**Bow raised to aim**, version 1, weapon, preview. Needs hands and body (2 hand(s)) at 30 fps or more.

Framing: Both hands and the head in the picture, the bow arm raised.

| Output | Phases | Fields |
|---|---|---|
| `bowAim` | started, ended |  |

Continuous: `bowPoint` (a position in the mirrored view, 0..1 each way).

Guided calibration (`requestCalibration`): One arrow: aim at the middle of the screen with the bow arm raised, draw and release. The bow arm's direction just before the release becomes this player's straight ahead, so the aim follows the arm from there. Until the release the aim points at the middle. (bowPoint: the middle of the view is the straight ahead, its edges 25 degrees of yaw and 15 of pitch from it unless the player's profile says otherwise; aiming past them goes past 0 or 1.) Stages, as the `stage` field of its `calibration` events: 0 shoot-centre, 1 done, 2 cancelled.

## archery.nock

**Nock an arrow**, version 1, weapon, preview. Needs hands (2 hand(s)) at 30 fps or more.

Framing: Both hands in the picture.

| Output | Phases | Fields |
|---|---|---|
| `nock` | performed |  |

## archery.shot

**Shoot the arrow when the draw hand opens**, version 1, weapon, preview. Needs hands and body at 30 fps or more.

Framing: Both hands and the head in the picture, the bow arm raised and the draw hand coming back to the face.

| Output | Phases | Fields |
|---|---|---|
| `arrowShot` | performed | `aimX` (number, 0..1): Where the bow was aimed for this arrow, across the mirrored view, in archery.aim's bowPoint scale (the middle is the player's straight ahead). It is the aim from just before the release, because the hands jump when the string is let go; it may go past 0 or 1 when the player aimed past the view's edge.<br>`aimY` (number, 0..1): The same aim's y, down the view (y down, as bowPoint).<br>`draw` (number, 0..1): How far the bow was drawn for this arrow (0 not drawn, 1 the full draw): the larger of the draw just before the release and at it. A game sets the arrow's speed from it.<br>`aimAgeMs` (number, ms): How long before the release the aim above was taken (it is taken from a moment before the release, while the bow was still steady).<br>`waitedMs` (number, ms): How long after archery.release's arrowRelease the arrow was let go: the shot waits for the draw hand to open. 0 when the hand had already opened, and for an open palm at the head.<br>`cue` (enum: 0 hand-opened, 1 open-palm): What let the arrow go. hand-opened: the draw hand opened after archery.release's arrowRelease. open-palm: after a full draw, the draw hand at the head opened into a palm (no arrowRelease needed). |
