# Screenshot evidence

These four screenshots were captured from the newly compiled browser UI and CSS in a headless offline browser with a synthetic `/api/config` response, because Chromium in this environment blocked direct localhost page navigation. They are **not** live-provider, production-AiRA or server-to-browser integration evidence.

- `01-welcome.png` — entry and call-to-action
- `02-adaptive-recovery.png` — recovery after +10 s and next-phase reduction
- `03-summary.png` — adapted full five-phase simulation (1:17 total)
- `04-mobile.png` — 390 px viewport, no horizontal overflow

The TypeScript program, OpenUI validation and 47 Node tests were run separately. The optional live OpenAIAPI and ClaudeCLI modes were **not** exercised.