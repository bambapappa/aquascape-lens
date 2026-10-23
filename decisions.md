# Decisions

- 2026-10-22: Hackathon idea: aquascape planner (chosen over size-scale, NPF routines, spatial letters, knot guide) because it hits all three glasses strengths and the owner has domain knowledge and Meshy assets.
- 2026-10-22: Start from Snap's Specs Base Template sample (SIK + UIKit bundled) instead of the in-app template, so the project could be created without GUI automation.
- 2026-10-22: Meshes from Meshy (owner's paid plan), not SPECS text-to-3D, because Lens Studio was not signed in.
- 2026-10-23: Drive the Lens Studio MCP with a small JSON-RPC client when the Claude Code CLI lost its sign-in; CLAD's skills remain the method. Documented in devpost/build-log.md.
- 2026-10-23: Palette is a tilted tray on the table in front of the tank, not a floating column beside it: fits the narrow FOV and keeps its interaction volume out of the line of sight into the tank.
- 2026-10-23: Coach rules as a pure module (ScapePlannerRules.ts) so they can be read and changed without the scene.
- 2026-10-23: Repo created private during the build; owner flips it public before submission.
- 2026-10-23 (v2): style rules kept pure and weighted; a rule that cannot be judged yet is excluded from the score instead of counting as a failure, so an empty tank shows 'place pieces' rather than 0%.
- 2026-10-23 (v2): rotation and lean are explicit buttons on the selected piece, not SIK rotation, because single-pinch mouse manipulation cannot rotate.
- 2026-10-23 (v3): species that share a growth form reuse one Meshy model with a material tint instead of a model each (Meshy credits and preview load); the catalogue marks them as variants so the docs do not overclaim.
- 2026-10-23 (v3): tank sizes are a fixed list of six standard sizes (30C to 120P) chosen with a cycle button, not free dimensions; changing size clears the layout because pieces are placed relative to the tank.
- 2026-10-23 (v3): coach messages name the full species so two Rotala variants are distinguishable; tests match the full name.
