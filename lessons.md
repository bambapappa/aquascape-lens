# Lessons (project specific)

- Lens Studio's AgentsDocs plugin rewrites `.mcp.json`, `AGENTS.md`, `CLAUDE.md`, `.gitignore` and `.claude/settings.local.json` on every project load, and deletes `.agents/`. Keep project skills as real directories under `.claude/skills/`, not symlinks into `.agents/`.
- UIKit FlexLayout: set `autoDiscoverItemsOnStart = false` before calling `addItems` from `onAwake`, and set `flexShrink = 0` on programmatic FlexItems or a row of buttons shrinks to a fraction of its size. Re-apply `Button.size` inside `onInitialized`.
- A UIKit panel carries an InteractionPlane collider volume about 42 cm deep around it; placed between the camera and the content it blocks far-field grabs (and the AiPreviewAgent's obstruction check). Keep panels out of the line of sight into the play area.
- Prefab scaling: compute bounds from `mesh.aabbMin/aabbMax` pushed through the world transform; `worldAabbMin/Max` on a freshly instantiated prefab can be stale.
- LEAF `drag(interactable, vector, ms)` adds `vector` on every drag update for the whole duration: it is a per-update velocity. Use it for coarse moves and clamping tests; precise endpoints need another approach.
- `RunAndCollectLogsTool` reported no errors while the Lens was actually crashing in `onAwake`; the Lens Studio log file (`~/Library/Preferences/Snap/Lens Studio/logs/`) had the stack traces.
- The preview pauses itself when it crashes five frames in a row; after a fix, `PreviewPanelTool refresh` then `resume` brings it back.
- The standalone `claude` CLI can lose its OAuth session while a desktop-app session is running (the app owns refresh); plan for `claude auth login` before headless runs.
