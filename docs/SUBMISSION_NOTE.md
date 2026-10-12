# Draft email — AI-directed OpenUI prototype (verify browser locally before sending)

Hi Vishnu,

I built **AiRA / The OpenUI Director**, a fictional movement experience focused on **how AI guides a user through an activity** rather than a traditional workout planner.

The main experience now uses the starter's actual `Conversation` → `/api/turn` → validated OpenUI pipeline. Each Director turn can author or revise the single visible scene: the movement, on-screen cue, simulated timer, and what the user can ask next. The same named OpenUI statements persist between turns. When a timer completes, its event and the current UI state are sent to the next turn. When someone asks for a gentler option, the next scene can be revised without claiming physical activity occurred.

I added a catalog-backed `Movement(id)` component with trusted local illustrations and instructions; the model selects the allowed movement ID, but cannot send executable code or take control of timers. An extra Director validator limits components, scene count and timer length. Invalid output keeps the previous UI. All session timing and pause/finish actions remain local.

There are two honest runtime modes. **Mock** is a fully offline, scripted Director fixture that still outputs genuine OpenUI patches; it demonstrates energy versus desk scenarios, timer-driven progression, and mid-session adaptation. **OpenAIAPI** can generate the actual scene patches using the provided provider adapter, local API key and explicit opt-in. The legacy v7 workout remains available in the Studio for comparison.

**Verified in the development environment:** TypeScript, static safety lint, 88 Node/unit/HTTP tests, synthetic-model `/api/turn` acceptance and rejection tests, and local HTTP 200. **Not verified here:** a completed Chromium/Playwright visual run (the browser timed out), or a real paid OpenAI/Claude call. No camera, microphone, audio, sensors, physical activity or health outcomes were used.

To run: `npm ci --ignore-scripts && npm start` (Node >=22.18), then open `http://127.0.0.1:4319`.

Best,
Navadeep
