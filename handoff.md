# Handoff

State 2026-10-23 night (after v3):

- Lens builds, runs in the Lens Studio 5.24.1 preview, and all eight LEAF
  scenarios in `Assets/Tests/` pass. v3 adds a tabbed palette with 38
  pieces (11 hardscape, 27 plants, 26 Meshy models), six standard tank
  sizes (Tank button) and species tints. v2 added style scoring (Iwagumi,
  Nature, Dutch, Jungle) and rotate/lean/size. Project saved, main pushed.
- Known cosmetic issue: the palette back plate renders a little narrower
  than the button rows; buttons work.
- `devpost/` holds the design brief (approved), interview answers, research
  notes, build log, video storyboard and submission text.
- A captioned stop-motion draft of the demo was assembled from preview
  captures (sent in chat, not committed).

Next steps for the owner (as of 2026-10-25):
1. Check the Git LFS quota on GitHub (about 420 MB in LFS; every clone of a
   public repo counts), then make the repo public.
2. Add the English voiceover or captions from `devpost/video-script.md` to
   `devpost/scape-planner-demo-cut.mp4` (2:53, silent, not in git) and upload
   it to YouTube as public.
3. Make sure you have joined the hackathon on Devpost, then submit with the
   repo link, the video link and `devpost/submission.md`. Deadline
   2026-11-09 17:00 ET (23:00 Swedish time).
How to resume with an agent: open the project in Lens Studio first (its
MCP server writes `.mcp.json`), then start Claude Code in this folder
(`claude auth login` if the CLI is signed out) so CLAD's skills and the
`lens-studio` MCP tools load.
