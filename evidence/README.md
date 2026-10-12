# Verification evidence status — v2

The committed v2 experience uses new movement visuals and a collapsed optional studio. **Earlier screenshots from the v1 timer UI do not verify v2, and must not be presented as v2 evidence.**

Validated in the build environment: TypeScript and safety lint, 61 Node unit/HTTP tests and local HTTP server. Fresh browser screenshots and Playwright E2E still need to be captured and verified on the target machine; Chromium returned `ERR_BLOCKED_BY_ADMINISTRATOR` for local navigation in this environment.

To collect truthful evidence: `npm run build && npm run test:ui` with Chromium installed, then manually review desktop and 390px mobile. Record actual mode tests in `docs/SUBMISSION_NOTE.md`; never claim physical workout, sensors, voice or live AI without testing them.