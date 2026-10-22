# Learner answers for the plan-lens interview

These are the project owner's answers, prepared in advance from
`research-notes.md`, so the plan-lens interview can be run without a live
back-and-forth. The interviewing agent should take each answer from here,
in the learner's words, and only ask the parent session if something is
genuinely missing.

## 1. The idea

An aquascaping planner. I want to stand at my empty aquarium and compose
the hardscape (stones, driftwood) and the plant groups at real size inside
the tank before I commit to the real pieces, with the classic composition
rules shown right on the tank. Call it **Scape Planner**.

## 2. The spatial moment

I am standing in front of my empty 60 cm tank on its stand. My hands are
dirty from substrate. Inside the tank I see virtual stones, a piece of
driftwood and plant groups sitting on the substrate at their real size. On
the front glass there is a faint thirds grid, and next to the tank a small
coach card tells me whether the layout follows the rules: is the main stone
on a third, do I have an odd number of pieces, is there a gap to the front
glass. I move a virtual stone with a pinch, look, and then move the real
stone to match.

It uses all three strengths: it shares my view (the guides are drawn on the
tank I am looking at, from where I stand), it draws in the world (pieces at
real size inside the real tank, so scale is judged by looking), and it
leaves my body free (both hands stay on the real stones; one pinch to swap
or move a virtual piece).

Why it is worse on a phone: I would need a hand for the phone, the tank is a
3D box I need to walk around, and judging scale only works at real size in
place.

## 3. Product or overlay

Overlay. The real version would sense the tank (its glass box on the stand).
The preview cannot recognise my tank, so the stand-in is a **virtual tank**:
a glass box 60 x 30 x 36 cm (width x depth x height) standing on a virtual
table 75 cm high, placed about 1 m in front of me when the Lens starts. One
big pinch button, **Place tank**, re-anchors the tank in front of wherever
I am looking, so I can move it to a sensible spot in the preview room.

## 4. Where things live

While I work I look slightly down at the tank, about 1 m away. The tank top
is at about 111 cm (75 cm table + 36 cm tank).

- **Tank**: on the table, 1 m ahead at start. Transparent glass with visible
  edges, a dark substrate layer about 4 cm thick sloping to 7 cm at the back.
- **Guides on the tank**: thirds lines on the front glass (two vertical
  lines at 20 cm and 40 cm, one horizontal at 24 cm from the bottom);
  three faint zone bands on the substrate: foreground (front 10 cm),
  midground (middle 10 cm), background (back 10 cm).
- **Palette**: a column of big buttons floating to the left of the tank,
  starting at tank-top height, facing me, about 25 cm wide. Buttons:
  Stone, Wood, Carpet, Bush, Stems, Undo, Clear, Guides, Place tank.
- **Coach card**: to the right of the tank at tank-top height, about
  20 cm wide. It lists the checks with a green or amber dot each.
- **Pieces** (spawned inside the tank, on the substrate, near the
  tank centre, then grabbed into place):
  - Stone (Seiryu): main stone 22 cm tall; the second stone placed is
    13 cm, the third 9 cm (same mesh, scaled). After three, repeat the
    ladder.
  - Wood (spider wood): 28 cm wide, 18 cm tall.
  - Carpet (Monte Carlo patch): 12 x 12 cm, 3 cm tall.
  - Bush (Cryptocoryne): 12 cm wide, 12 cm tall.
  - Stems (Rotala bunch): 8 cm wide, 25 cm tall.

The 3D models already exist in the project at `Assets/GeneratedMeshes/`
(`SeiryuStone.glb`, `SpiderWood.glb`, `CarpetMonteCarlo.glb`,
`BushCryptocoryne.glb`, `StemRotala.glb`), generated with Meshy under my
own paid plan. They are at arbitrary scale and must be normalised to the
sizes above.

## 5. Hands and input

- Pinch a palette button: the piece appears in the tank.
- Grab and drag a piece: it slides along the substrate plane (its height
  stays on the substrate; it cannot leave the tank's inner box).
- Pinch **Undo**: removes the last placed piece.
- Pinch **Clear**: removes all pieces.
- Pinch **Guides**: toggles the thirds grid and zone bands.
- Pinch **Place tank**: moves the tank and table to 1 m in front of me.
- All targets at least 6 cm, highlight when aimed at. No voice, no
  two-hand gestures.

## 6. When things show

- The palette is always visible while I plan; it is the tool.
- The coach card shows all checks, but it only *speaks up* (expands its
  text, plays a soft tick) for 4 seconds after I place or move a piece.
  Otherwise it sits quiet with its dots.
- Guides are on by default and can be toggled off.
- Nothing needs to pull my attention from out of view; everything sits
  around the tank in front of me. No sound cue needed.

## 7. Done criteria

1. When the Lens starts, a glass tank 60 x 30 x 36 cm stands on a table
   about 1 m in front of me. I can walk around it, and pinching **Guides**
   hides and shows the thirds grid on the front glass.
2. Pinching **Stone** places a Seiryu stone about 22 cm tall on the
   substrate inside the tank. I can grab it and drag it along the
   substrate, and it never leaves the tank.
3. With one stone dead centre, the coach card shows the focal point check
   in amber ("Main stone: move it to a third"). Dragging it to about one
   third from the left side turns it green.
4. Placing a second stone turns the count check amber ("Odd number of
   pieces: add one or remove one"). Placing a third stone turns it green.
5. Pinching **Undo** removes the last placed piece and pinching **Clear**
   empties the tank; the coach checks reset.

Also wanted, not required for the demo: placing **Stems** in the front
zone turns the zone check amber ("Rotala belongs in the background").

## Coach checks (the rules, for the build)

- Focal point: the largest stone's x position is 28 to 45 percent of the
  tank width from either side. (Green Aqua rule GA-03.)
- Odd count: stones plus wood pieces is an odd number. (GA-05, GA-18.)
- Front gap: every hardscape piece is at least 3 cm from the front glass.
  (GA-13.)
- Height: the tallest hardscape piece is at least 40 percent of the tank
  height. (GA-07.) Always true with the main stone; shown for teaching.
- Zones: carpet in foreground, bush in midground, stems in background.

## Out of scope

Recognising the real tank, saving or sharing layouts, voice control,
two-hand gestures, water or lighting simulation, rotating pieces,
custom tank sizes.

## Sign-off

If the drafted brief reflects these answers, take that as my "looks good":
set `status: approved`. I will not be available for a second round.

## Risks and open questions

- Grabbing a virtual stone while holding a real one: only real glasses
  can tell (feel unproven).
- The Meshy meshes are approximations of real stone and plants; scale is
  normalised, shape fidelity is not verified against real pieces.
- Reviewers judge from the video; everything above must show in the
  Lens Studio preview with a mouse.
