# Lessons (project specific)

- Lens Studio's AgentsDocs plugin rewrites `.mcp.json`, `AGENTS.md`, `CLAUDE.md`, `.gitignore` and `.claude/settings.local.json` on every project load, and deletes `.agents/`. Keep project skills as real directories under `.claude/skills/`, not symlinks into `.agents/`.
- UIKit FlexLayout: set `autoDiscoverItemsOnStart = false` before calling `addItems` from `onAwake`, and set `flexShrink = 0` on programmatic FlexItems or a row of buttons shrinks to a fraction of its size. Re-apply `Button.size` inside `onInitialized`.
- A UIKit panel carries an InteractionPlane collider volume about 42 cm deep around it; placed between the camera and the content it blocks far-field grabs (and the AiPreviewAgent's obstruction check). Keep panels out of the line of sight into the play area.
- Prefab scaling: compute bounds from `mesh.aabbMin/aabbMax` pushed through the world transform; `worldAabbMin/Max` on a freshly instantiated prefab can be stale.
- LEAF `drag(interactable, vector, ms)` adds `vector` on every drag update for the whole duration: it is a per-update velocity. Use it for coarse moves and clamping tests; precise endpoints need another approach.
- `RunAndCollectLogsTool` reported no errors while the Lens was actually crashing in `onAwake`; the Lens Studio log file (`~/Library/Preferences/Snap/Lens Studio/logs/`) had the stack traces.
- The preview pauses itself when it crashes five frames in a row; after a fix, `PreviewPanelTool refresh` then `resume` brings it back.
- The standalone `claude` CLI can lose its OAuth session while a desktop-app session is running (the app owns refresh); plan for `claude auth login` before headless runs.
- A UIKit BackPlate sized from `onLayoutComplete` can end up narrower than its widest row; set `backPlate.size` explicitly to the panel width, on both `onLayoutComplete` and `backPlate.onInitialized`.
- A tilted tray on the table needs its bottom row above the table top: three rows of 4.4 cm at a 50 degree tilt need the panel centre about 18 cm above the table.
- Rotating a fitted GLB about its bounds centre needs a pivot SceneObject between the wrapper and the prefab instance; rotating the instance itself rotates about the GLB's own origin.
- `PreviewInteractTool` gets stuck once a Pinch times out (every later pinch fails with "Timed out waiting for onTriggerStart"); a `PreviewPanelTool refresh` + `resume` clears it. The LEAF path (`trigger(interactable)`) is unaffected.
- A GLB dropped into `Assets/` is only imported (`.glb.meta` written, prefab id assigned) when Lens Studio rescans, which can lag minutes behind the copy; wait for the `.meta` before wiring the prefab input, and read the prefab id from the meta's `PrimaryAsset` line.
- Prefab inputs are wired with VirtualScene `modify` on `components.ScriptComponent.<input>` = `@id:<PrimaryAsset id from the .glb.meta>`.
- `PreviewInteractTool` pinches are unreliable for long sequences (one timeout locks it); drive demos and checks through LEAF scenarios instead, which never got stuck. The preview camera can be moved over MCP while a scenario runs.
- Screen recording from the Claude app needs its Screen Recording permission; without it `screencapture` silently returns only the wallpaper. The screensaver also blanks recordings: run `caffeinate -u -t 1` every 20 s while recording. `CapturePanelScreenshotTool` works even when the screen is locked.
- Use `h264_videotoolbox` for ffmpeg screen capture; libx264 load slowed the preview enough to time out interactions.
- Meshy plant models often come with a pot or a base; a horizontal bisect in headless Blender (`bmesh.ops.bisect_plane`, `clear_inner`) removes it, and Lens Studio keeps the prefab id when the GLB is overwritten in place.
