# Handoff

State 2026-10-25:

- The Lens builds and runs in the Lens Studio 5.24.1 preview (Plane scene).
  All twelve LEAF scenarios in `Assets/Tests/` pass, including the two
  showcase layouts (`scape-11-iwagumi-60p`, `scape-12-jungle-120p`).
- Features: soil and sand substrate, 14 hardscape pieces with rotate, lean,
  resize and mirror, carpet tiles, epiphytes and moss on the wood, 32 plant
  species, coach with style scoring, six tank sizes.
- The demo video with voiceover is cut (2:51, not in git); the script is
  `devpost/video-script.md`, the submission text `devpost/submission.md`.
- The repo was scanned for secrets (gitleaks, trufflehog, full history):
  nothing found.

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
