# Handoff

State 2026-10-23 evening (after the v2 improvements):

- Lens builds, runs in the Lens Studio 5.24.1 preview, and all seven LEAF
  scenarios in `Assets/Tests/` pass. v2 adds ten pieces, style scoring
  (Iwagumi, Nature, Dutch, Jungle), rotate/lean/size. Project saved, main pushed.
- `devpost/` holds the design brief (approved), interview answers, research
  notes, build log, video storyboard and submission text.
- A captioned stop-motion draft of the demo was assembled from preview
  captures (sent in chat, not committed).

Next steps for the owner:
1. Make the GitHub repo public (Settings, Danger Zone, Change visibility).
2. Record a real screen capture of the preview following
   `devpost/video-storyboard.md`, upload to YouTube (public), under 3 min.
3. Submit on https://learn-specs.devpost.com with the repo link, the video
   link and `devpost/submission.md`. Deadline 2026-11-09 17:00 ET.
4. Optional polish: coach card contrast against bright walls, a soft tick
   sound when the coach speaks up, a nicer stone texture.

How to resume with an agent: open the project in Lens Studio first (its
MCP server writes `.mcp.json`), then start Claude Code in this folder
(`claude auth login` if the CLI is signed out) so CLAD's skills and the
`lens-studio` MCP tools load.
