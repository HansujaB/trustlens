# T05 video-graceful — TTS off, 503 path clean

Goal: video is P2 — tonight it must fail gracefully, not crash the demo.

Scope (`server/video.js`, `server/http.js`, `src/components/LiveReport.jsx`):
- Keep `VIDEO_ENABLED=false`, no `TTS_*` keys.
- Verify `POST /api/reports/:id/video` → 503 `VIDEO_NOT_CONFIGURED`, report stays readable.
- Verify `npm run test:video` silent-fixture render still proves Remotion path.
- Copy check: UI labels video as roadmap / requires narration config.

Out of scope: wiring real TTS, LLM narration.

Acceptance:
- Clicking Generate Video shows clean configuration message, no hang.
- Silent MP4 artifact exists locally.

Demo relevance: safe to show or skip on camera without breakage.
