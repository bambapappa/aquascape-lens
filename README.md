# Scape Planner: an AR aquascaping planner for SPECS

Stand at your empty aquarium and compose the hardscape and the planting at
real size, inside the tank, before you commit to the real stones. The Lens
draws the classic composition guides on the tank itself (thirds grid, zone
bands) and a coach card tells you whether the layout follows the rules:
main stone on a third, odd number of pieces, a gap to the front glass,
hardscape tall enough, plants in their zones.

Built for **Learn AR with SPECS** (Devpost Learn, sponsor Snap), October 2026.

## What it does

- A virtual tank on a 75 cm table appears about 1 m in front of you (the
  stand-in for your real tank, which the preview cannot see). **Tank**
  cycles six standard sizes: 30C, 45P, 60P (the default, 60 x 30 x 36 cm),
  75P, 90P and 120P. Guides, zones and the palette follow the size.
- The palette tray has six tabs: Stone, Wood, Carpet, Mid, Back and Epi
  (plants tied to hardscape). Pinch a piece to place it at real size on the
  substrate. Hardscape: Seiryu, Dragon, lava, Frodo, Elephant skin and
  Pagoda stone; spider wood, Manzanita, Redmoor, Mopani and bonsai wood.
  Plants: 27 species across the four plant tabs (Monte Carlo, HC Cuba,
  Glossostigma, hairgrass, Lilaeopsis; Cryptocoryne in three colours,
  Staurogyne, Blyxa, Downoi, red lotus; Rotala, Limnophila, Ludwigia,
  Alternanthera, Hygrophila, Bacopa, Vallisneria, Cyperus, Amazon sword;
  Anubias in three sizes, Java fern, mosses, Riccia, Bucephalandra).
  Each species carries its real footprint, height and mature height, so
  the coach can judge zones and style rules. Grab and drag a piece; it
  stays on the substrate and inside the glass.
- **Rotate** turns the selected piece 15 degrees, **Lean** tilts it toward
  you in 10 degree steps (Iwagumi wants the main stone at 10 to 20), **Size**
  cycles a stone through the Oyaishi, Fukuishi and Soeishi sizes. The
  selected piece shows a cyan ring at its base.
- **Style** cycles Iwagumi, Nature, Dutch and Jungle. The coach card scores
  the layout 0 to 100 against that style's rules (stones only, main stone
  height and lean, one dominant material, planted area, species count,
  plant streets, and more) and lists the rules to fix first.
- The coach card updates after every change: focal point, odd count, front
  gap, height, plant zones. Amber means fix it, green means good.
- **Undo** removes the last piece, **Clear** empties the tank, **Guides**
  toggles the thirds grid and zone bands, **Place tank** re-anchors the
  tank in front of you.

Everything runs in Lens Studio's Interactive Preview with the mouse acting
as a pinch. No SPECS glasses are needed.

## Planning docs (devpost folder)

- `devpost/design-brief.md`: the brief written with the Devpost Learn
  `plan-lens` skill pack (status: approved).
- `devpost/interview-answers.md`: the learner's answers the interview was
  run against.
- `devpost/research-notes.md`: the aquascaping research behind the design
  (Green Aqua rules, planting zones, why dry layout matters) with sources.
- `devpost/build-log.md`: how the Lens was built with CLAD's skills over
  the Lens Studio MCP, what was tested and what is known to be unproven.

## Project layout

- `AquascapeLens.esproj`: Lens Studio 5.24 project (SPECS target).
- `Assets/Scripts/`: the Lens code.
  - `ScapePlannerMain.ts`: orchestration, layout state, palette actions,
    coach updates, place-in-front-of-user.
  - `ScapePlannerTank.ts`: the virtual tank, table, substrate and guides,
    rebuilt for each of the six standard sizes.
  - `ScapePlannerPiece.ts`: one placed piece: prefab scaling, collider,
    SIK grab, clamped to the tank.
  - `ScapePlannerRules.ts`: the composition checks as pure functions.
  - `ScapePlannerStyles.ts`: the style-fit rules and scoring (pure).
  - `ScapePlannerCatalog.ts`: the 38 placeable pieces (11 hardscape, 27
    plants) with sizes, zones, tabs and tints.
  - `ScapePlannerPaletteUI.ts`, `ScapePlannerCoachUI.ts`: UIKit panels.
- `Assets/GeneratedMeshes/`: 26 GLB models (11 stones and woods, 15 plant
  forms) generated with Meshy under the author's paid plan. Species that
  share a growth form reuse a model with a colour tint (for example the
  three Cryptocoryne colours, or Hygrophila and Bacopa on the Ludwigia
  stem model); the catalogue marks these as variants.
- `Assets/ScapePlanner/`: the box mesh and the three materials the tank is
  built from.
- `Packages/`: Spectacles Interaction Kit and UI Kit (from Snap's Specs
  Base Template).

## Tests

Eight LEAF scenarios in `Assets/Tests/` (one per done criterion in the
brief, an IK reachability check of the palette, a v2 scenario for style
scoring, rotate, lean and the front-gap check, and a v3 scenario for the
palette tabs and tank sizes) run from the LEAF panel in Lens Studio and all
pass in the preview. `LeafIndex.ts` registers them.

## Run it

1. Open `AquascapeLens.esproj` in Lens Studio 5.22 or later.
2. In the Preview panel pick a SPECS device and Interactive mode (the
   Sunlit Room scene works well).
3. Look down toward the table. Click the palette buttons to place pieces,
   click and drag a piece to move it.

## Credits

Composition rules after Green Aqua's "How to Design Your Aquascape Like a
Professional" and "Mastering Iwagumi". Built with Snap's CLAD agent skills
and the Lens Studio MCP; see `devpost/build-log.md`.
