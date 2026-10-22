# Devpost submission text (paste into the form)

## Inspiration
Aquascapers compose the hardscape dry, before any water goes in, because
moving a stone later clouds the tank for days. The hard part is judging
scale and composition while your hands are busy with real stones. Glasses
can show the plan on the tank itself.

## What it does
Scape Planner puts a virtual 60 x 30 x 36 cm tank on a table about a metre
in front of you (the stand-in for your real aquarium). Pinch Stone, Wood,
Carpet, Bush or Stems to drop a piece at real size on the substrate, grab it
to slide it around inside the glass, and read the coach card: main stone on
a third, odd number of pieces, a gap to the front glass, hardscape tall
enough, plants in their zones. The thirds grid and zone bands are drawn on
the tank. Undo, Clear, Guides and Place tank round it off.

## Who it is for
Hobby aquascapers setting up a new tank, and beginners who have heard the
rules but cannot see them yet.

## How we built it
Planned with the Devpost Learn skill pack (plan-lens interview, design
brief in the repo). Built in Lens Studio 5.24 on Snap's Specs Base Template
with Spectacles Interaction Kit and UI Kit, through the Lens Studio MCP,
following CLAD's skills: two-phase VirtualScene bootstrap, UIKit panels,
SIK Interactable plus InteractableManipulation for the pieces, a pure
rules module for the coach. 3D models generated with Meshy. Six LEAF
scenarios cover the done criteria and all pass in the preview.

## What we learned
Design for the narrow field of view: the controls ended up as a tray on
the table in front of the tank, not a column beside it, because that is
where you are already looking and because a floating panel's interaction
volume blocked grabs into the tank. Everything is placed in centimetres
at real scale, which turned out to be the whole point: you judge a 22 cm
stone by looking at it, not by measuring.

## What is next
Snap to the real tank with world mesh, save and share layouts, more stone
and plant types, and a shopping list from the placed pieces.
