# Build log: how Scape Planner was built

Written 2026-10-23 at the end of the build session. This is the honest record
of the process, including what deviated from the hackathon's standard flow.

## Timeline (one night, 22 to 23 October 2026)

1. **Setup.** Lens Studio 5.24.1 installed on the Mac mini. Project started
   from Snap's *Specs Base Template* (`specs-devs/samples`), which bundles
   Spectacles Interaction Kit 2.0 and UI Kit 2.0. The CLAD plugin (`ls-clad`
   from `lens-studio-devs/ls-extensions`) and the Devpost Learn skill pack
   (`challengepost/learn-specs`) were installed. Lens Studio opened the
   project, migrated it to 5.24, started its MCP server and wrote `.mcp.json`.
2. **Research.** Aquascaping guidance was gathered first (see
   `research-notes.md`): dry layout before water, scale mistakes, Green
   Aqua's composition rules, planting zones, existing tools.
3. **Plan.** The `plan-lens` interview was run against the learner's written
   answers in `interview-answers.md` and produced `design-brief.md`
   (status: approved).
4. **Assets.** Five 3D models were generated with Meshy under the author's
   paid plan (preview plus textured refine, PBR maps), downloaded as GLB and
   imported by Lens Studio: Seiryu stone, spider wood, Monte Carlo carpet,
   Cryptocoryne bush, Rotala stems. Snap's own text-to-3D was not used
   because it needs a signed-in Lens Studio account.
5. **Build.** Following CLAD's `specs-experience-builder` pipeline: project
   init survey (camera with world tracking, SIK prefab present, preview set
   to the SPECS 27 stereo device in Interactive mode), scripts written with
   the UIKit and SIK patterns from the `specs-build-ui`, `specs-interaction-
   recipes` and `lens-api` skills, scene bootstrapped in two `VirtualScene`
   applies (Phase A: assets and authored objects; Phase B: `@input` wiring
   after `RecompileTypeScriptTool`), then the see-and-fix loop with
   `RunAndCollectLogsTool`, `CapturePanelScreenshotTool` and
   `QueryRuntimeSceneTool`.
6. **Test.** LEAF installed from the Asset Library; six scenarios written
   (one per done criterion plus an IK reachability test) and run in the
   preview through the LEAF panel. All six pass.

## What deviated from the standard flow, and why

