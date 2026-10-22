---
status: approved
---

# Design brief: Scape Planner

<!-- Filled in by plan-lens from the learner's interview. Use the learner's words. Mark any value they didn't choose as (default). -->

## The one spatial moment
I am standing in front of my empty 60 cm aquarium on its stand, hands dirty from substrate. Inside the tank I see virtual stones, a piece of driftwood and plant groups sitting on the substrate at their real size, a faint thirds grid on the front glass, and a small coach card beside the tank that tells me whether the layout follows the composition rules. I move a virtual stone with a pinch, look, then move the real stone to match.

## Why it belongs on glasses
- Uses: shares your view (the guides are drawn on the tank I am looking at, from where I stand); draws in the world (pieces at real size inside the tank, so scale is judged by looking); leaves your body free (both hands stay on the real stones, one pinch to place or move a virtual piece).
- Why it's better than the phone or laptop version: a phone needs a hand, the tank is a 3D box I have to walk around, and judging scale only works at real size in place.

## Product or overlay
- Type: overlay: it responds to something real (my empty tank).
- What the real version would sense: the tank, a glass box on its stand.
- Stand-in for the preview: a virtual tank, 60 x 30 x 36 cm (width x depth x height), on a virtual table 75 cm high, placed about 1 m in front of me when the Lens starts. A big pinch button, **Place tank**, re-anchors the tank and table 1 m in front of wherever I am looking.

## Where things live
- Where the user is looking during the main task: slightly down at the tank, about 1 m away. Tank top is at about 111 cm (75 cm table plus 36 cm tank).
- Tank: on the table, 1 m ahead at start. Transparent glass with visible edges; a dark substrate layer about 4 cm thick at the front sloping to 7 cm at the back.
- Guides on the tank: thirds lines on the front glass (vertical lines at 20 cm and 40 cm from the left, one horizontal line 24 cm above the tank floor); three faint zone bands on the substrate: foreground (front 10 cm), midground (middle 10 cm), background (back 10 cm).
- Palette: a column of big buttons floating to the left of the tank, top at tank-top height, facing me, about 25 cm wide: Stone, Wood, Carpet, Bush, Stems, Undo, Clear, Guides, Place tank.
- Coach card: to the right of the tank at tank-top height, about 20 cm wide, listing the checks with a green or amber dot each.
- Pieces (spawn inside the tank, on the substrate, near the centre, then grabbed into place):
  - Stone (Seiryu): first stone 22 cm tall, second 13 cm, third 9 cm (same mesh, scaled); the ladder repeats.
  - Wood (spider wood): 28 cm wide, 18 cm tall.
  - Carpet (Monte Carlo patch): 12 x 12 cm, 3 cm tall.
  - Bush (Cryptocoryne): 12 cm wide, 12 cm tall.
  - Stems (Rotala bunch): 8 cm wide, 25 cm tall.
- Meshes: already in the project at `Assets/GeneratedMeshes/` (`SeiryuStone.glb`, `SpiderWood.glb`, `CarpetMonteCarlo.glb`, `BushCryptocoryne.glb`, `StemRotala.glb`), generated with Meshy under the learner's paid plan. They are at arbitrary scale and must be normalised to the sizes above.

## Hands and input
- Place a piece: pinch the matching palette button; the piece appears in the tank.
- Move a piece: grab and drag; it slides along the substrate plane, its height stays on the substrate, and it cannot leave the tank's inner box.
- Undo: pinch the Undo button; removes the last placed piece.
- Clear: pinch the Clear button; removes all pieces.
- Guides: pinch the Guides button; toggles the thirds grid and zone bands.
- Place tank: pinch the Place tank button; moves tank and table to 1 m in front of the user.
- Targets are big (at least 6 cm) and highlight when aimed at.
- Voice (if any) and the button that does the same job: none.

## When things show
- Palette: shows while planning (always), hides never.
- Coach card: shows its check dots always; expands its text and plays a soft tick for 4 seconds after a piece is placed or moved, then goes quiet.
- Guides: on at start, toggled with the Guides button.
- If something needs attention out of view: none (everything sits around the tank in front of the user).