- **The coding agent drove the Lens Studio MCP directly.** The build was run
  by Claude (Anthropic's model) from a Claude desktop session. Partway through
  the night the standalone Claude Code CLI lost its sign-in and could not be
  re-authenticated without the author, so the planned headless Claude Code
  session inside the project folder was not possible. Instead the agent
  connected to Lens Studio's MCP server with a small JSON-RPC client
  (streamable HTTP, the normal MCP protocol) and followed the CLAD plugin's
  skills and agent instructions step by step from their installed files.
  Every scene write, recompile, log read, preview capture, interaction and
  LEAF run went through the Lens Studio MCP tools. The CLAD plugin files were
  the method; the transport was a plain MCP client rather than Claude Code's
  built-in one.
- **The plan-lens interview was answered from a prepared document.** The
  learner (the project owner) wrote the answers in advance and signed off in
  writing, because the session ran overnight without them.
- **Meshes came from Meshy, not SPECS text-to-3D.** See step 4.

## Verification record

Checked in Lens Studio 5.24.1, Interactive Preview, Sunlit Room scene, SPECS
27 stereo device, mouse as pinch (simulated through the AiPreviewAgent and
LEAF interactors).

| Done criterion | How it was checked | Result |
|---|---|---|
| 1. Tank 60 x 30 x 36 cm on a table 1 m ahead; Guides toggles the thirds grid | LEAF `scape-1-tank-and-guides`; preview captures | pass |
| 2. Stone pinch places a 22 cm stone; grab and drag; never leaves the tank | LEAF `scape-2-place-and-drag-stone`; drag to the front glass clamps at the inner wall | pass |
| 3. Centred main stone: amber; stone on a third: green | LEAF `scape-3-focal-point` (pull to centre, fresh stone on a third); drag back to a third checked with the AiPreviewAgent drag tool (x = -8.9 cm gave "Main stone sits on a third") | pass |
| 4. Two stones: amber count; three: green | LEAF `scape-4-odd-count` | pass |
| 5. Undo removes last; Clear empties; coach resets | LEAF `scape-5-undo-clear` | pass |
| Reach: a simulated arm can pinch the palette on the table | LEAF `scape-6-reach-ik` | pass |
| Zone check (extra): stems in the midground warn "Rotala belongs in the background" | LEAF `scape-5-undo-clear` | pass |

Logic proven: everything in the table. Feel unproven: pinching a virtual
stone while holding a real one, comfort of looking down at a tank for a
long session, hand tracking near glass. Only real glasses can tell.

## Known limitations

- The palette's near-field interaction volume (UIKit) sits in front of the
  tank; a far-field drag toward the back of the tank can be blocked when the
  ray passes through it. Moving the palette to the table front minimised
  this; it is the reason the palette is a tray and not a floating column.
- LEAF's far-field drag applies its vector per update, so scenarios use it
  for coarse moves only.
- The preview cannot recognise a real tank; the virtual tank is the stand-in
  the brief describes.
- Repository visibility: the repo was created private during the overnight
  build and is to be made public by the author before submission.

## Version 2 (2026-10-23, evening)

Added after the first submission draft: a piece catalogue of ten objects
(five more Meshy models: dragon stone, Manzanita, Anubias nana, dwarf
hairgrass, red Ludwigia), style-fit scoring for Iwagumi, Nature, Dutch and
Jungle (weighted rules from ADA, Green Aqua, NBAT and AGA guidance, scored
over applicable rules only), rotate, lean and size on the selected piece,
a three-row palette tray, and fixes from a code review: front gap measured
from the piece's front face, focal piece is the tallest stone or wood,
plant zones follow the tank depth, lighter substrate for the additive
display, spawn spots that avoid overlaps. The research for the rules and
the catalogue was done by four parallel agents; the design and the code
were done by hand afterwards. Seven LEAF scenarios pass.

## Version 3 (2026-10-23, night)

Asked for: far more plants, a choice of hardscape materials, and standard
tank sizes. Done inline (no research agents this time, to keep token use
down):

- Sixteen more Meshy models (meshy-6-lite preview plus PBR refine, about
  15 credits each): lava rock, Frodo stone, Elephant skin, Pagoda stone,
  Redmoor, Mopani, bonsai wood, Java fern, moss cushion, Bucephalandra,
  Vallisneria, Amazon sword, Blyxa, Downoi, red lotus, Staurogyne. 26
  models in all.
- A catalogue of 38 pieces: 11 hardscape, 27 plants. Species that share a
  growth form reuse a model with a material tint (`applyTint` clones the
  prefab materials and scales `baseColorFactor`), and are marked as
  variants so the honest answer is "same shape, different colour".
- The palette became a tabbed tray (Stone, Wood, Carpet, Mid, Back, Epi):
  one tool row, one tab row, two rows of eight item slots that are renamed
  when a tab is chosen. LEAF taps the tab first, then the item.
- Six standard tank sizes (30C, 45P, 60P, 75P, 90P, 120P). The tank
  rebuilds its glass, substrate and guides, the table grows with it, the
  palette and coach move with it, and the rules read the live dimensions.
- One test broke for a good reason: the zone message now names the full
  species ("Rotala rotundifolia belongs in the background"), so scenario 5
  was updated. All eight LEAF scenarios pass.

Meshy spend for the whole project: about 240 credits of the monthly 1016.

## Version 4 (2026-10-24)

Feedback after the first recording: plants must not stand in pots or look like
cushions, a carpet must be laid tile by tile, epiphytes must sit on stone and
wood, and the substrate must be built up with soil and sand. Done:

- Pots and bases cut off five Meshy plant models in headless Blender (a
  horizontal bisect per model; originals kept outside the repo).
- Carpets are procedural tiles (MeshBuilder): blades for hairgrass and
  Lilaeopsis, small round leaves for Monte Carlo, HC Cuba and Glossostigma.
  Repeated taps lay tiles row by row from the front glass with a small
  overlap; every blade stands on the substrate under it.
- The substrate is a height field with grain. Soil and sand mounds (Base tab)
  pile on the sloped base, merge into ridges and can be dragged and resized;
  everything else re-seats on the new surface. Zones are a tint in the surface.
- Moss, Anubias, Buce and Java fern hang on the selected (or last) stone or
  wood at a real surface point (read from the mesh vertices), follow it when
  it moves, and re-hang where they are dropped.
- Stones: Bigger, Smaller and Mirror replace the three-step Size button; lean
  goes to 40 degrees and turns with the yaw, so stones can lean any way.
- The palette moved below the line of sight into the tank; the preview uses
  the empty Plane scene.
- New LEAF scenarios: v4 checks (mounds, carpet row, moss follows the stone,
  mirror and bigger) and an ADA-style 60P Iwagumi built with the palette
  alone (devpost/ada-60p-preview.png). All ten pass.

## Credits

Composition rules from Green Aqua. 3D models generated with Meshy. Built on
Snap's Specs Base Template, SIK, UI Kit, CLAD skills and LEAF.