## Done criteria
Each one can be checked in Lens Studio's preview.
1. At start, a glass tank 60 x 30 x 36 cm stands on a table about 1 m in front of me. I can walk around it, and pinching Guides hides and shows the thirds grid on the front glass.
2. Pinching Stone places a Seiryu stone about 22 cm tall on the substrate inside the tank. I can grab it and drag it along the substrate, and it never leaves the tank.
3. With one stone dead centre, the coach card shows the focal point check in amber ("Main stone: move it to a third"). Dragging it to about one third from the left side turns it green.
4. Placing a second stone turns the count check amber ("Odd number of pieces: add one or remove one"). Placing a third stone turns it green.
5. Pinching Undo removes the last placed piece, and pinching Clear empties the tank; the coach checks reset.

Also wanted, not required for the demo: placing Stems in the front zone turns the zone check amber ("Rotala belongs in the background").

## Coach checks (the rules behind the card)
- Focal point: the largest stone's x position is 28 to 45 percent of the tank width from either side (Green Aqua rule GA-03).
- Odd count: stones plus wood pieces is an odd number (GA-05, GA-18).
- Front gap: every hardscape piece is at least 3 cm from the front glass (GA-13).
- Height: the tallest hardscape piece is at least 40 percent of the tank height (GA-07); always true with the main stone, shown for teaching.
- Zones: carpet in the foreground, bush in the midground, stems in the background.

## Out of scope
- Recognising the real tank, saving or sharing layouts, voice control, two-hand gestures, water or lighting simulation, rotating pieces, custom tank sizes.

## Risks and open questions
- Grabbing a virtual stone while holding a real one: only real glasses can tell (feel unproven).
- The Meshy meshes are approximations of real stone and plants; scale is normalised, shape fidelity is not verified against real pieces.
- Reviewers judge from the video, so everything above must show in the Lens Studio preview with a mouse.
- The spawn point of new pieces (tank centre, on the substrate) and the 4 second coach timeout were set by the learner; the coach's soft tick sound is a (default) from the design rules.

## Build notes for CLAD
- Build for SPECS so it runs and can be demonstrated in Lens Studio's preview. No SPECS device is available.
- Use Spectacles Interaction Kit (SIK) and UI Kit for all interactions, so they work with the mouse in Interactive Preview and with LEAF.
- Build any stand-in exactly as described above, and keep it obvious in the scene.
- Use real-world scale in centimeters. Keep content inside the user's view during the main task.
- The display is additive: black renders as transparent. Don't rely on black or very dark content to be seen; keep text light and readable from where the user stands.
- Get the basic flow working first, then add detail.
- Write LEAF scenarios for each done criterion, run them in preview, and report which pass. Say which criteria have no test.
- Don't record, identify, or follow people.
- Use the existing meshes in `Assets/GeneratedMeshes/` (SeiryuStone, SpiderWood, CarpetMonteCarlo, BushCryptocoryne, StemRotala), normalised to the sizes in this brief. Do not call any cloud mesh generation (no SPECS text-to-3D, no FAST3D): the Lens Studio account is not signed in.

## After the build: judge it
This part is for you, after CLAD finishes.

1. **Does it work?** Ask your agent which LEAF tests passed and which done criteria have no test.
2. **Walk around it.** Open the preview in Interactive Preview. Use WASD to move, Q and E to go down and up, and right-drag (or hold Shift) to look around. Clicking acts as a pinch. Stand where a user would and look at the task.
3. **Ask the three questions.**
   - Does it use what I'm looking at?
   - Does it put something in my space, where it belongs?
   - Does it free my hands or let me keep my eyes up?
   - Would it be just as good on a phone? If so, what would make it need the glasses?
4. **Check comfort.**
   - Everything I need is in view while I do the task. Nothing sits at the edges, behind me, or stuck to my face.
   - Every control is within reach of someone standing there.
   - Text reads easily from where I stand. No dark UI disappearing.
   - Things show when needed and get out of the way.
5. **Label what you know.** Write "logic proven" next to anything the tests and preview show working, and "feel unproven" next to anything only real glasses could tell you (comfort over time, real hand tracking, real recognition).
6. **Fix with design notes, not code.** Tell your agent what to change in design terms, for example: "Move the step card 15 cm lower and next to the pan. Make the Next button twice as big. Re-run the tests." If a fix takes under a minute, like nudging a panel, do it yourself in the scene.
7. **Submit.** Record a video under 3 minutes of your Lens in the preview, public on YouTube. Make your repo public with your Lens Studio project and this `devpost/` folder. Details are on the hackathon site: https://learn-specs.devpost.com/resources
